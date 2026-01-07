# Jenkins Mac Agent Kurulum Rehberi

## Adım 1: Jenkins'te Mac Agent Node Oluşturma

1. **Jenkins Web UI'a git** (genellikle `http://localhost:8080` veya Jenkins sunucunun adresi)

2. **Manage Jenkins** → **Manage Nodes and Clouds** → **New Node**

3. **Node bilgilerini gir:**
   - **Node name:** `mac-agent` (veya istediğin isim)
   - **Type:** `Permanent Agent` seç
   - **Create** butonuna tıkla

4. **Node konfigürasyonu:**
   - **Remote root directory:** `/Users/mehmetcaninan/jenkins-agent` (veya istediğin bir dizin)
   - **Labels:** `mac chrome` (önemli! Jenkinsfile'da bu label'ı kullanacağız)
   - **Usage:** `Only build jobs with label expressions matching this node`
   - **Launch method:** `Launch agent by connecting it to the controller`
   - **Save** butonuna tıkla

5. **Agent bağlantı bilgilerini al:**
   - Yeni oluşturduğun node'a tıkla
   - Sayfada bir komut göreceksin, örneğin:
     ```
     java -jar agent.jar -jnlpUrl http://jenkins-url/computer/mac-agent/slave-agent.jnlp -secret [SECRET] -workDir /Users/mehmetcaninan/jenkins-agent
     ```

## Adım 2: Mac'te Agent'ı Başlatma

1. **Terminal'de agent dizinini oluştur:**
   ```bash
   mkdir -p ~/jenkins-agent
   cd ~/jenkins-agent
   ```

2. **Agent JAR dosyasını indir:**
   - Jenkins node sayfasındaki komuttan `-jnlpUrl` ve `-secret` değerlerini kopyala
   - Veya Jenkins'ten agent.jar dosyasını manuel indir:
     ```bash
     curl -O http://jenkins-url/jnlpJars/agent.jar
     ```

3. **Agent'ı başlat:**
   ```bash
   java -jar agent.jar -jnlpUrl http://jenkins-url/computer/mac-agent/slave-agent.jnlp -secret [SECRET] -workDir /Users/mehmetcaninan/jenkins-agent
   ```
   
   **Not:** `[SECRET]` yerine Jenkins'ten aldığın gerçek secret değerini kullan.

4. **Agent bağlantısını kontrol et:**
   - Jenkins'te node sayfasına git
   - Status'un "Connected" olduğunu gör

## Adım 3: Jenkinsfile'ı Güncelleme

Jenkinsfile'ı Mac agent'ı kullanacak şekilde güncelledim. Artık pipeline Mac'te çalışacak ve Chrome mevcut olacak.

## Adım 4: Pipeline'ı Çalıştırma

1. Jenkins'te pipeline job'ını çalıştır
2. Pipeline Mac agent'ında çalışacak
3. Selenium testleri gerçek Chrome ile çalışacak

## Sorun Giderme

### Agent bağlanmıyor:
- Java'nın kurulu olduğundan emin ol: `java -version`
- Jenkins URL'inin doğru olduğundan emin ol
- Firewall ayarlarını kontrol et

### Chrome bulunamıyor:
- Chrome'un kurulu olduğunu kontrol et: `ls /Applications/Google\ Chrome.app`
- PATH'e ekle: `export PATH="/Applications/Google Chrome.app/Contents/MacOS:$PATH"`

### Maven bulunamıyor:
- Maven'in kurulu olduğunu kontrol et: `mvn -version`
- PATH'e ekle: `export PATH="/opt/homebrew/bin:$PATH"`
