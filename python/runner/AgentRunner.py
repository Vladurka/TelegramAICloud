import os
import sys
import asyncio
import logging
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from telethon.tl.types import Message
from telethon.errors import FloodWaitError
import openai

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

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
                logger.info("Assistant stopped by user command.")
            elif text in ["/start", "start"]:
                self.is_active = True
                await event.reply("🤖 Assistant started. Ready to help. Send /stop to deactivate.")
                logger.info("Assistant started by user command.")

    async def on_new_message(self, event):
        if not self.is_active:
            return

        message = event.raw_text.strip()
        sender = await event.get_sender()
        sender_name = getattr(sender, 'username', None) or getattr(sender, 'first_name', 'Unknown')
        sender_id = sender.id if sender else "Unknown"

        logger.info(f"[📩] Message from {sender_name} (ID: {sender_id}): {message}")

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
            logger.error(f"OpenAI Error: {e}")
            reply = f"❌ Error: {e}"
        
        try:
            sleep_duration = min(self.typing_time * len(reply), 120)
            logger.info(f"[🤖] Simulation sleeping for {sleep_duration} seconds")
            await asyncio.sleep(sleep_duration)
            await event.reply(reply)
            logger.info(f"[🤖] Reply to {sender_name} (ID: {sender_id}): {reply}")
        except FloodWaitError as e:
            logger.warning(f"FloodWaitError: Sleeping for {e.seconds} seconds")
            await asyncio.sleep(e.seconds)
            await event.reply(reply)
            logger.info(f"[🤖] Reply to {sender_name} after flood wait: {reply}")

    async def start(self):
        self.client.add_event_handler(self.toggle_active, events.NewMessage())
        self.client.add_event_handler(self.on_new_message, events.NewMessage(incoming=True))

        await self.client.start()
        logger.info(f"Assistant started on session {self.api_id}")
        await self.client.run_until_disconnected()


if __name__ == "__main__":
    agent = TelegramAIAgent()
    asyncio.run(agent.start())
