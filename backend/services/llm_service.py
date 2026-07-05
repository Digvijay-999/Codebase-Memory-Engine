import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import HTTPException

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

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini Error: {str(e)}"
        )


def explain_repository(context: str):

    prompt = f"""
You are an expert software architect.

Based ONLY on the repository context below, explain:

1. Purpose of the project
2. Tech Stack
3. Folder Structure
4. Architecture
5. Main Components

Repository Context:

{context}
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini Error: {str(e)}"
        )


def generate_readme(context: str):

    prompt = f"""
You are an expert software engineer.

Generate a professional GitHub README.md for this repository.

Include:

# Project Name

## Overview

## Features

## Tech Stack

## Installation

## Usage

## Folder Structure

## Contributing

Repository Context:

{context}
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini Error: {str(e)}"
        )
