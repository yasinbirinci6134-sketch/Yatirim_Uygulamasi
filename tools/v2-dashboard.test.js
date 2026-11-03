"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const begin=html.indexOf("function fp2DashboardPortfolio(");
const end=html.indexOf("  // Yalnız Tema 2 için ayrı ana ekran;",begin);
assert.ok(begin>0&&end>begin,"FP2 home functions must be part of bundled UI");
const body=html.slice(begin,end);
const today=new Date(Date.now()+3*3600e3).toISOString().slice(0,10);
const state={market:null,tab:"gundem"},holder={pf:null,rows:[],history:[],shortFresh:false};
const navigator={dataset:{fp2go:"sanal"},addEventListener(type,cb){if(type==="click")this.onClick=cb;}};
const root={innerHTML:"",querySelectorAll(q){return q==="[data-fp2go]"?[navigator]:[];}};
let navigationCount=0;
const safe=r=>String(r??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const check=(rows,date)=>rows.every(x=>x.quoteSource==="live"&&x.curDate===date&&Number.isFinite(x.value))?
 rows.reduce((sum,x)=>sum+x.value,0):NaN;
const make=new Function("$","S","curPf","portfolioRows","fpTrustedHoldingsValue","fpShortFresh","SH",
 "fpHistory","sentences","fmtDate","asset","esc","showTab","renderAll","window","openNews","FP_DISCOVERY_TAB",
 body+";return {fp2DashboardPortfolio,studio2RenderGundem};");
const scan={d:{asOf:today,items:[{code:"KCHOL",score:92,price:100}]}};
const api=make(()=>root,state,()=>holder.pf,()=>holder.rows,check,()=>holder.shortFresh,scan,
 ()=>holder.history,txt=>txt?[txt]:[],d=>d||"",c=>({name:c}),safe,()=>{navigationCount++;},
 ()=>{navigationCount++;},{scrollTo:()=>{}},()=>{},"oneri");
const {fp2DashboardPortfolio,studio2RenderGundem}=api;
studio2RenderGundem();
assert.ok(root.innerHTML.includes("KONTROL MERKEZİ"),"new dashboard must render without online market data");
assert.ok(root.innerHTML.includes("Portföy oluştur"),"empty user still sees an actionable portfolio entry");
for(const n of ["01 / PORTFÖY","02 / RADAR","03 / SKOR GÜNLÜĞÜ","04 / ANALİZ","05 / HABERLER"])
 assert.ok(root.innerHTML.includes(n),"new visible section missing: "+n);
holder.pf={id:"one",name:"Yatırım hesabım"};
holder.rows=[{code:"AAA",amount:100,value:117,quoteSource:"none",curDate:today}];
state.market={updatedAt:new Date().toISOString(),
 indicators:[{k:"BIST 100",v:"11.000"},{k:"Dolar/TL",v:"44,2"}],
 stocks:[{code:"AAA",score:82}],funds:[{code:"ABC",score:91}],
 advice:{summary:"Veri tabanından gelen son analiz."},
 news:[{title:"<script>alert(1)</script>",date:today}]};
studio2RenderGundem();
assert.equal(fp2DashboardPortfolio(holder.pf,holder.rows,today).value,null,"purchase-price fallback cannot certify current value");
assert.ok(root.innerHTML.includes('AÇIK POZİSYON DEĞERİ</small><strong>—</strong>'),"unverified holdings stay undisplayed");
assert.ok(!root.innerHTML.includes("117 ₺"),"unverified price may not appear as invested gain");
assert.ok(!root.innerHTML.includes("<script>alert(1)</script>"),"external headlines must be escaped");
assert.ok(root.innerHTML.includes("&lt;script&gt;"),"headline escapes should be visible");
assert.ok(root.innerHTML.includes("Son analiz"),"do not describe old analysis as live");
assert.ok(root.innerHTML.includes("Doğrulanmış yeni tarama bekleniyor."),"stale scan should be visibly quarantined");
assert.ok(!root.innerHTML.includes("KCHOL"),"stale scores cannot appear as fresh radar candidates");
holder.rows=[{code:"AAA",amount:100,value:117,quoteSource:"live",curDate:today}];
holder.shortFresh=true;
holder.history=[
 {asOf:"2026-11-01",items:[{code:"AAA",score:79}]},
 {asOf:"2026-11-02",items:[{code:"AAA",score:84}]}];
studio2RenderGundem();
const trusted=fp2DashboardPortfolio(holder.pf,holder.rows,today);
assert.equal(trusted.value,117);
assert.equal(trusted.difference,17);
assert.ok(root.innerHTML.includes("117 ₺"),"verified holdings may show position value");
assert.ok(root.innerHTML.includes("KCHOL"),"fresh scan may populate short radar");
assert.ok(root.innerHTML.includes("Günlük puan farkı"),"history change must be visible");
assert.ok(root.innerHTML.includes("+5"),"real score delta must be shown");
navigator.onClick();
assert.equal(state.tab,"sanal","portfolio quick action must navigate to correct page");
assert.equal(navigationCount,2,"quick action should invoke navigation and render");
const stale=fp2DashboardPortfolio(holder.pf,[{code:"AAA",amount:100,value:117,quoteSource:"live",curDate:"2026-01-01"}],today);
assert.equal(stale.value,null,"stale quotes cannot produce fabricated gains");
assert.equal(fp2DashboardPortfolio(null,[],today).value,null,"no portfolio must not show a fabricated total");
assert.ok(html.indexOf("const FP_V2_UI=")<html.indexOf("const S ="),"preview mode must be initialized before app state");
assert.ok(html.includes('TH.design=picked==="classic"||picked==="modern"?picked:"modern"'),"2.0 must be initial preview theme");
assert.ok(html.includes('tab:FP_V2_UI?"gundem":"oneri"'),"preview should open dashboard, not old fund page");
assert.ok(html.includes('if(studioOn()&&S.tab==="gundem") renderGundem();'),"offline startup should render dashboard immediately");
console.log("V2 command center, portfolio truthfulness, navigation and preview defaults passed");
