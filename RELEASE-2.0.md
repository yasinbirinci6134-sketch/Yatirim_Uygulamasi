# Fon Pusulası 2.0 — Canlı Android

Paket: com.yasin.yatirimapp. Mevcut canlı uygulamanın üzerine kurulur, versionCode=200000+derleme numarası.

Eski sürüm ile aynı PKCS12 yatirim anahtarı kullanılır. V1.12 üretim APK sertifikası ile eşleşmeden yeni APK yayımlanmaz. Eski uygulamayı kaldırmadan yüklemek verileri korur.

2.0 varsayılanı Bugün kontrol merkezi; portföy özeti, kısa/uzun vade radarı, skor günlüğü ve TEFAS bir yıllık fiyat geçmişi. Kaynak veri bulunmadığında fiyat tahmin edilmez.

Üretim arayüzü yalnız başarıyla yayınlanmış APK commit SHA üzerinden güncellenir.

Gerçek cihazda uygulamanın üstüne kurulum ve TEFAS bir yıllık kaynak erişimi ayrıca doğrulanmalıdır.

## 2.0 Portföy ekranı
- Tema 2: Portföy kontrol merkezi, doğrulanmış açık pozisyon değeri, maliyet, fiyat-maliyet farkı ve varlık/işlem sayıları.
- Hisse / Fon / Tümü filtreleri ve hızlı Alım ekle / Nakit hareketi eylemleri.
- Pozisyon listesi ilk ekranda; varlık adı, skor, adet, doğrulanmış değer ve fark daha sıkı satırlarda.
- Ekstre, gerçekleşmiş getiri doğrulaması, nakit, risk, günlük, kapanmış işlemler ve analiz hesapları Gelişmiş bölümünde tutulur. Mevcut Firestore kayıtlarına dokunulmaz.
- Tam fiyat verisi yoksa toplam ve ilgili pozisyonların değer/kâr metrikleri gizlenir; satın alma fiyatından getiri üretilmez.
- Test: tools/v2-portfolio.test.js

## 2.0 Keşfet ekranı
- Fonlar/Hisseler: yeni koyu mavi radar başlığı; son puan sıralaması, veri tarihi ve güncellik bilgisi.
- Arama, puan/gün/yıl/A-Z sıralama, liste satırları ve varlık detayları ilk sırada; daha kompakt yerleşim.
- Takiptekiler/Tüm varlıklar anlık filtresi. Filtre, kayıt veya takip listesini değiştirmez.
- Öneri/keşifler/uzun analiz ve metodoloji bölümleri açılabilen ayrıntılara taşındı; eski eylemler korunur.
- Test: tools/v2-discovery.test.js.
