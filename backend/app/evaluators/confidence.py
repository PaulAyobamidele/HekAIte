"""
Confidence Scoring Evaluator

Analyzes linguistic markers to assess how confident the LLM is in its response.
High confidence != correctness (that's what other evaluators check).
"""
from typing import List
import re
from loguru import logger

from app.models.response import ConfidenceScore


class ConfidenceScorer:
    """
    Analyzes confidence based on linguistic markers
    
    Signals:
    - Hedging language ("might", "possibly", "perhaps")
    - Uncertainty markers ("I think", "I'm not sure")
    - Qualifiers ("may", "could", "sometimes")
    - Definitive statements ("definitely", "certainly")
    """
    
    HEDGING_WORDS = [
        "might", "maybe", "perhaps", "possibly", "probably",
        "could be", "may be", "seems", "appears", "likely"
    ]
    
    UNCERTAINTY_PHRASES = [
        "i think", "i believe", "i'm not sure", "i don't know",
        "not certain", "unclear", "unsure", "difficult to say"
    ]
    
    DEFINITIVE_WORDS = [
        "definitely", "certainly", "absolutely", "clearly",
        "obviously", "undoubtedly", "without doubt"
    ]
    
    def __init__(self):
        """Initialize confidence scorer"""
        logger.info("ConfidenceScorer initialized")
    
    def evaluate(self, model_output: str) -> ConfidenceScore:
        """
        Evaluate confidence level of the output
        
        Args:
            model_output: The LLM's generated response
            
        Returns:
            ConfidenceScore with detailed analysis
        """
        if not model_output or not model_output.strip():
            return ConfidenceScore(
                score=0.0,
                uncertainty_markers=[],
                hedging_detected=False,
                explanation="Empty output - no confidence analysis possible"
            )
        
        text_lower = model_output.lower()
        
        # Detect hedging
        hedging_markers = self._find_markers(text_lower, self.HEDGING_WORDS)
        hedging_detected = len(hedging_markers) > 0
        
        # Detect uncertainty
        uncertainty_markers = self._find_markers(text_lower, self.UNCERTAINTY_PHRASES)
        
        # Detect definitive language
        definitive_markers = self._find_markers(text_lower, self.DEFINITIVE_WORDS)
        
        # Calculate confidence score
        # More hedging/uncertainty = lower confidence
        # More definitive language = higher confidence
        hedging_penalty = min(len(hedging_markers) * 0.15, 0.5)
        uncertainty_penalty = min(len(uncertainty_markers) * 0.2, 0.5)
        definitive_bonus = min(len(definitive_markers) * 0.1, 0.3)
        
        base_score = 0.7  # Neutral baseline
        confidence_score = base_score - hedging_penalty - uncertainty_penalty + definitive_bonus
        confidence_score = max(0.0, min(1.0, confidence_score))
        
        # Combine all markers
        all_markers = hedging_markers + uncertainty_markers
        
        # Generate explanation
        explanation = self._generate_explanation(
            confidence_score,
            hedging_detected,
            len(uncertainty_markers),
            len(definitive_markers)
        )
        
        logger.info(
            f"Confidence evaluation complete: "
            f"score={confidence_score:.2f}, "
            f"hedging={len(hedging_markers)}, "
            f"uncertainty={len(uncertainty_markers)}"
        )
        
        return ConfidenceScore(
            score=confidence_score,
            uncertainty_markers=all_markers,
            hedging_detected=hedging_detected,
            explanation=explanation
        )
    
    def _find_markers(self, text: str, markers: List[str]) -> List[str]:
        """
        Find marker phrases in text
        
        Args:
            text: Text to search (lowercase)
            markers: List of marker phrases
            
        Returns:
            List of found markers
        """
        found = []
        for marker in markers:
            if marker in text:
                found.append(marker)
        return found
    
    def _generate_explanation(
        self,
        score: float,
        hedging: bool,
        uncertainty_count: int,
        definitive_count: int
    ) -> str:
        """Generate human-readable explanation"""
        if score >= 0.8:
            if definitive_count > 0:
                return f"High confidence with {definitive_count} definitive statement(s)"
            return "Response stated with high confidence"
        elif score >= 0.6:
            return "Moderate confidence with some qualifiers"
        elif score >= 0.4:
            if hedging:
                return "Low confidence with noticeable hedging language"
            return f"Uncertain response with {uncertainty_count} uncertainty marker(s)"
        else:
            return "Very low confidence, highly uncertain or speculative"
