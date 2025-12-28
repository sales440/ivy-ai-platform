FROM python:3.9-slim

WORKDIR /app

# Install system dependencies if needed
# RUN apt-get update && apt-get install -y ...

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ src/
# # COPY scripts/ scripts/ removed as directory does not exist yet # Scripts directory not strictly required for basic run if main.py doesn't use it yet

# Env vars
ENV PYTHONPATH=/app

# Default entrypoint
ENTRYPOINT ["python", "src/main.py"]
CMD ["--env", "prod"]
