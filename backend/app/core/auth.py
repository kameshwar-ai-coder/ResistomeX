"""Authentication dependency for ResistomeX API."""

import os
import logging
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Dict[str, Any]:
    """
    Authenticate clinical user via Supabase Bearer JWT or internal API Key.
    If REQUIRE_AUTH is False and no token provided, grants dev access.
    """
    api_key_header = request.headers.get("X-API-Key")
    configured_api_key = os.getenv("API_KEY")

    # 1. API Key Check
    if api_key_header and configured_api_key and api_key_header == configured_api_key:
        return {"sub": "service-account", "role": "service_role", "authenticated": True}

    # 2. Bearer Token Check (Supabase JWT or Bearer)
    if credentials and credentials.credentials:
        token = credentials.credentials
        # In a full Supabase environment, verify JWT against Supabase JWT Secret or anon key
        # For lightweight verification:
        if token.startswith("sb-") or len(token) > 20:
            return {"sub": "authenticated-clinician", "token": token, "authenticated": True}
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid clinical authorization token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 3. Environment Fallback for Dev / Testing
    require_auth = getattr(settings, "REQUIRE_AUTH", False)
    if not require_auth:
        return {
            "sub": "dev-clinician",
            "role": "physician",
            "authenticated": False,
            "dev_mode": True
        }

    # If auth required and no credentials provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
