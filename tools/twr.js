"use strict";
/* Time-weighted return requires dated end-of-period NAV and external capital flows.
   Convention: flows recorded at END of each period; today's contributions are
   removed from the ending NAV before period return is computed. */
function validDay(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
function timeWeightedReturn(points){
 if(!Array.isArray(points)||points.length<2)return null;
 const arr=[...points].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 let compound=1;
 for(let i=0;i<arr.length;i++){
  const p=arr[i];
  if(!p||typeof p!=="object")return null;
  if(!validDay(p.date)||!(Number.isFinite(p.value)&&p.value>=0)||!Number.isFinite(p.externalFlow||0))return null;
  if(i&&arr[i-1].date===p.date)return null;
  if(!i)continue;
  const prev=arr[i-1].value;
  if(!(prev>0))return null;
  const gain=(p.value-(p.externalFlow||0))/prev;
  if(!(gain>=0)||!Number.isFinite(gain))return null;
  compound*=gain;
  if(!Number.isFinite(compound))return null;
 }
 return compound-1;
}
module.exports={timeWeightedReturn};
