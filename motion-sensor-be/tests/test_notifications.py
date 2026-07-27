import uuid
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository


async def test_get_notifications_empty(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.get("/api/notifications", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["items"] == []
    assert data["next_cursor"] is None


async def test_get_notifications_requires_auth(client):
    response = await client.get("/api/notifications")
    assert response.status_code == 401


async def test_get_notifications_requires_verified_user(client, make_user, auth_headers):
    user = await make_user(verified=False)
    headers = await auth_headers(user)

    response = await client.get("/api/notifications", headers=headers)
    assert response.status_code == 403


async def test_unread_summary(client, make_user, auth_headers, db_session):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    repo = NotificationRepository(db_session)
    await repo.create(user.id, "Test Title 1", "Test Message 1")
    await repo.create(user.id, "Test Title 2", "Test Message 2")

    response = await client.get("/api/notifications/unread-summary", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["unread_count"] == 2
    assert data["has_unread"] is True


async def test_mark_notification_read(client, make_user, auth_headers, db_session):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    repo = NotificationRepository(db_session)
    notif = await repo.create(user.id, "Motion Alert", "Motion detected in hallway")

    response = await client.patch(
        f"/api/notifications/{notif.id}/read", headers=headers
    )

    assert response.status_code == 200
    assert response.json()["data"]["read"] is True

    summary_res = await client.get("/api/notifications/unread-summary", headers=headers)
    assert summary_res.json()["data"]["unread_count"] == 0
    assert summary_res.json()["data"]["has_unread"] is False


async def test_mark_notification_read_wrong_owner_forbidden(
    client, make_user, auth_headers, db_session
):
    user1 = await make_user(email="user1@example.com", verified=True)
    user2 = await make_user(email="user2@example.com", verified=True)
    user2_headers = await auth_headers(user2)

    repo = NotificationRepository(db_session)
    notif = await repo.create(user1.id, "User 1 Alert", "Message")

    response = await client.patch(
        f"/api/notifications/{notif.id}/read", headers=user2_headers
    )
    assert response.status_code == 403


async def test_mark_notification_read_not_found(client, make_user, auth_headers):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    response = await client.patch("/api/notifications/999999/read", headers=headers)
    assert response.status_code == 404


async def test_mark_all_notifications_read(client, make_user, auth_headers, db_session):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    repo = NotificationRepository(db_session)
    await repo.create(user.id, "Alert 1", "Msg 1")
    await repo.create(user.id, "Alert 2", "Msg 2")
    await repo.create(user.id, "Alert 3", "Msg 3")

    response = await client.post("/api/notifications/read-all", headers=headers)

    assert response.status_code == 200
    assert response.json()["data"]["updated_count"] == 3

    summary_res = await client.get("/api/notifications/unread-summary", headers=headers)
    assert summary_res.json()["data"]["unread_count"] == 0
    assert summary_res.json()["data"]["has_unread"] is False


async def test_motion_report_creates_notification(
    client, make_user, auth_headers, db_session
):
    user = await make_user(verified=True)
    headers = await auth_headers(user)

    from app.models.device import Device
    device = Device(
        factory_mac="AA:BB:CC:DD:EE:FF",
        owner_id=user.id,
        public_key="testpubkey",
        status="Paired",
        name="Front Door Sensor",
    )
    db_session.add(device)
    await db_session.commit()

    report_response = await client.post(
        "/api/motion/report",
        json={"device_id": str(device.id), "motion_detected": True},
    )
    assert report_response.status_code == 200

    notif_res = await client.get("/api/notifications", headers=headers)
    assert notif_res.status_code == 200
    items = notif_res.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Motion Detected"
    assert "Front Door Sensor" in items[0]["message"]


async def test_login_creates_security_notification(client, make_user, auth_headers):
    password = "SecurePassword123!"
    user = await make_user(password=password, verified=True)

    login_res = await client.post(
        "/auth/signin",
        json={"email": user.email, "password": password},
        headers={"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    user_headers = {"Authorization": f"Bearer {token}"}

    notif_res = await client.get("/api/notifications", headers=user_headers)
    assert notif_res.status_code == 200
    items = notif_res.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Security Alert: New Login"
    assert "iOS" in items[0]["message"]
    assert items[0]["type"] == "security"
