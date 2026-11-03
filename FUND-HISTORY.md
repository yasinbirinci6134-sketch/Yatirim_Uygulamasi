Fon Pusulası 2.0 - Gerçek fon fiyat geçmişi

TEFAS'ın 2026 JSON API'si, standart Android HTTP istemcilerine bot koruması uygulayabiliyor. Bu nedenle Android TEFAS isteği sonucunda 18 Eylül öncesi veri gelmeyebilir.

Yeni GitHub Actions fund-history.yml, sabit sürümlü tefasmak 1.0.1 (curl_cffi/TLS Chrome) ile piyasa veri dalındaki fonların 12 aylık günlük fiyatlarını alır. Her hafta içi 12:20 TSİ ve elle tetikleme desteklenir.

Yalnız doğrulanmış pozitif fiyatlar ve gerçek ISO tarihler tutulur. Eski gerçek günler yeni veri nedeniyle silinmez. Eksik günler doldurulmaz, fiyat tahmini yapılmaz. Üretim verisi data dalındaki fund-history.json dosyasına yazılır.

Akamai GitHub Actions isteklerini de bloke ederse iş hata verir ve sahte veya boş bir dosya yayınlanmaz. İlk tam bir yıllık veri ancak GitHub Actions çalışma logu ve yayınlanan arşivin ilk/son tarihiyle doğrulanır.

Telefondaki fon detayında önce sunucudaki ortak gerçek TEFAS veri arşivi, ardından gerekirse doğrudan TEFAS çağrısı kullanılır. Arşiv indirme hatası veya eksik dönemde daha önce doğrulanmış tarihler kaybedilmez. Yalnız bir yıllık kapsama gerçekten 300+ gün olduğunda tam yıl işaretlenir.
