# Use official light Python image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Prevent Python from writing pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Install system dependencies (needed for compiling certain packages if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first to optimize caching
COPY backend/requirements.txt /app/

# Install python dependencies plus gunicorn for production serving
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# Copy backend and frontend folders into the container
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Change working directory to backend so relative imports work correctly
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Run Flask application using Gunicorn WSGI server
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
