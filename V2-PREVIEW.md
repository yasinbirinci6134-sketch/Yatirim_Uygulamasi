# Fon Pusulasi 2.0 - Test Surumu

Bu dal, main dalindaki 2026.11.02-41 uygulamasindan ayridir.
Geri donus: backup/v41-before-v2-2026-11-02.

## Deneme APK
GitHub Actions > "Fon Pusulasi 2.0 Test APK" > basarili son run > Artifacts >
"Fon-Pusulasi-2-Preview-APK" ZIP dosyasini indir. ZIP'teki
"Fon-Pusulasi-2-Preview.apk" dosyasini telefona yukle.
ZIP'te "Fon-Pusulasi-2-Preview-build.txt" ve
"Fon-Pusulasi-2-Preview.apk.sha256" da vardir.
Ilk dosyadaki commit ile denedigini dusundugun kaynak surumu ayni olmalidir.
SHA-256 dosyasi APK'nin indirildikten sonra degismedigini kontrol etmek icindir.
Alternatif: GitHub Releases > v2-preview-current > Fon-Pusulasi-2-Preview.apk.
Releases etiketinin sabit oldugunu ve yeni basarili derlemelerde guncellendigini unut.
Paket adi com.yasin.yatirimapp.preview oldugu icin ana uygulamayla yan yana kurulur.
Debug sertifikasiyla imzali test uygulamasidir, magazaya uygun release surumu degildir.
Test uygulamasi GitHub'daki preview derleme durumunu okur; yalniz basarili APK ile iliskilendirilen kaynak commit'in degismez arayuzunu alir. Basarisiz/yeni commit dogrudan onizlemenin arayuzunu degistirmez.

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
- XIRR/TWR hesaplama ekranı: Kullanıcının içe aktardığı referanslı ekstre hareketlerinin
  tarih, tutar, bakiye ve portföy kayıtlarıyla mutabakatı sağlanırsa oran gösterilir.
  Kaynağın gerçekliği otomatik olarak doğrulanmaz; başlangıç nakdi sıfır olmalıdır.
- Gerçek portföy için nakit dahil NAV geçmişi zorunludur. Eski pozisyon grafiği TWR değildir.
- Skor geçmişi başarı analizleri ve tam görsel son rötuşlar ayrıca test edilecektir.
- Tarama veri dogrulama akisi degistirilmis olsa bile main dalindaki zamanlayici main'i kullanir;
  burada test edilebilir kaynak kodudur, canli akis degildir.

## Ekstre yukleme
Portfoy > Gercek getiri > Ekstre yukle > Taslak olustur:
- Uygulamadaki mevcut alis/satis ve nakit hareketlerinden taslak olusturur.
- Kurum adi, ekstre referansi, her hareketin referansi, acilis/kapanis nakdi,
  son portfoy degeri ve nakit dahil NAV gecmisi kurum ekstresinden tamamlanmalidir.
- Taslak kendi basina dogrulanmis hesaplama ya da banka ekstresi degildir.
- JSON cihazdaki localStorage alaninda tutulur; hesap / kisi bilgisi ekleme.
- Telefondaki "CSV/TXT dosyasini sec" alanina dokunarak ekstre dosyasini dogrudan secebilirsin.
  Secim Android'in sistem dosya secicisini acar, dosya yalniz WebView icinde okunur;
  banka verisi otomatik olarak bir sunucuya gonderilmez. 250 KB siniri vardir.
  Dosya okununca "CSV hareketlerini aktar" butonuna ayrica basmalisin.
- JSON'i elle duzenlemek yerine "CSV hareketlerini ice aktar" bolumune yapistirabilirsin.
  Kabul edilen basliklar: tarih;tür;tutar;referans veya date,type,amount,reference.
  Tarih YYYY-AA-GG veya GG.AA.YYYY; miktar 1000.50 ya da 1.000,50 olabilir.
  Turler: Alis, Satis, Para yatirma, Para cekme, Temettu, Komisyon.
  CSV satirlarinda referans zorunludur; hatali tek satir varsa hicbir hareket aktarilmaz.
  CSV yalnız hareketleri doldurur; kurum kimligi, acilis/kapanis nakdi, pozisyon
  degeri ve toplam NAV kayitlari eksik kalir. Icerik kendi kendini dogrulamaz.
- Yeni form alanlariyla kurum adini, ekstre referansini, acilis/kapanis nakdini,
  kapanis tarihini, kapanis pozisyon degerini ve toplam portfoy degerini dogrudan
  telefondan girebilirsin. Bu alanlara gercek kurum dokumundeki degerleri gir.
  Mevcut JSON'u degistirip form alanlarina dokunmazsan eski alanlar JSON'un
  uzerine yazilmaz. Yalniz formu doldurarak kontrol baslatabilirsin;
  ancak ilgili tarihli kurum ekstresi ve islem referanslari eksikse kaydedilmez.
- TWR icin "NAV gecmisini aktar" bolumu: tarih;deger;disNakit basliklarini
  iceren CSV veya TXT dosyasindan nakit dahil toplam portfoy degeri kayitlarini alir.
  disNakit ilgili gun yatirma eksi cekme tutaridir; cekme varsa negatif yazilir.
  Her gunun tarihi tekil olmalidir. NAV disNakit her satirda acikca yazilmalidir; bos veya null tutar sifir varsayilmaz. Bu rakamlar asla uygulama tarafindan
  tahmin edilmez, nakit hareketleriyle eslesmedikce TWR gosterilmez.

## APK derlemesini dogrulama
GitHub Actions > Fon Pusulasi 2.0 Test APK > basarili calisma.
Gecmis calismalarin testini incelemek icin ilgili is akisinin adimlarini ac.
Build is akisinin sonuna .github/status/v2-preview-build.json durum dosyasi eklenmistir.
Dosyadaki source_commit derlenen kaynak kodudur; yeni commit sonrasi eski
basarili sonucu yeni surum olarak yorumlama.
Arsiv, kaynak HTML'ye byte-byte esit arayuz paketi icermelidir.
Eski bir is akisi devam ederken yeni commit olursa eskisi iptal edilir.

## Otomatik testler
node tools/data-quality.test.js
node tools/quote-selection.test.js
node tools/portfolio-engine.test.js
node tools/return-metrics.test.js
node tools/v2-ui.test.js
node tools/twr.test.js
node tools/external-flows.test.js
node tools/ledger-reconcile.test.js
node tools/legacy-trade-audit.test.js
node tools/verified-returns.test.js
node tools/ui-returns.test.js

Bu testler preview APK GitHub Actions derlemesinden once calistirilir.

## Skor gecmisi veri guvenligi
- Ayni piyasa tarihine ait tekrar taramalar tek gun sayilir; ilk kayit korunur.
- Gerceklesen sonuclar icin gecerli 80+ puan, tarihli fiyat ve 5 ayri tarih gerekir.
- Fiyat/borsa getirisi bolunme ve temettu duzeltmeli degildir; gecmis tutarlar uydurulmaz.

## Tarama veri kalitesi (onizleme dalina ozel)
- BIST 100 endeks tarihinin tarama tarihiyle eslesmesi, piyasa gunu tutarliligi ve 7 gunluk guncellik siniri kontrol edilir.
- Fiyatlarin en az %80'i tarama gunune ait olmalidir; tarihi eski veya gelecekteki tarama yayinlanmaz.
- Android test arayuzu, indirilen taramayi da ayni kalite kuralindan gecirir; mevcut onayli veriyi bozuk veriyle degistirmez.
- main uzerindeki canli zamanlayici bu onizleme kodunu otomatik olarak kullanmaz.

## Cihazdaki eski tarama davranisi
- Onbellekte eski ya da hatali tarama kalmissa, guclu/zayif adaylarin guncel oneriler gibi sunulmasi engellenir.
- Boyle bir durumda kayitli tarih ve veri guncel degil uyari karti gosterilir.
- Bozuk eski zaman damgasi, yeni gecerli taramanin cihazda kabul edilmesini engelleyemez.
- Puan gecmisi kayitlari silinmez; veri kaynagi bulunamiyorsa gelecek getiri uydurulmaz.

## Skor analizi yorumlama
- Sinyal sayisinin yaninda kac farkli baslangic gununde sinyal olustugu da sayilir.
- En az 30 eslesmis sinyal ve 5 farkli giris gunu yoksa kullaniciya "On gozlem" uyari metni verilir.
- Bu esikler istatistiksel dogruluk garantisi degildir; ayni gun sinyalleri iliskilidir.
- Skor gunlugunde hem en buyuk artislari hem en buyuk dususleri gostermek icin mutlak fark siralamasi kullanilir.

## Onizleme guvenli uzaktan guncelleme
- Yalniz test paketinde once .github/status/v2-preview-build.json icindeki status=success ve source_commit kontrol edilir.
- Ardindan GitHub'daki 40 haneli commit SHA'ya sabitlenen ui/index.html indirilir; hareketli feature dalinin sonu okunmaz.
- Durum dosyasi ulasilamaz veya yeni derleme basarisizsa mevcut onayli cache/paket arayuzu kullanilir.
- Ana surumun uzaktan guncelleme davranisi degistirilmez.

## Tema 1 kompakt arayuz (onizleme)
- Hisse, fon ve altin/doviz listeleri iki ana sutuna indirildi; skor kodun yaninda.
- Bilinmeyen skor sayi olarak uydurulmaz; erisilebilir aciklama korunur.
- Portfoyde kapali pozisyonlar daha ince; acildiginda islemler, detaylar ve butonlar gorunur.
- Tema 2'nin yogun liste davranisi degistirilmez; eski portfoy ve alim-satim kayitlarina dokunulmaz.

## Android acilis ve kurtarma
- Indirilen yeni UI ancak basarili JS ready() sinyali sonrasi "son calisan" olarak kaydedilir.
- Yeni UI'ye gecis oncesi, dogrulanmis eski UI ui_last_good.html olarak saklanir.
- Yeni UI 12 saniyede acilamazsa dosya bozuk sayilir; son calisan UI, yoksa APK ici UI yuklenir.
- APK icindeki UI de 20 saniyede acilamazsa yerel "Yeniden dene" paneli gosterilir.
- Load kuşak numarasi ile eski watchdog yeni UI'yi geriye dusuremez.
- Portfoy, nakit hareketleri, tema, yerel veriler ve localStorage kurtarma sirasinda silinmez.
- Otomatik kaynak/derleme testleri gercek telefonda acilis testinin yerini tutmaz.

## Telefon acilis tanilamasi
- Android host her acilis denemesinde durum, sure ve basarili/hatali geri donus sayaclarini kaydeder.
- startupReport() yalniz teknik sayaclar, uygulama surumu, ekran kaynagi ve zamanlari dondurur.
- Portfoy islemleri, ekstre tutarlari, hesap bilgileri veya URL'ler tanilama raporuna eklenmez.
- Bu bilgiler cihazda tutulur; kullanici paylasmadikca otomatik gonderilmez.

## Ayarlardaki tanilama raporu
- Ayarlar > Acilis tanilama > Tanilama raporu dugmesinden sadece teknik acilis bilgileri okunabilir.
- Paylas secenegi kullanici dokunmadan calismaz; veri otomatik olarak baska yere gonderilmez.
- Tema 1 ve Tema 2 ayarlari ayni raporu gosterir.

## UI 2.0 onizleme baslangici
- Sadece .preview paketinde ilk acilista Tema 2 ve Bugun sekmesi varsayilan; v41 ayarlari degismez.
- Kullanicinin Tema 1 secimi fp-v2-theme-choice anahtarinda kalici ve sunucu tercih yuklemesinden korunur.
- Uygulama basligi Fon Pusulasi 2.0; dort alt sekmede ayirt edilebilir simgeler var.

## Fon Pusulasi 2.0 - kullanicinin gordugu yeni ana ekran
- Test APK'si ilk acilista Tema 2 ve Bugun kontrol merkezini gosterir. Eski klasik secim istege bagli kalir ve cihaz tercihleriyle korunur.
- Yeni koyu yesil ust panel, pusula motifi, Portfoyum/Hisseler/Fonlar hizli erisimi, piyasa gostergeleri seridi, pozisyon ozeti.
- Iki radar karti: kalite kapisindan gecmis kisa vade tarama skorları ve son analizdeki uzun vade hisse/fon puanlari.
- Telefonun kaydettigi gercek puan degisimleri, son analiz ve haberler artik Bugun ekranindan gorulebilir.
- Dogrulanmis guncel fiyat bulunmazsa portfoy karsiligi/kari BOS birakilir; alis fiyatindan sahte getiri uydurulmaz.
- Acilista ag verileri gelmese de yeni kontrol merkezi render edilir; eski bos ekran yerine yeni tasarim gorulur.
- Veriye dayali kontrol paneli TWR/XIRR gibi dogrulanmis gercek getiriyle karistirilmamalidir.
- tools/v2-dashboard.test.js node testinde bos, guncel, gecikmis, guvenilmez fiyat senaryolari ve buton yonlendirmeleri denenir.
