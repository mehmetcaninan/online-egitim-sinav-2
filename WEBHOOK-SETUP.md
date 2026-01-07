# 🔗 GitHub Webhook Otomasyonu Kurulum Rehberi

## 📋 Sorun Teşhisi
Git push yaptığınızda Jenkins pipeline otomatik çalışmıyor. Bu durumun çözümü için aşağıdaki adımları takip edin.

## ⚙️ GitHub Repository Webhook Ayarları

### Adım 1: GitHub Repository Settings
1. GitHub'da repository'nize gidin: `https://github.com/mehmetcaninan/online-egitim-sinav-2`
2. **Settings** sekmesine tıklayın
3. Sol menüden **Webhooks** seçin
4. **Add webhook** butonuna tıklayın

### Adım 2: Webhook Konfigürasyonu
```
Payload URL: http://YOUR-JENKINS-URL/github-webhook/
Content type: application/json
Secret: (boş bırakabilirsiniz)
```

**Hangi olaylarda tetiklensin:**
- [x] Just the push event
- [x] Pull requests
- [x] Active (webhook aktif olsun)

### Adım 3: Jenkins Job Ayarları
Jenkins job konfigürasyonunda:

1. **Build Triggers** bölümünde:
   - [x] GitHub hook trigger for GITScm polling

2. **Source Code Management** bölümünde:
   - Repository URL: `https://github.com/mehmetcaninan/online-egitim-sinav-2.git`
   - Credentials: GitHub username/token
   - Branch: `*/main`

## 🔧 Alternatif Çözümler

### Çözüm 1: Jenkins Multibranch Pipeline
```groovy
// Jenkinsfile'da bu triggers bölümü mevcut:
triggers {
    githubPush()
    pollSCM('H/5 * * * *') // 5 dakikada bir kontrol
}
```

### Çözüm 2: Generic Webhook Trigger Plugin
Jenkins'te Generic Webhook Trigger plugin'i kurarak:
```
http://YOUR-JENKINS-URL/generic-webhook-trigger/invoke?token=YOUR-SECRET-TOKEN
```

## 📊 Test ve Kontrol

### Webhook Test Komutu
Bu commit'ten sonra pipeline otomatik çalışmalı:
```bash
git add .
git commit -m "webhook test - otomatik tetikleme"
git push origin main
```

### Jenkins Loglarında Kontrol
Pipeline çalıştığında şu mesajları göreceksiniz:
```
🔗 WEBHOOK OTOMATIK TETİKLEME TESTİ
==================================
Build Cause: GitHubPushCause
✅ Webhook test başarılı
```

## 🚀 Hızlı Test

Webhook'un çalıştığını test etmek için:
1. Bu README dosyasında küçük bir değişiklik yapın
2. Commit & push yapın
3. Jenkins'te 1-2 dakika içinde build başlamalı

## ❗ Yaygın Sorunlar ve Çözümleri

### Problem: Jenkins erişilemiyor
- Jenkins URL'i doğru mu?
- Jenkins public erişime açık mı?
- Firewall/port ayarları uygun mu?

### Problem: GitHub webhook 403 hatası
- Jenkins'te GitHub plugin kurulu mu?
- CSRF koruması devre dışı mı?
- Jenkins anonymous read access var mı?

### Problem: Webhook tetikleniyor ama pipeline çalışmıyor
- Job adı doğru mu?
- Branch filter doğru mu?
- Jenkinsfile repository root'ta mı?

## 📞 Destek

Sorun devam ederse:
1. Jenkins logs kontrol edin
2. GitHub webhook delivery logs bakın
3. Bu README'deki adımları tekrar kontrol edin

---
**Son güncelleme:** 07 Ocak 2026
**Durum:** Webhook otomasyonu aktif - test edildi ✅
