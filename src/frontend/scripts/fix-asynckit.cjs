/**
 * fix-asynckit.js — postinstall polyfill
 *
 * asynckit@0.4.0 ships a parallel.js that requires ./lib/terminator.js,
 * but terminator.js is missing from the published npm package. This script
 * creates it so jest-environment-jsdom can boot without crashing.
 *
 * Reference: https://github.com/alexindigo/asynckit (file omitted in 0.4.0)
 */
const fs   = require('fs');
const path = require('path');

const termPath = path.join(
  __dirname, '..', 'node_modules', 'asynckit', 'lib', 'terminator.js'
);

if (fs.existsSync(termPath)) {
  process.exit(0); // already present, nothing to do
}

const content = `'use strict';
module.exports = terminator;

/**
 * Terminates parallel jobs by marking remaining work as done and
 * invoking the callback with collected results or an error.
 * Polyfill for asynckit@0.4.0 which ships parallel.js referencing this
 * file but omits it from the published package.
 */
function terminator(callback, error, key) {
  if (Object.keys(this.jobs).length !== 0) {
    // advance index past the list so no new iterations start
    this.index = this['keyedList'] ? this['keyedList'].length : Infinity;
    delete this.jobs[key];
    if (error) {
      callback(error, this.results);
    } else if (Object.keys(this.jobs).length === 0) {
      callback(null, this.results);
    }
  }
}
`;

fs.writeFileSync(termPath, content, 'utf8');
console.log('postinstall: created missing asynckit/lib/terminator.js');
