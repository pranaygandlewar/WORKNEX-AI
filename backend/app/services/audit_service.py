import json
import sys
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models import AuditLog

# Argument names whose values must never be persisted in plaintext.
_SENSITIVE_ARG_NAMES = {"approval_token", "password", "api_key", "secret", "token", "new_password"}

def redact_arguments(arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of *arguments* with sensitive values replaced."""
    if not isinstance(arguments, dict):
        return arguments
    redacted = {}
    for key, value in arguments.items():
        if any(sensitive in key.lower() for sensitive in _SENSITIVE_ARG_NAMES):
            redacted[key] = "***REDACTED***"
        elif isinstance(value, dict):
            redacted[key] = redact_arguments(value)
        else:
            redacted[key] = value
    return redacted

def record_audit(
    tool_name: str,
    arguments: dict,
    result: str,
    actor: str = "system",
    action_type: str = "MCP_TOOL",
    status: str = "SUCCESS",
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """Persist an append-only audit log entry.

    Arguments are redacted of sensitive values before serialization.
    """
    safe_args = json.dumps(redact_arguments(arguments))
    entry = AuditLog(
        tool_name=tool_name,
        arguments=safe_args,
        result=str(result)[:2000],
        timestamp=datetime.now(timezone.utc),
        actor=actor,
        action_type=action_type,
        status=status
    )
    
    if db is not None:
        try:
            db.add(entry)
            db.commit()
            return entry
        except Exception as exc:
            db.rollback()
            print(f"[audit] failed to record entry: {exc}", file=sys.stderr)
            return None
    return None

