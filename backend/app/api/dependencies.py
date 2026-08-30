from collections import defaultdict, deque
from secrets import compare_digest
from time import monotonic
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.config import settings
from app.database.session import get_db

_bearer = HTTPBearer(auto_error=False)
_request_times: dict[str, deque[float]] = defaultdict(deque)

async def require_api_auth(request: Request) -> str:
    """Require a server-side bearer token outside explicitly enabled demo mode."""
    if request.method == "OPTIONS":
        return "options"
    if settings.DEMO_MODE:
        return "demo"
    if not settings.is_production() and not settings.API_AUTH_TOKEN:
        return "dev-unauthenticated"
    if not settings.API_AUTH_TOKEN:
        return "unauthenticated-demo"
    credentials: HTTPAuthorizationCredentials | None = await _bearer(request)
    if not credentials or credentials.scheme.lower() != "bearer" or not compare_digest(credentials.credentials, settings.API_AUTH_TOKEN):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid bearer authentication is required")
    return "api-token"

async def enforce_rate_limit(request: Request) -> None:
    if settings.DEMO_MODE or not settings.is_production():
        return
    client = request.client.host if request.client else "unknown"
    now = monotonic()
    window = 60.0
    timestamps = _request_times[client]
    while timestamps and now - timestamps[0] >= window:
        timestamps.popleft()
    if len(timestamps) >= settings.RATE_LIMIT_PER_MINUTE:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
    timestamps.append(now)

__all__ = ["get_db", "require_api_auth", "enforce_rate_limit"]
