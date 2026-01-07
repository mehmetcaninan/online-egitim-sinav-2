# Jenkins Agent Handshake Error Çözümü

## Sorun: "Handshake error" ve "Did not receive X-Remoting-Capability header"

Bu hata genellikle şu nedenlerden kaynaklanır:
1. Secret değeri yanlış veya eski
2. Node adı yanlış
3. WebSocket bağlantısı sorunlu
4. Jenkins node konfigürasyonu yanlış

## Çözüm Adımları

### 1. Jenkins'te Secret'ı Yeniden Al

1. **Jenkins Web UI** → `Manage Nodes and Clouds` → `Mac-agent` node'una git
2. Node sayfasında **"Run from agent command line"** bölümünü bul
3. **Yeni secret değerini kopyala** (eski secret geçersiz olabilir)
4. **Tam komutu kopyala** (secret dahil)

### 2. WebSocket Olmadan Dene

WebSocket bazen sorun çıkarabilir. Önce WebSocket olmadan dene:

```bash
cd ~/jenkins-agent
java -jar agent.jar -url http://localhost:8080/ -secret YENİ_SECRET -name "Mac-agent" -workDir "/Users/mehmetcaninan/jenkins-agent"
```

### 3. Node Konfigürasyonunu Kontrol Et

Jenkins'te node sayfasında:
- **Launch method:** `Launch agent by connecting it to the controller` olmalı
- **Node name:** Tam olarak `Mac-agent` olmalı (büyük/küçük harf duyarlı)
- **Secret:** Node sayfasındaki secret ile terminaldeki secret aynı olmalı

### 4. Jenkins Versiyonunu Kontrol Et

Eski Jenkins versiyonları WebSocket'i desteklemeyebilir. WebSocket olmadan dene.

### 5. Alternatif: JNLP URL Kullan

Eğer yeni yöntem çalışmazsa, eski JNLP yöntemini dene:

```bash
cd ~/jenkins-agent
java -jar agent.jar -jnlpUrl http://localhost:8080/computer/Mac-agent/slave-agent.jnlp -secret YENİ_SECRET -workDir "/Users/mehmetcaninan/jenkins-agent"
```

**Not:** Node adı `Mac-agent` ise URL'de de aynı olmalı (büyük M).

### 6. Jenkins Log'larını Kontrol Et

Jenkins'te:
- `Manage Jenkins` → `System Log`
- Hata mesajlarını kontrol et

### 7. Node'u Silip Yeniden Oluştur

Eğer hiçbiri çalışmazsa:
1. Node'u sil
2. Yeni node oluştur
3. Yeni secret al
4. Tekrar dene
