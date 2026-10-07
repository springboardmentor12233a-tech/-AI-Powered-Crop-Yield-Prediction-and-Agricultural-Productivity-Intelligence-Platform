FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for some python packages (like psycopg2)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY backend/requirements-docker.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY backend /app/backend

# Copy the models directory since it's needed by the backend
COPY models /app/models

# Copy the dataset for historical weather/soil analysis
COPY Smart_Farming_Crop_Yield_2024.csv /app/Smart_Farming_Crop_Yield_2024.csv

# Set python path so imports like `from backend...` work correctly
ENV PYTHONPATH=/app

# Expose the port uvicorn will run on
EXPOSE 8000

# Command to run the application using uvicorn
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
