"""
Logging utilities
"""
from loguru import logger
import sys

def setup_logger(level: str = "INFO"):
    """Configure logger"""
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
        level=level
    )
    return logger
