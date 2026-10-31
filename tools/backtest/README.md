# Hisse puanı geri testi
1. `node dl.js` (GitHub Actions'ta): Yahoo 10 yıllık günlük fiyat + İş Yatırım çeyreklik bilanço → `bt/data.json.gz` (probe dalında).
2. `NEW=1 node run.js data.json.gz` → her ay sonunda uygulamadaki formüllerle (ui/index.html) puan; 3/6/12 ay sonraki BIST 100'e göre fazla getiri → rows.json
3. `node ana.js` (F=e3|e6|e12): faktör IC'leri, sinyal sepetleri, puan beşlileri. `grid.js`, `g2.js`, `g3.js`: ağırlık, momentum ve eşik denemeleri.
Sınırlar: evren bugünkü BIST 100 (hayatta kalma yanlılığı), faiz/enflasyon beklentisi yaklaşık tablo, analist ve haber geçmişi yok.
