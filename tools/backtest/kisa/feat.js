// Teknik göstergeler: yalnız i gününe kadarki veriyle hesaplanır (geleceğe bakmaz). Hem araştırmada hem uygulamada aynı mantık.
function features(p){ // p: {c,h,l,v} dizileri (eşit uzunlukta, eski→yeni)
  const n=p.c.length, c=p.c, h=p.h||c, l=p.l||c, v=p.v||[], F=[];
  const sma=(arr,i,k)=>{ if(i<k-1) return null; let s=0; for(let j=i-k+1;j<=i;j++) s+=arr[j]; return s/k; };
  const ema=(arr,k)=>{ const out=new Array(n).fill(null), a=2/(k+1); let e=null; for(let i=0;i<n;i++){ e=e==null?arr[i]:e+a*(arr[i]-e); out[i]=e; } return out; };
  const e12=ema(c,12), e26=ema(c,26), macd=c.map((_,i)=>e12[i]-e26[i]), sig=ema(macd,9);
  // RSI(14) Wilder
  const rsi=new Array(n).fill(null); let ag=0,al=0; for(let i=1;i<n;i++){ const ch=c[i]-c[i-1], g=Math.max(0,ch), lo=Math.max(0,-ch);
    if(i<=14){ ag+=g/14; al+=lo/14; if(i===14) rsi[i]=al?100-100/(1+ag/al):100; } else { ag=(ag*13+g)/14; al=(al*13+lo)/14; rsi[i]=al?100-100/(1+ag/al):100; } }
  const rng=new Array(n).fill(null); for(let i=19;i<n;i++){ let mx=-Infinity,mn=Infinity; for(let j=i-19;j<=i;j++){ mx=Math.max(mx,h[j]??c[j]); mn=Math.min(mn,l[j]??c[j]); } rng[i]=mn>0?mx/mn-1:null; }
  for(let i=0;i<n;i++){ if(i<260){ F.push(null); continue; }
    const r=k=>c[i]/c[i-k]-1, ma20=sma(c,i,20), ma50=sma(c,i,50), ma200=sma(c,i,200);
    let sd=0; for(let j=i-19;j<=i;j++) sd+=(c[j]-ma20)**2; sd=Math.sqrt(sd/20);
    let lr=[]; for(let j=i-19;j<=i;j++) lr.push(Math.log(c[j]/c[j-1])); const mu=lr.reduce((s,x)=>s+x,0)/20, vol20=Math.sqrt(lr.reduce((s,x)=>s+(x-mu)**2,0)/19);
    let hi20=-Infinity, hi55=-Infinity, hi252=-Infinity, lo252=Infinity, hi60=-Infinity; for(let j=i-1;j>=i-251;j--){ const x=c[j]; if(j>=i-20) hi20=Math.max(hi20,x); if(j>=i-55) hi55=Math.max(hi55,x); if(j>=i-60) hi60=Math.max(hi60,x); hi252=Math.max(hi252,x); lo252=Math.min(lo252,x); }
    const hist=rng.slice(i-250,i).filter(x=>x!=null).sort((a,b)=>a-b); let below=0; for(const x of hist) if(x<rng[i]) below++; const sq=hist.length?below/hist.length:null;
    let up=0; for(let j=i-9;j<=i;j++) if(c[j]>c[j-1]) up++;
    const vv=k=>{ let s=0,m=0; for(let j=i-k+1;j<=i;j++) if(v[j]>0){ s+=v[j]; m++; } return m?s/m:null; }, v5=vv(5), v50=vv(50), vr=v5&&v50?v5/v50:null;
    F.push({ r5:r(5), r10:r(10), r21:r(21), r63:r(63), r126:r(126), r252x21:(c[i-21]/c[i-252])-1,
      ma20:c[i]/ma20-1, ma50:c[i]/ma50-1, ma200:c[i]/ma200-1, trend:(c[i]>ma20)+(ma20>ma50)+(ma50>ma200),
      rsi:rsi[i], macdH:(macd[i]-sig[i])/c[i], macdD:((macd[i]-sig[i])-(macd[i-5]-sig[i-5]))/c[i],
      bbB:sd?(c[i]-(ma20-2*sd))/(4*sd):null, sq, brk20:c[i]>hi20?1:0, brk55:c[i]>hi55?1:0, hi52:c[i]>=hi252?1:0,
      pos52:hi252>lo252?(c[i]-lo252)/(hi252-lo252):null, dd60:c[i]/Math.max(hi60,c[i])-1, up10:up/10, vol20, vr, brkV:(c[i]>hi20&&vr>1.5)?1:0 }); }
  return F; }
if(typeof module!=='undefined') module.exports={features};
