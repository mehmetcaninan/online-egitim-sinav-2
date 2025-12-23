FROM openjdk:17-jdk-slim

LABEL maintainer="Online Eğitim Sınav Sistemi"

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
