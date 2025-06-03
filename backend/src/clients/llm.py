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
    ) -> str:
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
                )
            else:
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                )
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
