import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
)


def ask_llm(question: str, context: str):

    prompt = f"""
You are an expert software engineer.

Answer ONLY using the provided repository context.

If the answer is not in the context, say:
"I couldn't find that in the repository."

Repository Context:

{context}

Question:

{question}
"""

    response = model.generate_content(prompt)

    return response.text