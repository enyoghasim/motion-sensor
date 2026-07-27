from sqlalchemy import select

from app.models.device import Device
from app.models.space import Space


async def test_list_spaces_empty_for_new_user(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.get("/api/spaces", headers=headers)

    assert response.status_code == 200
    assert response.json()["data"] == []


async def test_signup_creates_default_home_space(client, db_session):
    # New signups are unverified, so we go straight to the DB rather than the
    # (verified-only) /api/spaces endpoint to check the default space exists.
    signup_response = await client.post(
        "/auth/signup",
        json={"email": "homeowner@example.com", "password": "Password123!", "name": "Home Owner"},
    )
    user_id = signup_response.json()["data"]["user"]["id"]

    result = await db_session.execute(select(Space).filter_by(owner_id=user_id))
    spaces = result.scalars().all()

    assert len(spaces) == 1
    assert spaces[0].name == "Home"
    assert spaces[0].icon == "Home01Icon"


async def test_create_space(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.post(
        "/api/spaces", json={"name": "Garage", "icon": "GarageIcon"}, headers=headers
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["name"] == "Garage"
    assert data["icon"] == "GarageIcon"

    list_response = await client.get("/api/spaces", headers=headers)
    assert len(list_response.json()["data"]) == 1


async def test_create_space_requires_name(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.post("/api/spaces", json={"name": ""}, headers=headers)

    assert response.status_code == 422


async def test_create_space_rejects_unknown_icon(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.post(
        "/api/spaces", json={"name": "Attic", "icon": "NotARealIcon"}, headers=headers
    )

    assert response.status_code == 422


async def test_create_space_requires_auth(client):
    response = await client.post("/api/spaces", json={"name": "Garage"})
    assert response.status_code == 401


async def test_update_space(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)
    create_response = await client.post(
        "/api/spaces", json={"name": "Office", "icon": "OfficeIcon"}, headers=headers
    )
    space_id = create_response.json()["data"]["id"]

    response = await client.patch(
        f"/api/spaces/{space_id}", json={"name": "Home Office"}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Home Office"
    assert response.json()["data"]["icon"] == "OfficeIcon"


async def test_update_space_not_found(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.patch("/api/spaces/999999", json={"name": "Ghost"}, headers=headers)

    assert response.status_code == 404


async def test_update_space_wrong_owner_forbidden(client, make_user, auth_headers):
    owner = await make_user(email="owner@example.com", verified=True)
    other = await make_user(email="other@example.com", verified=True)
    owner_headers = await auth_headers(owner)
    other_headers = await auth_headers(other)

    create_response = await client.post(
        "/api/spaces", json={"name": "Private Room"}, headers=owner_headers
    )
    space_id = create_response.json()["data"]["id"]

    response = await client.patch(
        f"/api/spaces/{space_id}", json={"name": "Hijacked"}, headers=other_headers
    )

    assert response.status_code == 403


async def test_delete_space(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)
    create_response = await client.post("/api/spaces", json={"name": "Temp"}, headers=headers)
    space_id = create_response.json()["data"]["id"]

    response = await client.delete(f"/api/spaces/{space_id}", headers=headers)
    assert response.status_code == 200

    list_response = await client.get("/api/spaces", headers=headers)
    assert list_response.json()["data"] == []


async def test_delete_space_unassigns_devices(client, make_user, auth_headers, db_session):
    user = await make_user(verified=True)
    headers = await auth_headers(user)
    create_response = await client.post("/api/spaces", json={"name": "Basement"}, headers=headers)
    space_id = create_response.json()["data"]["id"]

    device = Device(
        factory_mac="AA:BB:CC:DD:EE:01",
        owner_id=user.id,
        space_id=space_id,
        public_key="deadbeef",
        status="Paired",
        name="Basement Sensor",
    )
    db_session.add(device)
    await db_session.commit()

    response = await client.delete(f"/api/spaces/{space_id}", headers=headers)
    assert response.status_code == 200

    devices_response = await client.get("/api/devices", headers=headers)
    devices = devices_response.json()["items"]
    assert len(devices) == 1
    assert devices[0]["space_id"] is None


async def test_delete_space_wrong_owner_forbidden(client, make_user, auth_headers):
    owner = await make_user(email="owner2@example.com", verified=True)
    other = await make_user(email="other2@example.com", verified=True)
    owner_headers = await auth_headers(owner)
    other_headers = await auth_headers(other)

    create_response = await client.post(
        "/api/spaces", json={"name": "Vault"}, headers=owner_headers
    )
    space_id = create_response.json()["data"]["id"]

    response = await client.delete(f"/api/spaces/{space_id}", headers=other_headers)
    assert response.status_code == 403


async def test_delete_space_not_found(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.delete("/api/spaces/999999", headers=headers)

    assert response.status_code == 404


async def test_spaces_require_verified_user(client, make_user, auth_headers):
    user = await make_user(verified=False)
    headers = await auth_headers(user)

    response = await client.get("/api/spaces", headers=headers)

    assert response.status_code == 403
