# Kısa vade (2–4 hafta) geri testi
1. `node dl2.js` (GitHub Actions'ta): 10 yıllık günlük fiyat + hacim → `bt/data2.json.gz`
2. `H=20 node sr.js data2.json.gz` → örnek satırlar; `H=20 node sic.js` → her göstergenin tahmin gücü (eğitim 2017–22, test 2023–26)
3. `node scomp.js`, `node sstop.js` → bileşik puan, en iyi 5 stratejisi, zarar-kes; `node sval.js` → uygulamadaki SHORT kodunun aynı sonucu verdiğini doğrular; `node st.js` → klasik sinyaller; `node sfx.js` → altın/döviz
Sonuç: işe yarayanlar uzun vadeli yükseliş (son ay hariç), 200 günlük ortalamaya uzaklık, ortalamaların sıralanışı, RSI, 1 yıllık aralıktaki yer, son 3 ayın zirvesine yakınlık, düşük oynaklık. Hacim artışı, sıkışma-kırılım, MACD ve "aşırı satım" işe yaramadı.
