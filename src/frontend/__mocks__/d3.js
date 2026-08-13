// jsdom-compatible D3 stub — SPRINT4 §7.2
const chain = () => ({
  attr: chain, on: chain, append: chain, selectAll: chain,
  data: chain, join: chain, text: chain, call: chain,
  force: chain, strength: chain, distance: chain, id: chain,
  remove: chain, style: chain, filter: chain, forEach: () => {},
  slice: () => ({ forEach: () => {} }),
});

module.exports = {
  select:          () => chain(),
  forceSimulation: () => chain(),
  forceLink:       () => chain(),
  forceManyBody:   () => chain(),
  forceCenter:     () => chain(),
  forceY:          () => chain(),
  forceX:          () => chain(),
  drag:            () => chain(),
  scalePoint:      () => ({ domain: chain, range: chain, padding: chain }),
};
