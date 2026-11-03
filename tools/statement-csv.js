"use strict";
/* Strict, all-or-nothing conversion of generic statement CSV into UNVERIFIED movements. */
function fpParseStatementCsv(input){
 const fail=x=>({events:[],errors:[x]});
 if(typeof input!=="string"||!input.trim())return fail("CSV metni boş");
 if(input.length>250000)return fail("CSV en fazla 250.000 karakter olabilir");
 const text=input.replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n");
 const first=text.split("\n").find(x=>x.trim());
 const delimiter=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?";":",";
 const rows=[],row=[];let field="",quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){
   if(c==='"'&&text[i+1]==='"'){field+='"';i++}
   else if(c==='"')quoted=false;
   else field+=c;
  }else if(c==='"'){
   if(field.trim())return fail("CSV tırnak işaretleri geçersiz");
   quoted=true;
  }else if(c===delimiter){row.push(field.trim());field=""}
  else if(c==="\n"){row.push(field.trim());field="";if(row.some(Boolean))rows.push(row.slice());row.length=0}
  else field+=c;
 }
 if(quoted)return fail("CSV içinde kapanmamış tırnak işareti var");
 row.push(field.trim());if(row.some(Boolean))rows.push(row);
 if(rows.length<2)return fail("CSV başlığı ve en az bir hareket gerekli");
 if(rows.length>4001)return fail("CSV en fazla 4.000 hareket içerebilir");
 const norm=s=>String(s||"").toLocaleLowerCase("tr-TR").replace(/ı/g,"i").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
 const head=rows.shift().map(norm),idx=(...opts)=>head.findIndex(x=>opts.includes(x));
 const positions={date:idx("tarih","date","islemtarihi"),type:idx("tur","tip","type","islemturu"),amount:idx("tutar","amount","tutartry","tutartl"),reference:idx("referans","reference","ref","dekontno","islemno")};
 if(Object.values(positions).some(x=>x<0))return fail("Başlıklar gerekli: tarih, tür, tutar, referans");
 const types={buy:"buy",alis:"buy",alim:"buy",sell:"sell",satis:"sell",satim:"sell",deposit:"deposit",yatirma:"deposit",parayatirma:"deposit",withdrawal:"withdrawal",cekme:"withdrawal",paracekme:"withdrawal",dividend:"dividend",temettu:"dividend",fee:"fee",komisyon:"fee"};
 const validDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+"T00:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s};
 const parseAmount=s=>{
  let v=String(s||"").replace(/\s/g,"");
  if(/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(v))v=v.replace(/\./g,"").replace(",",".");
  else if(/^\d+,\d{1,2}$/.test(v))v=v.replace(",",".");
  else if(!/^\d+(?:\.\d{1,2})?$/.test(v))return NaN;
  const n=Number(v);return Number.isFinite(n)&&n>0&&n<Number.MAX_SAFE_INTEGER/100?Math.round(n*100)/100:NaN;
 };
 const errors=[],events=[];
 for(let i=0;i<rows.length;i++){
  const r=rows[i],ref=r[positions.reference]||"",type=types[norm(r[positions.type])],amount=parseAmount(r[positions.amount]);let date=r[positions.date]||"";
  if(/^\d{2}\.\d{2}\.\d{4}$/.test(date)){const [d,m,y]=date.split(".");date=y+"-"+m+"-"+d}
  if(!validDate(date)||!type||!Number.isFinite(amount)||!ref.trim()){if(errors.length<8)errors.push("Satır "+(i+2)+": tarih, tür, tutar veya referans geçersiz");continue}
  events.push({id:"csv-"+(i+1),reference:ref.trim(),type,date,amount});
 }
 if(errors.length)return {events:[],errors};
 return {events,errors:[]};
}
/* NAV values must come from a dated statement, not price interpolation. */
function fpParseNavCsv(input){
 const fail=message=>({valuations:[],errors:[message]});
 if(typeof input!=="string"||!input.trim())return fail("NAV CSV boş");
 if(input.length>250000)return fail("NAV CSV en fazla 250.000 karakter olabilir");
 const lines=input.replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n").split("\n").filter(x=>x.trim());
 if(lines.length<2||lines.length>4001)return fail("NAV CSV: başlık ve 1-4.000 kayıt gerekli");
 const delimiter=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?";":",";
 const norm=s=>String(s||"").toLocaleLowerCase("tr-TR").replace(/ı/g,"i").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
 const hdr=lines[0].split(delimiter).map(norm),col={
  date:hdr.findIndex(x=>["tarih","date","degerlemetarihi"].includes(x)),
  value:hdr.findIndex(x=>["deger","value","nav","portfoydegeri","toplamdeger"].includes(x)),
  flow:hdr.findIndex(x=>["disnakit","externalflow","netgiris","nakitgiriscikis"].includes(x))
 };
 if(Object.values(col).some(x=>x<0))return fail("NAV başlıkları: tarih;değer;dışNakit");
 const amount=(src,allowMinus)=>{
  let v=String(src||"").trim().replace(/\s/g,"");
  if(/^-?\d{1,3}(?:\.\d{3})+,(?:\d{1,2})?$/.test(v))v=v.replace(/\./g,"").replace(",",".");
  else if(/^-?\d+,(?:\d{1,2})?$/.test(v))v=v.replace(",",".");
  else if(!/^-?\d+(?:\.\d{1,2})?$/.test(v))return NaN;
  const n=Number(v);return Number.isFinite(n)&&(allowMinus||n>=0)&&Math.abs(n)<Number.MAX_SAFE_INTEGER/100?Math.round(n*100)/100:NaN;
 };
 const validDate=s=>{const x=new Date(s+"T00:00:00Z");return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(x.getTime())&&x.toISOString().slice(0,10)===s};
 const rows=[],dates=new Set();
 for(let i=1;i<lines.length;i++){
  const cells=lines[i].split(delimiter);let date=String(cells[col.date]||"").trim();
  if(/^\d{2}\.\d{2}\.\d{4}$/.test(date)){const [d,m,y]=date.split(".");date=y+"-"+m+"-"+d}
  const value=amount(cells[col.value],false),externalFlow=amount(cells[col.flow],true);
  if(!validDate(date)||!Number.isFinite(value)||!Number.isFinite(externalFlow)||dates.has(date))
   return fail("NAV CSV satır "+(i+1)+": geçersiz tarih, değer, dış nakit veya tekrar eden gün");
  dates.add(date);rows.push({date,value,externalFlow});
 }
 rows.sort((a,b)=>a.date.localeCompare(b.date));
 return {valuations:rows,errors:[]};
}
module.exports={fpParseStatementCsv,fpParseNavCsv};
