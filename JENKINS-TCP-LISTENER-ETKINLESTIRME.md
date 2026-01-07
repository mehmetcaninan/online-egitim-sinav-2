# Jenkins TCP Slave Agent Listener Etkinleştirme

## Sorun: "tcpSlaveAgentListener/ is invalid: 404 Not Found"

Bu hata, Jenkins'te TCP Slave Agent Listener'ın aktif olmadığı anlamına gelir.

## Çözüm: TCP Port'u Etkinleştir

### Adım 1: Jenkins Güvenlik Ayarları

1. **Jenkins Web UI** → `Manage Jenkins` → `Configure Global Security`

2. **"Agents"** bölümünü bul

3. **"TCP port for inbound agents"** seçeneğini bul:
   - **"Random"** seç (veya belirli bir port numarası gir, örn: `50000`)
   - VEYA **"Fixed"** seç ve port numarası gir (örn: `50000`)

4. **"Save"** butonuna tıkla

### Adım 2: JNLP Yöntemini Kullan (Önerilen)

TCP port sorunları yaşıyorsan, JNLP yöntemi daha güvenilirdir:

```bash
cd ~/jenkins-agent
java -jar agent.jar -jnlpUrl http://localhost:8080/computer/Mac-agent/slave-agent.jnlp -secret c816e8298ee9ff8ad5ca4eb88423a74dd9520ce573d53466e1aced6218b5858e -workDir "/Users/mehmetcaninan/jenkins-agent"
```

**Not:** Node adı `Mac-agent` ise URL'de de aynı olmalı.

### Adım 3: Jenkins'ten Tam Komutu Kopyala

En güvenilir yöntem:

1. Jenkins → `Manage Nodes and Clouds` → `Mac-agent`
2. Node sayfasında **"Run from agent command line"** bölümünü bul
3. **Tam komutu kopyala** (JNLP veya TCP, hangisi gösteriliyorsa)
4. Terminalde çalıştır

## Alternatif: SSH ile Bağlanma

Eğer TCP ve JNLP çalışmazsa, SSH kullan:

1. **Node konfigürasyonunda:**
   - Launch method: `Launch agent via SSH` seç
   - Host: `localhost`
   - Credentials: SSH key ekle
   - Save

2. **SSH key oluştur (eğer yoksa):**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "jenkins@mac"
   ```

3. **Public key'i authorized_keys'e ekle:**
   ```bash
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

4. **Jenkins'te SSH credentials ekle:**
   - `Manage Jenkins` → `Manage Credentials`
   - SSH key'i ekle
   - Node konfigürasyonunda kullan
