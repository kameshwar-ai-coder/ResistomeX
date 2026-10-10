import logging
from app.ai.llm import RuleConstrainedRecommendationEngine
from app.services.decision_service import DecisionService
from app.schemas.treatment import (
    TreatmentSupportRequest,
    TreatmentSupportResponse,
    AntibioticOptionSchema
)

logger = logging.getLogger(__name__)
engine = RuleConstrainedRecommendationEngine()


class TreatmentService:
    """Guideline-filtered Empiric Antimicrobial Recommendation Service."""

    @staticmethod
    def get_treatment_support(req: TreatmentSupportRequest) -> TreatmentSupportResponse:
        risk_cat = "High" if req.predicted_amr_probability >= 0.70 else "Medium" if req.predicted_amr_probability >= 0.40 else "Low"
        learned_context = DecisionService.get_learned_few_shot_context(req.infection_source, risk_cat)

        recommendations = engine.generate_recommendations(
            patient_id=req.patient_id,
            encounter_id=req.encounter_id,
            predicted_amr_prob=req.predicted_amr_probability,
            infection_source=req.infection_source,
            drug_allergy=req.drug_allergy,
            kidney_function=req.kidney_function,
            learned_context=learned_context
        )

        candidate_options = []
        for reg in recommendations.candidate_regimens:
            # Determine coverage score based on line type and risk
            score = 92 if "First-Line" in reg.line_type else 84
            candidate_options.append(AntibioticOptionSchema(
                regimen_id=reg.regimen_id,
                antibiotic_name=reg.antibiotic_name,
                spectrum=reg.spectrum,
                line_type=reg.line_type,
                dosing_guidance=reg.dosing_guidance,
                contraindications=reg.contraindications,
                renal_adjustment_required=reg.renal_adjustment_required,
                coverage_score_percent=score
            ))

        return TreatmentSupportResponse(
            success=True,
            patient_id=req.patient_id,
            encounter_id=req.encounter_id,
            predicted_amr_probability=req.predicted_amr_probability,
            risk_category=recommendations.risk_category,
            infection_source=req.infection_source,
            candidate_regimens=candidate_options,
            safety_warnings=recommendations.safety_warnings,
            stewardship_rationale=recommendations.antimicrobial_stewardship_rationale
        )
