FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
COPY AgentConsumer.py .
COPY Utils.py .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "AgentConsumer.py"]
