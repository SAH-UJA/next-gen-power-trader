from src.clients.llm import OpenAIClient
from src.prompts.trade_assistant import SYSTEM_PROMPT as trade_assistant_prompt
from src.prompts.humanizer import SYSTEM_PROMPT as humanizer_prompt
from src.config.assistant import TOOLS
from src.schemas.ask import AskRequest, HumanizeDataRequest

llm_client = OpenAIClient()


import json


def generate_assistant_stream(ask: AskRequest):
    try:
        for token in llm_client.generate_text(
            system_prompt=trade_assistant_prompt,
            user_prompt=ask.question,
            context=ask.context,
            tools=TOOLS,
            stream=True,
        ):
            # If token is a tool call JSON, yield as-is; else wrap in {"content": ...}
            try:
                parsed = json.loads(token)
                if isinstance(parsed, dict) and "tool_call" in parsed:
                    yield token  # Already a complete tool_call JSON
                    continue
            except Exception:
                pass
            yield json.dumps({"content": token}) + "\n"
    except Exception as e:
        yield json.dumps({"error": str(e)}) + "\n"


def generate_humanizer_stream(data: HumanizeDataRequest):
    try:
        for token in llm_client.generate_text(
            system_prompt=humanizer_prompt,
            user_prompt=data.raw,
            stream=True,
        ):
            yield token
    except Exception as e:
        yield f"\n[ERROR]: {str(e)}"
