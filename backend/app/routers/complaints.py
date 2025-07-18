from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from ..schemas.complaints import ComplaintCreate, ComplaintResponse
from ..db import supabase
from ..services.ai_service import AIService
from datetime import datetime
from typing import List
from uuid import uuid4

ai_service = AIService()

router = APIRouter()

# Placeholder for dependency to get current user (for future JWT implementation)
# For now, assumes user_id is provided in the complaint payload
async def get_current_user_id():
    # In a real application, this would decode a JWT to get the user ID
    # For now, we'll just return a dummy user ID or expect it in the payload
    return "dummy_user_id_from_auth"

@router.post("/", response_model=ComplaintResponse)
async def submit_complaint(complaint: ComplaintCreate):
    try:
        ticket_number = f"TICKET-{uuid4().hex[:8].upper()}"
        # The user_id is coming from the payload for now, as per instructions
        # In a real app, this would be `user_id = Depends(get_current_user_id)`
        data, count = supabase.table("complaints").insert({
            "user_id": complaint.user_id,
            "subject": complaint.subject,
            "description": complaint.description,
            "status": complaint.status,
            "ticket_number": ticket_number,
            "created_at": datetime.now().isoformat(),
            "summary": None,
            "suggested_response": None,
            "category": None
        }).execute()

        print('Supabase insert result:', data)

        if data and data[1]:
            inserted_complaint = data[1][0]
            complaint_id = inserted_complaint["id"]
            complaint_description = inserted_complaint["description"]

            ai_results = ai_service.process_complaint(complaint_description)

            update_data, count = supabase.table("complaints").update({
                "summary": ai_results.get("summary"),
                "suggested_response": ai_results.get("suggested_response"),
                "category": ai_results.get("category")
            }).eq("id", complaint_id).execute()

            print('Supabase update result:', update_data)

            if update_data:
                # Refresh the inserted_complaint with AI data for the response
                inserted_complaint.update({
                    "summary": ai_results.get("summary"),
                    "suggested_response": ai_results.get("suggested_response"),
                    "category": ai_results.get("category")
                })

        if data and data[1]:
            # Supabase returns a list of inserted objects
            inserted_complaint = data[1][0] # Access the first element of the list of lists
            return ComplaintResponse(
                id=inserted_complaint["id"],
                user_id=inserted_complaint["user_id"],
                subject=inserted_complaint["subject"],
                description=inserted_complaint["description"],
                status=inserted_complaint["status"],
                ticket_number=inserted_complaint.get("ticket_number"),
                created_at=datetime.fromisoformat(inserted_complaint["created_at"]),
                summary=inserted_complaint.get("summary"),
                suggested_response=inserted_complaint.get("suggested_response"),
                category=inserted_complaint.get("category")
            )
        else:
            raise HTTPException(status_code=400, detail="Complaint submission failed")
    except Exception as e:
        import traceback
        print('Exception in submit_complaint:', traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/process-complaint/{complaint_id}", response_model=ComplaintResponse)
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
            ticket_number=updated_complaint.get("ticket_number"),
            created_at=datetime.fromisoformat(updated_complaint["created_at"]),
            summary=updated_complaint.get("summary"),
            suggested_response=updated_complaint.get("suggested_response"),
            category=updated_complaint.get("category")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ComplaintResponse])
async def list_complaints():
    try:
        data, count = supabase.table("complaints").select("*").execute()
        if data and data[1]:
            return [
                {
                    **item,
                    "ticket_number": item.get("ticket_number")
                } for item in data[1]
            ]
        else:
            return []
    except Exception as e:
        import traceback
        print('Exception in list_complaints:', traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))