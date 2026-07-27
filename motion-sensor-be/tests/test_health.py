async def test_health_returns_service_status(client):
    response = await client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "motion-sensor-backend"
    assert body["database"] in ("connected", "disconnected")
    assert body["mqtt"] in ("connected", "disconnected")
