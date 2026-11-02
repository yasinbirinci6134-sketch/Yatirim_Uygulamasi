"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {fpComputeImportedReturns}=require("./ui-returns");
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
let redraws=0;
const getHandlers=new Function("document","localStorage","S","fpLegacyAudit","pfTrades","portfolioRows","fpComputeImportedReturns","toast","confirm","renderSanal","esc",
 html.slice(from,to)+";return {fpReturnEvidenceSheet,fpImportedStatement};")(
 document,localStorage,S,
 ()=>({issues:[],candidates:[{id:"x:buy",date:"2025-01-02",type:"buy",amount:800}]}),
 ()=>[{id:"x",date:"2025-01-02",amount:800}],
 ()=>[{value:900}],
 fpComputeImportedReturns,msg=>messages.push(msg),()=>true,()=>{redraws++},x=>String(x));
getHandlers.fpReturnEvidenceSheet({id:"pf1",name:"Ornek"});
const sheet=elements.find(el=>el.tag==="div"&&el.innerHTML.includes('id="pfEvidenceDraft"'));
assert.ok(sheet,"statement sheet should include draft action");
sheet.querySelector("#pfEvidenceDraft").onclick();
const draft=JSON.parse(sheet.querySelector("#pfEvidenceText").value);
assert.equal(draft.events.length,2);assert.equal(draft.source.institution,"");
assert.equal(draft.openingCash,null);
assert.ok(draft.events.every(x=>x.reference===""));
sheet.querySelector("#pfEvidenceSave").onclick();
assert.equal(getHandlers.fpImportedStatement("pf1"),null,"unverified draft must never be saved");
assert.equal(redraws,0);
const real={source:{institution:"Example",reference:"statement"},openingCash:0,terminalCash:200,positionsValue:900,
 terminal:{date:"2026-01-01",value:1100},events:[
 {id:"d",reference:"broker-deposit",date:"2025-01-01",type:"deposit",amount:1000},
 {id:"b",reference:"broker-buy",date:"2025-01-02",type:"buy",amount:800}],
 valuations:[{date:"2025-01-01",value:1000},{date:"2026-01-01",value:1100}]};
sheet.querySelector("#pfEvidenceText").value=JSON.stringify(real);
sheet.querySelector("#pfEvidenceSave").onclick();
assert.equal(redraws,1,"accepted statement should trigger rerender");
assert.deepEqual(getHandlers.fpImportedStatement("pf1"),real);
assert.ok(messages.some(x=>String(x).includes("mutabakat")));
getHandlers.fpReturnEvidenceSheet({id:"pf1",name:"Ornek"});
const savedSheet=elements.filter(el=>el.tag==="div"&&el.innerHTML.includes('id="pfEvidenceDraft"')).at(-1);
assert.ok(savedSheet.querySelector("#pfEvidenceText").value.includes('"broker-deposit"'));
savedSheet.querySelector("#pfEvidenceDelete").onclick();
assert.equal(getHandlers.fpImportedStatement("pf1"),null,"deleting evidence must clear local storage");
assert.equal(redraws,2,"deleting evidence must rerender");
console.log("statement modal interaction tests passed");
