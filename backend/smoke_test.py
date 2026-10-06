"""End-to-End smoke test for ResistomeX Backend & AI Inference Services."""

import os
import sys
import asyncio

# Insert backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

import httpx
from app.main import app
from app.services.model_registry import model_registry
from app.services.amr_service import AMRService
from app.schemas.amr import PatientInputSchema


async def run_smoke_tests():
    print("==================================================")
    print("ResistomeX Backend & AI Inference Smoke Tests")
    print("==================================================")
    
    # 1. Verify Model Registry
    print("\n[1/7] Testing Model Registry...")
    assert model_registry.is_loaded is True, "ModelRegistry is not loaded!"
    assert model_registry.model is not None, "Model binary is None!"
    assert model_registry.preprocessor is not None, "Preprocessor is None!"
    print(f"  -> Model version: {model_registry.metadata.get('model_version')}")
    print(f"  -> Preprocessor features: {len(model_registry.preprocessor.feature_names)}")
    print("  [PASS] Model registry loaded successfully.")

    # 2. Test Direct AMR Inference Service
    print("\n[2/7] Testing Direct AMR Inference Service...")
    sample_patient = PatientInputSchema(
        patient_id="PT-SMOKE-01",
        encounter_id="ENC-SMOKE-01",
        age_years=72.0,
        sex="Female",
        ward="ICU",
        primary_diagnosis="Urosepsis",
        infection_source="Urinary Tract Infection",
        temperature_c=38.9,
        heart_rate_bpm=112.0,
        systolic_bp_mmhg=95.0,
        diastolic_bp_mmhg=60.0,
        spo2_percent=94.0,
        respiratory_rate_bpm=22.0,
        crp_mg_l=88.5,
        comorbidities="Diabetes; CKD",
        kidney_function="Moderate impairment",
        drug_allergy="Penicillin",
        prior_antibiotic_exposure_count_90d=2,
        prior_antibiotic_days=10,
        prior_resistant_organism="ESBL",
        ward_endemic_resistance_rate=0.28
    )

    pred_res = AMRService.predict_amr_risk(sample_patient)
    assert pred_res.success is True
    assert 0.0 <= pred_res.prediction.probability <= 1.0
    assert pred_res.prediction.risk_level in ["Low", "Medium", "High"]
    assert len(pred_res.explanation.top_risk_factors) > 0
    print(f"  -> Predicted Probability: {pred_res.prediction.probability * 100:.1f}% ({pred_res.prediction.risk_level} Risk)")
    print(f"  -> Top SHAP Driver: {pred_res.explanation.top_risk_factors[0].feature} (+{pred_res.explanation.top_risk_factors[0].shap_value})")
    print(f"  -> Safety Alerts: {pred_res.explanation.safety_warnings}")
    print("  [PASS] Direct AMR Service inference works.")

    # 3. Test API via AsyncClient
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # Health endpoint
        print("\n[3/7] Testing GET /health...")
        h_res = await client.get("/health")
        assert h_res.status_code == 200
        h_data = h_res.json()
        assert h_data["status"] == "healthy"
        assert h_data["model_loaded"] is True
        print(f"  -> Health payload: {h_data}")
        print("  [PASS] /health returned 200 OK.")

        # Predict endpoint
        print("\n[4/7] Testing POST /api/amr/predict...")
        p_res = await client.post("/api/amr/predict", json=sample_patient.model_dump())
        assert p_res.status_code == 200
        p_data = p_res.json()
        assert p_data["success"] is True
        assert "prediction" in p_data
        assert "explanation" in p_data
        print(f"  -> Prediction response: {p_data['prediction']['risk_level']} ({p_data['prediction']['probability_percent']}%)")
        print("  [PASS] /api/amr/predict returned 200 OK.")

        # Explain endpoint
        print("\n[5/7] Testing POST /api/amr/explain...")
        e_res = await client.post("/api/amr/explain", json={
            "patient_id": "PT-SMOKE-01",
            "encounter_id": "ENC-SMOKE-01",
            "features": sample_patient.model_dump(),
            "top_k": 5
        })
        assert e_res.status_code == 200
        e_data = e_res.json()
        assert e_data["success"] is True
        assert len(e_data["top_risk_drivers"]) > 0
        print(f"  -> Top driver: {e_data['top_risk_drivers'][0]['display_name']}")
        print("  [PASS] /api/amr/explain returned 200 OK.")

        # Treatment support endpoint
        print("\n[6/7] Testing POST /api/treatment/support...")
        t_res = await client.post("/api/treatment/support", json={
            "patient_id": "PT-SMOKE-01",
            "encounter_id": "ENC-SMOKE-01",
            "predicted_amr_probability": pred_res.prediction.probability,
            "infection_source": "Urinary Tract Infection",
            "drug_allergy": "Penicillin",
            "kidney_function": "Moderate impairment"
        })
        assert t_res.status_code == 200
        t_data = t_res.json()
        assert t_data["success"] is True
        assert len(t_data["candidate_regimens"]) > 0
        print(f"  -> Regimens returned: {[r['antibiotic_name'] for r in t_data['candidate_regimens']]}")
        print("  [PASS] /api/treatment/support returned 200 OK.")

        # LLM Note Extraction endpoint
        print("\n[7/7] Testing POST /api/llm/extract...")
        note = "Admitted with fever. T 39.1 C, HR 110, BP 118/75, SpO2 96%. History: CKD; allergy Penicillin; prior antibiotic exposure in 90d 2; previous resistant organism ESBL."
        l_res = await client.post("/api/llm/extract", json={"raw_clinical_note": note})
        assert l_res.status_code == 200
        l_data = l_res.json()
        assert l_data["success"] is True
        assert l_data["extracted_features"]["temperature_c"] == 39.1
        assert l_data["extracted_features"]["drug_allergy"] == "Penicillin"
        print(f"  -> Extracted: Temp={l_data['extracted_features']['temperature_c']}C, Allergy={l_data['extracted_features']['drug_allergy']}")
        print("  [PASS] /api/llm/extract returned 200 OK.")

    print("\n==================================================")
    print("ALL 7 SMOKE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_smoke_tests())
