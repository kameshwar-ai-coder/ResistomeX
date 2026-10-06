from typing import Generator
from app.services.model_registry import model_registry, ModelRegistry


def get_model_registry() -> ModelRegistry:
    """Dependency for injecting ModelRegistry."""
    return model_registry
