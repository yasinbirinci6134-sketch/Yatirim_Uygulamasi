"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length>=3);
for(const [i,s] of scripts.entries())new vm.Script(s[1],{filename:"ui/index.html:script"+i});
const start=html.indexOf("function fpSignalResults("),end=html.indexOf("\nfunction fpScoreDiary()",start);
assert.ok(start>0&&end>start);
const score=new Function(html.slice(start,end)+";return fpSignalResults;")();
const snaps=Array.from({length:6},(_,i)=>({at:"2026-11-"+String(i+1).padStart(2,"0"),xu:100+i*2,items:[{code:"ABC",score:90,price:100+i*4},{code:"DEF",score:40,price:50+i}]}));
const out=score(snaps,5);
assert.equal(out.count,1);assert.equal(out.positive,1);assert.ok(Math.abs(out.avg-20)<1e-7);
assert.ok(Math.abs(out.relativeAvg-10)<1e-7);
assert.equal(score(snaps.slice(0,5),5).count,0);
const auditStart=html.indexOf("function fpLegacyAudit("),auditEnd=html.indexOf("function renderSanal()",auditStart);
assert.ok(auditStart>0&&auditEnd>auditStart);
const audit=new Function(html.slice(auditStart,auditEnd)+";return fpLegacyAudit;")();
const review=audit([{id:"one",code:"ABC",amount:100,price:10,buyDate:"2026-01-01",status:"closed",sellPrice:12,sellDate:"2026-02-01"}]);
assert.deepEqual(review.candidates.map(x=>x.amount),[100,120]);
assert.equal(review.verified,false);
assert.equal(audit([{id:"bad",amount:20,buyDate:"2026-02-30"}]).issues.length,1);
assert.ok(html.includes("${legacyAuditCard}"));
assert.ok(html.includes("const returnRequirements=["),"return readiness checklist should render");
assert.ok(html.includes("Ekstre nakit mutabakatı"),"external statement reconciliation must be visible");
assert.ok(html.includes("Pozisyon grafiği nakit içermiyor"),"do not mislabel position-only chart as verified NAV");
const repStart=html.indexOf("function fpAuditReport("),repEnd=html.indexOf("function renderSanal()",repStart);
assert.ok(repStart>0&&repEnd>repStart);
const report=new Function(html.slice(repStart,repEnd)+";return fpAuditReport;")();
const txt=report("Örnek",{candidates:[{id:"x",type:"buy",date:"2026-01-01",amount:100}],issues:["Kontrol bekliyor"]},[]);
assert.ok(txt.includes("BANKA DOĞRULAMASI YOK"));
assert.ok(txt.includes("100.00"));
assert.ok(html.includes('id="pfAuditShare"'));
const {auditLegacyTrades}=require("./legacy-trade-audit");
for(const tradeSet of [
 [{id:"a",amount:100,price:10,buyDate:"2026-01-01",status:"closed",sellPrice:12,sellDate:"2026-02-01"}],
 [{id:"a",amount:100,buyDate:"2026-02-30"}],
 [{id:"a",amount:100,price:10,buyDate:"2026-02-02",status:"closed",sellPrice:12,sellDate:"2026-02-01"}],
 [{id:"a",amount:100,buyDate:"2026-01-01"},{id:"a",amount:120,buyDate:"2026-01-02"}]
]){
 const uiAudit=audit(tradeSet),engineAudit=auditLegacyTrades(tradeSet);
 assert.deepEqual(uiAudit.candidates.map(x=>[x.type,x.date,Math.round(x.amount*100)]),
  engineAudit.candidates.map(x=>[x.type,x.date,Math.round(x.amount*100)]),
  "UI and reconciliation engine candidate totals must agree");
 assert.equal(uiAudit.verified,false);
}
const sourceReturns=fs.readFileSync(path.join(__dirname,"ui-returns.js"),"utf8").trim();
const inlineStart=html.indexOf("/* Browser and Node shared audit");
const inlineEnd=html.indexOf("const FP_IMPORT_KEY=",inlineStart);
assert.ok(inlineStart>0&&inlineEnd>inlineStart);
assert.equal(html.slice(inlineStart,inlineEnd).trim(),sourceReturns,"WebView and test engine must use identical return calculator");
assert.ok(html.includes('id="pfReturnImport"'),"evidence import control must be visible");
assert.ok(html.includes('id="pfEvidenceSave"'),"statement importer must permit explicit save");
assert.ok(html.includes("fpComputeImportedReturns(statementData"),"portfolio screen must call return engine");
const draftStart=html.indexOf("function fpStatementDraft(");
const draftEnd=html.indexOf("function fpReturnEvidenceSheet(",draftStart);
assert.ok(draftStart>0&&draftEnd>draftStart);
const makeDraft=new Function(html.slice(draftStart,draftEnd)+";return fpStatementDraft;")();
const sampleTrades={candidates:[{type:"buy",date:"2025-01-02",amount:120}],issues:[]};
const sampleFlows=[{type:"deposit",date:"2025-01-01",amount:200}];
const draft=makeDraft(sampleTrades,sampleFlows);
assert.deepEqual(draft.events.map(e=>e.type),["deposit","buy"]);
assert.deepEqual(draft.events.map(e=>e.amount),[200,120]);
assert.ok(draft.events.every(e=>e.reference===""),"draft event references cannot be fabricated");
assert.equal(draft.source.institution,"");
assert.equal(draft.openingCash,null);
assert.equal(draft.positionsValue,null);
assert.equal(draft.valuations.length,0);
assert.ok(html.includes('id="pfEvidenceDraft"'));
assert.deepEqual(sampleTrades.candidates,[{type:"buy",date:"2025-01-02",amount:120}],"draft must not mutate trades");
assert.ok(html.includes("statementIsHistorical"),"returns must identify historical valuations");
assert.ok(html.includes("Bu geçmiş tarihli getiri hesabıdır"),"stale returns cannot look current");
assert.ok(html.includes("İşlem eşleştirmesi"),"legacy trades must be presented as matched when reconciled");
assert.ok(html.includes("TWR verisi değildir"),"position-only historical chart is not total NAV");
const trustedStart=html.indexOf("function fpTrustedHoldingsValue(");
const trustedEnd=html.indexOf("function fpReturnEvidenceSheet(",trustedStart);
assert.ok(trustedStart>0&&trustedEnd>trustedStart);
const trusted=new Function(html.slice(trustedStart,trustedEnd)+";return fpTrustedHoldingsValue;")();
const dated={value:300,quoteSource:"live",curDate:"2026-11-03"};
assert.equal(trusted([dated],"2026-11-03"),300);
assert.ok(Number.isNaN(trusted([{...dated,quoteSource:"none"}],"2026-11-03")));
assert.ok(Number.isNaN(trusted([{...dated,curDate:null}],"2026-11-03")));
assert.ok(Number.isNaN(trusted([{...dated,curDate:"2026-10-25"}],"2026-11-03")));
assert.equal(trusted([{...dated,curDate:"2026-10-27"}],"2026-11-03"),300);
assert.ok(Number.isNaN(trusted([{...dated,curDate:"2026-11-04"}],"2026-11-03")));
assert.equal(trusted([],"2026-11-03"),0);
assert.ok(html.includes("fpComputeImportedReturns(statementData,legacyAudit,cashflows,trustedHoldings"));
assert.ok(html.includes("x.priced===true"),"legacy position snapshots must not pose as verified quotes");
assert.ok(html.includes("if(Number.isFinite(snapshotVal))fpPortSnapshot"),"only externally priced holdings should be recorded");
assert.ok(html.includes("Bu bir TWR/NAV grafiği değildir"),"position charts must distinguish from return metrics");
console.log("UI scripts and score-history tests passed");
