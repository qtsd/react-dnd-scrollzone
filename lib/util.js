"use strict";

exports.__esModule = true;
exports.noop = noop;
exports.intBetween = intBetween;

function noop() {}

function intBetween(min, max, val) {
  return Math.floor(Math.min(max, Math.max(min, val)));
}