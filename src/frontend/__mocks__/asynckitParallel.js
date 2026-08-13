// Mock for asynckit/parallel — lib/terminator.js is missing from asynckit@0.4.0
// in some npm installations. This module is only used by jsdom's internal XHR
// implementation, which is not exercised by our component tests.
module.exports = function parallel(list, iterator, callback) {
  setImmediate(() => callback(null, {}));
  return function terminate() {};
};
