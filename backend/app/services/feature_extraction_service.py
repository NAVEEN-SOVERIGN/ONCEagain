from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.feature import MovementFeature

class FeatureExtractionService:
    @staticmethod
    def save_features(db: Session, session_id: str, features_data: List[Dict[str, Any]]) -> List[MovementFeature]:
        saved = []
        for feat in features_data:
            mf = MovementFeature(
                screening_session_id=session_id,
                functional_test_id=feat.get("functional_test_id"),
                feature_name=feat["feature_name"],
                feature_value=feat["feature_value"],
                unit=feat.get("unit", ""),
                body_side=feat.get("body_side", "BILATERAL"),
                confidence=feat.get("confidence", 1.0),
                source=feat.get("source", "CAMERA_ESTIMATE")
            )
            db.add(mf)
            saved.append(mf)
        db.commit()
        return saved
