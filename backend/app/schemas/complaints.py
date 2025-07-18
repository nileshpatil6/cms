from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ComplaintCreate(BaseModel):
    user_id: str
    subject: str
    description: str
    status: Optional[str] = "pending"
    ticket_number: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    description: str
    status: str
    ticket_number: Optional[str] = None
    created_at: datetime
    summary: Optional[str] = None
    suggested_response: Optional[str] = None
    category: Optional[str] = None