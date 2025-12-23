# Online Eğitim Sınav Sistemi - CI/CD Pipeline

Bu proje Jenkins kullanarak otomatik CI/CD pipeline'ına sahiptir. Kod üzerinde yapılan her değişiklik otomatik olarak test edilir ve deploy edilir.

## CI/CD Pipeline Aşamaları

### 1. GitHub'dan Kod Çekme
- Jenkins, GitHub repository'den en son kodları çeker
- Webhook ile otomatik tetiklenir
- Jenkinsfile stage: **`1 - Checkout (GitHub)`** (5 puan)

### 2. Build İşlemi
- Maven ile proje derlenir
- Dependency'ler indirilir
- JAR dosyası oluşturulur
- Jenkinsfile stage: **`2 - Build`** (5 puan)

### 3. Birim Testleri
- JUnit ve Spring Boot testleri çalıştırılır
- Test sonuçları raporlanır
- Code coverage analizi yapılır
- `src/test/java/.../unit/ApplicationUnitTest.java` ve diğer `*Test.java` sınıfları
- Jenkinsfile stage: **`3 - Unit Tests`** (15 puan)

### 4. Entegrasyon Testleri
- Spring Boot integration testleri
- Database bağlantı testleri
- API endpoint testleri
- `src/test/java/.../integration/ApplicationIntegrationTest.java` entegrasyon testi
- Maven Failsafe plugin ile çalışır (`maven-failsafe-plugin`)
- Jenkinsfile stage: **`4 - Integration Tests`** (15 puan)

### 5. Docker Container Oluşturma
- Docker image build edilir
- Container olarak çalıştırılır
- Sağlık kontrolü yapılır
- `Dockerfile` ve `docker-compose.yml` kullanılır
- Uygulama (`app`) ve PostgreSQL veritabanı (`db`) Docker container'larında ayağa kalkar
- Jenkinsfile stage: **`5 - Docker Containers`** (5 puan)

### 6. Selenium Test Senaryoları

#### 6A. Kullanıcı Giriş Testi
- Geçerli/geçersiz kullanıcı girişi
- Session yönetimi
- Güvenlik kontrolleri
  - `UserLoginSeleniumTest`

#### 6B. Sınav Oluşturma Testi
- Admin paneli erişimi
- Sınav formu doldurma
- Validation kontrolleri
  - `ExamCreationSeleniumTest`

#### 6C. Sınav Alma Testi
- Öğrenci sınav alma süreci
- Soru gezinme
- Zaman yönetimi
  - `ExamTakingSeleniumTest`

#### 6D. Sonuç Görüntüleme Testi
- Sınav sonuçları sayfası
- Rapor görüntüleme
- İstatistik kontrolleri
  - `ResultViewSeleniumTest`

#### 6E. Kullanıcı Profil Testi
- Profil güncelleme
- Şifre değiştirme
- Kişisel bilgi yönetimi
  - `UserProfileSeleniumTest`

#### 6F. Admin Panel Testi
- Admin dashboard
- Kullanıcı yönetimi
- Sistem ayarları
  - `AdminPanelSeleniumTest`

#### 6G. Soru Yönetimi Testi
- Soru ekleme/düzenleme
- Toplu soru yükleme
- Kategori yönetimi
  - `QuestionManagementSeleniumTest`

#### 6H. Rapor Görüntüleme Testi
- Detaylı raporlar
- Excel export
- Grafik görüntüleme
  - `ReportViewSeleniumTest`

#### 6I. Dosya Yükleme Testi
- Soru dosyası yükleme
- Kaynak doküman yükleme
- Dosya validasyonu
  - `FileUploadSeleniumTest`

#### 6J. Performans Testi
- Sayfa yükleme süreleri
- Çoklu kullanıcı testi
- Database performansı
  - `PerformanceSeleniumTest`

Toplamda **10 adet Selenium test senaryosu** bulunmaktadır. Jenkins pipeline'ında bu senaryolar:
- Önce backend ve (varsa) frontend ayakta iken Docker container'ları üzerinden sistem çalışır duruma getirilir
- Ardından **`6 - Selenium UI Test Senaryoları`** stage'i ile topluca çalıştırılır (55 + ek senaryolar için bonus puan).

## Kurulum ve Kullanım

### Gereksinimler
- Java 17+
- Maven 3.6+
- Docker
- Jenkins
- Chrome Browser (Selenium için)

### Jenkins Kurulumu

1. **Jenkins Plugin'leri:**
   ```
   - Git Plugin
   - Maven Integration Plugin
   - Docker Plugin
   - TestNG Results Plugin
   - JUnit Plugin
   - HTML Publisher Plugin
   ```

2. **Jenkins Job Oluşturma:**
   ```bash
   # Pipeline job oluşturun
   # Pipeline script from SCM seçin
   # Repository URL'i girin
   # Jenkinsfile path'i belirtin
   ```

3. **Jenkins Konfigürasyonu:**
   ```groovy
   // Jenkinsfile içeriği zaten hazır
   // Global tool configuration'da Maven ve JDK ayarlayın
   ```

### Yerel Çalıştırma

```bash
# Proje build et
./mvnw clean compile

# Birim testleri çalıştır
./mvnw test

# Entegrasyon testleri çalıştır
./mvnw verify

# Selenium testleri çalıştır
./mvnw test -Dtest=*SeleniumTest

# Docker ile çalıştır
docker-compose up -d

# Tüm pipeline'ı simüle et
./scripts/jenkins-helper.sh full-cleanup
./mvnw clean package
./scripts/jenkins-helper.sh start-selenium
./mvnw test -Dtest=*SeleniumTest
./scripts/jenkins-helper.sh stop-selenium
```

### Test Raporları

Test raporları şu dizinlerde oluşturulur:
- `target/surefire-reports/` - Birim testleri
- `target/failsafe-reports/` - Entegrasyon testleri
- `target/selenium-reports/` - Selenium testleri
- `target/combined-reports/` - Birleştirilmiş raporlar

### Docker Compose Kullanımı

```bash
# Tüm servisleri başlat
docker-compose up -d

# Sadece uygulama
docker-compose up app

# Selenium Grid ile
docker-compose up selenium-hub selenium-chrome

# Temizlik
docker-compose down
```

### Troubleshooting

#### Jenkins Pipeline Hataları
```bash
# Log'ları kontrol et
docker logs jenkins

# Workspace temizle
./scripts/jenkins-helper.sh full-cleanup
```

#### Selenium Test Hataları
```bash
# Chrome driver güncelle
./mvnw dependency:purge-local-repository
./mvnw clean test

# Selenium Grid durumunu kontrol et
curl http://localhost:4444/wd/hub/status
```

#### Docker Hataları
```bash
# Container'ları kontrol et
docker ps -a

# Image'ları temizle
docker system prune -f
```

## Performans Metrikleri

Pipeline her çalıştırıldığında şu metrikleri takip eder:
- Build süresi
- Test execution süresi
- Code coverage yüzdesi
- Test başarı oranı
- Deploy süresi

### SLA Hedefleri
- Build süresi: < 5 dakika
- Test execution: < 10 dakika
- Total pipeline: < 20 dakika
- Test success rate: > %95

## Güvenlik

- Hassas bilgiler environment variable olarak yönetilir
- Docker container'lar non-root user ile çalışır
- Database bağlantıları şifrelenmiş
- API endpoint'leri authentication gerektiriyor

## Monitoring

Jenkins dashboard'da şu bilgiler izlenir:
- Build başarı/başarısızlık oranları
- Test trend analizi
- Performance metrikleri
- Error log analizi

## Katkıda Bulunma

1. Feature branch oluşturun
2. Testlerinizi yazın
3. Pull request açın
4. CI/CD pipeline'ın başarıyla tamamlanmasını bekleyin

## İletişim

Sorularınız için lütfen development team ile iletişime geçin.
