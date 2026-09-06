import os
from openai import OpenAI

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=os.environ["HF_TOKEN"]
)

response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {
            "role": "system",
            "content": "You are an agricultural AI assistant."
        },
        {
            "role": "user",
            "content": "Explain in one sentence why crop yield prediction is useful for farmers."
        }
    ]
)

print("\nAI Agricultural Insight:")
print(response.choices[0].message.content)