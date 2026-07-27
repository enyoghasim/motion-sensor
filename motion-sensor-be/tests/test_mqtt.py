async def test_mqtt_auth_missing_password_rejected(client):
    response = await client.post(
        "/api/mqtt/auth", json={"clientid": "AA:BB:CC:DD:EE:01", "username": "AA:BB:CC:DD:EE:01"}
    )

    assert response.status_code == 401
    assert response.json()["message"] == "Missing password/token"


async def test_mqtt_auth_unknown_token_rejected(client):
    response = await client.post("/api/mqtt/auth", json={"password": "not-a-real-token"})

    assert response.status_code == 401


async def test_mqtt_auth_valid_token_accepted(client, fake_redis):
    factory_mac = "AA:BB:CC:DD:EE:40"
    await fake_redis.set("device_token:opaque-token-123", factory_mac)

    response = await client.post(
        "/api/mqtt/auth",
        json={"password": "opaque-token-123", "username": factory_mac, "clientid": factory_mac},
    )

    assert response.status_code == 200


async def test_mqtt_auth_rejects_username_mismatch(client, fake_redis):
    factory_mac = "AA:BB:CC:DD:EE:41"
    await fake_redis.set("device_token:opaque-token-456", factory_mac)

    response = await client.post(
        "/api/mqtt/auth",
        json={
            "password": "opaque-token-456",
            "username": "someone-elses-mac",
            "clientid": "also-not-it",
        },
    )

    assert response.status_code == 401


async def test_mqtt_auth_allows_missing_username_regardless_of_clientid(client, fake_redis):
    factory_mac = "AA:BB:CC:DD:EE:42"
    await fake_redis.set("device_token:opaque-token-789", factory_mac)

    response = await client.post(
        "/api/mqtt/auth",
        json={"password": "opaque-token-789", "username": "", "clientid": "anything"},
    )

    assert response.status_code == 200
