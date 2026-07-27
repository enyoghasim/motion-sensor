from datetime import datetime, timedelta

from app.models.device import Device


async def _create_device(db_session, owner_id) -> Device:
    device = Device(factory_mac=f"AA:BB:CC:{owner_id:02d}:00:01", owner_id=owner_id, status="Paired")
    db_session.add(device)
    await db_session.commit()
    await db_session.refresh(device)
    return device


async def test_report_motion_creates_event(client, make_user, db_session):
    user = await make_user(verified=True)
    device = await _create_device(db_session, user.id)

    response = await client.post(
        "/api/motion/report", json={"device_id": str(device.id), "motion_detected": True}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "recorded"
    assert body["device_id"] == str(device.id)
    assert body["motion_detected"] is True


async def test_report_motion_requires_no_auth(client, make_user, db_session):
    # Device-facing endpoint: must work without a user session token.
    user = await make_user(verified=True)
    device = await _create_device(db_session, user.id)

    response = await client.post(
        "/api/motion/report", json={"device_id": str(device.id), "motion_detected": False}
    )

    assert response.status_code == 200


async def test_report_motion_validates_body(client):
    response = await client.post("/api/motion/report", json={"device_id": "not-a-uuid"})
    assert response.status_code == 422


async def test_get_latest_motion_returns_404_when_no_events(client, make_user, auth_headers, db_session):
    user = await make_user(verified=True)
    headers = await auth_headers(user)
    device = await _create_device(db_session, user.id)

    response = await client.get(f"/api/motion/{device.id}", headers=headers)

    assert response.status_code == 404


async def test_get_latest_motion_success(client, make_user, auth_headers, db_session):
    user = await make_user(verified=True)
    headers = await auth_headers(user)
    device = await _create_device(db_session, user.id)

    await client.post(
        "/api/motion/report", json={"device_id": str(device.id), "motion_detected": True}
    )

    response = await client.get(f"/api/motion/{device.id}", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["device_id"] == str(device.id)
    assert body["motion_detected"] is True


async def test_get_latest_motion_blocks_non_owner(client, make_user, auth_headers, db_session):
    owner = await make_user(email="motionowner@example.com", verified=True)
    other = await make_user(email="motionother@example.com", verified=True)
    other_headers = await auth_headers(other)
    device = await _create_device(db_session, owner.id)

    response = await client.get(f"/api/motion/{device.id}", headers=other_headers)

    assert response.status_code == 403


async def test_motion_endpoints_require_auth(client, make_user, db_session):
    user = await make_user(verified=True)
    device = await _create_device(db_session, user.id)

    response = await client.get(f"/api/motion/{device.id}")

    assert response.status_code == 401


async def test_motion_endpoints_require_verified_user(client, make_user, auth_headers, db_session):
    user = await make_user(verified=False)
    headers = await auth_headers(user)
    device = await _create_device(db_session, user.id)

    response = await client.get(f"/api/motion/{device.id}", headers=headers)

    assert response.status_code == 403


async def test_motion_history_paginates_with_cursor(client, make_user, auth_headers, db_session):
    user = await make_user(verified=True)
    headers = await auth_headers(user)
    device = await _create_device(db_session, user.id)

    from app.models.motion_event import MotionEvent

    base_time = datetime(2024, 1, 1, 12, 0, 0)
    for i in range(3):
        db_session.add(
            MotionEvent(
                device_id=device.id,
                motion_detected=bool(i % 2),
                timestamp=base_time + timedelta(minutes=i),
            )
        )
    await db_session.commit()

    first_page = await client.get(
        f"/api/motion/{device.id}/history", params={"limit": 2}, headers=headers
    )
    assert first_page.status_code == 200
    first_body = first_page.json()
    assert len(first_body["items"]) == 2
    assert first_body["next_cursor"] is not None

    second_page = await client.get(
        f"/api/motion/{device.id}/history",
        params={"limit": 2, "cursor": first_body["next_cursor"]},
        headers=headers,
    )
    second_body = second_page.json()
    assert len(second_body["items"]) == 1
    assert second_body["next_cursor"] is None


async def test_motion_history_blocks_non_owner(client, make_user, auth_headers, db_session):
    owner = await make_user(email="historyowner@example.com", verified=True)
    other = await make_user(email="historyother@example.com", verified=True)
    other_headers = await auth_headers(other)
    device = await _create_device(db_session, owner.id)

    response = await client.get(f"/api/motion/{device.id}/history", headers=other_headers)

    assert response.status_code == 403
