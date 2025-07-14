import json
import pika
import docker
import os
from dotenv import load_dotenv

load_dotenv()

DOCKER_IMAGE = "telegram-ai-agent"
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

docker_client = docker.from_env()

def run_agent_container(api_id, api_hash, session_string, prompt, reply_time):
    container_name = f"agent_{api_id}"
    print(f"[INFO] (Re)Starting agent container: {container_name}")
    
    try:
        existing = docker_client.containers.get(container_name)
        print(f"[INFO] Removing old container: {container_name}")
        existing.stop()
        existing.remove()
    except docker.errors.NotFound:
        pass

    docker_client.containers.run(
    image=DOCKER_IMAGE,
    command=["python", "AgentRunner.py", str(api_id), api_hash, session_string, prompt, reply_time],
    environment={"OPENAI_API_KEY": OPENAI_KEY},
    detach=True,
    name=container_name,
    restart_policy={"Name": "on-failure"}
)
    print(f"[INFO] Agent container {container_name} started successfully.")


def callback(ch, method, properties, body):
    try:
        data = json.loads(body)
        run_agent_container(
            api_id=data["api_id"],
            api_hash=data["api_hash"],
            session_string=data["session_string"],
            prompt=data["prompt"],
            reply_time=data["reply_time"] 
        )
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"[ERROR] Failed to start agent: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag)

def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters("localhost"))
    channel = connection.channel()
    channel.queue_declare(queue="account_data", durable=True)
    channel.basic_consume(queue="account_data", on_message_callback=callback)
    print("[*] Waiting for new account data...")
    channel.start_consuming()

if __name__ == "__main__":
    main()
