async def test_me_returns_current_user(client, make_user, auth_headers):
    user = await make_user(email="me@example.com", name="Me User", verified=True)
    headers = await auth_headers(user)

    response = await client.get("/user/me", headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["email"] == "me@example.com"
    assert data["name"] == "Me User"
    assert data["email_verified"] is True


async def test_me_allows_unverified_user(client, make_user, auth_headers):
    user = await make_user(email="unverified-me@example.com", verified=False)
    headers = await auth_headers(user)

    response = await client.get("/user/me", headers=headers)

    assert response.status_code == 200
    assert response.json()["data"]["email_verified"] is False


async def test_me_requires_token(client):
    response = await client.get("/user/me")
    assert response.status_code == 401
