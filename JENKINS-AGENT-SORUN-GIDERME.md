# Jenkins Agent Bağlantı Sorun Giderme

## Sorun: 404 Not Found Hatası

Bu hata, Jenkins'te `mac-agent` node'unun bulunamadığı anlamına gelir.

## Çözüm Adımları

### 1. Jenkins'te Node'un Var Olduğunu Kontrol Et

1. **Jenkins Web UI'a git:** `http://localhost:8080`
2. **Manage Jenkins** → **Manage Nodes and Clouds**
3. **`mac-agent` node'unun listede olduğunu kontrol et**

**Eğer node yoksa:**
- "New Node" butonuna tıkla
- Node name: `mac-agent`
- Type: `Permanent Agent`
- Create

### 2. Node Konfigürasyonunu Kontrol Et

Node sayfasında:
- **Name:** `mac-agent` olmalı
- **Remote root directory:** `/Users/mehmetcaninan/jenkins-agent`
- **Labels:** `mac chrome`
- **Launch method:** `Launch agent by connecting it to the controller`

### 3. Doğru Komutu Kullan

Jenkins node sayfasında **tam komutu** göreceksin. O komutu kopyalayıp kullan.

**Yeni Jenkins versiyonları için (önerilen):**
```bash
java -jar agent.jar -url http://localhost:8080 -name mac-agent -secret [SECRET] -workDir ~/jenkins-agent
```

**Eski yöntem (hala çalışır):**
```bash
java -jar agent.jar -jnlpUrl http://localhost:8080/computer/mac-agent/slave-agent.jnlp -secret [SECRET] -workDir ~/jenkins-agent
```

### 4. Node Adını Kontrol Et

Eğer node adı `mac-agent` değilse, komuttaki node adını değiştir:
- Node adı `macbook-agent` ise → URL'de `mac-agent` yerine `macbook-agent` kullan

### 5. Jenkins URL'ini Kontrol Et

Eğer Jenkins farklı bir portta çalışıyorsa:
- `http://localhost:8080` yerine doğru URL'i kullan
- Örnek: `http://localhost:8081` veya `http://jenkins-server:8080`

## Alternatif: SSH ile Bağlanma

Eğer JNLP bağlantısı çalışmıyorsa, SSH ile bağlanmayı dene:

1. **Node konfigürasyonunda:**
   - Launch method: `Launch agent via SSH` seç
   - Host: `localhost` (veya Mac'in IP adresi)
   - Credentials: SSH key ekle
   - Save

2. **SSH key oluştur (eğer yoksa):**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "jenkins@mac"
   ```

3. **Public key'i authorized_keys'e ekle:**
   ```bash
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   ```

## Hızlı Test

Node'un var olup olmadığını test et:
```bash
curl http://localhost:8080/computer/mac-agent/
```

Eğer 200 OK dönerse → Node var
Eğer 404 dönerse → Node yok, oluşturman gerekiyor
