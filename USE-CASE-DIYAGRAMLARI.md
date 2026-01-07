# Online Eğitim Sınav Sistemi - Use Case Diyagramları

## 1. Sistem Genel Bakış Use Case Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│              Online Eğitim Sınav Sistemi                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                       │
        ▼                     ▼                       ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│   Admin      │    │  Öğretmen    │      │   Öğrenci    │
└──────────────┘    └──────────────┘      └──────────────┘
        │                     │                       │
        │                     │                       │
        ▼                     ▼                       ▼
```

## 2. Kullanıcı Giriş Use Case Diyagramı

```
                    ┌─────────────────────┐
                    │   Giriş Yapma       │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Geçerli      │    │ Geçersiz    │    │ Kayıt        │
│ Giriş        │    │ Giriş       │    │ Olma         │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐
│ Dashboard'a  │
│ Yönlendirme  │
└──────────────┘
```

**Aktörler:**
- Admin
- Öğretmen
- Öğrenci

**Use Case'ler:**
1. **Giriş Yapma**
   - Geçerli kullanıcı bilgileri ile giriş
   - Geçersiz kullanıcı bilgileri ile giriş denemesi
   - Kayıt olma

**İlişkiler:**
- Admin, Öğretmen ve Öğrenci → Giriş Yapma (include)
- Geçerli Giriş → Dashboard'a Yönlendirme (extend)

---

## 3. Sınav Oluşturma Use Case Diyagramı

```
                    ┌─────────────────────┐
                    │   Öğretmen          │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Sınav Oluşturma     │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Sınav        │    │ Soru         │    │ Sınav       │
│ Bilgileri    │    │ Ekleme       │    │ Ayarları    │
│ Girme        │    │              │    │ Yapma       │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │ Sınav Kaydetme     │
                    └─────────────────────┘
```

**Aktör:** Öğretmen

**Use Case'ler:**
1. **Sınav Oluşturma**
   - Sınav bilgileri girme (başlık, açıklama, süre)
   - Soru ekleme
   - Sınav ayarları yapma
   - Sınav kaydetme

**İlişkiler:**
- Sınav Bilgileri Girme → Sınav Oluşturma (include)
- Soru Ekleme → Sınav Oluşturma (include)
- Sınav Ayarları Yapma → Sınav Oluşturma (include)
- Sınav Oluşturma → Sınav Kaydetme (extend)

---

## 4. Sınav Alma Use Case Diyagramı

```
                    ┌─────────────────────┐
                    │   Öğrenci           │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Sınav Alma         │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Sınav        │    │ Soru         │    │ Cevap        │
│ Listesi      │    │ Navigasyonu  │    │ Seçme        │
│ Görüntüleme  │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │ Sınav Gönderme     │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Sonuç Görüntüleme  │
                    └─────────────────────┘
```

**Aktör:** Öğrenci

**Use Case'ler:**
1. **Sınav Alma**
   - Sınav listesi görüntüleme
   - Sınav başlatma
   - Soru navigasyonu (ileri/geri)
   - Cevap seçme
   - Sınav gönderme
   - Sonuç görüntüleme

**İlişkiler:**
- Sınav Listesi Görüntüleme → Sınav Alma (include)
- Soru Navigasyonu → Sınav Alma (include)
- Cevap Seçme → Sınav Alma (include)
- Sınav Alma → Sınav Gönderme (extend)
- Sınav Gönderme → Sonuç Görüntüleme (extend)

---

## 5. Admin Panel Use Case Diyagramı

```
                    ┌─────────────────────┐
                    │   Admin             │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Admin Panel        │
                    │ Yönetimi          │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Kullanıcı    │    │ Sınav        │    │ Sistem       │
│ Yönetimi     │    │ Yönetimi     │    │ Ayarları     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Kullanıcı    │    │ Sınav        │    │ Ayarları     │
│ Ekleme/      │    │ Listeleme/   │    │ Güncelleme   │
│ Düzenleme    │    │ Silme        │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

**Aktör:** Admin

**Use Case'ler:**
1. **Admin Panel Yönetimi**
   - Kullanıcı yönetimi (ekleme, düzenleme, silme)
   - Sınav yönetimi (listeleme, silme)
   - Sistem ayarları (güncelleme)

**İlişkiler:**
- Kullanıcı Yönetimi → Admin Panel Yönetimi (include)
- Sınav Yönetimi → Admin Panel Yönetimi (include)
- Sistem Ayarları → Admin Panel Yönetimi (include)

---

## 6. Detaylı Use Case Açıklamaları

### UC-01: Kullanıcı Girişi

**Aktör:** Admin, Öğretmen, Öğrenci  
**Önkoşul:** Kullanıcı kayıtlı olmalı  
**Ana Akış:**
1. Kullanıcı ana sayfaya gider
2. Sistem giriş formunu gösterir
3. Kullanıcı username ve password girer
4. Sistem bilgileri doğrular
5. Sistem kullanıcıyı rolüne göre dashboard'a yönlendirir

**Alternatif Akış:**
- 4a. Geçersiz bilgiler: Sistem hata mesajı gösterir, kullanıcı giriş sayfasında kalır

---

### UC-02: Sınav Oluşturma

**Aktör:** Öğretmen  
**Önkoşul:** Öğretmen olarak giriş yapılmış olmalı  
**Ana Akış:**
1. Öğretmen "Sınav Oluştur" butonuna tıklar
2. Sistem sınav oluşturma formunu gösterir
3. Öğretmen sınav bilgilerini girer (başlık, açıklama, süre)
4. Öğretmen soruları ekler
5. Öğretmen sınav ayarlarını yapar
6. Öğretmen "Kaydet" butonuna tıklar
7. Sistem sınavı kaydeder ve başarı mesajı gösterir

**Alternatif Akış:**
- 3a. Eksik bilgi: Sistem validasyon hatası gösterir
- 6a. Kaydetme hatası: Sistem hata mesajı gösterir

---

### UC-03: Sınav Alma

**Aktör:** Öğrenci  
**Önkoşul:** Öğrenci olarak giriş yapılmış ve aktif bir sınav olmalı  
**Ana Akış:**
1. Öğrenci "Sınavlar" bölümüne gider
2. Sistem mevcut sınavları listeler
3. Öğrenci bir sınav seçer ve "Başla" butonuna tıklar
4. Sistem sınav sayfasını gösterir
5. Öğrenci soruları cevaplar
6. Öğrenci "Gönder" butonuna tıklar
7. Sistem sınavı değerlendirir ve sonuçları gösterir

**Alternatif Akış:**
- 3a. Sınav süresi dolmuş: Sistem hata mesajı gösterir
- 5a. Süre doldu: Sistem sınavı otomatik gönderir

---

### UC-04: Admin Panel Yönetimi

**Aktör:** Admin  
**Önkoşul:** Admin olarak giriş yapılmış olmalı  
**Ana Akış:**
1. Admin admin panel'e gider
2. Sistem admin dashboard'unu gösterir
3. Admin bir yönetim modülü seçer (Kullanıcı/Sınav/Ayarlar)
4. Sistem ilgili yönetim sayfasını gösterir
5. Admin işlemleri gerçekleştirir (ekleme/düzenleme/silme)
6. Sistem değişiklikleri kaydeder

**Alternatif Akış:**
- 5a. Geçersiz işlem: Sistem hata mesajı gösterir

---

## 7. Use Case İlişki Matrisi

| Use Case | Aktör | İlişki Tipi | Bağlı Use Case |
|----------|-------|-------------|----------------|
| Kullanıcı Girişi | Admin, Öğretmen, Öğrenci | Include | Dashboard Yönlendirme |
| Sınav Oluşturma | Öğretmen | Include | Soru Ekleme, Sınav Ayarları |
| Sınav Oluşturma | Öğretmen | Extend | Sınav Kaydetme |
| Sınav Alma | Öğrenci | Include | Soru Navigasyonu, Cevap Seçme |
| Sınav Alma | Öğrenci | Extend | Sınav Gönderme, Sonuç Görüntüleme |
| Admin Panel | Admin | Include | Kullanıcı Yönetimi, Sınav Yönetimi |

---

## 8. Use Case Öncelikleri

| Use Case | Öncelik | Karmaşıklık |
|----------|---------|-------------|
| Kullanıcı Girişi | Yüksek | Düşük |
| Sınav Oluşturma | Yüksek | Orta |
| Sınav Alma | Yüksek | Yüksek |
| Admin Panel | Orta | Orta |
| Sonuç Görüntüleme | Orta | Düşük |

---

**Not:** Bu use case diyagramları, sistemin temel işlevlerini ve aktörler arasındaki ilişkileri göstermektedir. Her use case, ilgili test senaryoları ile doğrulanmıştır.
