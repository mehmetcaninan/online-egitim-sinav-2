FROM openjdk:17-jdk-slim

LABEL maintainer="Online Eğitim Sınav Sistemi"

# CI ve Selenium için gerekli paketleri kur
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    xvfb \
    gnupg \
    software-properties-common \
    ca-certificates \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Google Chrome kurulumu
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# ChromeDriver'ı kur (Selenium için)
RUN CHROME_VERSION=$(google-chrome --version | cut -d " " -f3 | cut -d "." -f1) \
    && CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION}") \
    && wget -O /tmp/chromedriver.zip "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip" \
    && unzip /tmp/chromedriver.zip -d /tmp/ \
    && mv /tmp/chromedriver /usr/local/bin/ \
    && chmod +x /usr/local/bin/chromedriver \
    && rm /tmp/chromedriver.zip

# Çalışma dizinini ayarla
WORKDIR /app

# Maven wrapper ve pom.xml dosyalarını kopyala
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Dependency'leri önceden indir (cache için)
RUN ./mvnw dependency:go-offline -B

# Kaynak kodları kopyala
COPY src src

# Uygulamayı build et
RUN ./mvnw clean package -DskipTests

# JAR dosyasını kopyala
RUN cp target/*.jar app.jar

# Port'u aç (test ortamı için 8081)
EXPOSE 8081

# Uygulamayı başlat
ENTRYPOINT ["java", "-jar", "/app/app.jar", "--server.port=8081"]
