from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json
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


@router.post("/assistant/stream")
async def ask_assistant_stream(ask: AskRequest):
    def token_generator():
        try:
            for token in llm_client.generate_text(
                system_prompt=trade_assistant_prompt,
                user_prompt=ask.question,
                context=ask.context,
                tools=TOOLS,
                stream=True,
            ):
                yield token
        except Exception as e:
            yield f"\n[ERROR]: {str(e)}"

    return StreamingResponse(token_generator(), media_type="application/x-ndjson")


@router.post("/humanizer", response_model=HumanizedResponse)
def humanize_response(data: HumanizeDataRequest):
    try:
        llm_answer = llm_client.generate_text(
            system_prompt=humanizer_prompt, user_prompt=data.raw
        )
        return HumanizedResponse(answer=llm_answer.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/humanizer/stream")
async def humanize_response_stream(data: HumanizeDataRequest):
    def token_generator():
        try:
            for token in llm_client.generate_text(
                system_prompt=humanizer_prompt,
                user_prompt=data.raw,
                stream=True,
            ):
                yield token
        except Exception as e:
            yield f"\n[ERROR]: {str(e)}"

    return StreamingResponse(token_generator(), media_type="text/plain")
