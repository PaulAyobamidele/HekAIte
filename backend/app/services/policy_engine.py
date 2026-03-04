import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from loguru import logger

from app.models.database import Policy, PolicyViolation, Evaluation


OPERATORS = {
    "gt": lambda a, b: a > b,
    "gte": lambda a, b: a >= b,
    "lt": lambda a, b: a < b,
    "lte": lambda a, b: a <= b,
    "eq": lambda a, b: a == b,
    "neq": lambda a, b: a != b,
    "contains": lambda a, b: b in str(a),
    "not_contains": lambda a, b: b not in str(a),
}

FIELD_MAP = {
    "hallucination_score": lambda e: e.hallucination_score,
    "safety_score": lambda e: e.safety_score,
    "confidence_score": lambda e: e.confidence_score,
    "overall_risk": lambda e: e.overall_risk,
    "recommended_action": lambda e: e.recommended_action,
}

EU_AI_ACT_TEMPLATES = [
    {
        "name": "EU AI Act - High Risk Safety Threshold",
        "description": "Blocks outputs with safety score below 0.7, required for high-risk AI systems under EU AI Act Article 9.",
        "eu_risk_category": "high",
        "rules": {
            "conditions": [
                {"field": "safety_score", "operator": "lt", "value": 0.7}
            ],
            "logic": "any",
            "action": "block",
            "severity": "critical",
        },
    },
    {
        "name": "EU AI Act - Hallucination Guard",
        "description": "Flags outputs with high hallucination scores. Ensures accuracy and robustness per Article 15.",
        "eu_risk_category": "high",
        "rules": {
            "conditions": [
                {"field": "hallucination_score", "operator": "gt", "value": 0.6}
            ],
            "logic": "any",
            "action": "review",
            "severity": "high",
        },
    },
    {
        "name": "EU AI Act - Transparency Confidence Check",
        "description": "Flags low-confidence outputs for human review per Article 13 transparency obligations.",
        "eu_risk_category": "limited",
        "rules": {
            "conditions": [
                {"field": "confidence_score", "operator": "lt", "value": 0.5}
            ],
            "logic": "any",
            "action": "flag",
            "severity": "medium",
        },
    },
    {
        "name": "EU AI Act - Critical Risk Blocker",
        "description": "Blocks all critical-risk outputs. Mandatory for unacceptable-risk category systems.",
        "eu_risk_category": "unacceptable",
        "rules": {
            "conditions": [
                {"field": "overall_risk", "operator": "eq", "value": "critical"}
            ],
            "logic": "any",
            "action": "block",
            "severity": "critical",
        },
    },
    {
        "name": "EU AI Act - Combined Safety & Accuracy",
        "description": "Requires both low hallucination and high safety. Full compliance check for high-risk deployments.",
        "eu_risk_category": "high",
        "rules": {
            "conditions": [
                {"field": "hallucination_score", "operator": "gt", "value": 0.5},
                {"field": "safety_score", "operator": "lt", "value": 0.8},
            ],
            "logic": "any",
            "action": "review",
            "severity": "high",
        },
    },
]


class PolicyEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def evaluate_policies(
        self, db: Session, evaluation: Evaluation, user_id: str
    ) -> list[dict]:
        policies = (
            db.query(Policy)
            .filter(Policy.user_id == user_id, Policy.is_active == True)
            .all()
        )
        violations = []
        for policy in policies:
            result = self.check_single_policy(policy, evaluation)
            if result["violated"]:
                violation = PolicyViolation(
                    id=str(uuid.uuid4()),
                    evaluation_id=evaluation.id,
                    policy_id=policy.id,
                    policy_version=policy.version,
                    severity=result["severity"],
                    details=result["details"],
                )
                db.add(violation)
                violations.append(
                    {
                        "policy_id": policy.id,
                        "policy_name": policy.name,
                        "severity": result["severity"],
                        "action": result["action"],
                        "details": result["details"],
                    }
                )
        if violations:
            db.commit()
        return violations

    def check_single_policy(self, policy: Policy, evaluation: Evaluation) -> dict:
        rules = policy.rules
        conditions = rules.get("conditions", [])
        logic = rules.get("logic", "any")
        action = rules.get("action", "flag")
        severity = rules.get("severity", "medium")

        triggered = []
        for cond in conditions:
            field = cond.get("field")
            operator = cond.get("operator")
            threshold = cond.get("value")

            if field not in FIELD_MAP or operator not in OPERATORS:
                continue

            actual_value = FIELD_MAP[field](evaluation)
            op_fn = OPERATORS[operator]

            try:
                if op_fn(actual_value, threshold):
                    triggered.append(
                        {
                            "field": field,
                            "operator": operator,
                            "threshold": threshold,
                            "actual": actual_value,
                        }
                    )
            except (TypeError, ValueError):
                continue

        if logic == "all":
            violated = len(triggered) == len(conditions) and len(conditions) > 0
        else:
            violated = len(triggered) > 0

        return {
            "violated": violated,
            "severity": severity,
            "action": action,
            "details": {
                "triggered_conditions": triggered,
                "logic": logic,
                "total_conditions": len(conditions),
            },
        }

    def test_policy_against_data(self, rules: dict, test_data: dict) -> dict:
        class FakeEvaluation:
            pass

        fake = FakeEvaluation()
        fake.hallucination_score = test_data.get("hallucination_score", 0.0)
        fake.safety_score = test_data.get("safety_score", 1.0)
        fake.confidence_score = test_data.get("confidence_score", 1.0)
        fake.overall_risk = test_data.get("overall_risk", "low")
        fake.recommended_action = test_data.get("recommended_action", "allow")

        class FakePolicy:
            pass

        fp = FakePolicy()
        fp.rules = rules
        fp.version = 0

        return self.check_single_policy(fp, fake)

    def get_templates(self) -> list[dict]:
        return EU_AI_ACT_TEMPLATES

    def get_eu_risk_classification(self, evaluation: Evaluation) -> str:
        if evaluation.safety_score < 0.5 or evaluation.overall_risk == "critical":
            return "unacceptable"
        if evaluation.hallucination_score > 0.6 or evaluation.safety_score < 0.7:
            return "high"
        if evaluation.confidence_score < 0.5:
            return "limited"
        return "minimal"

    # CRUD helpers
    def create_policy(
        self,
        db: Session,
        user_id: str,
        name: str,
        rules: dict,
        description: Optional[str] = None,
        eu_risk_category: Optional[str] = None,
    ) -> Policy:
        policy = Policy(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            description=description,
            version=1,
            eu_risk_category=eu_risk_category,
            rules=rules,
            is_active=True,
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
        return policy

    def update_policy(
        self,
        db: Session,
        policy: Policy,
        name: Optional[str] = None,
        description: Optional[str] = None,
        rules: Optional[dict] = None,
        eu_risk_category: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Policy:
        if name is not None:
            policy.name = name
        if description is not None:
            policy.description = description
        if rules is not None:
            policy.rules = rules
            policy.version += 1
        if eu_risk_category is not None:
            policy.eu_risk_category = eu_risk_category
        if is_active is not None:
            policy.is_active = is_active
        policy.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(policy)
        return policy


def get_policy_engine() -> PolicyEngine:
    return PolicyEngine()
