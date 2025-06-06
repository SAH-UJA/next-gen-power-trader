from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from src.schemas.ask import (
    AskRequest,
    HumanizeDataRequest,
)
from src.clients.llm import OpenAIClient
from src.prompts.trade_assistant import SYSTEM_PROMPT as trade_assistant_prompt
from src.prompts.humanizer import SYSTEM_PROMPT as humanizer_prompt
from src.config.assistant import TOOLS

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

    return StreamingResponse(token_generator(), media_type="text/event-stream")
