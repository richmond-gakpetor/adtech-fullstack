import time
import logging
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        method = request.method
        path = request.url.path
        start_time = time.time()
        
        logger.info(
            f"→ {method} {path}",
            extra={
                "request_id": request_id,
                "method": method,
                "path": path,
                "client_ip": client_ip,
            }
        )
        
        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            status_code = response.status_code
            
            if status_code >= 500:
                log_level = logging.ERROR
                symbol = "✗"
            elif status_code >= 400:
                log_level = logging.WARNING
                symbol = "⚠"
            else:
                log_level = logging.INFO
                symbol = "✓"
            
            logger.log(
                log_level,
                f"{symbol} {method} {path} → {status_code} ({duration_ms}ms)",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "status_code": status_code,
                    "duration_ms": duration_ms,
                    "client_ip": client_ip,
                }
            )
            
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.exception(
                f"✗ {method} {path} → ERROR ({duration_ms}ms): {str(e)}",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "duration_ms": duration_ms,
                    "client_ip": client_ip,
                }
            )
            raise
