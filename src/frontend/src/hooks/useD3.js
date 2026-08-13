import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

/**
 * Generic D3 lifecycle hook — CYB-29 §5.
 * Usage: const svgRef = useD3((svg, data) => { ... return cleanup; }, data);
 *
 * ⚠️  StrictMode runs effects twice — the cleanup fn (simulation.stop()) is mandatory.
 * ⚠️  renderFn must not mutate the data prop; clone arrays if D3 mutates them.
 */
export function useD3(renderFn, data) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const cleanup = renderFn(svg, data);
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  return svgRef;
}
