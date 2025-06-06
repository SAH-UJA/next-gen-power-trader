from src.config.settings import settings
from typing import List
import openai


class OpenAIClient:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client = openai.OpenAI(api_key=self.api_key)

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        context: List = None,
        tools: List = None,
        stream: bool = False,
    ):
        try:
            messages = [
                {"role": "system", "content": system_prompt},
            ]
            if context:
                messages.extend(context)
            messages.append({"role": "user", "content": user_prompt})
            if tools:
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                    tools=tools,
                    tool_choice="auto",
                    stream=stream,
                )
            else:
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                    stream=stream,
                )
            if stream:
                for chunk in response:
                    print("DEBUG LLM STREAM CHUNK:", chunk)  # Add logging for debugging
                    # Emit tool call events as JSON objects
                    if (
                        hasattr(chunk.choices[0].delta, "tool_calls")
                        and chunk.choices[0].delta.tool_calls
                    ):
                        import json

                        # Convert tool_calls to serializable dicts
                        def to_dict(obj):
                            if hasattr(obj, "model_dump"):
                                return obj.model_dump()
                            elif hasattr(obj, "__dict__"):
                                return obj.__dict__
                            else:
                                return str(obj)

                        tool_calls = chunk.choices[0].delta.tool_calls
                        if isinstance(tool_calls, list):
                            serializable_tool_calls = [to_dict(tc) for tc in tool_calls]
                        else:
                            serializable_tool_calls = to_dict(tool_calls)

                        yield json.dumps({"tool_call": serializable_tool_calls}) + "\n"
                    # Emit normal content tokens
                    if (
                        hasattr(chunk.choices[0].delta, "content")
                        and chunk.choices[0].delta.content
                    ):
                        yield chunk.choices[0].delta.content + "\n"
            else:
                return response.choices[0].message
        except Exception as e:
            raise RuntimeError(f"Error generating text: {str(e)}") from e


if __name__ == "__main__":
    client = OpenAIClient()
    prompt = "What is the capital of France?"
    try:
        answer = client.generate_text(prompt)
        print(f"Answer: {answer}")
    except RuntimeError as e:
        print(e)
