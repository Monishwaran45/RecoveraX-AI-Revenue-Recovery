# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import asyncio
import time
import logging
from typing import Dict, Any, Optional, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse

logger = logging.getLogger(__name__)

class IdempotencyStore:
    """
    In-memory and Redis-ready Idempotency Key Store.
    Caches response status, headers, and body for state-mutating requests.
    """
    def __init__(self, ttl_seconds: int = 86400):
        self.ttl_seconds = ttl_seconds
        self._store: Dict[str, Tuple[int, Dict[str, str], bytes, float]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Tuple[int, Dict[str, str], bytes]]:
        async with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            status, headers, body, timestamp = entry
            if time.time() - timestamp > self.ttl_seconds:
                del self._store[key]
                return None
            return status, headers, body

    async def set(self, key: str, status: int, headers: Dict[str, str], body: bytes):
        async with self._lock:
            self._store[key] = (status, headers, body, time.time())

    async def clear(self):
        async with self._lock:
            self._store.clear()

idempotency_store = IdempotencyStore()

class IdempotencyMiddleware(BaseHTTPMiddleware):
    """
    HTTP Idempotency Middleware.
    Enforces idempotent execution for POST, PUT, PATCH, DELETE requests containing an 'Idempotency-Key' header.
    """
    async def dispatch(self, request: Request, call_next):
        if request.method not in ("POST", "PUT", "PATCH", "DELETE"):
            return await call_next(request)

        idempotency_key = request.headers.get("Idempotency-Key") or request.headers.get("X-Idempotency-Key")
        if not idempotency_key:
            return await call_next(request)

        cached = await idempotency_store.get(idempotency_key)
        if cached:
            status_code, headers, body = cached
            logger.info(f"Idempotency Cache HIT for key: {idempotency_key}")
            res_headers = dict(headers)
            res_headers["X-Cache"] = "HIT-Idempotency"
            res_headers["Idempotency-Key"] = idempotency_key
            return StarletteResponse(
                content=body,
                status_code=status_code,
                headers=res_headers
            )

        response = await call_next(request)
        
        # Cache successful or client-side responses (status < 500)
        if response.status_code < 500:
            response_body = [chunk async for chunk in response.body_iterator]
            response.body_iterator = iterate_in_threadpool(response_body)
            full_body = b"".join(response_body)
            
            headers_to_cache = {
                k: v for k, v in response.headers.items()
                if k.lower() not in ("content-length", "content-type")
            }
            if "content-type" in response.headers:
                headers_to_cache["content-type"] = response.headers["content-type"]

            await idempotency_store.set(
                idempotency_key,
                response.status_code,
                headers_to_cache,
                full_body
            )
            response.headers["Idempotency-Key"] = idempotency_key

        return response

async def iterate_in_threadpool(chunks):
    for chunk in chunks:
        yield chunk
