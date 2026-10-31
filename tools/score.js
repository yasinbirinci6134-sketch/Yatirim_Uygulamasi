// Fiyata bağlı puan parçalarını hesaplar (uygulamadaki kodun aynısı: ui/index.html içindeki SCORE bloğu).
// Kullanım: node tools/score.js girdi.json [çıktı.json]
//   girdi: market/latest biçiminde nesne; üst düzeyde "bist": {"m1","m3","y1"} (BIST 100 getirileri, %) olmalı.
//   Hisse: momentum (m1, m3, y1, mLow/mHigh ya da low1y/high1y), analist (fiyat etkisi), score, signal
//   Döviz/altın: trend (ALE fonunun getirilerine göre), tasima (fcst ve "Beklenen faiz (12 ay)"), score, signal
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'ui', 'index.html'), 'utf8');
const a = html.indexOf('/*SCORE:BEGIN'), b = html.indexOf('/*SCORE:END*/');
if (a < 0 || b < 0) { console.error('SCORE bloğu bulunamadı'); process.exit(1); }
const lr = (v, d = 2) => v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d;
const SCORE = new Function('lr', html.slice(a, b) + '\nreturn SCORE;')(lr);
const inp = process.argv[2], outp = process.argv[3] || inp;
const M = JSON.parse(fs.readFileSync(inp, 'utf8'));
if (!M.bist) console.warn('UYARI: "bist" yok; hisse momentumu hesaplanmadı (yapay zekânın değeri kalır).');
const before = {}; for (const x of [...(M.stocks || []), ...(M.fx || [])]) before[x.code] = { score: x.score, signal: x.signal, parts: { ...(x.parts || {}) } };
const res = SCORE.apply(M, { B: M.bist || null });
for (const x of [...(M.stocks || []), ...(M.fx || [])]) delete x._ai;
fs.writeFileSync(outp, JSON.stringify(M));
for (const x of [...(M.stocks || []), ...(M.fx || [])]) {
  const o = before[x.code]; if (!o) continue;
  const ch = Object.keys(x.parts || {}).filter(k => o.parts[k] !== x.parts[k]).map(k => `${k} ${o.parts[k]}→${x.parts[k]}`);
  if (ch.length || o.score !== x.score || o.signal !== x.signal) console.log(`${x.code}: puan ${o.score}→${x.score}, sinyal ${o.signal}→${x.signal}; ${ch.join(', ')}`);
}
console.log('tamam', JSON.stringify(res));
