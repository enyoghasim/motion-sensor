import pytest


async def test_signup_creates_user_and_returns_token(client):
    response = await client.post(
        "/auth/signup",
        json={"email": "new@example.com", "password": "Password123!", "name": "New User"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["access_token"]
    assert body["data"]["user"]["email"] == "new@example.com"
    assert body["data"]["user"]["email_verified"] is False


async def test_signup_rejects_duplicate_email(client, make_user):
    await make_user(email="dup@example.com")

    response = await client.post(
        "/auth/signup",
        json={"email": "dup@example.com", "password": "Password123!", "name": "Someone"},
    )

    assert response.status_code == 400


@pytest.mark.parametrize(
    "payload,bad_field",
    [
        ({"email": "not-an-email", "password": "Password123!", "name": "A"}, "email"),
        ({"email": "a@b.com", "password": "short1!", "name": "A"}, "password"),
        ({"email": "a@b.com", "password": "nouppercase1!", "name": "A"}, "password"),
        ({"email": "a@b.com", "password": "NOLOWERCASE1!", "name": "A"}, "password"),
        ({"email": "a@b.com", "password": "NoDigits!", "name": "A"}, "password"),
        ({"email": "a@b.com", "password": "NoSpecial123", "name": "A"}, "password"),
    ],
)
async def test_signup_validates_input(client, payload, bad_field):
    response = await client.post("/auth/signup", json=payload)

    assert response.status_code == 422
    fields = [err["field"] for err in response.json()["errors"]]
    assert bad_field in fields


async def test_login_with_correct_credentials(client, make_user):
    await make_user(email="login@example.com", password="Password123!")

    response = await client.post(
        "/auth/signin", json={"email": "login@example.com", "password": "Password123!"}
    )

    assert response.status_code == 200
    assert response.json()["data"]["access_token"]


async def test_login_with_wrong_password(client, make_user):
    await make_user(email="login2@example.com", password="Password123!")

    response = await client.post(
        "/auth/signin", json={"email": "login2@example.com", "password": "WrongPass1!"}
    )

    assert response.status_code == 401


async def test_login_with_unknown_email(client):
    response = await client.post(
        "/auth/signin", json={"email": "nope@example.com", "password": "Password123!"}
    )

    assert response.status_code == 401


async def test_signout_invalidates_session(client, make_user, auth_headers):
    user = await make_user(email="logout@example.com", verified=True)
    headers = await auth_headers(user)

    logout_response = await client.post("/auth/signout", headers=headers)
    assert logout_response.status_code == 200

    me_response = await client.get("/user/me", headers=headers)
    assert me_response.status_code == 401


async def test_protected_endpoint_requires_token(client):
    response = await client.get("/user/me")
    assert response.status_code == 401


async def test_protected_endpoint_rejects_garbage_token(client):
    response = await client.get("/user/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401


async def test_verified_only_endpoint_blocks_unverified_user(client, make_user, auth_headers):
    user = await make_user(email="unverified@example.com", verified=False)
    headers = await auth_headers(user)

    response = await client.get("/api/spaces", headers=headers)

    assert response.status_code == 403


async def test_otp_request_and_verify_email(client, make_user, auth_headers, fake_redis):
    user = await make_user(email="otp@example.com", verified=False)
    headers = await auth_headers(user)

    request_response = await client.post(
        "/auth/otp/request", json={"scope": "email_verification"}, headers=headers
    )
    assert request_response.status_code == 200

    stored_hash = await fake_redis.get(f"otp:{user.id}:email_verification")
    assert stored_hash is not None

    bad_response = await client.post(
        "/auth/otp/verify", json={"otp": "000000", "scope": "email_verification"}, headers=headers
    )
    assert bad_response.status_code == 400


async def test_otp_verify_rejects_invalid_scope(client, make_user, auth_headers):
    user = await make_user(email="otpscope@example.com", verified=False)
    headers = await auth_headers(user)

    response = await client.post(
        "/auth/otp/verify", json={"otp": "123456", "scope": "not_a_real_scope"}, headers=headers
    )

    assert response.status_code == 400


async def test_otp_request_is_rate_limited(client, make_user, auth_headers):
    user = await make_user(email="ratelimited@example.com", verified=False)
    headers = await auth_headers(user)

    for _ in range(5):
        response = await client.post(
            "/auth/otp/request", json={"scope": "email_verification"}, headers=headers
        )
        assert response.status_code == 200

    sixth_response = await client.post(
        "/auth/otp/request", json={"scope": "email_verification"}, headers=headers
    )
    assert sixth_response.status_code == 429


async def test_change_password_requires_current_password(client, make_user, auth_headers):
    user = await make_user(email="changepw@example.com", password="OldPassword1!", verified=True)
    headers = await auth_headers(user)

    response = await client.post(
        "/auth/change-password",
        json={"current_password": "WrongOldPass1!", "new_password": "NewPassword1!"},
        headers=headers,
    )

    assert response.status_code == 400


async def test_change_password_succeeds_and_new_password_works(client, make_user, auth_headers):
    user = await make_user(email="changepw2@example.com", password="OldPassword1!", verified=True)
    headers = await auth_headers(user)

    response = await client.post(
        "/auth/change-password",
        json={"current_password": "OldPassword1!", "new_password": "NewPassword1!"},
        headers=headers,
    )
    assert response.status_code == 200

    login_response = await client.post(
        "/auth/signin", json={"email": "changepw2@example.com", "password": "NewPassword1!"}
    )
    assert login_response.status_code == 200


async def test_change_email_blocked_when_already_verified(client, make_user, auth_headers):
    user = await make_user(email="verified@example.com", verified=True)
    headers = await auth_headers(user)

    response = await client.post(
        "/auth/change-email", json={"email": "new-address@example.com"}, headers=headers
    )

    assert response.status_code == 400


async def test_change_email_rejects_email_already_in_use(client, make_user, auth_headers):
    await make_user(email="taken@example.com")
    user = await make_user(email="changeme@example.com", verified=False)
    headers = await auth_headers(user)

    response = await client.post(
        "/auth/change-email", json={"email": "taken@example.com"}, headers=headers
    )

    assert response.status_code == 400


async def test_change_email_succeeds_for_unverified_user(client, make_user, auth_headers):
    user = await make_user(email="changeme2@example.com", verified=False)
    headers = await auth_headers(user)

    response = await client.post(
        "/auth/change-email", json={"email": "brandnew@example.com"}, headers=headers
    )

    assert response.status_code == 200


async def test_reset_password_flow_with_invalid_otp(client, make_user):
    await make_user(email="reset@example.com", password="OldPassword1!")

    request_response = await client.post(
        "/auth/reset-password/request", json={"email": "reset@example.com"}
    )
    assert request_response.status_code == 200
    request_id = request_response.json()["data"]["request_id"]

    verify_response = await client.post(
        "/auth/reset-password/verify",
        json={"request_id": request_id, "otp": "000000", "new_password": "BrandNew1!"},
    )
    assert verify_response.status_code == 400


async def test_reset_password_flow_success(client, make_user, fake_redis, monkeypatch):
    user = await make_user(email="resetsuccess@example.com", password="OldPassword1!", verified=True)

    # Intercept OTP generation to know the plain OTP
    from app.routers import auth as auth_router
    async def mock_otp():
        return "654321", auth_router.get_password_hash("654321")
    
    monkeypatch.setattr(auth_router, "generate_and_hash_otp", mock_otp)

    request_response = await client.post(
        "/auth/reset-password/request", json={"email": "resetsuccess@example.com"}
    )
    assert request_response.status_code == 200
    request_id = request_response.json()["data"]["request_id"]

    verify_response = await client.post(
        "/auth/reset-password/verify",
        json={"request_id": request_id, "otp": "654321", "new_password": "BrandNew1!"},
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["success"] is True

    # Check login with old password fails
    old_login = await client.post(
        "/auth/signin", json={"email": "resetsuccess@example.com", "password": "OldPassword1!"}
    )
    assert old_login.status_code == 401

    # Check login with new password succeeds
    new_login = await client.post(
        "/auth/signin", json={"email": "resetsuccess@example.com", "password": "BrandNew1!"}
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()["data"]


async def test_reset_password_request_does_not_leak_unknown_email(client):
    response = await client.post(
        "/auth/reset-password/request", json={"email": "doesnotexist@example.com"}
    )

    assert response.status_code == 200
    assert response.json()["data"]["request_id"]


async def test_reset_password_verify_rejects_unknown_request_id(client):
    response = await client.post(
        "/auth/reset-password/verify",
        json={"request_id": "00000000-0000-0000-0000-000000000000", "otp": "123456", "new_password": "BrandNew1!"},
    )

    assert response.status_code == 400

