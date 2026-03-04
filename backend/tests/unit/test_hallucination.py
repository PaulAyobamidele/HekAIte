import pytest
from app.evaluators.hallucination import HallucinationDetector
from app.models.response import HallucinationScore


@pytest.fixture
def detector():
    return HallucinationDetector(threshold=0.7)


def test_hallucination_empty_output(detector):
    result = detector.evaluate("", [])
    assert isinstance(result, HallucinationScore)
    assert result.score == 0.0
    assert len(result.unsupported_claims) == 0


def test_hallucination_no_context(detector):
    result = detector.evaluate(
        "The capital of France is Paris.",
        []
    )
    assert isinstance(result, HallucinationScore)
    assert result.score == 1.0
    assert result.coverage_ratio == 0.0


def test_hallucination_supported_claims(detector):
    output = "The capital of France is Paris."
    context = ["Paris is the capital of France."]
    
    result = detector.evaluate(output, context)
    assert isinstance(result, HallucinationScore)
    assert result.score < 0.5
    assert result.coverage_ratio > 0.5


def test_hallucination_multiple_claims(detector):
    output = "Paris is the capital of France. Paris is on the Seine river."
    context = [
        "Paris is the capital of France.",
        "The Seine river flows through Paris."
    ]
    
    result = detector.evaluate(output, context)
    assert isinstance(result, HallucinationScore)
    assert result.coverage_ratio > 0.3


def test_hallucination_threshold_applied(detector):
    output = "The capital of France is Marseille."
    context = ["Paris is the capital of France."]
    
    result = detector.evaluate(output, context)
    assert isinstance(result, HallucinationScore)
    assert result.score >= 0.0
    assert result.score <= 1.0
