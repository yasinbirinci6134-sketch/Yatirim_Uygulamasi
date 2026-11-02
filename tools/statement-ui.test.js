"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {fpComputeImportedReturns}=require("./ui-returns");
const {fpParseStatementCsv,fpParseNavCsv}=require("./statement-csv");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const from=html.indexOf('const FP_IMPORT_KEY='),to=html.indexOf('/* V2: review legacy records',from);
assert.ok(from>0&&to>from);
const elements=[],saved=new Map(),messages=[];
const document={
 createElement(tag){
  const fields=new Map();
  const el={tag,innerHTML:"",value:"",className:"",style:{},setAttribute(){},focus(){},remove(){},
   querySelector(id){if(!fields.has(id))fields.set(id,{value:"",onclick:null,focus(){}});return fields.get(id)}};
  elements.push(el);return el;
 },
 body:{append(){}}
};
const localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
const S={uid:"test-user",cashflows:[{id:"c1",pf:"pf1",date:"2025-01-01",type:"deposit",amount:1000}]};
let redraws=0,pricedRows=[{value:900}];
const getHandlers=new Function("document","localStorage","S","fpLegacyAudit","pfTrades","portfolioRows","fpComputeImportedReturns","fpParseStatementCsv","fpParseNavCsv","toast","confirm","renderSanal","esc",
 html.slice(from,to)+";return {fpReturnEvidenceSheet,fpImportedStatement};")(
 document,localStorage,S,
 ()=>({issues:[],candidates:[{id:"x:buy",date:"2025-01-02",type:"buy",amount:800}]}),
 ()=>[{id:"x",date:"2025-01-02",amount:800}],
 ()=>pricedRows,
 fpComputeImportedReturns,fpParseStatementCsv,fpParseNavCsv,msg=>messages.push(msg),()=>true,()=>{redraws++},x=>String(x));
getHandlers.fpReturnEvidenceSheet({id:"pf1",name:"Ornek"});
const sheet=elements.find(el=>el.tag==="div"&&el.innerHTML.includes('id="pfEvidenceDraft"'));
assert.ok(sheet,"statement sheet should include draft action");
sheet.querySelector("#pfEvidenceDraft").onclick();
const draft=JSON.parse(sheet.querySelector("#pfEvidenceText").value);
assert.equal(draft.events.length,2);assert.equal(draft.source.institution,"");
assert.equal(draft.openingCash,null);
assert.ok(draft.events.every(x=>x.reference===""));
sheet.querySelector("#pfCsvText").value=["tarih;tür;tutar;referans","01.01.2025;Para yatırma;1000;dekont-1","02.01.2025;Alış;800;dekont-2"].join(String.fromCharCode(10));
sheet.querySelector("#pfCsvApply").onclick();
const csvDraft=JSON.parse(sheet.querySelector("#pfEvidenceText").value);
assert.deepEqual(csvDraft.events.map(e=>[e.type,e.amount,e.reference]),[["deposit",1000,"dekont-1"],["buy",800,"dekont-2"]]);
assert.equal(csvDraft.openingCash,null,"CSV must not invent broker cash balances");
sheet.querySelector("#pfNavCsvText").value=["tarih;değer;dışNakit","01.01.2025;1000;0","01.01.2026;1100;0"].join(String.fromCharCode(10));
sheet.querySelector("#pfNavApply").onclick();
const navDraft=JSON.parse(sheet.querySelector("#pfEvidenceText").value);
assert.equal(navDraft.valuations.length,2);
assert.deepEqual(navDraft.valuations.map(x=>x.value),[1000,1100]);
assert.equal(getHandlers.fpImportedStatement("pf1"),null,"NAV CSV must not auto-certify portfolio returns");

assert.equal(getHandlers.fpImportedStatement("pf1"),null,"CSV conversion must not auto-save");
sheet.querySelector("#pfEvidenceSave").onclick();
assert.equal(getHandlers.fpImportedStatement("pf1"),null,"unverified draft must never be saved");
assert.equal(redraws,0);
const real={source:{institution:"Example",reference:"statement"},openingCash:0,terminalCash:200,positionsValue:900,
 terminal:{date:"2026-01-01",value:1100,externalFlow:0},events:[
 {id:"d",reference:"broker-deposit",date:"2025-01-01",type:"deposit",amount:1000},
 {id:"b",reference:"broker-buy",date:"2025-01-02",type:"buy",amount:800}],
 valuations:[{date:"2025-01-01",value:1000,externalFlow:0},{date:"2026-01-01",value:1100,externalFlow:0}]};
sheet.querySelector("#pfEvidenceText").value=JSON.stringify(real);
sheet.querySelector("#pfEvidenceSave").onclick();
assert.equal(redraws,1,"accepted statement should trigger rerender");
assert.deepEqual(getHandlers.fpImportedStatement("pf1"),real);
assert.ok(messages.some(x=>String(x).includes("mutabakat")));
getHandlers.fpReturnEvidenceSheet({id:"pf1",name:"Ornek"});
const savedSheet=elements.filter(el=>el.tag==="div"&&el.innerHTML.includes('id="pfEvidenceDraft"')).at(-1);
assert.ok(savedSheet.querySelector("#pfEvidenceText").value.includes('"broker-deposit"'));
// A matching statement cannot make today's return credible when the WebView
// only has fallback purchase prices instead of dated market quotes.
const today=new Date(Date.now()+3*3600e3).toISOString().slice(0,10);
const current={...real,terminal:{...real.terminal,date:today},valuations:[real.valuations[0],{date:today,value:1100}]};
savedSheet.querySelector("#pfEvidenceText").value=JSON.stringify(current);
savedSheet.querySelector("#pfEvidenceSave").onclick();
assert.deepEqual(getHandlers.fpImportedStatement("pf1"),real,
 "unverified same-day holdings must not overwrite validated historical statement");
assert.equal(redraws,1);
pricedRows=[{value:900,quoteSource:"live",curDate:today}];
savedSheet.querySelector("#pfEvidenceSave").onclick();
assert.deepEqual(getHandlers.fpImportedStatement("pf1"),current,
 "same-day evidence should be accepted once independently dated quotes are present");
assert.equal(redraws,2);
savedSheet.querySelector("#pfEvidenceDelete").onclick();
assert.equal(getHandlers.fpImportedStatement("pf1"),null,"deleting evidence must clear local storage");
assert.equal(redraws,3,"deleting evidence must rerender");
// A broker statement can be completed with plain fields rather than manual JSON edits.
getHandlers.fpReturnEvidenceSheet({id:"pf1",name:"Ornek"});
const formSheet=elements.filter(el=>el.tag==="div"&&el.innerHTML.includes('id="pfEvidenceInstitution"')).at(-1);
assert.ok(formSheet,"phone-friendly statement form must be present");
formSheet.querySelector("#pfEvidenceText").value=JSON.stringify({...real,source:{institution:"",reference:""},openingCash:null,terminalCash:null,positionsValue:null,terminal:{date:"",value:null},valuations:real.valuations});
for(const [id,value] of Object.entries({
 pfEvidenceInstitution:"Example",pfEvidenceReference:"statement",pfEvidenceOpening:"0",
 pfEvidenceClosing:"200",pfEvidenceAsOf:"2026-01-01",pfEvidenceHoldings:"900",pfEvidenceNav:"1100"
}))formSheet.querySelector("#"+id).value=value;
formSheet.querySelector("#pfEvidenceSave").onclick();
assert.deepEqual(getHandlers.fpImportedStatement("pf1"),real,"form fields must merge into final checked statement");
// Form-first flow never needs hand-written JSON, but guessed trades lack
// institution references and must fail visibly without replacing old evidence.
getHandlers.fpReturnEvidenceSheet({id:"pf2",name:"Form testi"});
const simpleSheet=elements.filter(el=>el.tag==="div"&&el.innerHTML.includes('id="pfEvidenceInstitution"')).at(-1);
assert.equal(simpleSheet.querySelector("#pfEvidenceText").value,"");
for(const [id,value] of Object.entries({
 pfEvidenceInstitution:"Broker",pfEvidenceReference:"Döküm",pfEvidenceOpening:"0",
 pfEvidenceClosing:"200",pfEvidenceAsOf:"2026-01-01",
 pfEvidenceHoldings:"900",pfEvidenceNav:"1100"
}))simpleSheet.querySelector("#"+id).value=value;
simpleSheet.querySelector("#pfEvidenceSave").onclick();
assert.equal(getHandlers.fpImportedStatement("pf2"),null,"form-only draft must not bypass independent transaction references");
assert.ok(String(simpleSheet.querySelector("#pfEvidenceIssues").textContent||"").length>0,
 "reconciliation errors should remain visible in the form");
console.log("statement modal interaction tests passed");
(async()=>{
 const fresh=elements.length;
 getHandlers.fpReturnEvidenceSheet({id:"pf1",name:"Ornek"});
 const beforeFileSelection=getHandlers.fpImportedStatement("pf1");
 const csvSheet=elements.slice(fresh).find(el=>el.innerHTML.includes('id="pfCsvFile"'));
 assert.ok(csvSheet,"file picker must be offered in statement modal");
 const fileInput=csvSheet.querySelector("#pfCsvFile");
 const sampleFile="tarih;tür;tutar;referans\\n01.01.2025;Para yatırma;1000;broker-1";
 fileInput.files=[{name:"ekstre.csv",size:sampleFile.length,text:async()=>sampleFile}];
 await fileInput.onchange();
 assert.equal(csvSheet.querySelector("#pfCsvText").value,sampleFile,"chosen file should fill CSV textarea only");
 assert.equal(fileInput.value,"","file chooser should reset after reading");
 assert.deepEqual(getHandlers.fpImportedStatement("pf1"),beforeFileSelection,"file selection must not modify independently checked evidence");
 fileInput.files=[{name:"huge.csv",size:250001,text:async()=>{throw Error("should not read oversize files")}}];
 await fileInput.onchange();
 assert.equal(csvSheet.querySelector("#pfCsvText").value,sampleFile,"oversized file should not overwrite CSV text");
 console.log("statement native-file import tests passed");
})().catch(e=>{console.error(e);process.exitCode=1;});

