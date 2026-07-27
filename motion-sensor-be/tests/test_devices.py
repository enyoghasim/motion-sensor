from datetime import datetime, timedelta

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from app.models.device import Device


def _make_keypair():
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes_raw()
    return private_key, public_bytes.hex()


def _sign(private_key: Ed25519PrivateKey, factory_mac: str, challenge: str) -> str:
    message = (factory_mac + challenge).encode("utf-8")
    return private_key.sign(message).hex()


async def test_list_devices_empty(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.get("/api/devices", headers=headers)

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["next_cursor"] is None


async def test_list_devices_requires_verified_user(client, make_user, auth_headers):
    user = await make_user(verified=False)
    headers = await auth_headers(user)

    response = await client.get("/api/devices", headers=headers)

    assert response.status_code == 403


async def test_list_devices_requires_auth(client):
    response = await client.get("/api/devices")
    assert response.status_code == 401


async def test_list_devices_paginates_with_cursor(client, make_user, auth_headers, db_session):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    base_time = datetime(2024, 1, 1, 12, 0, 0)
    for i in range(3):
        db_session.add(
            Device(
                factory_mac=f"AA:BB:CC:DD:EE:{i:02d}",
                owner_id=user.id,
                status="Paired",
                name=f"Sensor {i}",
                created_at=base_time + timedelta(minutes=i),
            )
        )
    await db_session.commit()

    first_page = await client.get("/api/devices", params={"limit": 2}, headers=headers)
    assert first_page.status_code == 200
    first_body = first_page.json()
    assert len(first_body["items"]) == 2
    assert first_body["next_cursor"] is not None
    # Most recently created first.
    assert first_body["items"][0]["name"] == "Sensor 2"

    second_page = await client.get(
        "/api/devices",
        params={"limit": 2, "cursor": first_body["next_cursor"]},
        headers=headers,
    )
    second_body = second_page.json()
    assert len(second_body["items"]) == 1
    assert second_body["items"][0]["name"] == "Sensor 0"
    assert second_body["next_cursor"] is None


async def test_claim_start_returns_challenge(client, make_user, auth_headers, fake_redis):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.post(
        "/api/devices/claim/start", json={"factory_mac": "AA:BB:CC:DD:EE:10"}, headers=headers
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["challenge"]) == 64
    assert body["expires_in"] == 300
    stored = await fake_redis.get("claim:challenge:AA:BB:CC:DD:EE:10")
    assert stored == body["challenge"]


async def test_claim_start_requires_verified_user(client, make_user, auth_headers):
    user = await make_user(verified=False)
    headers = await auth_headers(user)

    response = await client.post(
        "/api/devices/claim/start", json={"factory_mac": "AA:BB:CC:DD:EE:11"}, headers=headers
    )

    assert response.status_code == 403


async def test_claim_full_flow_pairs_device(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)
    factory_mac = "AA:BB:CC:DD:EE:20"
    private_key, public_key_hex = _make_keypair()

    start_response = await client.post(
        "/api/devices/claim/start", json={"factory_mac": factory_mac}, headers=headers
    )
    challenge = start_response.json()["challenge"]
    signature = _sign(private_key, factory_mac, challenge)

    finish_response = await client.post(
        "/api/devices/claim/finish",
        json={
            "factory_mac": factory_mac,
            "challenge": challenge,
            "signature": signature,
            "public_key": public_key_hex,
        },
        headers=headers,
    )

    assert finish_response.status_code == 200

    devices_response = await client.get("/api/devices", headers=headers)
    devices = devices_response.json()["items"]
    assert len(devices) == 1
    assert devices[0]["factory_mac"] == factory_mac
    assert devices[0]["status"] == "Paired"


async def test_claim_finish_rejects_invalid_signature(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)
    factory_mac = "AA:BB:CC:DD:EE:21"
    _, public_key_hex = _make_keypair()
    other_private_key, _ = _make_keypair()

    start_response = await client.post(
        "/api/devices/claim/start", json={"factory_mac": factory_mac}, headers=headers
    )
    challenge = start_response.json()["challenge"]
    # Signed with the wrong private key -> should not verify against public_key_hex.
    bad_signature = _sign(other_private_key, factory_mac, challenge)

    finish_response = await client.post(
        "/api/devices/claim/finish",
        json={
            "factory_mac": factory_mac,
            "challenge": challenge,
            "signature": bad_signature,
            "public_key": public_key_hex,
        },
        headers=headers,
    )

    assert finish_response.status_code == 401


async def test_claim_finish_rejects_expired_or_wrong_challenge(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)
    factory_mac = "AA:BB:CC:DD:EE:22"
    private_key, public_key_hex = _make_keypair()

    signature = _sign(private_key, factory_mac, "some-challenge-never-issued")

    finish_response = await client.post(
        "/api/devices/claim/finish",
        json={
            "factory_mac": factory_mac,
            "challenge": "some-challenge-never-issued",
            "signature": signature,
            "public_key": public_key_hex,
        },
        headers=headers,
    )

    assert finish_response.status_code == 400


async def test_claim_start_rejects_device_owned_by_someone_else(client, make_user, auth_headers):
    owner = await make_user(email="deviceowner@example.com", verified=True)
    other = await make_user(email="deviceother@example.com", verified=True)
    owner_headers = await auth_headers(owner)
    other_headers = await auth_headers(other)
    factory_mac = "AA:BB:CC:DD:EE:23"
    private_key, public_key_hex = _make_keypair()

    start_response = await client.post(
        "/api/devices/claim/start", json={"factory_mac": factory_mac}, headers=owner_headers
    )
    challenge = start_response.json()["challenge"]
    signature = _sign(private_key, factory_mac, challenge)
    await client.post(
        "/api/devices/claim/finish",
        json={
            "factory_mac": factory_mac,
            "challenge": challenge,
            "signature": signature,
            "public_key": public_key_hex,
        },
        headers=owner_headers,
    )

    response = await client.post(
        "/api/devices/claim/start", json={"factory_mac": factory_mac}, headers=other_headers
    )

    assert response.status_code == 403


async def test_delete_device_wrong_password_forbidden(client, make_user, auth_headers, db_session):
    user = await make_user(password="RealPassword1!", verified=True)
    headers = await auth_headers(user)
    device = Device(factory_mac="AA:BB:CC:DD:EE:30", owner_id=user.id, status="Paired")
    db_session.add(device)
    await db_session.commit()

    response = await client.request(
        "DELETE",
        f"/api/devices/{device.id}",
        json={"password": "WrongPassword1!"},
        headers=headers,
    )

    assert response.status_code == 403


async def test_delete_device_not_found(client, make_user, auth_headers):
    user = await make_user(password="RealPassword1!", verified=True)
    headers = await auth_headers(user)

    response = await client.request(
        "DELETE",
        "/api/devices/00000000-0000-0000-0000-000000000000",
        json={"password": "RealPassword1!"},
        headers=headers,
    )

    assert response.status_code == 404


async def test_delete_device_wrong_owner_forbidden(client, make_user, auth_headers, db_session):
    owner = await make_user(email="realowner@example.com", password="OwnerPass1!", verified=True)
    other = await make_user(email="notowner@example.com", password="OtherPass1!", verified=True)
    other_headers = await auth_headers(other)
    device = Device(factory_mac="AA:BB:CC:DD:EE:31", owner_id=owner.id, status="Paired")
    db_session.add(device)
    await db_session.commit()

    response = await client.request(
        "DELETE",
        f"/api/devices/{device.id}",
        json={"password": "OtherPass1!"},
        headers=other_headers,
    )

    assert response.status_code == 403


async def test_delete_device_success(client, make_user, auth_headers, db_session):
    user = await make_user(password="RealPassword1!", verified=True)
    headers = await auth_headers(user)
    device = Device(factory_mac="AA:BB:CC:DD:EE:32", owner_id=user.id, status="Paired")
    db_session.add(device)
    await db_session.commit()

    response = await client.request(
        "DELETE",
        f"/api/devices/{device.id}",
        json={"password": "RealPassword1!"},
        headers=headers,
    )

    assert response.status_code == 200

    list_response = await client.get("/api/devices", headers=headers)
    assert list_response.json()["items"] == []
