# Fon Pusulasi 2.0 - Test Surumu

Bu dal, main dalindaki 2026.11.02-41 uygulamasindan ayridir.
Geri donus: backup/v41-before-v2-2026-11-02.

## Deneme APK
GitHub Actions > "Fon Pusulasi 2.0 Test APK" > basarili son run > Artifacts >
"Fon-Pusulasi-2-Preview-APK" ZIP dosyasini indir. ZIP'teki app-debug.apk'yi telefona yukle.
Paket adi com.yasin.yatirimapp.preview oldugu icin ana uygulamayla yan yana kurulur.
Debug sertifikasiyla imzali test uygulamasidir, magazaya uygun release surumu degildir.
Test uygulamasi GitHub'dan feature/fon-pusulasi-v2-phase1 dalindaki arayuzu alir.

## Bu deneme surumundeki yeni islevler
- Hisse fiyat kaynaklarinin seciminde ortak fpQuote fonksiyonu
- Gunluk tarama yayinlamadan once veri kalite kontrolleri (main'deki canli cron henuz degismedi)
- Portfoyde nakit hareketi: para yatirma, para cekme, temettu, komisyon
- Nakit hareketleri goruntuleme ve silme
- Mevcut pozisyonlar ve onceki islemler degistirilmez

## Sinirlar
- Eski alim/satim kayitlari nakit defterine otomatik eklenmez.
- Nakit hareketleri bu onizlemede mevcut portfoy piyasa degerine EKLENMEZ;
  cunku eski islemlerin nakit bileseni eksik ve aksi halde iki kez sayma riski var.
- XIRR/TWR, performans grafigi, skor gecmisi basari analizleri ve tam UI revizyonu
  bu onizleme paketinde henuz uygulanmadi.
- Tarama veri dogrulama akisi degistirilmis olsa bile main dalindaki zamanlayici main'i kullanir;
  burada test edilebilir kaynak kodudur, canli akis degildir.

## Testler
node tools/data-quality.test.js
node tools/quote-selection.test.js
node tools/portfolio-engine.test.js

Bu komutlar her preview APK GitHub Actions derlemesinden once calistirilir.
