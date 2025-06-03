from pydantic import BaseModel
from typing import Optional, List, Any


class AskRequest(BaseModel):
    question: str
    context: Optional[List] = None


class ToolConfig(BaseModel):
    function: str
    params: dict


class AskResponse(BaseModel):
    answer: Optional[str] = None
    tool_config: Optional[ToolConfig] = None


class HumanizeDataRequest(BaseModel):
    raw: str


class HumanizedResponse(BaseModel):
    answer: str
