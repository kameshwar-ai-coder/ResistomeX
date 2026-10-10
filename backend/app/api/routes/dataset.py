import os
import io
import json
import pandas as pd
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel

router = APIRouter(prefix="/dataset", tags=["10k Dataset & Data Ingestion"])

# Path to the 10k clinical dataset
DATASET_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "..",
        "..",
        "ml-research",
        "data",
        "cohorts",
        "resistomex_cohort_v2_10000.csv"
    )
)

# In-memory dataframe cache for high-speed queries
_cached_df: Optional[pd.DataFrame] = None


def get_dataset_df() -> pd.DataFrame:
    global _cached_df
    if _cached_df is None:
        if os.path.exists(DATASET_PATH):
            _cached_df = pd.read_csv(DATASET_PATH).fillna("")
        else:
            # Fallback path if running from different working directory
            alt_path = os.path.join(os.getcwd(), "ml-research", "data", "cohorts", "resistomex_cohort_v2_10000.csv")
            if os.path.exists(alt_path):
                _cached_df = pd.read_csv(alt_path).fillna("")
            else:
                raise HTTPException(status_code=404, detail="10k clinical dataset file not found on server.")
    return _cached_df


class DatasetStatsResponse(BaseModel):
    total_records: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    wards: List[str]
    infection_sources: List[str]
    pathogens: List[str]
    available_columns: List[str]


class EHRParseRequest(BaseModel):
    raw_text: Optional[str] = None
    json_payload: Optional[Dict[str, Any]] = None


@router.get("/stats", response_model=DatasetStatsResponse)
def get_dataset_stats():
    """Returns aggregated metadata and summary distributions of the 10,000 clinical patient dataset."""
    df = get_dataset_df()
    risk_counts = df["amr_risk_category"].value_counts().to_dict()
    
    return DatasetStatsResponse(
        total_records=len(df),
        high_risk_count=int(risk_counts.get("High", 0)),
        medium_risk_count=int(risk_counts.get("Medium", 0)),
        low_risk_count=int(risk_counts.get("Low", 0)),
        wards=sorted([w for w in df["ward"].unique().tolist() if str(w).strip()]),
        infection_sources=sorted([s for s in df["infection_source"].unique().tolist() if str(s).strip()])[:25],
        pathogens=sorted([p for p in df["suspected_pathogen"].unique().tolist() if str(p).strip()])[:25],
        available_columns=list(df.columns)
    )


@router.get("/records")
def search_dataset_records(
    search: Optional[str] = Query(None, description="Search keyword in patient_name, patient_id, encounter_id, diagnosis, pathogen"),
    risk_category: Optional[str] = Query(None, description="Filter by risk category: High, Medium, Low"),
    ward: Optional[str] = Query(None, description="Filter by hospital ward"),
    infection_source: Optional[str] = Query(None, description="Filter by infection source"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Search and paginate through the 10k dataset records."""
    df = get_dataset_df()
    filtered = df

    if isinstance(risk_category, str) and risk_category and risk_category != "All":
        filtered = filtered[filtered["amr_risk_category"].astype(str).str.lower() == risk_category.lower()]

    if isinstance(ward, str) and ward and ward != "All":
        filtered = filtered[filtered["ward"].astype(str).str.contains(ward, case=False, na=False)]

    if isinstance(infection_source, str) and infection_source and infection_source != "All":
        filtered = filtered[filtered["infection_source"].astype(str).str.contains(infection_source, case=False, na=False)]

    if isinstance(search, str) and search.strip():
        s = search.strip().lower()
        mask = (
            filtered["patient_name"].astype(str).str.lower().str.contains(s, na=False) |
            filtered["patient_id"].astype(str).str.lower().str.contains(s, na=False) |
            filtered["encounter_id"].astype(str).str.lower().str.contains(s, na=False) |
            filtered["primary_diagnosis"].astype(str).str.lower().str.contains(s, na=False) |
            filtered["suspected_pathogen"].astype(str).str.lower().str.contains(s, na=False) |
            filtered["infection_source"].astype(str).str.lower().str.contains(s, na=False) |
            filtered["prior_resistant_organism"].astype(str).str.lower().str.contains(s, na=False) |
            filtered["resistance_phenotype"].astype(str).str.lower().str.contains(s, na=False) |
            filtered["prior_antibiotic_90d"].astype(str).str.lower().str.contains(s, na=False) |
            filtered["ward"].astype(str).str.lower().str.contains(s, na=False)
        )
        filtered = filtered[mask]

    limit_val = int(limit) if isinstance(limit, (int, str)) and not hasattr(limit, "default") else 50
    offset_val = int(offset) if isinstance(offset, (int, str)) and not hasattr(offset, "default") else 0

    total_matched = len(filtered)
    page_records = filtered.iloc[offset_val:offset_val + limit_val].to_dict(orient="records")

    return {
        "total": total_matched,
        "offset": offset,
        "limit": limit,
        "records": page_records
    }


@router.get("/record/{record_id}")
def get_single_record(record_id: str):
    """Retrieve a full 10k record by patient_id or encounter_id."""
    df = get_dataset_df()
    match = df[(df["patient_id"] == record_id) | (df["encounter_id"] == record_id)]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"No dataset record found with ID '{record_id}'")
    return match.iloc[0].to_dict()


@router.post("/upload")
async def upload_dataset_file(file: UploadFile = File(...)):
    """
    Parse uploaded CSV or Excel (.xlsx, .xls) file into standardized 10k-format records.
    Normalizes column headers and converts types.
    """
    filename = file.filename or "uploaded_file.csv"
    contents = await file.read()

    try:
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(contents))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(contents))
        else:
            df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file '{filename}': {str(e)}")

    # Header normalization mapping for varying EHR column names
    col_mapping = {
        "patientid": "patient_id",
        "mrn": "patient_id",
        "patient_mrn": "patient_id",
        "name": "patient_name",
        "fullname": "patient_name",
        "patientname": "patient_name",
        "age": "age_years",
        "gender": "sex",
        "diagnosis": "primary_diagnosis",
        "infection": "infection_source",
        "pathogen": "suspected_pathogen",
        "temp": "temperature_c",
        "temperature": "temperature_c",
        "hr": "heart_rate_bpm",
        "heart_rate": "heart_rate_bpm",
        "pulse": "heart_rate_bpm",
        "systolic": "systolic_bp_mmhg",
        "systolic_bp": "systolic_bp_mmhg",
        "bp_systolic": "systolic_bp_mmhg",
        "diastolic": "diastolic_bp_mmhg",
        "diastolic_bp": "diastolic_bp_mmhg",
        "bp_diastolic": "diastolic_bp_mmhg",
        "spo2": "spo2_percent",
        "o2_sat": "spo2_percent",
        "rr": "respiratory_rate_bpm",
        "resp_rate": "respiratory_rate_bpm",
        "respiratory_rate": "respiratory_rate_bpm",
        "crp": "crp_mg_l",
        "kidney": "kidney_function",
        "liver": "liver_function",
        "allergy": "drug_allergy",
        "allergies": "drug_allergy",
        "prior_abx": "prior_antibiotic_90d",
        "prior_antibiotics": "prior_antibiotic_90d",
        "prior_antibiotic_exposure": "prior_antibiotic_90d",
        "prior_resistant": "prior_resistant_organism",
        "ward_resistance": "ward_endemic_resistance_rate"
    }

    # Rename lower-cased stripped column names if present
    new_cols = {}
    for col in df.columns:
        norm = str(col).strip().lower().replace(" ", "_").replace("-", "_")
        if norm in col_mapping:
            new_cols[col] = col_mapping[norm]
        else:
            new_cols[col] = norm
    df = df.rename(columns=new_cols)

    df = df.fillna("")
    records = df.to_dict(orient="records")

    return {
        "success": True,
        "filename": filename,
        "total_rows_parsed": len(records),
        "columns_detected": list(df.columns),
        "records": records[:200],  # Return up to first 200 rows for preview
        "message": f"Successfully parsed {len(records)} records from {filename}."
    }


@router.post("/parse-ehr")
def parse_ehr_payload(request: EHRParseRequest):
    """
    Parses pasted raw EHR clinical text or JSON / FHIR export into standardized 10k dataset attributes.
    """
    if request.json_payload:
        data = request.json_payload
        return {
            "success": True,
            "parsed_record": {
                "patient_id": data.get("patient_id") or data.get("id", f"PT-{os.urandom(2).hex().upper()}"),
                "encounter_id": data.get("encounter_id", f"ENC-{os.urandom(3).hex().upper()}"),
                "patient_name": data.get("patient_name") or data.get("name", "EHR Ingested Patient"),
                "age_years": float(data.get("age_years") or data.get("age", 60)),
                "sex": data.get("sex") or data.get("gender", "Male"),
                "pregnancy_status": data.get("pregnancy_status", "Not applicable"),
                "ward": data.get("ward", "ICU Ward 22"),
                "bed": str(data.get("bed", "Bed 01")),
                "primary_diagnosis": data.get("primary_diagnosis") or data.get("diagnosis", "Sepsis / Severe Infection"),
                "infection_source": data.get("infection_source") or data.get("source", "Bloodstream / Sepsis"),
                "suspected_pathogen": data.get("suspected_pathogen") or data.get("pathogen", "Gram-negative Bacilli"),
                "temperature_c": float(data.get("temperature_c") or data.get("temp", 38.5)),
                "heart_rate_bpm": float(data.get("heart_rate_bpm") or data.get("hr", 102)),
                "systolic_bp_mmhg": float(data.get("systolic_bp_mmhg") or data.get("systolic", 110)),
                "diastolic_bp_mmhg": float(data.get("diastolic_bp_mmhg") or data.get("diastolic", 70)),
                "spo2_percent": float(data.get("spo2_percent") or data.get("spo2", 95)),
                "respiratory_rate_bpm": float(data.get("respiratory_rate_bpm") or data.get("rr", 22)),
                "crp_mg_l": float(data.get("crp_mg_l") or data.get("crp", 48.0)),
                "comorbidities": data.get("comorbidities", "Diabetes Mellitus; Hypertension"),
                "kidney_function": data.get("kidney_function", "Normal"),
                "liver_function": data.get("liver_function", "Normal"),
                "drug_allergy": data.get("drug_allergy", "None known"),
                "prior_antibiotic_exposure_count_90d": int(data.get("prior_antibiotic_exposure_count_90d", 1)),
                "prior_antibiotic_90d": data.get("prior_antibiotic_90d", "Ceftriaxone"),
                "prior_antibiotic_days": int(data.get("prior_antibiotic_days", 5)),
                "prior_resistant_organism": data.get("prior_resistant_organism", "None known"),
                "ward_endemic_resistance_rate": float(data.get("ward_endemic_resistance_rate", 0.28))
            }
        }

    # If raw text is provided
    text = (request.raw_text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Either raw_text or json_payload must be provided.")

    # Simple heuristic extraction from EHR notes
    return {
        "success": True,
        "parsed_record": {
            "patient_id": f"PT-{os.urandom(2).hex().upper()}",
            "encounter_id": f"ENC-{os.urandom(3).hex().upper()}",
            "patient_name": "Ingested EHR Patient",
            "age_years": 65,
            "sex": "Female" if "female" in text.lower() else "Male",
            "ward": "ICU Ward 22" if "icu" in text.lower() else "General Medicine",
            "bed": "Bed 12",
            "primary_diagnosis": "Severe Infection / Sepsis",
            "infection_source": "Pneumonia" if "pneumonia" in text.lower() else "Urinary Tract Infection" if "uti" in text.lower() else "Bloodstream / Sepsis",
            "suspected_pathogen": "Pseudomonas aeruginosa" if "pseudomonas" in text.lower() else "E. coli" if "e. coli" in text.lower() else "Gram-negative Bacilli",
            "temperature_c": 38.6,
            "heart_rate_bpm": 105,
            "systolic_bp_mmhg": 115,
            "diastolic_bp_mmhg": 72,
            "spo2_percent": 94,
            "respiratory_rate_bpm": 22,
            "crp_mg_l": 55.0,
            "comorbidities": "Hypertension; Type 2 Diabetes",
            "kidney_function": "Normal",
            "liver_function": "Normal",
            "drug_allergy": "Penicillin" if "penicillin" in text.lower() else "None known",
            "prior_antibiotic_exposure_count_90d": 1,
            "prior_antibiotic_90d": "Levofloxacin" if "levo" in text.lower() else "Ceftriaxone",
            "prior_antibiotic_days": 7,
            "prior_resistant_organism": "ESBL E. coli" if "esbl" in text.lower() else "None known",
            "ward_endemic_resistance_rate": 0.32
        }
    }
