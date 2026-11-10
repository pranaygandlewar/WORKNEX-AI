from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.api.dependencies import get_db, get_current_user_or_demo
from backend.app.models import User, AIConversation, AIMessage
from backend.app.schemas import (
    AIChatRequest,
    AIChatResponse,
    AIConversationResponse,
    AIMessageResponse
)
from backend.app.ai.agent import AIAssistantService

router = APIRouter(prefix="/ai", tags=["AI Business Assistant"])

@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(
    chat_in: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo)
):
    """Interact with the WORKNEX AI Assistant through MCP tool orchestration."""
    service = AIAssistantService(db=db, current_user=current_user)
    return service.process_chat(
        message=chat_in.message,
        conversation_id=chat_in.conversation_id
    )

@router.get("/conversations", response_model=List[AIConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo)
):
    """Retrieve chat history sessions for the current user."""
    if current_user.role == "Demo Visitor":
        return []
        
    convs = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.updated_at.desc())
        .limit(20)
        .all()
    )
    result = []
    for c in convs:
        msgs = (
            db.query(AIMessage)
            .filter(AIMessage.conversation_id == c.id)
            .order_by(AIMessage.timestamp.asc())
            .all()
        )
        result.append(
            AIConversationResponse(
                id=c.id,
                title=c.title,
                created_at=c.created_at,
                messages=[AIMessageResponse.model_validate(m) for m in msgs]
            )
        )
    return result

@router.get("/conversations/{conversation_id}", response_model=AIConversationResponse)
def get_single_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_demo)
):
    """Retrieve a single chat conversation thread with all message history."""
    c = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    msgs = (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == c.id)
        .order_by(AIMessage.timestamp.asc())
        .all()
    )
    return AIConversationResponse(
        id=c.id,
        title=c.title,
        created_at=c.created_at,
        messages=[AIMessageResponse.model_validate(m) for m in msgs]
    )

