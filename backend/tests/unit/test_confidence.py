import pytest
from app.evaluators.confidence import ConfidenceScorer
from app.models.response import ConfidenceScore


@pytest.fixture
def scorer():
    return ConfidenceScorer()


def test_confidence_empty_output(scorer):
    result = scorer.evaluate("")
    assert isinstance(result, ConfidenceScore)
    assert result.score == 0.0


def test_confidence_definitive_language(scorer):
    result = scorer.evaluate(
        "The capital of France is definitely Paris. This is absolutely correct."
    )
    assert isinstance(result, ConfidenceScore)
    assert result.score > 0.5
    assert result.hedging_detected == False


def test_confidence_hedged_language(scorer):
    result = scorer.evaluate(
        "The capital of France might be Paris. Perhaps it could be elsewhere."
    )
    assert isinstance(result, ConfidenceScore)
    assert result.score < 0.7
    assert result.hedging_detected == True


def test_confidence_uncertainty_markers(scorer):
    result = scorer.evaluate(
        "I think Paris is the capital, but I'm not sure about some details."
    )
    assert isinstance(result, ConfidenceScore)
    assert len(result.uncertainty_markers) > 0


def test_confidence_neutral_statement(scorer):
    result = scorer.evaluate("Paris is the capital of France.")
    assert isinstance(result, ConfidenceScore)
    assert 0.0 <= result.score <= 1.0


def test_confidence_mixed_markers(scorer):
    result = scorer.evaluate(
        "Definitely, Paris is clearly the capital, though some might disagree."
    )
    assert isinstance(result, ConfidenceScore)
    assert 0.0 <= result.score <= 1.0
