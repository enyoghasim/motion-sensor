import ipaddress
from fastapi import Request


def parse_device_info(user_agent: str | None) -> str:
    if not user_agent:
        return "Unknown Device"

    ua = user_agent.lower()
    if "iphone" in ua or "ipad" in ua or "ios" in ua or "expo" in ua or "cfnetwork" in ua:
        return "iOS App"
    if "android" in ua or "okhttp" in ua:
        return "Android App"
    if "chrome" in ua:
        return "Chrome Browser"
    if "safari" in ua:
        return "Safari Browser"
    if "firefox" in ua:
        return "Firefox Browser"
    if "curl" in ua or "postman" in ua or "httpx" in ua:
        return "API Client"

    return "Web Browser / Client"


def extract_client_context(request: Request) -> tuple[str, str]:
    user_agent = request.headers.get("user-agent")
    device_name = parse_device_info(user_agent)

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif request.client:
        client_ip = request.client.host
    else:
        client_ip = "Unknown IP"

    # Determine location hint
    location = "Local Network"
    try:
        ip_obj = ipaddress.ip_address(client_ip)
        if not ip_obj.is_private and not ip_obj.is_loopback:
            location = f"IP {client_ip}"
        else:
            location = f"Local ({client_ip})"
    except ValueError:
        location = client_ip

    return device_name, location
