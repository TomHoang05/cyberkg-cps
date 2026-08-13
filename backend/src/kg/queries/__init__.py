# Expose all query submodules so callers can access via `queries.q1_surface.*` etc.
from . import (
    common,
    entities,
    narrative,
    purdue,
    q1_surface,
    q2_chain,
    q3_consequence,
    q4_roles,
    q5_full,
)
