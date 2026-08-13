"""LLM generation pipeline — D-18 §III.4."""
import hashlib, time
from pathlib import Path
from datetime import datetime, timezone
from typing import Literal
from src.api.config import LLMConfig
from src.api.models.responses import InstructionalOutput, OutputType, EvidenceDistribution
from src.llm.cache import get_cache, set_cache

TEMPLATES_DIR = Path(__file__).parent / "templates"
SYSTEM_PROMPT = (TEMPLATES_DIR / "system_prompt.txt").read_text()

TEMPLATES = {
    "attack_surface":       (TEMPLATES_DIR / "attack_surface.txt").read_text(),
    "it_ot_movement":       (TEMPLATES_DIR / "it_ot_movement.txt").read_text(),
    "physical_consequences":(TEMPLATES_DIR / "consequences.txt").read_text(),
    "ai_human_role":        (TEMPLATES_DIR / "ai_human_role.txt").read_text(),
    "attack_dossier":       (TEMPLATES_DIR / "attack_dossier.txt").read_text(),
}


def _cache_key(attack_name: str, output_type: str, kg_data: dict) -> str:
    kg_hash = hashlib.sha256(str(kg_data).encode()).hexdigest()[:16]
    return f"{attack_name}:{output_type}:{kg_hash}"


def generate_instructional_output(
    attack_name: str,
    output_type: Literal["attack_surface", "it_ot_movement", "physical_consequences",
                         "ai_human_role", "attack_dossier"],
    kg_data: dict,
    llm_config: LLMConfig,
) -> InstructionalOutput:
    """Core generation function — D-18 §III.4."""
    cache_key = _cache_key(attack_name, output_type, kg_data)
    cached = get_cache(cache_key)
    if cached:
        return InstructionalOutput(**cached)

    template = TEMPLATES[output_type]
    prompt = template.format(**{k: str(v) for k, v in kg_data.items()})

    t0 = time.time()
    content = _call_llm(llm_config, SYSTEM_PROMPT, prompt)
    latency_ms = int((time.time() - t0) * 1000)

    prov = kg_data.get("provenance_summary", {})
    dist = prov.get("evidence_class_distribution", {})

    output = InstructionalOutput(
        attack=attack_name,
        output_type=OutputType(output_type),
        content=content,
        model_used=llm_config.LLM_MODEL_OPENAI if llm_config.LLM_PRIMARY == "openai"
                   else llm_config.LLM_MODEL_ANTHROPIC,
        kg_confidence=prov.get("overall_confidence", 0.0),
        evidence_class_distribution=EvidenceDistribution(**dist),
        generated_at=datetime.now(timezone.utc),
        generation_latency_ms=latency_ms,
    )
    set_cache(cache_key, output.model_dump(), ttl=llm_config.LLM_CACHE_TTL)
    return output


def _call_llm(cfg: LLMConfig, system: str, user: str) -> str:
    """Call primary LLM with fallback — D-18 §III.4."""
    if cfg.LLM_PRIMARY == "openai":
        try:
            return _openai_call(cfg, system, user)
        except Exception:
            return _anthropic_call(cfg, system, user)
    else:
        try:
            return _anthropic_call(cfg, system, user)
        except Exception:
            return _openai_call(cfg, system, user)


def _openai_call(cfg: LLMConfig, system: str, user: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=cfg.OPENAI_API_KEY)
    resp = client.chat.completions.create(
        model=cfg.LLM_MODEL_OPENAI,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}],
        max_tokens=cfg.LLM_MAX_TOKENS,
        temperature=cfg.LLM_TEMPERATURE,
    )
    return resp.choices[0].message.content


def _anthropic_call(cfg: LLMConfig, system: str, user: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=cfg.ANTHROPIC_API_KEY)
    resp = client.messages.create(
        model=cfg.LLM_MODEL_ANTHROPIC,
        max_tokens=cfg.LLM_MAX_TOKENS,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return resp.content[0].text
