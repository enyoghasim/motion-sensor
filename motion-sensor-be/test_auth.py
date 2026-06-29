from fastapi.testclient import TestClient
from app.main import app
import sys

# Test client
try:
    with TestClient(app) as client:
        response = client.post(
            "/auth/register",
            json={"email": "test@example.com", "password": "password123", "name": "Test User"}
        )
        print("Register:", response.status_code, response.json())
        
        token = response.json().get("access_token")
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            me_resp = client.get("/auth/me", headers=headers)
            print("Me:", me_resp.status_code, me_resp.json())
            
            logout_resp = client.post("/auth/logout", headers=headers)
            print("Logout:", logout_resp.status_code, logout_resp.json())
except Exception as e:
    print(f"Error: {e}")
