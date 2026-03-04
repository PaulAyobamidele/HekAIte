"""
Request models (Pydantic schemas)
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class EvaluationRequest(BaseModel):
    """Request schema for LLM output evaluation"""
    
    prompt: str = Field(
        ...,
        description="The original prompt sent to the LLM",
        min_length=1,
        max_length=10000
    )
    
    model_output: str = Field(
        ...,
        description="The LLM's generated response",
        min_length=1,
        max_length=50000
    )
    
    context: Optional[List[str]] = Field(
        default=None,
        description="Retrieved context/documents (for RAG systems)"
    )
    
    sources: Optional[List[str]] = Field(
        default=None,
        description="URLs or source references"
    )
    
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional metadata (model name, temperature, etc.)"
    )
    
    company_id: Optional[str] = Field(
        default=None,
        description="Company identifier for multi-tenant setup"
    )
    
    policy_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Custom policy configuration"
    )
    
    model_config = {
        "protected_namespaces": (),
        "json_schema_extra": {
            "examples": [{
                "prompt": "What is the capital of France?",
                "model_output": "The capital of France is Paris, which is located on the Seine River.",
                "context": [
                    "Paris is the capital and most populous city of France.",
                    "The city is located on the Seine River in northern France."
                ],
                "metadata": {
                    "model": "gpt-4",
                    "temperature": 0.7,
                    "timestamp": "2024-02-04T10:30:00Z"
                }
            }]
        }
    }
