FROM eclipse-temurin:17-jdk

LABEL maintainer="Online Eğitim Sınav Sistemi"

# Platform bağımsız paketleri kur
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

# Chromium (platform bağımsız) kurulumu
RUN apt-get update && apt-get install -y \
    chromium-browser \
    chromium-chromedriver \
    && rm -rf /var/lib/apt/lists/*

# Chrome/Chromium environment variables
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Çalışma dizinini ayarla
WORKDIR /app

# Maven wrapper ve pom.xml dosyalarını kopyala
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Maven wrapper'ı çalıştırılabilir yap
RUN chmod +x ./mvnw

# Dependency'leri önceden indir (cache için)
RUN ./mvnw dependency:go-offline -B

# Kaynak kodları kopyala
COPY src src

# Spring Boot executable JAR oluştur - frontend build işlemi kaldırıldı
RUN ./mvnw clean package -DskipTests -Dspring-boot.repackage.skip=false

# JAR dosyasını gerçek adıyla kopyala
RUN cp target/online_egitim_sinav_kod-0.0.1-SNAPSHOT.jar online_egitim_sinav_kod-0.0.1-SNAPSHOT.jar

# Port'u aç (test ortamı için 8081)
EXPOSE 8081

# Uygulamayı başlat - Docker profili ile
ENTRYPOINT ["java", "-jar", "/app/online_egitim_sinav_kod-0.0.1-SNAPSHOT.jar", "--spring.profiles.active=docker", "--server.port=8081"]
