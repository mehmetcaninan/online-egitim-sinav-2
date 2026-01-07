# Online Eğitim Sınav Sistemi - Test Senaryoları

## Genel Bakış

Bu dokümanda, Online Eğitim Sınav Sistemi için hazırlanan tüm Selenium UI test senaryoları detaylı olarak açıklanmaktadır. Toplamda **15 adet test senaryosu** bulunmaktadır.

---

## Senaryo 1: Kullanıcı Giriş Testi

### Senaryo 1.1: Geçerli Kullanıcı Girişi

**Test Sınıfı:** `UserLoginSeleniumTest.testValidUserLogin`  
**Önkoşul:** Uygulama çalışır durumda, frontend `http://localhost:5173` adresinde erişilebilir

**Adımlar:**
1. Ana sayfaya git (`http://localhost:5173`)
2. Sayfa yüklenmesini bekle
3. Giriş formu elementlerini kontrol et (username, password alanları)
4. Geçerli kullanıcı bilgileri gir (örn: `admin` / `123456`)
5. Giriş butonuna tıkla
6. Başarılı giriş sonrası yönlendirmeyi kontrol et

**Beklenen Sonuç:**
- Giriş formu görüntülenir
- Geçerli bilgilerle giriş başarılı olur
- Kullanıcı dashboard'una yönlendirilir

**Test Verileri:**
- Username: `admin`, `ogretmen`, `ogrenci`
- Password: `123456`

---

### Senaryo 1.2: Geçersiz Kullanıcı Girişi

**Test Sınıfı:** `UserLoginSeleniumTest.testInvalidUserLogin`  
**Önkoşul:** Uygulama çalışır durumda

**Adımlar:**
1. Ana sayfaya git
2. Geçersiz kullanıcı bilgileri gir (örn: `wrong@example.com` / `wrongpass`)
3. Giriş butonuna tıkla
4. Hata mesajının gösterilmesini kontrol et
5. Kullanıcının giriş sayfasında kaldığını doğrula

**Beklenen Sonuç:**
- Hata mesajı gösterilir
- Kullanıcı giriş sayfasında kalır
- Dashboard'a yönlendirilmez

---

## Senaryo 2: Sınav Oluşturma Testi

### Senaryo 2.1: Sınav Oluşturma Sayfasına Erişim

**Test Sınıfı:** `ExamCreationSeleniumTest.testExamCreationAccess`  
**Önkoşul:** Öğretmen olarak giriş yapılmış

**Adımlar:**
1. Öğretmen olarak giriş yap (`ogretmen` / `123456`)
2. Öğretmen dashboard'una git
3. "Sınav Oluştur" veya "Yeni Sınav" butonunu bul
4. Sınav oluşturma sayfasına git
5. Sınav formu elementlerini kontrol et (başlık, açıklama, süre alanları)

**Beklenen Sonuç:**
- Sınav oluşturma sayfasına erişilir
- Form elementleri görüntülenir
- Tüm gerekli alanlar mevcuttur

---

### Senaryo 2.2: Temel Sınav Oluşturma

**Test Sınıfı:** `ExamCreationSeleniumTest.testCreateBasicExam`  
**Önkoşul:** Sınav oluşturma sayfasına erişilmiş

**Adımlar:**
1. Sınav başlığı gir: "Test Sınavı - Selenium"
2. Sınav açıklaması gir: "Selenium ile oluşturulan test sınavı"
3. Süre ayarı gir: 60 dakika
4. "Kaydet" veya "Oluştur" butonuna tıkla
5. Başarı mesajını kontrol et

**Beklenen Sonuç:**
- Sınav başarıyla oluşturulur
- Başarı mesajı gösterilir
- Sınav listesine eklenir

---

### Senaryo 2.3: Sınav Ayarları Yapılandırma

**Test Sınıfı:** `ExamCreationSeleniumTest.testExamSettings`  
**Önkoşul:** Sınav oluşturma sayfasına erişilmiş

**Adımlar:**
1. Sınav ayarları bölümünü bul
2. Checkbox ayarlarını kontrol et
3. Dropdown menülerini kontrol et
4. Sayısal ayarları kontrol et (puan, soru sayısı vb.)

**Beklenen Sonuç:**
- Tüm ayar seçenekleri görüntülenir
- Ayarlar yapılandırılabilir

---

## Senaryo 3: Sınav Alma Testi

### Senaryo 3.1: Sınav Listesi Erişimi

**Test Sınıfı:** `ExamTakingSeleniumTest.testExamListAccess`  
**Önkoşul:** Öğrenci olarak giriş yapılmış

**Adımlar:**
1. Öğrenci olarak giriş yap (`ogrenci` / `123456`)
2. Öğrenci dashboard'una git
3. "Sınavlar" veya "Mevcut Sınavlar" bölümünü bul
4. Sınav listesinin görüntülendiğini kontrol et

**Beklenen Sonuç:**
- Öğrenci dashboard'u yüklenir
- Mevcut sınavlar listelenir
- Sınav bilgileri (başlık, süre, tarih) görüntülenir

---

### Senaryo 3.2: Sınav Başlatma Süreci

**Test Sınıfı:** `ExamTakingSeleniumTest.testExamStartProcess`  
**Önkoşul:** Sınav listesine erişilmiş

**Adımlar:**
1. Bir sınav seç
2. "Başla" veya "Sınavı Başlat" butonuna tıkla
3. Sınav sayfasının yüklendiğini kontrol et
4. Soruların görüntülendiğini kontrol et
5. Soru numarasını kontrol et

**Beklenen Sonuç:**
- Sınav başlatılır
- Sınav sayfası yüklenir
- İlk soru görüntülenir
- Soru navigasyon butonları mevcuttur

---

### Senaryo 3.3: Soru Navigasyonu

**Test Sınıfı:** `ExamTakingSeleniumTest.testExamQuestionNavigation`  
**Önkoşul:** Sınav başlatılmış

**Adımlar:**
1. İlk soruyu görüntüle
2. Bir cevap seç (radio button veya checkbox)
3. "Sonraki" butonuna tıkla
4. İkinci sorunun görüntülendiğini kontrol et
5. "Önceki" butonuna tıkla
6. İlk soruya geri dönüldüğünü kontrol et

**Beklenen Sonuç:**
- Sorular arasında navigasyon çalışır
- Seçilen cevaplar kaydedilir
- Soru numaraları doğru gösterilir

---

### Senaryo 3.4: Sınav Gönderme

**Test Sınıfı:** `ExamTakingSeleniumTest.testExamSubmission`  
**Önkoşul:** Sınav tamamlanmış

**Adımlar:**
1. Tüm soruları cevapla
2. "Gönder" veya "Bitir" butonuna tıkla
3. Onay mesajını kontrol et
4. Sonuç sayfasının yüklendiğini kontrol et
5. Puan ve sonuç bilgilerini kontrol et

**Beklenen Sonuç:**
- Sınav başarıyla gönderilir
- Sonuç sayfası görüntülenir
- Puan ve doğru/yanlış cevaplar gösterilir

---

## Senaryo 4: Admin Panel Testi

### Senaryo 4.1: Admin Dashboard Erişimi

**Test Sınıfı:** `AdminPanelSeleniumTest.testAdminDashboardAccess`  
**Önkoşul:** Admin olarak giriş yapılmış

**Adımlar:**
1. Admin olarak giriş yap (`admin` / `123456`)
2. Admin dashboard'una git
3. Admin panel elementlerini kontrol et (navigasyon menüsü, kullanıcı yönetimi, sınav yönetimi, raporlar)

**Beklenen Sonuç:**
- Admin dashboard yüklenir
- Tüm admin panel elementleri görüntülenir
- Navigasyon menüsü çalışır

---

### Senaryo 4.2: Kullanıcı Yönetimi

**Test Sınıfı:** `AdminPanelSeleniumTest.testUserManagement`  
**Önkoşul:** Admin dashboard'una erişilmiş

**Adımlar:**
1. "Kullanıcı Yönetimi" veya "Users" menüsüne git
2. Kullanıcı listesinin görüntülendiğini kontrol et
3. "Ekle" veya "Yeni Kullanıcı" butonunu bul
4. Kullanıcı ekleme formunun mevcut olduğunu kontrol et

**Beklenen Sonuç:**
- Kullanıcı listesi görüntülenir
- Kullanıcı ekleme seçeneği mevcuttur
- Kullanıcı bilgileri düzenlenebilir

---

### Senaryo 4.3: Sistem Ayarları

**Test Sınıfı:** `AdminPanelSeleniumTest.testSystemSettings`  
**Önkoşul:** Admin dashboard'una erişilmiş

**Adımlar:**
1. "Ayarlar" veya "Settings" menüsüne git
2. Sistem ayarları formunu bul
3. Ayarların görüntülendiğini kontrol et
4. Ayarların kaydedilebilir olduğunu kontrol et

**Beklenen Sonuç:**
- Sistem ayarları paneli erişilebilir
- Ayarlar formu görüntülenir
- Ayarlar kaydedilebilir

---

## Senaryo 5: Kullanıcı Profil Testi

**Test Sınıfı:** `UserProfileSeleniumTest`  
**Durum:** Hazırlanmış, Jenkins ortamında test edilmemiş

**Senaryolar:**
- Profil bilgilerini görüntüleme
- Profil bilgilerini güncelleme
- Şifre değiştirme
- Kişisel bilgi yönetimi

---

## Senaryo 6: Sonuç Görüntüleme Testi

**Test Sınıfı:** `ResultViewSeleniumTest`  
**Durum:** Hazırlanmış, Jenkins ortamında test edilmemiş

**Senaryolar:**
- Sınav sonuçlarını görüntüleme
- Detaylı rapor görüntüleme
- İstatistik kontrolleri
- Geçmiş sınav sonuçları

---

## Senaryo 7: Soru Yönetimi Testi

**Test Sınıfı:** `QuestionManagementSeleniumTest`  
**Durum:** Hazırlanmış, Jenkins ortamında test edilmemiş

**Senaryolar:**
- Soru ekleme
- Soru düzenleme
- Toplu soru yükleme
- Kategori yönetimi

---

## Senaryo 8: Rapor Görüntüleme Testi

**Test Sınıfı:** `ReportViewSeleniumTest`  
**Durum:** Hazırlanmış, Jenkins ortamında test edilmemiş

**Senaryolar:**
- Detaylı raporlar görüntüleme
- Excel export işlemi
- Grafik görüntüleme
- İstatistiksel analizler

---

## Senaryo 9: Dosya Yükleme Testi

**Test Sınıfı:** `FileUploadSeleniumTest`  
**Durum:** Hazırlanmış, Jenkins ortamında test edilmemiş

**Senaryolar:**
- Soru dosyası yükleme
- Kaynak doküman yükleme
- Dosya validasyonu
- Dosya format kontrolü

---

## Senaryo 10: Performans Testi

**Test Sınıfı:** `PerformanceSeleniumTest`  
**Durum:** Hazırlanmış, Jenkins ortamında test edilmemiş

**Senaryolar:**
- Sayfa yükleme süreleri
- Çoklu kullanıcı testi
- Database performansı
- API response time

---

## Test Verileri

### Kullanıcı Hesapları

| Rol | Username | Password | Açıklama |
|-----|----------|----------|----------|
| Admin | `admin` | `123456` | Sistem yöneticisi |
| Öğretmen | `ogretmen` | `123456` | Sınav oluşturma yetkisi |
| Öğrenci | `ogrenci` | `123456` | Sınav alma yetkisi |

### Test URL'leri

- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:8081`
- **Health Check:** `http://localhost:8081/actuator/health`

---

## Test Ortamı Gereksinimleri

- **Java:** 17+
- **Maven:** 3.6+
- **Chrome Browser:** Son sürüm
- **ChromeDriver:** WebDriverManager ile otomatik indirilir
- **Selenium WebDriver:** 4.31.0+
- **JUnit:** 5.x

---

## Test Çalıştırma

### Yerel Ortamda

```bash
# Tüm Selenium testlerini çalıştır
./mvnw failsafe:integration-test failsafe:verify -Dit.test=**/*Selenium*

# Belirli bir test sınıfını çalıştır
./mvnw failsafe:integration-test -Dit.test=UserLoginSeleniumTest
```

### Jenkins Pipeline'da

Testler otomatik olarak `6 - Selenium UI Test Senaryoları` stage'inde çalıştırılır.

---

## Sonuç

Toplamda **15 adet test senaryosu** hazırlanmış ve Jenkins pipeline'ında çalıştırılmıştır. Testler projenin gerçek frontend component'lerini kullanarak gerçek kullanıcı senaryolarını simüle etmektedir.
