import json
from langchain_groq import ChatGroq
from app.config import settings

llm = ChatGroq(groq_api_key=settings.GROQ_API_KEY, model_name=settings.GROQ_MODEL)
msg = "Respond ONLY in JSON format: {\"diagnosis\": \"TEMPORARY_FAILURE\", \"confidence\": 0.9, \"reason\": \"Bank gateway timeout\"}"
res = llm.invoke(msg)
print("RAW CONTENT:", res.content)

# Clean up JSON if surrounded by markdown code blocks
content = res.content.strip()
if content.startswith("```"):
    content = content.split("\n", 1)[1].rsplit("\n", 1)[0]
data = json.loads(content)
print("PARSED DATA:", data)
