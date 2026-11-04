"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const start=html.indexOf("function fpScoreDiary(){"),end=html.indexOf("/* Kisa vadede",start);
assert.ok(start>=0&&end>start,"score diary function found");
const fn=html.slice(start,end);
assert.match(fn,/class="fp-score-diary"/,"score diary has collapsible container");
assert.match(fn,/<summary>/,"summary remains visible");
assert.match(fn,/<\/details>/,"collapsible container closes");
assert.doesNotMatch(fn,/<details[^>]*\sopen(?:\s|=|>)/,"diary is collapsed by default");
assert.match(fn,/fpSignalResults\(h\)/,"score calculations retained");
assert.match(fn,/class="fp-score-change"/,"expanded score rows use compact layout");
assert.doesNotMatch(fn,/class="trade" data-st=/,"expanded score rows do not use oversized trade cards");
assert.match(html,/\.fp-score-diary-body \.fp-score-change\{display:grid/,"compact score rows styled");
console.log("2.1 compact score diary markup passed");

// Shared compact-density guard: four screens, modern theme only.
assert.match(html,/id="fp21-compact-density"/);
for(const tab of ["hisse","oneri","doviz","sanal"]) assert.ok(html.includes("#v-"+tab),"compact style must cover "+tab);
assert.match(html,/html\[data-design="modern"\] :is\(#v-hisse,#v-oneri,#v-doviz,#v-sanal\) section\.card/);

assert.match(html,/html\.apk\[data-design="modern"\] nav\.tabs button\{padding:4px 0 3px/);
assert.match(html,/html\.apk \.sheet\.st \.st-top\{min-height:48px/);


// Device screenshot regression: avoid a separate oversized stock header and diary card.
const densityStart=html.indexOf('compact.textContent='),densityEnd=html.indexOf('document.head.appendChild(compact)',densityStart);
assert.ok(densityStart>0&&densityEnd>densityStart,"screenshot-density override exists");
const density=html.slice(densityStart,densityEnd);
for(const selector of [
  "#fp-discovery-tabs button",
  "#v-hisse > section.card:has(.studio-hm-tabs)",
  "#v-hisse .st-view > section.card:has(> .fp-score-diary)",
  "#v-hisse .st-view .fund.lrow.st-row",
  "#v-hisse .st-view .st-row .lmid .name",
  "#v-hisse .st-view .st-row .right .lp",
]) assert.ok(density.includes(selector),"compact screenshot selector preserved: "+selector);
assert.match(density,/\.fund\.lrow\.st-row\{\s*min-height:44px!important/, "stock rows retain compact touch-sized minimum");
assert.match(density,/\.studio-hm-tabs button\{\s*min-height:36px;min-width:44px/, "horizon selector keeps usable tap target");
assert.match(density,/\.st-row \.lmid \.name\{\s*font-size:11px;line-height:1\.2;white-space:nowrap/, "company name remains visible in a single clipped line");
assert.match(html,/const stRow=it=>[\s\S]*?studio-inline-score[\s\S]*?<div class="name">[\s\S]*?<div class="right">/, "score, company and quotation retained");
console.log("2.1 screenshot-driven short-stock density guards passed");
