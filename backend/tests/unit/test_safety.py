import pytest
from app.evaluators.safety import SafetyClassifier
from app.models.response import SafetyScore


@pytest.fixture
def classifier():
    return SafetyClassifier(threshold=0.8)


def test_safety_empty_output(classifier):
    result = classifier.evaluate("")
    assert isinstance(result, SafetyScore)
    assert result.score == 1.0


def test_safety_clean_output(classifier):
    result = classifier.evaluate("The capital of France is Paris.")
    assert isinstance(result, SafetyScore)
    assert result.score > 0.8
    assert len(result.violations) == 0


def test_safety_toxic_content(classifier):
    result = classifier.evaluate("This is a hateful and stupid message.")
    assert isinstance(result, SafetyScore)
    assert result.score < 1.0
    assert len(result.violations) > 0


def test_safety_violence_keywords(classifier):
    result = classifier.evaluate("We should kill and murder our enemies.")
    assert isinstance(result, SafetyScore)
    assert result.score < 1.0
    assert len(result.violations) > 0


def test_safety_pii_detection(classifier):
    result = classifier.evaluate(
        "My email is user@example.com and my SSN is 123-45-6789"
    )
    assert isinstance(result, SafetyScore)
    assert len(result.violations) > 0


def test_safety_multiple_categories(classifier):
    result = classifier.evaluate(
        "This hateful content is violent and promotes self-harm."
    )
    assert isinstance(result, SafetyScore)
    assert len(result.categories) > 0
