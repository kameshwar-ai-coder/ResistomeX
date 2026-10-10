from fastapi import APIRouter, HTTPException
from app.schemas.llm import ClinicalNoteExtractRequest, ClinicalNoteExtractResponse
from app.services.llm_service import LLMService

router = APIRouter(prefix="/llm", tags=["Clinical LLM & NLP"])


@router.post("/extract", response_model=ClinicalNoteExtractResponse)
def extract_clinical_note(req: ClinicalNoteExtractRequest):
    """
    Extract structured physiologic parameters from unstructured clinical notes
    with injection sanitization and hallucination verification.
    """
    try:
        return LLMService.extract_from_note(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting clinical parameters: {str(e)}")
