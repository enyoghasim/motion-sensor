#!/bin/bash

# Navigate to the directory of this script so it can be run from anywhere
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Please run 'python3 -m venv venv' and install requirements."
    exit 1
fi

echo "Starting Celery worker in the background..."
# We run celery in the background and capture its Process ID (PID)
venv/bin/celery -A app.core.celery_app worker --loglevel=info &
CELERY_PID=$!

echo "Starting Uvicorn..."
# We run uvicorn in the foreground so you can see its logs and hit Ctrl+C to stop it
venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8080 &
UVICORN_PID=$!

# Define a cleanup function to safely shut down both processes
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $UVICORN_PID
    kill $CELERY_PID
    wait $UVICORN_PID 2>/dev/null
    wait $CELERY_PID 2>/dev/null
    echo "All services stopped."
    exit 0
}

# Trap the SIGINT (Ctrl+C) and SIGTERM signals and run the cleanup function
trap cleanup SIGINT SIGTERM

# Keep the script running and wait for the background jobs
wait $UVICORN_PID
wait $CELERY_PID
