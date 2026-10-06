import logging
from app.ai.llm import ClinicalNoteExtractor, ClinicalHallucinationChecker
from app.schemas.llm import (
    ClinicalNoteExtractRequest,
    ClinicalNoteExtractResponse,
    ExtractedClinicalFeatures
)

logger = logging.getLogger(__name__)
extractor = ClinicalNoteExtractor()
checker = ClinicalHallucinationChecker()


class LLMService:
    """Clinical Note Extraction and Auditing Service."""

    @staticmethod
    def extract_from_note(req: ClinicalNoteExtractRequest) -> ClinicalNoteExtractResponse:
        sanitized = extractor._sanitize_input(req.raw_clinical_note)
        extracted = extractor.extract(req.raw_clinical_note)
        
        if extracted is None:
            features = ExtractedClinicalFeatures()
            return ClinicalNoteExtractResponse(
                success=False,
                extracted_features=features,
                hallucination_check_passed=True,
                hallucination_warnings=["No valid clinical parameters parsed from text."],
                sanitized_note=sanitized
            )

        feat_dict = extracted.model_dump()
        is_hallucinated, warnings = checker.check_extraction_hallucination(feat_dict, req.raw_clinical_note)

        clean_features = ExtractedClinicalFeatures(
            temperature_c=extracted.temperature_c,
            heart_rate_bpm=extracted.heart_rate_bpm,
            systolic_bp_mmhg=extracted.systolic_bp_mmhg,
            diastolic_bp_mmhg=extracted.diastolic_bp_mmhg,
            spo2_percent=extracted.spo2_percent,
            respiratory_rate_bpm=extracted.respiratory_rate_bpm,
            crp_mg_l=extracted.crp_mg_l,
            comorbidities=extracted.comorbidities or [],
            previous_antibiotic_exposure=bool(extracted.previous_antibiotic_exposure),
            previous_antibiotics=extracted.previous_antibiotics or [],
            prior_resistant_organism=extracted.prior_resistant_organism or "None known",
            drug_allergy=extracted.drug_allergy or "None known",
            allergy_severity=extracted.allergy_severity,
            infection_source=extracted.infection_source or "Unknown"
        )

        return ClinicalNoteExtractResponse(
            success=True,
            extracted_features=clean_features,
            hallucination_check_passed=(not is_hallucinated),
            hallucination_warnings=warnings,
            sanitized_note=sanitized
        )
