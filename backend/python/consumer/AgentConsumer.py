import json
import pika
import docker
import os
from dotenv import load_dotenv
from Utils import decrypt_aes_gcm

load_dotenv()

DOCKER_IMAGE = os.getenv("DOCKER_IMAGE")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

docker_client = docker.from_env()

def validate_agent_data(data):
    required_fields = [
        "api_id", "api_hash", "session_string",
        "prompt", "typing_time", "reaction_time",
        "model", "name"
    ]

    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
        value = data[field]
        if value is None or (isinstance(value, str) and value.strip() == ""):
            raise ValueError(f"Field '{field}' is empty")

    if not isinstance(data["api_id"], int) or data["api_id"] <= 0:
        raise ValueError("Field 'api_id' must be a positive integer")
    if not isinstance(data["typing_time"], (int, float)) or data["typing_time"] < 0:
        raise ValueError("Field 'typing_time' must be ≥ 0")
    if not isinstance(data["reaction_time"], (int, float)) or data["reaction_time"] < 0:
        raise ValueError("Field 'reaction_time' must be ≥ 0")


def run_agent_container(api_id, api_hash, session_string, prompt, typing_time, reaction_time, model, name):
    container_name = f"agent_{api_id}"
    print(f"[INFO] Attempting to start agent container: {container_name}")

    try:
        existing_container = docker_client.containers.get(container_name)
        print(f"[INFO] Stopping existing container: {container_name}")
        existing_container.stop()
        print(f"[INFO] Removing existing container: {container_name}")
        existing_container.remove()
    except docker.errors.NotFound:
        pass
    except Exception as e:
        print(f"[ERROR] Unexpected error while checking container existence: {e}")
        return

    try:
        container = docker_client.containers.run(
            image=DOCKER_IMAGE,
            name=container_name,
            command=["python", "AgentRunner.py"],
            environment={
                "OPENAI_API_KEY": OPENAI_KEY,
                "API_ID": str(api_id),
                "API_HASH": api_hash,
                "SESSION_STRING": decrypt_aes_gcm(session_string),
                "PROMPT": prompt,
                "TYPING_TIME": str(typing_time),
                "REACTION_TIME": str(reaction_time),
                "MODEL": model,
                "NAME": name
            },
            detach=True,
            restart_policy={"Name": "on-failure"}
        )
        print(f"[INFO] Agent container '{container_name}' started successfully (ID: {container.id})")
    except Exception as e:
        print(f"[ERROR] Failed to start agent container: {e}")


def create_or_update_agent(ch, method, properties, body):
    try:
        data = json.loads(body)
        validate_agent_data(data)

        run_agent_container(
            api_id=data["api_id"],
            api_hash=data["api_hash"],
            session_string=data["session_string"],
            prompt=data["prompt"],
            typing_time=data["typing_time"],
            reaction_time=data["reaction_time"],
            model=data["model"],
            name=data["name"]
        )

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except ValueError as ve:
        print(f"[VALIDATION ERROR] {ve}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        print(f"[ERROR] Failed to start agent: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag)


def delete_agent(ch, method, properties, body):
    container_name = None 
    try:
        data = json.loads(body)

        api_id = data["api_id"]

        if not api_id or not isinstance(api_id, int):
            raise ValueError("Missing or empty required field: api_id")

        container_name = f"agent_{api_id}"
        print(f"[INFO] Stopping and removing agent container: {container_name}")
        
        existing = docker_client.containers.get(container_name)
        existing.stop()
        existing.remove()

        print(f"[INFO] Agent container '{container_name}' deleted successfully")

        ch.basic_ack(delivery_tag=method.delivery_tag)

    except docker.errors.NotFound:
        print(f"[INFO] Agent container {container_name or '[unknown]'} not found.")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except ValueError as ve:
        print(f"[VALIDATION ERROR] {ve}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    except Exception as e:
        print(f"[ERROR] Failed to delete agent: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag)


def main():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=os.getenv("RABBITMQ_HOST"),
            port=int(os.getenv("RABBITMQ_PORT")),
            virtual_host="/",
            credentials=pika.PlainCredentials(os.getenv("RABBITMQ_USER"), os.getenv("RABBITMQ_PASSWORD"))
        )
    )
    channel = connection.channel()
    channel.queue_declare(queue="create_or_update_agent", durable=True)
    channel.basic_consume(queue="create_or_update_agent", on_message_callback=create_or_update_agent)
    channel.queue_declare(queue="delete_agent", durable=True)
    channel.basic_consume(queue="delete_agent", 
    on_message_callback=delete_agent)
    print("[*] Waiting for new account data...")
    channel.start_consuming()

if __name__ == "__main__":
    main()
