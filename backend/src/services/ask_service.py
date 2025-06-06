from src.clients.llm import OpenAIClient
from src.prompts.trade_assistant import SYSTEM_PROMPT as trade_assistant_prompt
from src.prompts.humanizer import SYSTEM_PROMPT as humanizer_prompt
from src.config.assistant import TOOLS
from src.schemas.ask import AskRequest, HumanizeDataRequest

llm_client = OpenAIClient()


def generate_assistant_stream(ask: AskRequest):
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
