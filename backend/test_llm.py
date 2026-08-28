import json
from langchain_groq import ChatGroq
from app.config import settings

def test_llm_execution():
    llm = ChatGroq(groq_api_key=settings.GROQ_API_KEY, model_name=settings.GROQ_MODEL)
    msg = "Respond ONLY in JSON format: {\"diagnosis\": \"TEMPORARY_FAILURE\", \"confidence\": 0.9, \"reason\": \"Bank gateway timeout\"}"
    res = llm.invoke(msg)
    print("RAW CONTENT:", res.content)

    content = res.content.strip()
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
    data = json.loads(content)
    print("PARSED DATA:", data)
    assert "diagnosis" in data

