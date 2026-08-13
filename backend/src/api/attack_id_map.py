"""Attack ID mapping — URL slug <-> Neo4j attack_id <-> display name.

Sprint 3 / T048 — CYB-26 §8.2 Attack ID Mapping

The REST API exposes human-readable URL slugs (e.g. 'colonial_pipeline_2021').
Neo4j stores canonical attack IDs (e.g. 'ATK-COL-001').
This module translates between the two and is the single source of truth.

Usage in route handlers:
    from src.api.attack_id_map import resolve_attack_id, SLUG_TO_ATTACK_ID

    try:
        kg_id = resolve_attack_id(slug)   # 'colonial_pipeline_2021' -> 'ATK-COL-001'
    except ValueError:
        raise HTTPException(404, {"code": "ATTACK_NOT_FOUND", ...})
"""

# URL slug -> Neo4j attack_id (canonical KG primary key)
SLUG_TO_ATTACK_ID: dict[str, str] = {
    "colonial_pipeline_2021": "ATK-COL-001",
    "triton_2017":            "ATK-TRI-001",
    "stuxnet_2010":           "ATK-STX-001",
    "german_steel_mill_2014": "ATK-GSM-001",
}

# Neo4j attack_id -> URL slug (inverse)
ATTACK_ID_TO_SLUG: dict[str, str] = {v: k for k, v in SLUG_TO_ATTACK_ID.items()}

# URL slug -> human-readable display name (used in LLM prompts)
SLUG_TO_NAME: dict[str, str] = {
    "colonial_pipeline_2021": "Colonial Pipeline",
    "triton_2017":            "TRITON",
    "stuxnet_2010":           "Stuxnet",
    "german_steel_mill_2014": "German Steel Mill",
}

# All valid slugs (for validation and 404 messages)
VALID_SLUGS: list[str] = list(SLUG_TO_ATTACK_ID.keys())


def resolve_attack_id(slug: str) -> str:
    """Resolve a URL slug to its Neo4j attack_id.

    Parameters
    ----------
    slug : str
        URL slug, e.g. 'colonial_pipeline_2021'

    Returns
    -------
    str
        Neo4j attack_id, e.g. 'ATK-COL-001'

    Raises
    ------
    ValueError
        If the slug is not in SLUG_TO_ATTACK_ID.
    """
    if slug not in SLUG_TO_ATTACK_ID:
        raise ValueError(
            f"Attack {slug!r} not found. "
            f"Valid attack IDs: {VALID_SLUGS}"
        )
    return SLUG_TO_ATTACK_ID[slug]


def resolve_slug(attack_id: str) -> str:
    """Resolve a Neo4j attack_id back to its URL slug.

    Parameters
    ----------
    attack_id : str
        Neo4j primary key, e.g. 'ATK-COL-001'

    Returns
    -------
    str
        URL slug, e.g. 'colonial_pipeline_2021'

    Raises
    ------
    ValueError
        If the attack_id is not in ATTACK_ID_TO_SLUG.
    """
    if attack_id not in ATTACK_ID_TO_SLUG:
        raise ValueError(f"attack_id {attack_id!r} has no URL slug mapping.")
    return ATTACK_ID_TO_SLUG[attack_id]
