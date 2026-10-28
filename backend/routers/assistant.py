import logging
import os
from typing import Literal

import openai
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from lib.db import db  # sekaligus memuat backend/.env

router = APIRouter()
logger = logging.getLogger(__name__)

# DeepSeek kompatibel dengan format OpenAI, jadi cukup pakai SDK openai dengan base_url DeepSeek.
# Kalau key kosong, backend tetap jalan; hanya request chat yang gagal (401).
client = openai.AsyncOpenAI(api_key=os.environ.get("DEEPSEEK_API_KEY", ""), base_url="https://api.deepseek.com")

MODEL = "deepseek-flash"
KNOWLEDGE_RESOURCES = ["profile", "major", "facility", "agenda", "news"]

BASE_PROMPT = """Kamu adalah asisten virtual resmi website sekolah ini.
Jawab dalam bahasa Indonesia, singkat, ramah, dan mudah dipahami calon siswa maupun orang tua.
Jawab HANYA berdasarkan data sekolah di bawah. Jika informasinya tidak ada, katakan terus terang
dan sarankan menghubungi sekolah atau mengisi formulir PPDB di website.
Jangan mengarang biaya, tanggal, nomor kontak, atau nama orang."""


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    messages: list[ChatTurn] = Field(min_length=1, max_length=20)


async def build_knowledge() -> str:
    # Urutan dibuat stabil supaya cache prefix otomatis DeepSeek tetap kena
    items = await db.cms_items.find(
        {"is_published": True, "resource": {"$in": KNOWLEDGE_RESOURCES}},
        {"_id": 0, "resource": 1, "title": 1, "description": 1, "date": 1, "end_date": 1, "skills": 1, "careers": 1},
    ).sort([("resource", 1), ("date", 1), ("title", 1)]).to_list(300)

    lines = ["# Data sekolah"]
    for item in items:
        line = f"- [{item['resource']}] {item['title']}"
        if item.get("date"):
            line += f" ({item['date']}{' s/d ' + item['end_date'] if item.get('end_date') else ''})"
        if item.get("description"):
            line += f": {item['description']}"
        if item.get("skills"):
            line += f" | Keahlian: {', '.join(item['skills'])}"
        if item.get("careers"):
            line += f" | Prospek kerja: {', '.join(item['careers'])}"
        lines.append(line)
    return "\n".join(lines)


@router.post("/assistant/chat")
async def chat(payload: ChatRequest):
    if payload.messages[0].role != "user" or payload.messages[-1].role != "user":
        raise HTTPException(status_code=422, detail="Percakapan harus diawali dan diakhiri pesan user")

    system = f"{BASE_PROMPT}\n\n{await build_knowledge()}"
    messages = [{"role": "system", "content": system}, *(m.model_dump() for m in payload.messages)]

    async def generate():
        try:
            stream = await client.chat.completions.create(
                model=MODEL,
                messages=messages,
                stream=True,
                max_tokens=2048,  # batas biaya per jawaban; endpoint ini publik
                extra_body={"thinking": {"type": "disabled"}},  # tanya-jawab sederhana tidak perlu mode berpikir
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except openai.RateLimitError:
            yield "\n\nAsisten sedang sibuk, coba lagi sebentar."
        except openai.APIError:
            logger.exception("assistant chat failed")  # termasuk 402 kalau saldo DeepSeek habis
            yield "\n\nMaaf, asisten sedang mengalami gangguan."

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")
