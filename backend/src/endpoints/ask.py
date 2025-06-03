from fastapi import APIRouter, HTTPException
from src.schemas.ask import (
    AskRequest,
    AskResponse,
    HumanizeDataRequest,
    HumanizedResponse,
)
from src.clients.llm import OpenAIClient
from src.prompts.trade_assistant import SYSTEM_PROMPT as trade_assistant_prompt
from src.prompts.humanizer import SYSTEM_PROMPT as humanizer_prompt
from src.config.assistant import TOOLS
import json

router = APIRouter()
llm_client = OpenAIClient()


@router.post("/assistant", response_model=AskResponse)
async def ask_assistant(ask: AskRequest):
    try:
        llm_answer = llm_client.generate_text(
            system_prompt=trade_assistant_prompt,
            user_prompt=ask.question,
            context=ask.context,
            tools=TOOLS,
        )
        if llm_answer.tool_calls:
            return AskResponse(
                answer=None,
                tool_config={
                    "function": llm_answer.tool_calls[0].function.name,
                    "params": json.loads(llm_answer.tool_calls[0].function.arguments),
                },
            )
        return AskResponse(answer=llm_answer.content, tool_config=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/humanizer", response_model=HumanizedResponse)
def humanize_response(data: HumanizeDataRequest):
    try:
        llm_answer = llm_client.generate_text(
            system_prompt=humanizer_prompt, user_prompt=data.raw
        )
        return HumanizedResponse(answer=llm_answer.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
