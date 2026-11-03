"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const start=html.indexOf('let PF2_PORT_FILTER="all";');
const end=html.indexOf("function renderSanal(){",start);
assert.ok(start>0&&end>start,"portfolio 2.0 helpers must exist");
const source=html.slice(start,end);
const today=new Date(Date.now()+3*3600e3).toISOString().slice(0,10);
const assets={AAA:{code:"AAA",name:"Test <Hisse>",isStock:true,score:89,cat:"hisse"},BBB:{code:"BBB",name:"Test Fon",cat:"altin",score:65}};
const asset=c=>assets[c]||null,esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const check=(rows,date)=>rows.every(x=>x.quoteSource==="live"&&x.curDate===date&&Number.isFinite(x.value))?rows.reduce((a,x)=>a+x.value,0):NaN;
const tl=(n)=>Number(n).toFixed(2)+" TL",num=n=>String(n),pc=n=>Number(n).toFixed(2)+"%",cls=n=>n>0?"up":n<0?"down":"";
const create=(kind)=>{
  return {tag:kind,className:"",innerHTML:"",children:[],appendChild(child){this.children.push(child);},
   insertAdjacentElement(where,node){this.inserted={where,node};}};
};
const document={createElement:create};
const groupRows=rows=>{
 const groups={};
 for(const r of rows){
  if(!groups[r.code])groups[r.code]={code:r.code,lots:[],amount:0,units:0};
  const g=groups[r.code];g.lots.push(r);g.amount+=r.amount;g.units+=r.units||1;
 }
 return Object.values(groups);
};
const tool=new Function("fpTrustedHoldingsValue","asset","tl","esc","num","pc","cls","groupRows","document","$",
 source+";return {pf2Overview,pf2Hero,pf2ArrangePortfolio,pf2WirePortfolio,getFilter:()=>PF2_PORT_FILTER};");
const api=tool(check,asset,tl,esc,num,pc,cls,groupRows,document,()=>({click(){}}));
const pf={name:"Tasarruf <test>"};
const trusted=[{code:"AAA",amount:100,value:120,quoteSource:"live",curDate:today,units:10},
 {code:"BBB",amount:150,value:170,quoteSource:"live",curDate:today,units:5}];
const good=api.pf2Overview(trusted,today);
assert.equal(good.value,290);assert.equal(good.change,40);assert.equal(good.count,2);
assert.deepEqual(good.kinds,{hisse:1,fon:0,diger:1});
assert.equal(good.lots,2);
const old=trusted.map(x=>({...x}));old[1].quoteSource="none";
const risky=api.pf2Overview(old,today);
assert.equal(risky.value,null,"no total when one fund lacks a verified quote");
assert.equal(risky.change,null,"no fake gain from a purchase-price fallback");
assert.ok(api.pf2Hero(pf,old,today,false).includes(">—</strong>"),"unknown total stays visibly unknown");
assert.ok(api.pf2Hero(pf,old,today,false).includes("tahmin gösterilmiyor"),"unknown valuation must have explicit label");
assert.ok(api.pf2Hero(pf,trusted,today,false).includes("40.00 TL"),"fully verified scenario can show signed price-cost difference");
assert.ok(api.pf2Hero(pf,[],today,false).includes("0 VARLIK"),"empty state must remain actionable");
assert.ok(api.pf2Hero(pf,trusted,today,false).includes("Tasarruf &lt;test&gt;"),"portfolio names must be HTML-escaped");
const top={outerHTML:""},mgr={insertAdjacentElement(where,node){this.where=where;this.node=node;}};
const left={classList:{add(){}},innerHTML:""},right={classList:{add(){}},innerHTML:""};
const trade={dataset:{k:"g:AAA"},querySelector(q){return q===".xh:first-child"?left:q===".right.xh"?right:null;}};
const positions={querySelectorAll(q){assert.equal(q,".trade.x");return [trade];},insertAdjacentElement(where,node){this.where=where;this.node=node;}};
const sections={chart:{id:"chart"},returns:{id:"returns"},cash:{id:"cash"},audit:{id:"audit"},risk:{id:"risk"},journal:{id:"journal"},closed:{id:"closed"}};
const plan={id:"plan"};
const root={appended:[],querySelector(q){
 if(q===".pfhero")return top;if(q==="#pfMgr")return mgr;
 if(q==='[data-pf2-section="positions"]')return positions;
 if(q==="#planBox")return plan;
 const match=q.match(/^\[data-pf2-section="(.+)"\]$/);return match?sections[match[1]]||null:null;
 },appendChild(node){this.appended.push(node);}};
api.pf2ArrangePortfolio(root,pf,[trusted[0]],today,false);
assert.ok(top.outerHTML.includes('id="pfPick"'),"existing portfolio chooser must retain its ID/event contract");
assert.equal(mgr.node,positions,"positions must move ahead of historical/advanced content");
assert.equal(positions.node.className,"pf2-toolbar","filters and quick actions must precede positions");
assert.ok(left.innerHTML.includes("AAA")&&left.innerHTML.includes("89"),"row must show inline asset score");
assert.ok(left.innerHTML.includes("Test &lt;Hisse&gt;"),"asset names must escape arbitrary HTML");
assert.ok(right.innerHTML.includes("120.00 TL"),"trusted value must be displayed compactly");
assert.equal(trade.dataset.pf2Kind,"hisse");
assert.equal(root.appended[0].tag,"details","advanced reports should be native collapsible disclosure");
assert.equal(root.appended[0].children[0].children.at(-1),plan,"full plan tool must survive reordering");
const rowState={classList:{hidden:false,toggle(name,yes){assert.equal(name,"pf2-filtered");this.hidden=yes;}},dataset:{pf2Kind:"hisse"}};
const buttons=["all","hisse","fon"].map(type=>({dataset:{pf2Filter:type},setAttribute(k,v){this[k]=v;},
 addEventListener(k,fn){assert.equal(k,"click");this.click=fn;}}));
const actions=[{addEventListener(k,fn){this.click=fn;}},{addEventListener(k,fn){this.click=fn;}}];
const ui={querySelectorAll(q){return q==="[data-pf2-filter]"?buttons:q==='[data-pf2-section="positions"] .trade.x'?[rowState]:[];},
 querySelector(q){return q==="[data-pf2-add]"?actions[0]:q==="[data-pf2-cash]"?actions[1]:null;}};
api.pf2WirePortfolio(ui);
assert.equal(buttons[0]["aria-pressed"],"true");
buttons[2].click();
assert.equal(rowState.classList.hidden,true,"filter must hide other asset types");
buttons[0].click();
assert.equal(rowState.classList.hidden,false,"all filter restores hidden holdings");
assert.ok(html.includes('if(modernPortfolio)pf2ArrangePortfolio(v,pf,rows,snapshotToday,S.pfOpen);'));
assert.ok(html.includes('if(modernPortfolio)pf2WirePortfolio(v);'));
assert.ok(html.includes('data-pf2-section="cash"')&&html.includes('data-pf2-section="returns"'));
assert.ok(html.includes(".pf2-advanced-body")&&html.includes(".pf2-pos-score"));
console.log("Portfolio 2.0 hub, filters, trusted values, asset rows and preserved controls passed");
