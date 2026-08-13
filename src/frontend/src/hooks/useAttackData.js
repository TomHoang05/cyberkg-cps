import { useState, useEffect } from 'react';
import { attackService } from '../services/attackService';

// Queries that don't require an attackId (list endpoints)
const LIST_QUERIES = new Set(['listAttacks']);

export function useAttackData(attackId, queryType = 'surface') {
  const [data,    setData]    = useState(null);
  // AUDIT-FIXED: was useState(false) — left loading=false on first render before
  // the effect runs, so consumers could flash an empty graph for one frame.
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!queryType) return;
    if (!(queryType in attackService)) return;
    // Non-list queries require an attackId
    if (!LIST_QUERIES.has(queryType) && !attackId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    attackService[queryType](attackId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Cleanup: mark stale so in-flight response is ignored
    return () => { cancelled = true; };
  }, [attackId, queryType]);

  return { data, loading, error };
}
