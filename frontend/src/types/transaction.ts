export interface Transaction {
  id: number;
  user_id: number;
  amount: string;
  currency: string;
  merchant: string;
  category: string;
  timestamp: string;
  location: string | null;
  device_id: string | null;
  status: string;
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: string;
  decision: string;
  reasons: string[];
}

export interface TransactionWithRisk extends Transaction {
  risk: RiskAssessment;
}