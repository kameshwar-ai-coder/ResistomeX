// ResistomeX Clinical Dataset (Static Fabricated Mock Data Cleared)

export const INITIAL_PATIENTS = [];

export const MOCK_ADMIN_SURVEILLANCE = {
  totalInpatients: 0,
  hospitalAmrRate: "0.0%",
  stewardshipCompliance: "0.0%",
  highRiskPatientsCount: 0,
  wardBreakdown: [],
  pathogenPrevalence: [],
  monthlyResistanceTrend: []
};

export const MOCK_ANTIBIOTIC_USAGE = {
  dddPer1000BedDays: 0,
  broadSpectrumRatio: "0.0%",
  stewardshipInterventionsThisMonth: 0,
  topAntibiotics: []
};

export const MOCK_AI_PERFORMANCE = {
  rocAuc: 0,
  sensitivity: "0.0%",
  specificity: "0.0%",
  precision: "0.0%",
  f1Score: "0.000",
  modelName: "ResistomeX XGBoost v2.4",
  lastTrained: "-",
  totalTrainingSamples: 0,
  confusionMatrix: {
    truePositive: 0,
    falsePositive: 0,
    falseNegative: 0,
    trueNegative: 0
  },
  globalShapImportance: []
};

export const MOCK_USERS = [];
