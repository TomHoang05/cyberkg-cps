"""
Transform Service — T054
=========================
Converts Q1+Q2_LLM+Q3_LLM+Q4 query outputs into a flat intermediate dict
optimised for LLM prompt templates.

Canonical function: transform_kg_to_llm_dict(surface, chain, consequence, roles)
Source: CYB-26 §9.2 | CYB-22 §III.2 (design reference)
CLAUDE.md §17: function signature pinned here — do NOT rename or restructure.

The intermediate dict (returned by this function) is the ONLY input
accepted by llm_service_prompts.build_prompt(). All template placeholders
must match the keys returned here.

Query formats expected:
  surface    — Q1_ATTACK_SURFACE      (flat attack props + techniques/systems/zones as map lists)
  chain      — Q2_ATTACK_CHAIN_LLM    (single row: chain list + bridge_mechanisms list)
  consequence— Q3_CONSEQUENCE_LLM     (single row: consequences list + ot_system + physical_process + instructional_concepts)
  roles      — Q4_ROLES               (single row: human_roles list + ai_components list)

Intermediate dict keys (canonical — CLAUDE.md §17):
    attack_name, attack_id, year, sector, actor,
    bridge_type, bridge_name, purdue_from, purdue_to,
    chain, ot_system, physical_process, safety_critical,
    consequences, human_actors, ai_components,
    evidence_class_counts, instructional_concepts,
    attack, provenance_summary
"""
from typing import Any


def transform_kg_to_llm_dict(
    surface:     dict,
    chain:       dict,
    consequence: dict,
    roles:       dict,
) -> dict[str, Any]:
    """Convert Q1+Q2_LLM+Q3_LLM+Q4 outputs to intermediate dict for LLM prompting.

    Parameters
    ----------
    surface:     result of Q1_ATTACK_SURFACE       — flat attack props + map lists
    chain:       result of Q2_ATTACK_CHAIN_LLM     — {chain: [...], bridge_mechanisms: [...]}
    consequence: result of Q3_CONSEQUENCE_LLM      — {consequences: [...], ot_system, physical_process, ...}
    roles:       result of Q4_ROLES                — {human_roles: [...], ai_components: [...]}

    Returns
    -------
    Flat dict with canonical keys as documented in CLAUDE.md §17.
    """
    # ── Q1: Attack node properties (now returned as flat fields) ─────────
    attack_name = surface.get("name", surface.get("attack_id", ""))

    # ── Q2: Bridge and chain info ────────────────────────────────────────
    bridges = (chain or {}).get("bridge_mechanisms", [])
    bridge  = bridges[0] if bridges else {}

    # Ordered attack chain steps from Q2_LLM
    chain_steps = [
        {
            "step":     s.get("step"),
            "mitre_id": s.get("technique_id"),
            "name":     s.get("name"),
            "tactic":   s.get("tactic"),
            "plane":    s.get("plane"),
            "evidence": s.get("evidence_class"),
        }
        for s in (chain or {}).get("chain", [])
    ]

    # ── Q3: Consequence data (now returned as flat aggregated row) ───────
    conseqs = [
        {
            "type":        c.get("table1_category"),
            "description": c.get("name"),
            "realized":    c.get("was_realized"),
            "severity":    c.get("severity"),
            "table1":      c.get("table1_category"),
        }
        for c in (consequence or {}).get("consequences", [])
    ]

    ot_system        = (consequence or {}).get("ot_system")
    physical_process = (consequence or {}).get("physical_process")
    instructional_concepts = (consequence or {}).get("instructional_concepts", [])

    # ── Q4: Human and AI roles (fix 0.1 — Q4 now also returns ai_attack_surfaces) ─
    human_actors = [
        {
            "role":        h.get("role_type"),
            "description": h.get("role_description") or h.get("name"),
            "action":      h.get("action"),
        }
        for h in (roles or {}).get("human_roles", [])
    ]
    ai_components = [
        {
            "name":            ai.get("name"),
            "type":            ai.get("ai_type"),
            "is_hypothetical": ai.get("is_hypothetical", True),
            "role":            ai.get("role"),
        }
        for ai in (roles or {}).get("ai_components", [])
    ]
    ai_attack_surfaces = [
        {
            "id":            ais.get("surface_id"),
            "name":          ais.get("name"),
            "surface_type":  ais.get("surface_type"),
            "is_adversarial": ais.get("is_adversarial", True),
            "category":      ais.get("table1_category"),
            "atlas_id":      ais.get("mitre_atlas_id"),
        }
        for ais in (roles or {}).get("ai_attack_surfaces", [])
    ]

    # ── Evidence class counts (from Q1 flat nodes) ───────────────────────
    ec: dict[str, int] = {
        "documented_fact":         0,
        "supported_inference":     0,
        "instructional_extension": 0,
    }
    for cls in (
        [surface.get("evidence_class")]
        + [t.get("evidence_class") for t in surface.get("techniques", [])]
        + [s.get("evidence_class") for s in surface.get("systems", [])]
    ):
        if cls in ec:
            ec[cls] += 1

    # Weighted confidence: documented_fact=1.0, supported_inference=0.5
    total = sum(ec.values())
    overall_confidence = round(
        (ec["documented_fact"] * 1.0 + ec["supported_inference"] * 0.5) / max(total, 1),
        2,
    )

    # provenance_summary is a dict so generator.py can extract evidence_class_distribution
    # and overall_confidence; str() conversion is used inside template.format()
    provenance_summary = {
        "evidence_class_distribution": ec,
        "overall_confidence": overall_confidence,
    }

    return {
        # Attack header (flat, not nested)
        "attack_name":   attack_name,
        "attack_id":     surface.get("attack_id"),
        "year":          surface.get("year"),
        "sector":        surface.get("industry_sector"),
        "actor":         surface.get("attributed_to"),
        # Bridge (from Q2 bridge_mechanisms)
        "bridge_type":   bridge.get("bridge_type"),
        "bridge_name":   bridge.get("name"),
        "purdue_from":   bridge.get("purdue_from"),
        "purdue_to":     bridge.get("purdue_to"),
        # Chain
        "chain":         chain_steps,
        # Physical (from Q3_LLM flat fields)
        "ot_system":         ot_system,
        "physical_process":  physical_process,
        "safety_critical":   False,
        # Consequences
        "consequences":      conseqs,
        # Roles
        "human_actors":       human_actors,
        "ai_components":      ai_components,
        "ai_attack_surfaces": ai_attack_surfaces,
        # Provenance
        "evidence_class_counts":   ec,
        "instructional_concepts":  instructional_concepts,
        # Template placeholder aliases — all 5 .txt templates use {attack} and {provenance_summary}
        "attack":              attack_name,
        "provenance_summary":  provenance_summary,
    }
