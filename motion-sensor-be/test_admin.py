import asyncio
from fastapi.testclient import TestClient
from app.main import app
import sys
import traceback

def main():
    client = TestClient(app)
    try:
        response = client.get("/admin/device/list")
        print(f"Status: {response.status_code}")
        print(response.text)
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    main()
