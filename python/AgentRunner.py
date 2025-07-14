import os
import sys
import openai
import asyncio
import random
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from telethon.errors import FloodWaitError
from telethon.tl.types import Message

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

is_active = True
my_id = None

async def build_context(client, event, limit=4):
    chat_id = event.chat_id
    messages = await client.get_messages(chat_id, limit=limit)
    context = []

    for msg in reversed(messages):
        if not isinstance(msg, Message):
            continue
        if msg.id == event.id:
            continue
        text = msg.text or msg.message
        if text:
            role = "user" if not msg.out else "assistant"
            context.append({"role": role, "content": text})

    return context

async def start_agent(api_id, api_hash, session_string, prompt, reply_time):
    global is_active, my_id

    client = TelegramClient(StringSession(session_string), api_id, api_hash)

    @client.on(events.NewMessage())
    async def toggle_active(event):
        global is_active, my_id

        if my_id is None:
            me = await client.get_me()
            my_id = me.id

        if event.is_private and event.sender_id == event.chat_id == my_id:
            text = event.raw_text.strip().lower()
            if text in ["/stop", "stop"]:
                is_active = False
                await event.reply("🤖 Assistant stopped. Send /start to activate.")
                print("🛑 Assistant deactivated")
            elif text in ["/start", "start"]:
                is_active = True
                await event.reply("🤖 Assistant started. Ready to help. Send /stop to deactivate.")
                print("✅ Assistant activated")

    @client.on(events.NewMessage(incoming=True))
    async def handle(event):
        global is_active

        if not is_active:
            return

        sender = await event.get_sender()
        name = sender.first_name or "User"
        message = event.raw_text

        print(f"📩 {name}: {message}")

        try:
            context = await build_context(client, event, limit=4)
            full_messages = [{"role": "system", "content": prompt}] + context + [
                {"role": "user", "content": message}
            ]

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=full_messages,
                max_tokens=200
            )
            reply = response['choices'][0]['message']['content'].strip()
        except Exception as e:
            print(f"⚠️ OpenAI Error: {e}")
            reply = "Sorry, I can't reply right now."

        delay = random.uniform(float(reply_time) * 0.8, float(reply_time) * 1.2)
        await asyncio.sleep(delay)

        try:
            await event.reply(reply)
            print(f"🤖 Reply to {name}: {reply}")
        except FloodWaitError as e:
            print(f"⏳ Flood wait: sleeping {e.seconds} sec")
            await asyncio.sleep(e.seconds)
            await event.reply(reply)

    await client.start()
    print(f"🤖 Agent {api_id} started and running.")
    await client.run_until_disconnected()

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: AgentRunner.py <api_id> <api_hash> <session_string> <prompt> <reply_time>")
        sys.exit(1)

    api_id = int(sys.argv[1])
    api_hash = sys.argv[2]
    session_string = sys.argv[3]
    prompt = sys.argv[4]
    reply_time = sys.argv[5] 

    asyncio.run(start_agent(api_id, api_hash, session_string, prompt, reply_time))
