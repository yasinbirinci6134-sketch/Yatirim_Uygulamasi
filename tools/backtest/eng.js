// Geri test motoru: uygulamadaki formüller (SCORE, lbuild, formulaScore) aynen kullanılır
const fs=require('fs');
const H=fs.readFileSync(process.env.UI||require('path').join(__dirname,'..','..','ui','index.html'),'utf8');
const seg=(a,b)=>{ const i=H.indexOf(a), j=H.indexOf(b,i+1); if(i<0||j<0) throw Error('yok '+a); return H.slice(i,j); };
const lr=(v,d=2)=>v==null||!isFinite(v)?null:Math.round(v*10**d)/10**d, TR=3*3600e3;
const END='_vol:vol!=null?lr(vol,1):null }; }';
const lb=H.slice(H.indexOf('function lbuild'), H.indexOf(END)+END.length);
const body=seg('/*SCORE:BEGIN','/*SCORE:END*/')+'\n'+lb+'\n'+seg('// ağır olumsuz KAP: yapay zekânın','/*SCORE:BEGIN')+'\nreturn {SCORE,lbuild,formulaScore,HOLD};';
const S={live:{fin:{},an:{}}}, dayKey=ms=>new Date(ms+TR).toISOString().slice(0,10);
module.exports={E:new Function('lr','TR','S','dayKey',body)(lr,TR,S,dayKey),S,lr,TR,dayKey};
