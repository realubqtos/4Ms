from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel
import google.generativeai as genai


class AgentResult(BaseModel):
    success: bool
    data: Dict[str, Any]
    error: Optional[str] = None
    metadata: Dict[str, Any] = {}


class BaseAgent(ABC):
    def __init__(self, model_name: str = "gemini-pro"):
        self.model = genai.GenerativeModel(model_name)
        self.agent_name = self.__class__.__name__

    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> AgentResult:
        pass

    async def generate_content(self, prompt: str) -> str:
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"{self.agent_name} generation error: {str(e)}")
