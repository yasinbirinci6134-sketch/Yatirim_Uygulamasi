"use strict";
/* Money-weighted return for COMPLETE cashflow ledgers only.
   Cashflows investor perspective: deposits negative, withdrawals positive.
   Terminal portfolio market value positive. Never calculate from incomplete legacy trades. */
function validDay(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
function xirr(flows,{maxRate=1e6,tolerance=1e-9}={}){
 if(!Array.isArray(flows)||flows.length<2)return null;
 const f=flows.map(x=>({date:String(x.date||""),amount:x.amount,day:Date.parse(x.date+"T00:00:00Z")}));
 if(f.some(x=>!validDay(x.date)||!Number.isFinite(x.day)||!Number.isFinite(x.amount)))return null;
 if(!f.some(x=>x.amount<0)||!f.some(x=>x.amount>0))return null;
 /* Multiple sign reversals may produce multiple XIRR roots. Do not publish an
    ambiguous annualized return without a dedicated multi-root solver. */
 const ordered=f.slice().sort((a,b)=>a.day-b.day);
 const byDay=[];
 for(const x of ordered){const prev=byDay[byDay.length-1];if(prev&&prev.day===x.day)prev.amount+=x.amount;else byDay.push({...x});}
 let reversals=0,previous=0;
 for(const x of byDay){const sign=Math.sign(x.amount);if(!sign)continue;if(previous&&sign!==previous)reversals++;previous=sign;}
 if(reversals!==1)return null;
 const t0=Math.min(...f.map(x=>x.day)),yr=365.2425*86400000;
 const npv=r=>f.reduce((sum,x)=>sum+x.amount/Math.pow(1+r,(x.day-t0)/yr),0);
 let lo=-0.999999,hi=1,fl=npv(lo),fh=npv(hi);
 while(fl*fh>0&&hi<maxRate){hi=hi*2+1;fh=npv(hi);}
 if(!Number.isFinite(fl)||!Number.isFinite(fh)||fl*fh>0)return null;
 for(let i=0;i<180;i++){
  const mid=(lo+hi)/2,fm=npv(mid);
  if(!Number.isFinite(fm))return null;
  if(Math.abs(fm)<tolerance)return mid;
  if(fl*fm>0){lo=mid;fl=fm;}else{hi=mid;fh=fm;}
 }
 return (lo+hi)/2;
}
module.exports={xirr};
