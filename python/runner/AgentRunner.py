import os
import asyncio
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from telethon.tl.types import Message
from telethon.errors import FloodWaitError
import openai

load_dotenv()

class TelegramAIAgent:
    def __init__(self):
        self.api_id = int(os.getenv("API_ID"))
        self.api_hash = os.getenv("API_HASH")
        self.session_string = os.getenv("SESSION_STRING")
        self.prompt = os.getenv("PROMPT")
        self.typing_time = float(os.getenv("TYPING_TIME"))  
        self.is_active = True
        self.my_id = None

        self.client = TelegramClient(StringSession(self.session_string), self.api_id, self.api_hash)

        self.openai_client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def build_context(self, event, limit=4):
        messages = await self.client.get_messages(event.chat_id, limit=limit)
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

    async def toggle_active(self, event):
        if self.my_id is None:
            me = await self.client.get_me()
            self.my_id = me.id

        if event.is_private and event.sender_id == event.chat_id == self.my_id:
            text = event.raw_text.strip().lower()
            if text in ["/stop", "stop"]:
                self.is_active = False
                await event.reply("🤖 Assistant stopped. Send /start to activate.")
            elif text in ["/start", "start"]:
                self.is_active = True
                await event.reply("🤖 Assistant started. Ready to help. Send /stop to deactivate.")

    async def on_new_message(self, event):
        if not self.is_active:
            return

        message = event.raw_text.strip()

        try:
            context = await self.build_context(event)
            messages = [{"role": "system", "content": self.prompt}] + context + [
                {"role": "user", "content": message}
            ]

            response = await self.openai_client.chat.completions.create(
                model="gpt-4.1-mini", 
                messages=messages,
                max_tokens=200,
            )
            reply = response.choices[0].message.content.strip()

        except Exception as e:
            print(f"OpenAI Error: {e}")
            reply = f"❌ Error: {e}"

        sleep_duration = min(self.typing_time * len(reply), 120)
        await self.client.send_chat_action(event.chat_id, 'typing')
        await asyncio.sleep(sleep_duration)

        try:
            await event.reply(reply)
        except FloodWaitError as e:
            await asyncio.sleep(e.seconds)
            await event.reply(reply)

    async def start(self):
        self.client.add_event_handler(self.toggle_active, events.NewMessage())
        self.client.add_event_handler(self.on_new_message, events.NewMessage(incoming=True))

        await self.client.start()
        print(f"[✅] Assistant started on session {self.api_id}")
        await self.client.run_until_disconnected()


if __name__ == "__main__":
    agent = TelegramAIAgent()
    asyncio.run(agent.start())
