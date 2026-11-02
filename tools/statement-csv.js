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
module.exports={fpParseStatementCsv};
