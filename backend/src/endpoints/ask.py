from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from src.schemas.ask import (
    AskRequest,
    HumanizeDataRequest,
)
from src.services.ask_service import (
    generate_assistant_stream,
    generate_humanizer_stream,
)

router = APIRouter()


@router.post("/assistant/stream")
async def ask_assistant_stream(ask: AskRequest):
    return StreamingResponse(
        generate_assistant_stream(ask), media_type="application/x-ndjson"
    )


@router.post("/humanizer/stream")
async def humanize_response_stream(data: HumanizeDataRequest):
    return StreamingResponse(
        generate_humanizer_stream(data), media_type="text/event-stream"
    )
