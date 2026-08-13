// jsdom-compatible D3 stub — covers all methods used by AttackSurface,
// Timeline, and PurdueModel visualisation components.
const noop = () => {};

const chain = () => {
  const obj = {
    // selection / DOM
    attr: () => obj, on: () => obj, append: () => obj,
    selectAll: () => obj, select: () => obj,
    data: () => obj, join: () => obj, text: () => obj,
    call: () => obj, style: () => obj, filter: () => obj,
    remove: () => obj, classed: () => obj,
    html: () => obj, property: () => obj,
    // simulation
    force: () => obj, strength: () => obj, distance: () => obj,
    id: () => obj, radius: () => obj, iterations: () => obj,
    alpha: () => obj, alphaDecay: () => obj, restart: () => obj,
    stop: noop, tick: noop,
    // zoom / drag
    scaleExtent: () => obj, translateExtent: () => obj,
    transform: () => obj,
    // scale
    domain: () => obj, range: () => obj, padding: () => obj,
    // transition
    duration: () => obj, ease: () => obj,
    // iteration
    forEach: noop, each: () => obj,
    slice: () => ({ forEach: noop }),
    // misc
    node: () => null,
  };
  return obj;
};

// A static identity transform value (accessed as d3.zoomIdentity, not called)
const zoomIdentity = { k: 1, x: 0, y: 0 };

module.exports = {
  select:          () => chain(),
  selectAll:       () => chain(),
  forceSimulation: () => chain(),
  forceLink:       () => chain(),
  forceManyBody:   () => chain(),
  forceCenter:     () => chain(),
  forceCollide:    () => chain(),
  forceY:          () => chain(),
  forceX:          () => chain(),
  drag:            () => chain(),
  zoom:            () => chain(),
  zoomIdentity,
  scalePoint:      () => chain(),
  scaleOrdinal:    () => chain(),
  schemeCategory10: [],
  extent:          () => [[0, 0], [1, 1]],
  axisBottom:      () => chain(),
  axisLeft:        () => chain(),
};
