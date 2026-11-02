/* Browser and Node shared audit of user-supplied external statement data.
   Does not authenticate the origin of a pasted statement. Never changes trades. */
function fpComputeImportedReturns(data,audit,cashflows,liveHoldings,today){
 const errors=[],missing=x=>{if(!errors.includes(x))errors.push(x)};
 const validDate=s=>{if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const t=new Date(s+"T00:00:00Z");return Number.isFinite(t.getTime())&&t.toISOString().slice(0,10)===s};
 const validAmount=n=>typeof n==="number"&&Number.isFinite(n)&&n>0&&n<Number.MAX_SAFE_INTEGER/100&&Math.abs(Math.round(n*100)-n*100)<1e-5;
 const fail=()=>({xirr:null,twr:null,ledgerReady:false,errors});
 if(!data||typeof data!=="object"||Array.isArray(data))return {xirr:null,twr:null,ledgerReady:false,errors:["Ekstre verisi geçersiz"]};
 if(!data.source||typeof data.source.institution!=="string"||!data.source.institution.trim()||typeof data.source.reference!=="string"||!data.source.reference.trim())missing("Ekstre kurumu ve referansı eksik");
 if(!Number.isFinite(data.openingCash)||data.openingCash<0||!Number.isFinite(data.terminalCash)||data.terminalCash<0)missing("Açılış veya kapanış nakdi geçersiz");
 if(data.openingCash!==0)missing("XIRR için başlangıç nakdi sıfır olmalı; dönem öncesi sermaye bu kayıtlarla ölçülemez");
 if(!Array.isArray(data.events)||!data.events.length)missing("Ekstre işlem listesi eksik");
 if(!data.terminal||!validDate(data.terminal.date)||!Number.isFinite(data.terminal.value)||data.terminal.value<0)missing("Kapanış portföy değerlemesi eksik");
 if(!Number.isFinite(data.positionsValue)||data.positionsValue<0)missing("Pozisyon değerlemesi eksik");
 if(validDate(today)&&validDate(data.terminal?.date)&&data.terminal.date>today)missing("Kapanış tarihi gelecekte olamaz");
 if(audit?.issues?.length)missing("Eski işlem denetiminde giderilmemiş hatalar var");
 if(!Array.isArray(audit?.candidates)||!Array.isArray(cashflows))missing("Portföy kayıtları okunamadı");
 if(errors.length)return fail();
 const events=data.events.slice().sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||""))),ids=new Set(),signs={deposit:1,withdrawal:-1,buy:-1,sell:1,dividend:1,fee:-1};
 let running=data.openingCash;
 for(const e of events){
  if(!e||!validDate(e.date)||!validAmount(e.amount)||!Object.prototype.hasOwnProperty.call(signs,e.type)||typeof e.id!=="string"||!e.id.trim()||ids.has(e.id)||typeof e.reference!=="string"||!e.reference.trim()){missing("Geçersiz, tekrarlanan veya referanssız ekstre hareketi");continue}
  if(e.date>data.terminal.date)missing("Kapanış değerlemesinden sonraki işlemler ekstreye dahil edilmiş");
  ids.add(e.id);running=Math.round((running+e.amount*signs[e.type])*100)/100;
  if(running< -0.005)missing("Ekstrede negatif nakit bakiyesi");
 }
 if(Math.abs(running-data.terminalCash)>0.01)missing("Ekstre kapanış nakdi tutmuyor");
 if(Math.abs(data.positionsValue+data.terminalCash-data.terminal.value)>0.01)missing("Nakit ve pozisyon toplamı portföy değerine eşit değil");
 if(validDate(today)&&data.terminal.date===today&&(!Number.isFinite(liveHoldings)||liveHoldings<0||Math.abs(liveHoldings-data.positionsValue)>0.01))missing("Bugünkü pozisyon değeri uygulamada doğrulanamıyor veya uyuşmuyor");
 const expected=[...(audit.candidates||[]),...cashflows].map(x=>({type:x.type,date:x.date,amount:x.amount}));
 const used=new Set();
 for(const x of expected){
  const match=events.findIndex((e,i)=>!used.has(i)&&e&&e.type===x.type&&e.date===x.date&&Number.isFinite(e.amount)&&Math.abs(e.amount-x.amount)<=0.01);
  if(match<0)missing("Portföy işlemleri ile ekstre hareketleri eşleşmiyor");else used.add(match);
 }
 if(used.size!==events.length)missing("Ekstrede portföyde kaydedilmemiş hareketler var");
 const external=events.filter(e=>e&&(e.type==="deposit"||e.type==="withdrawal"));
 if(!external.some(e=>e.type==="deposit"))missing("Para yatırma hareketi bulunamadı");
 if(external.some(e=>e.date>=data.terminal.date))missing("Kapanış tarihinde veya sonrasında dış nakit hareketi var");
 if(errors.length)return fail();
 const flows=external.map(e=>({date:e.date,amount:e.type==="deposit"?-e.amount:e.amount}));
 flows.push({date:data.terminal.date,amount:data.terminal.value});
 const byDay=new Map();
 for(const x of flows)byDay.set(x.date,(byDay.get(x.date)||0)+x.amount);
 let changes=0,prev=0;
 for(const [day,amount] of [...byDay].sort((a,b)=>a[0].localeCompare(b[0]))){const sig=Math.sign(amount);if(sig&&prev&&sig!==prev)changes++;if(sig)prev=sig}
 let xirr=null;
 if(changes===1&&flows.some(e=>e.amount<0)&&flows.some(e=>e.amount>0)){
  const t0=Math.min(...flows.map(x=>Date.parse(x.date+"T00:00:00Z"))),year=365.2425*86400000;
  const npv=r=>flows.reduce((v,e)=>v+e.amount/Math.pow(1+r,(Date.parse(e.date+"T00:00:00Z")-t0)/year),0);
  let low=-0.999999,high=1,fl=npv(low),fh=npv(high);
  for(let i=0;i<30&&Number.isFinite(fh)&&fl*fh>0&&high<1e6;i++){high=2*high+1;fh=npv(high)}
  if(Number.isFinite(fl)&&Number.isFinite(fh)&&fl*fh<=0){
   for(let i=0;i<150;i++){const mid=(low+high)/2,m=npv(mid);if(!Number.isFinite(m))break;if(fl*m>0){low=mid;fl=m}else high=mid}
   xirr=(low+high)/2;
  }
 }
 if(xirr===null)missing("XIRR kökü hesaplanamıyor veya belirsiz");
 let twr=null;
 if(Array.isArray(data.valuations)&&data.valuations.length>=2){
  const points=data.valuations.slice().sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||"")));
  const first=points[0],last=points[points.length-1],firstDeposit=external.filter(x=>x.type==="deposit").map(x=>x.date).sort()[0];
  if(first?.date!==firstDeposit||last?.date!==data.terminal.date||!Number.isFinite(last?.value)||Math.abs(last.value-data.terminal.value)>0.01)missing("NAV başlangıç/bitiş tarihleri tutarsız");
  const navDays=new Set();
  for(const p of points){if(!p||!validDate(p.date)||!Number.isFinite(p.value)||p.value<0||navDays.has(p.date)||!Number.isFinite(p.externalFlow||0))missing("NAV kayıtları eksik veya geçersiz");else navDays.add(p.date)}
  if(external.some(x=>!navDays.has(x.date)))missing("Dış nakit tarihinde toplam portföy değeri eksik");
  if(!errors.length){
   let compound=1;
   for(let i=1;i<points.length;i++){
    const p=points[i],prev=points[i-1];if(!(prev.value>0)){missing("Sıfır NAV ile TWR hesaplanamaz");break}
    const movement=external.filter(e=>e.date>prev.date&&e.date<=p.date).reduce((sum,e)=>sum+(e.type==="deposit"?e.amount:-e.amount),0);
    if(Math.abs((p.externalFlow||0)-movement)>0.01){missing("NAV dış nakit hareketleri ekstreyle uyuşmuyor");break}
    const factor=(p.value-movement)/prev.value;
    if(!Number.isFinite(factor)||factor<0){missing("Geçersiz TWR dönemi");break}
    compound*=factor;
   }
   if(!errors.length&&Number.isFinite(compound))twr=compound-1;
  }
 }
 return {xirr,twr,ledgerReady:true,errors};
}
if(typeof module!=="undefined"&&module.exports)module.exports={fpComputeImportedReturns};
