from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from ..schemas.complaints import ComplaintResponse
from ..db import supabase
from ..services.ai_service import AIService
from datetime import datetime

router = APIRouter()
ai_service = AIService()

@router.post("/process-complaint/{complaint_id}", response_model=ComplaintResponse)
async def process_existing_complaint_with_ai(complaint_id: str):
    try:
        data, count = supabase.table("complaints").select("description").eq("id", complaint_id).execute()
        
        if not data or not data[1]:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        complaint_description = data[1][0]["description"]
        ai_results = ai_service.process_complaint(complaint_description)

        update_data, count = supabase.table("complaints").update({
            "summary": ai_results.get("summary"),
            "suggested_response": ai_results.get("suggested_response"),
            "category": ai_results.get("category")
        }).eq("id", complaint_id).execute()

        if not update_data or not update_data[1]:
            raise HTTPException(status_code=500, detail="Failed to update complaint with AI results")

        updated_complaint = update_data[1][0]
        return ComplaintResponse(
            id=updated_complaint["id"],
            user_id=updated_complaint["user_id"],
            subject=updated_complaint["subject"],
            description=updated_complaint["description"],
            status=updated_complaint["status"],
            created_at=datetime.fromisoformat(updated_complaint["created_at"]),
            summary=updated_complaint.get("summary"),
            suggested_response=updated_complaint.get("suggested_response"),
            category=updated_complaint.get("category")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))