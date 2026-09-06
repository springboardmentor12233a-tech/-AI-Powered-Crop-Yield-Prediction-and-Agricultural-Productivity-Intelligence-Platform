import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {
            "role": "user",
            "content": "Explain in simple terms how AI can help farmers predict crop yield."
        }
    ],
    temperature=0.7,
)

print("\n===== GROQ LLM RESPONSE =====\n")
print(response.choices[0].message.content)