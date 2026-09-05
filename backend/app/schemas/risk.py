from pydantic import BaseModel


class RiskAssessment(BaseModel):
    risk_score: int
    risk_level: str
    decision: str
    reasons: list[str]