"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const begin=html.indexOf("const FP2_DISC_STATE="),end=html.indexOf("function renderOneri(){",begin);
assert.ok(begin>0&&end>begin,"2.0 Keşfet helper block must be present");
const code=html.slice(begin,end);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nodes=[];
const document={createElement(tag){
  const node={tag,children:[],parentElement:null,innerHTML:"",hidden:false,open:false,attributes:{},
    classList:{classes:new Set(),add(k){this.classes.add(k)},toggle(k,yes){if(yes)this.classes.add(k);else this.classes.delete(k)}},
    appendChild(child){this.children.push(child);child.parentElement=this;return child;},
    addEventListener(event,fn){this[event]=fn;},
    insertAdjacentElement(position,other){this.inserted={position,other};},
    querySelector(q){if(q==="[data-fp2-disc-more]")return this.moreButton;return null},
    querySelectorAll(q){if(q==="[data-fp2-disc-focus]")return this.pills||[];
      if(q===".fgrp")return this.groups||[];
      if(q==='.fund.lrow[data-k]')return this.rows||[];
      return []},
    get firstChild(){return this.children[0]||null},
  };nodes.push(node);return node;
}};
const functions=new Function("document","studioOn","esc",code+";return {fp2DiscoverySummary,fp2DiscoveryHero,fp2ArrangeDiscovery,FP2_DISC_STATE};")(document,()=>true,esc);
const now=new Date().toISOString();
const items=[{code:"ABC",name:"A <Fund>",score:92},{code:"DEF",score:83},{code:"GHI",score:75},{code:"BAD",score:999},{code:"NA",score:null}];
const sum=functions.fp2DiscoverySummary("oneri",items,["ABC","GHI"],now);
assert.equal(sum.count,5);assert.equal(sum.tracked,2);
assert.deepEqual(sum.top.map(x=>x.code),["ABC","DEF","GHI"],"invalid and missing scores cannot lead the radar");
assert.equal(sum.stale,false);
assert.equal(functions.fp2DiscoverySummary("hisse",items,[], "2022-01-01").stale,true);
assert.equal(functions.fp2DiscoverySummary("hisse",items,[], "not-a-date").stale,true);
const hero=functions.fp2DiscoveryHero("oneri",items,["ABC"],now);
assert.ok(hero.includes("Fonları keşfet."));assert.ok(hero.includes("ABC"));
assert.ok(hero.includes("Skor yatırım tavsiyesi veya gerçekleşmiş getiri değildir."));
assert.ok(!hero.includes(">999</strong>"));
const list=document.createElement("section"),root=document.createElement("main");
const rowA=document.createElement("div"),rowB=document.createElement("div");
rowA.dataset={k:"f:ABC"};rowB.dataset={k:"f:DEF"};
list.rows=[rowA,rowB];
const groupA=document.createElement("div"),groupB=document.createElement("div");
groupA.rows=[rowA];groupB.rows=[rowB];
list.groups=[groupA,groupB];
const initial=document.createElement("section");initial.id="old-analysis";
const search={closest(query){assert.equal(query,"section.card");return list}};
root.children=[initial,list];
root.querySelector=query=>query==='[data-lfq="oneri"]'?search:null;
root.appendChild=function(n){this.children.push(n)};
const oldCreate=document.createElement.bind(document);
document.createElement=function(tag){
  const n=oldCreate(tag);
  if(tag==="div"){n.moreButton={attributes:{},setAttribute(k,v){this.attributes[k]=v}};
    n.pills=["all","watch"].map(choice=>({dataset:{fp2DiscFocus:choice},attributes:{},
      setAttribute(k,v){this.attributes[k]=v},addEventListener(k,fn){this[k]=fn}}));}
  return n;
};
functions.fp2ArrangeDiscovery(root,"oneri",items,["ABC"],now);
const wrapper=root.children.at(-1);
assert.equal(wrapper.className,"fp2-discovery-hub");
const toolbar=list.parentElement?.children?.find(x=>x.className==="fp2-discovery-controls");
assert.ok(toolbar,"the live list must keep a filter toolbar");
assert.equal(list.classList.classes.has("fp2-discovery-list"),true);
const pills=toolbar.pills;
assert.equal(pills[0].attributes["aria-pressed"],"true");
pills[1].click();
assert.equal(rowA.classList.classes.has("fp2-disc-hidden"),false,"tracked item stays visible");
assert.equal(rowB.classList.classes.has("fp2-disc-hidden"),true,"untracked item is filtered");
assert.equal(groupB.classList.classes.has("fp2-disc-hidden"),true,"empty category is hidden");
pills[0].click();
assert.equal(rowB.classList.classes.has("fp2-disc-hidden"),false,"all filter restores row");
const advanced=wrapper.children.at(-1);
assert.equal(advanced.tag,"details");
assert.equal(advanced.children[0].children[0],initial,"previous analysis must not be discarded");
assert.equal(advanced.open,false);
assert.ok(html.includes('fp2ArrangeDiscovery(v,"oneri",S.market.funds||[],S.fwatch,S.market.updatedAt);'));
assert.ok(html.includes('fp2ArrangeDiscovery(v,"hisse",st,S.watch,m.updatedAt);'));
assert.ok(html.includes("bindFunds(v);"),"existing fund compare, buy and watch actions must be bound");
assert.ok(html.includes("bindRowBtns(v);"),"existing row detail handlers must remain");
assert.ok(html.includes(".fp2-disc-hero")&&html.includes(".fp2-discovery-list"),"distinct modern styles must be in bundle");
console.log("Compact Keşfet hero, watch focus, category visibility, original analyses and binding checks passed");
