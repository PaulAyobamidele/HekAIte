"""
Hallucination Detection Evaluator

This module detects unsupported claims in LLM outputs by comparing
them against provided context using semantic similarity.
"""
from typing import List, Tuple
import re
import numpy as np
from loguru import logger

from app.services.embedding import get_embedding_service
from app.models.response import HallucinationScore


class HallucinationDetector:
    """
    Detects hallucinations by checking if LLM claims are supported by context
    
    Method:
    1. Split output into sentences (claims)
    2. Embed each claim
    3. Embed context chunks
    4. Calculate semantic coverage
    5. Identify unsupported claims
    """
    
    def __init__(self, threshold: float = 0.7):
        """
        Initialize detector
        
        Args:
            threshold: Minimum similarity score to consider a claim supported (0-1)
        """
        self.threshold = threshold
        self.embedding_service = get_embedding_service()
        logger.info(f"HallucinationDetector initialized with threshold={threshold}")
    
    def evaluate(
        self, 
        model_output: str, 
        context: List[str]
    ) -> HallucinationScore:
        """
        Evaluate model output for hallucinations
        
        Args:
            model_output: The LLM's generated response
            context: List of context documents/chunks
            
        Returns:
            HallucinationScore with detailed analysis
        """
        # Handle edge cases
        if not model_output or not model_output.strip():
            return HallucinationScore(
                score=0.0,
                unsupported_claims=[],
                coverage_ratio=1.0,
                explanation="Empty output - no claims to verify"
            )
        
        if not context or len(context) == 0:
            logger.warning("No context provided - cannot verify claims")
            return HallucinationScore(
                score=1.0,  # High hallucination risk
                unsupported_claims=self._extract_sentences(model_output),
                coverage_ratio=0.0,
                explanation="No context provided - all claims are unverified"
            )
        
        # Extract claims from output
        claims = self._extract_sentences(model_output)
        
        if not claims:
            return HallucinationScore(
                score=0.0,
                unsupported_claims=[],
                coverage_ratio=1.0,
                explanation="No extractable claims found"
            )
        
        # Compute semantic coverage
        unsupported_claims, coverage_ratio = self._check_coverage(claims, context)
        
        # Calculate hallucination score
        hallucination_score = 1.0 - coverage_ratio
        
        # Generate explanation
        explanation = self._generate_explanation(
            len(claims),
            len(unsupported_claims),
            coverage_ratio
        )
        
        logger.info(
            f"Hallucination detection complete: "
            f"score={hallucination_score:.2f}, "
            f"unsupported={len(unsupported_claims)}/{len(claims)}"
        )
        
        return HallucinationScore(
            score=hallucination_score,
            unsupported_claims=unsupported_claims,
            coverage_ratio=coverage_ratio,
            explanation=explanation
        )
    
    def _extract_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences (claims)
        
        Args:
            text: Input text
            
        Returns:
            List of sentences
        """
        # Simple sentence splitting (can be improved with spaCy/NLTK)
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        return sentences
    
    def _check_coverage(
        self, 
        claims: List[str], 
        context: List[str]
    ) -> Tuple[List[str], float]:
        """
        Check which claims are supported by context
        
        Args:
            claims: List of claim sentences
            context: List of context documents
            
        Returns:
            Tuple of (unsupported_claims, coverage_ratio)
        """
        # Embed all claims and context
        claim_embeddings = self.embedding_service.embed(claims)
        context_embeddings = self.embedding_service.embed(context)
        
        unsupported_claims = []
        supported_count = 0
        
        # For each claim, find best matching context
        for i, claim in enumerate(claims):
            claim_emb = claim_embeddings[i]
            
            # Calculate similarity with all context chunks
            similarities = self.embedding_service.batch_similarity(
                claim_emb, 
                context_embeddings
            )
            
            # Check if any context supports this claim
            max_similarity = float(np.max(similarities)) if len(similarities) > 0 else 0.0
            
            if max_similarity < self.threshold:
                unsupported_claims.append(claim)
                logger.debug(f"Unsupported claim (sim={max_similarity:.2f}): {claim[:50]}...")
            else:
                supported_count += 1
        
        coverage_ratio = supported_count / len(claims) if claims else 0.0
        
        return unsupported_claims, coverage_ratio
    
    def _generate_explanation(
        self,
        total_claims: int,
        unsupported_count: int,
        coverage_ratio: float
    ) -> str:
        """
        Generate human-readable explanation
        
        Args:
            total_claims: Total number of claims analyzed
            unsupported_count: Number of unsupported claims
            coverage_ratio: Ratio of supported claims
            
        Returns:
            Explanation string
        """
        if coverage_ratio >= 0.9:
            return (
                f"Excellent: {total_claims - unsupported_count}/{total_claims} claims "
                f"are well-supported by provided context"
            )
        elif coverage_ratio >= 0.7:
            return (
                f"Good: {total_claims - unsupported_count}/{total_claims} claims supported, "
                f"but {unsupported_count} claim(s) lack clear evidence"
            )
        elif coverage_ratio >= 0.5:
            return (
                f"Concerning: Only {total_claims - unsupported_count}/{total_claims} claims "
                f"are supported. {unsupported_count} claim(s) appear to be hallucinated"
            )
        else:
            return (
                f"High risk: Majority of claims ({unsupported_count}/{total_claims}) "
                f"are unsupported by provided context"
            )
