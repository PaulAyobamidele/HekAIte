"""
Embedding service for semantic similarity
"""
from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
from loguru import logger


class EmbeddingService:
    """Handles text embeddings for semantic analysis"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialize embedding model
        
        Args:
            model_name: HuggingFace model identifier
        """
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        logger.info("Embedding model loaded successfully")
    
    def embed(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for texts
        
        Args:
            texts: List of text strings
            
        Returns:
            Numpy array of embeddings (n_texts, embedding_dim)
        """
        if not texts:
            return np.array([])
        
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings
    
    def cosine_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            emb1: First embedding vector
            emb2: Second embedding vector
            
        Returns:
            Similarity score (0-1)
        """
        dot_product = np.dot(emb1, emb2)
        norm_product = np.linalg.norm(emb1) * np.linalg.norm(emb2)
        
        if norm_product == 0:
            return 0.0
        
        similarity = dot_product / norm_product
        return float(similarity)
    
    def batch_similarity(self, query_emb: np.ndarray, context_embs: np.ndarray) -> np.ndarray:
        """
        Calculate similarity between one query and multiple context embeddings
        
        Args:
            query_emb: Query embedding (1D array)
            context_embs: Context embeddings (2D array)
            
        Returns:
            Array of similarity scores
        """
        if context_embs.size == 0:
            return np.array([])
        
        # Normalize embeddings
        query_norm = query_emb / np.linalg.norm(query_emb)
        context_norms = context_embs / np.linalg.norm(context_embs, axis=1, keepdims=True)
        
        # Compute similarities
        similarities = np.dot(context_norms, query_norm)
        return similarities


# Global instance (singleton pattern)
_embedding_service = None


def get_embedding_service(model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> EmbeddingService:
    """Get or create embedding service instance"""
    global _embedding_service
    
    if _embedding_service is None:
        _embedding_service = EmbeddingService(model_name)
    
    return _embedding_service
