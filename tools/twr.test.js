"use strict";
const assert=require("node:assert/strict");
const {timeWeightedReturn}=require("./twr");
const result=timeWeightedReturn([{date:"2026-01-01",value:1000},{date:"2026-02-01",value:1600,externalFlow:500},{date:"2026-03-01",value:1760}]);
assert.ok(Math.abs(result-0.21)<1e-10);
assert.equal(timeWeightedReturn([{date:"2026-01-01",value:0},{date:"2026-02-01",value:1000}]),null);
assert.equal(timeWeightedReturn([{date:"2026-01-01",value:1000},{date:"2026-01-01",value:1100}]),null);
assert.equal(timeWeightedReturn([{date:"2026-01-01",value:1000}]),null);
console.log("TWR tests passed");
