"""Helpers for UTC chat: filters, citations, FAQ/OOS short-circuit."""

from __future__ import annotations

import json
from datetime import date

from constants.utc import DEFAULT_UTC_SYSTEM_PROMPT
from schemas.utc import CitationSource
from services.domain_router import classify_domain, out_of_scope_message
from services.faq import FaqService


def build_domain_filter(domain: str | None, audience: str | None = None) -> dict | None:
    cond: dict = {}
    if domain and domain not in ("chung", "out_of_scope"):
        cond["domain"] = domain
    if audience and audience != "all":
        cond["audience"] = audience
    return cond or None


def prefer_effective(results: list, today: date | None = None) -> list:
    today = today or date.today()

    def effective_rank(r) -> tuple:
        payload = getattr(r, "payload", None) or {}
        ef = payload.get("effective_from")
        et = payload.get("effective_to")
        ok = True
        try:
            if ef and date.fromisoformat(str(ef)[:10]) > today:
                ok = False
            if et and date.fromisoformat(str(et)[:10]) < today:
                ok = False
        except ValueError:
            ok = True
        return (0 if ok else 1, -getattr(r, "score", 0))

    return sorted(results, key=effective_rank)


def results_to_citations(results: list, limit: int = 5) -> list[CitationSource]:
    cites: list[CitationSource] = []
    for r in results[:limit]:
        payload = getattr(r, "payload", None) or {}
        text = payload.get("_text") or ""
        cites.append(
            CitationSource(
                title=payload.get("title") or payload.get("filename") or "Tài liệu",
                excerpt=(text[:240] + "…") if len(text) > 240 else text,
                document_id=payload.get("document_id"),
                heading=payload.get("heading"),
                filename=payload.get("filename"),
                score=getattr(r, "score", None),
            )
        )
    return cites


def citations_header(citations: list[CitationSource]) -> str:
    return json.dumps([c.model_dump() for c in citations], ensure_ascii=False)


async def resolve_utc_pre_rag(db, query: str) -> dict:
    """
    Returns dict:
      domain, out_of_scope (bool), faq_answer (str|None), filter (dict|None)
    """
    domain = classify_domain(query)
    if domain == "out_of_scope":
        return {
            "domain": domain,
            "out_of_scope": True,
            "faq_answer": out_of_scope_message(),
            "filter": None,
        }

    faq_svc = FaqService(db)
    faq = await faq_svc.best_match(query, domain=domain)
    if faq:
        return {
            "domain": domain,
            "out_of_scope": False,
            "faq_answer": faq.answer,
            "faq_id": faq.id,
            "filter": build_domain_filter(domain),
        }

    return {
        "domain": domain,
        "out_of_scope": False,
        "faq_answer": None,
        "filter": build_domain_filter(domain),
    }


def utc_system_prompt_fallback() -> str:
    return DEFAULT_UTC_SYSTEM_PROMPT
