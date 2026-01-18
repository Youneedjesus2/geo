from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.auditor import run_audit


router = APIRouter()

#= wetake the business name and city from the frontend
class AuditRequest(BaseModel):
    business_name: str
    city: str

@router.post("/audit")
async def audit_business(request: AuditRequest):
    if not request.business_name or not request.city:
        raise HTTPException(status_code=400, detail="Missing fields")

    # call service layer
    results = run_audit(request.business_name, request.city)
    

    return {
        "status": "success",
        "data": results
    }