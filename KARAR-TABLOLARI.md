# Online Eğitim Sınav Sistemi - Karar Tabloları

## 1. Kullanıcı Giriş Karar Tablosu

### Tablo 1.1: Giriş Doğrulama Karar Tablosu

| Koşul No | Username Geçerli | Password Geçerli | Kullanıcı Aktif | Rol Atanmış | Sonuç | Hata Mesajı |
|----------|------------------|------------------|-----------------|-------------|--------|-------------|
| 1 | Evet | Evet | Evet | Evet | ✅ Başarılı Giriş | - |
| 2 | Evet | Evet | Evet | Hayır | ❌ Giriş Başarısız | "Rol atanmamış" |
| 3 | Evet | Evet | Hayır | Evet | ❌ Giriş Başarısız | "Kullanıcı aktif değil" |
| 4 | Evet | Hayır | Evet | Evet | ❌ Giriş Başarısız | "Geçersiz şifre" |
| 5 | Hayır | Evet | Evet | Evet | ❌ Giriş Başarısız | "Kullanıcı bulunamadı" |
| 6 | Hayır | Hayır | Evet | Evet | ❌ Giriş Başarısız | "Geçersiz kullanıcı adı veya şifre" |
| 7 | Evet | Evet | Hayır | Hayır | ❌ Giriş Başarısız | "Kullanıcı aktif değil ve rol atanmamış" |
| 8 | Hayır | Hayır | Hayır | Hayır | ❌ Giriş Başarısız | "Geçersiz kullanıcı bilgileri" |

**Açıklama:**
- **Koşul 1:** Tüm koşullar sağlandığında kullanıcı başarıyla giriş yapar
- **Koşul 2-8:** Herhangi bir koşul sağlanmadığında giriş başarısız olur ve ilgili hata mesajı gösterilir

---

### Tablo 1.2: Rol Bazlı Yönlendirme Karar Tablosu

| Rol | Giriş Başarılı | Dashboard URL | Erişilebilir Modüller |
|-----|----------------|---------------|----------------------|
| ADMIN | Evet | `/admin` | Tüm modüller (Kullanıcı, Sınav, Ayarlar, Raporlar) |
| TEACHER | Evet | `/teacher` | Sınav Oluşturma, Soru Yönetimi, Öğrenci Listesi |
| STUDENT | Evet | `/student` | Sınav Listesi, Sınav Alma, Sonuç Görüntüleme |

**Açıklama:**
- Her rol için farklı dashboard ve erişim yetkileri tanımlanmıştır
- Admin tüm modüllere erişebilir
- Öğretmen sadece sınav ve soru yönetimi modüllerine erişebilir
- Öğrenci sadece sınav alma ve sonuç görüntüleme modüllerine erişebilir

---

## 2. Sınav Oluşturma Karar Tablosu

### Tablo 2.1: Sınav Validasyon Karar Tablosu

| Koşul No | Başlık Dolu | Açıklama Dolu | Süre > 0 | Başlangıç Tarihi Geçerli | Bitiş Tarihi Geçerli | Bitiş > Başlangıç | Soru Sayısı > 0 | Sonuç |
|----------|-------------|---------------|-----------|-------------------------|---------------------|-------------------|-----------------|-------|
| 1 | Evet | Evet | Evet | Evet | Evet | Evet | Evet | ✅ Kaydet |
| 2 | Hayır | Evet | Evet | Evet | Evet | Evet | Evet | ❌ "Başlık gerekli" |
| 3 | Evet | Hayır | Evet | Evet | Evet | Evet | Evet | ✅ Kaydet (Açıklama opsiyonel) |
| 4 | Evet | Evet | Hayır | Evet | Evet | Evet | Evet | ❌ "Süre 0'dan büyük olmalı" |
| 5 | Evet | Evet | Evet | Hayır | Evet | Evet | Evet | ❌ "Geçersiz başlangıç tarihi" |
| 6 | Evet | Evet | Evet | Evet | Hayır | Evet | Evet | ❌ "Geçersiz bitiş tarihi" |
| 7 | Evet | Evet | Evet | Evet | Evet | Hayır | Evet | ❌ "Bitiş tarihi başlangıçtan sonra olmalı" |
| 8 | Evet | Evet | Evet | Evet | Evet | Evet | Hayır | ❌ "En az 1 soru gerekli" |

**Açıklama:**
- Sınav oluşturma işlemi için tüm zorunlu alanların doldurulması gerekir
- Açıklama alanı opsiyoneldir
- Tarih validasyonları yapılır
- En az 1 soru eklenmiş olmalıdır

---

### Tablo 2.2: Soru Tipi ve Puanlama Karar Tablosu

| Soru Tipi | Seçenek Sayısı | Doğru Cevap Sayısı | Puan Hesaplama | Otomatik Değerlendirme |
|-----------|----------------|-------------------|----------------|------------------------|
| MULTIPLE_CHOICE | 2-5 | 1 | Sabit puan | ✅ Evet |
| CLASSIC | - | - | Manuel puanlama | ❌ Hayır |

**Açıklama:**
- Çoktan seçmeli sorular otomatik değerlendirilir
- Klasik sorular manuel puanlama gerektirir
- Her soru tipi için farklı puanlama stratejisi uygulanır

---

## 3. Sınav Alma Karar Tablosu

### Tablo 3.1: Sınav Başlatma Karar Tablosu

| Koşul No | Kullanıcı Giriş Yapmış | Sınav Aktif | Sınav Başlangıç Tarihi Geçti | Sınav Bitiş Tarihi Geçmedi | Kullanıcı Daha Önce Başlatmamış | Sonuç |
|----------|----------------------|-------------|----------------------------|---------------------------|--------------------------------|-------|
| 1 | Evet | Evet | Evet | Evet | Evet | ✅ Sınav Başlatılır |
| 2 | Hayır | Evet | Evet | Evet | Evet | ❌ "Giriş yapmalısınız" |
| 3 | Evet | Hayır | Evet | Evet | Evet | ❌ "Sınav aktif değil" |
| 4 | Evet | Evet | Hayır | Evet | Evet | ❌ "Sınav henüz başlamadı" |
| 5 | Evet | Evet | Evet | Hayır | Evet | ❌ "Sınav süresi dolmuş" |
| 6 | Evet | Evet | Evet | Evet | Hayır | ❌ "Bu sınavı zaten başlattınız" |

**Açıklama:**
- Sınav başlatma için tüm koşulların sağlanması gerekir
- Kullanıcı bir sınavı sadece bir kez başlatabilir
- Sınav zamanı kontrolü yapılır

---

### Tablo 3.2: Sınav Gönderme Karar Tablosu

| Koşul No | Tüm Sorular Cevaplandı | Süre Doldu | Zorunlu Sorular Cevaplandı | Sonuç | İşlem |
|----------|----------------------|------------|---------------------------|-------|-------|
| 1 | Evet | Hayır | Evet | ✅ Gönder | Sınav gönderilir, sonuçlar hesaplanır |
| 2 | Hayır | Hayır | Evet | ⚠️ Uyarı | "Tüm soruları cevaplamadınız, yine de göndermek istiyor musunuz?" |
| 3 | Evet | Evet | Evet | ✅ Otomatik Gönder | Süre dolduğu için otomatik gönderilir |
| 4 | Hayır | Evet | Hayır | ❌ Gönderilemez | "Zorunlu sorular cevaplanmadı" |
| 5 | Evet | Hayır | Hayır | ❌ Gönderilemez | "Zorunlu sorular cevaplanmadı" |

**Açıklama:**
- Kullanıcı tüm soruları cevaplamadan gönderebilir (uyarı ile)
- Süre dolduğunda sınav otomatik gönderilir
- Zorunlu sorular mutlaka cevaplanmalıdır

---

## 4. Cevap Değerlendirme Karar Tablosu

### Tablo 4.1: Çoktan Seçmeli Soru Değerlendirme

| Kullanıcı Cevabı | Doğru Cevap | Sonuç | Puan |
|-----------------|-------------|-------|------|
| A | A | ✅ Doğru | Tam puan |
| B | A | ❌ Yanlış | 0 |
| C | A | ❌ Yanlış | 0 |
| D | A | ❌ Yanlış | 0 |
| Boş | A | ⚠️ Boş | 0 |

**Açıklama:**
- Çoktan seçmeli sorularda sadece doğru cevap tam puan alır
- Yanlış veya boş cevaplar 0 puan alır

---

### Tablo 4.2: Klasik Soru Değerlendirme

| Kullanıcı Cevabı | Değerlendirme Durumu | Puan |
|-----------------|---------------------|------|
| Dolu | ✅ Değerlendirildi | Manuel atanan puan (0-100) |
| Dolu | ⏳ Beklemede | 0 (henüz değerlendirilmedi) |
| Boş | ❌ Boş | 0 |

**Açıklama:**
- Klasik sorular manuel değerlendirme gerektirir
- Öğretmen veya admin tarafından puan verilir
- Değerlendirme yapılmadan önce puan 0'dır

---

## 5. Admin Panel Karar Tablosu

### Tablo 5.1: Kullanıcı Onaylama Karar Tablosu

| Kullanıcı Rolü | Onay Durumu | İşlem | Sonuç |
|---------------|-------------|-------|-------|
| STUDENT | Beklemede | Onayla | ✅ Öğrenci aktif olur, sisteme giriş yapabilir |
| STUDENT | Beklemede | Reddet | ❌ Öğrenci aktif olmaz, giriş yapamaz |
| TEACHER | Beklemede | Onayla | ✅ Öğretmen aktif olur, sınav oluşturabilir |
| TEACHER | Beklemede | Reddet | ❌ Öğretmen aktif olmaz, giriş yapamaz |
| ADMIN | - | - | ✅ Admin otomatik aktif, onay gerekmez |

**Açıklama:**
- Öğrenci ve öğretmen kayıtları admin onayı gerektirir
- Admin hesapları otomatik aktif olur
- Onaylanmayan kullanıcılar sisteme giriş yapamaz

---

### Tablo 5.2: Sınav Silme Karar Tablosu

| Sınav Durumu | Başlangıç Tarihi Geçti | Öğrenci Cevapladı | Silme İşlemi | Sonuç |
|-------------|----------------------|------------------|-------------|-------|
| Aktif | Hayır | Hayır | ✅ Sil | Sınav silinir |
| Aktif | Evet | Hayır | ⚠️ Uyarı | "Sınav başlamış, yine de silmek istiyor musunuz?" |
| Aktif | Evet | Evet | ❌ Silinemez | "Sınav tamamlanmış, silinemez" |
| Pasif | - | - | ✅ Sil | Sınav silinir |

**Açıklama:**
- Başlamamış sınavlar silinebilir
- Başlamış ama tamamlanmamış sınavlar uyarı ile silinebilir
- Tamamlanmış sınavlar silinemez (veri bütünlüğü için)

---

## 6. Sistem Ayarları Karar Tablosu

### Tablo 6.1: Sistem Parametreleri

| Parametre | Değer Aralığı | Varsayılan | Açıklama |
|-----------|--------------|-----------|----------|
| Maksimum Soru Sayısı | 1-100 | 50 | Bir sınavda en fazla soru sayısı |
| Minimum Soru Sayısı | 1-10 | 1 | Bir sınavda en az soru sayısı |
| Maksimum Süre (dakika) | 10-300 | 120 | Bir sınavın maksimum süresi |
| Minimum Süre (dakika) | 5-60 | 10 | Bir sınavın minimum süresi |
| Otomatik Gönderme | Evet/Hayır | Evet | Süre dolduğunda otomatik gönderme |

**Açıklama:**
- Sistem parametreleri admin tarafından yapılandırılabilir
- Her parametre için geçerli değer aralığı vardır
- Varsayılan değerler sistem kurulumunda belirlenir

---

## 7. Hata Yönetimi Karar Tablosu

### Tablo 7.1: Hata Durumları ve Çözümleri

| Hata Kodu | Hata Tipi | Durum Kodu | Kullanıcıya Gösterilen Mesaj | Sistem Log'u |
|-----------|-----------|------------|------------------------------|--------------|
| ERR-001 | Geçersiz Giriş | 401 | "Kullanıcı adı veya şifre hatalı" | "Invalid login attempt: {username}" |
| ERR-002 | Yetkisiz Erişim | 403 | "Bu işlem için yetkiniz yok" | "Unauthorized access: {user} -> {resource}" |
| ERR-003 | Kayıt Bulunamadı | 404 | "İstediğiniz kayıt bulunamadı" | "Resource not found: {resource_id}" |
| ERR-004 | Validasyon Hatası | 400 | "Lütfen tüm zorunlu alanları doldurun" | "Validation error: {field}" |
| ERR-005 | Sunucu Hatası | 500 | "Bir hata oluştu, lütfen daha sonra tekrar deneyin" | "Internal server error: {error}" |

**Açıklama:**
- Her hata durumu için standart bir kod ve mesaj tanımlanmıştır
- Kullanıcıya anlaşılır mesajlar gösterilir
- Sistem log'larında detaylı hata bilgileri kaydedilir

---

## 8. Test Senaryoları ile Karar Tabloları İlişkisi

| Test Senaryosu | İlgili Karar Tablosu | Test Edilen Koşul |
|----------------|---------------------|-------------------|
| testValidUserLogin | Tablo 1.1 - Koşul 1 | Geçerli giriş |
| testInvalidUserLogin | Tablo 1.1 - Koşul 4, 5, 6 | Geçersiz giriş |
| testExamCreationAccess | Tablo 2.1 - Koşul 1 | Sınav oluşturma erişimi |
| testCreateBasicExam | Tablo 2.1 - Koşul 1 | Sınav kaydetme |
| testExamStartProcess | Tablo 3.1 - Koşul 1 | Sınav başlatma |
| testExamSubmission | Tablo 3.2 - Koşul 1 | Sınav gönderme |
| testAdminDashboardAccess | Tablo 5.1 | Admin panel erişimi |

---

**Not:** Bu karar tabloları, sistemin iş mantığını ve karar noktalarını detaylı olarak açıklamaktadır. Her karar tablosu, ilgili test senaryoları ile doğrulanmıştır.
