#!/bin/bash

echo "🔧 Local Jenkins Ortamı Kurulum Scripti (Frontend + Backend)"
echo "=========================================================="

# macOS kontrolü
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Bu script macOS için hazırlanmıştır"
    exit 1
fi

echo "📋 Gerekli yazılımlar kontrol ediliyor..."

# Docker Desktop kontrolü
if ! docker --version >/dev/null 2>&1; then
    echo "❌ Docker Desktop bulunamadı!"
    echo "🔗 Lütfen Docker Desktop'ı kurun: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "✅ Docker Desktop: $(docker --version)"

# Homebrew kontrolü
if ! command -v brew >/dev/null 2>&1; then
    echo "❌ Homebrew bulunamadı, kurulum yapılıyor..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
echo "✅ Homebrew: $(brew --version | head -1)"

# Node.js kontrolü (Frontend için gerekli)
if ! command -v node >/dev/null 2>&1; then
    echo "⬇️ Node.js kuruluyor..."
    brew install node
fi
echo "✅ Node.js: $(node --version)"

# npm kontrolü
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm bulunamadı! Node.js ile birlikte gelmeli."
    exit 1
fi
echo "✅ npm: $(npm --version)"

# Google Chrome kontrolü
if [ ! -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    echo "❌ Google Chrome bulunamadı!"
    echo "🔗 Lütfen Google Chrome'u kurun: https://www.google.com/chrome/"
    exit 1
fi
echo "✅ Google Chrome mevcut"

# ChromeDriver kurulumu
echo "🚗 ChromeDriver kontrol ediliyor..."
if ! command -v chromedriver >/dev/null 2>&1; then
    echo "⬇️ ChromeDriver kuruluyor..."
    brew install chromedriver

    # ChromeDriver'ı güvenlik izninden geçir
    echo "🔒 ChromeDriver güvenlik izni veriliyor..."
    xattr -d com.apple.quarantine $(which chromedriver) 2>/dev/null || true
else
    echo "✅ ChromeDriver zaten kurulu: $(chromedriver --version)"
fi

# Jenkins kurulumu
echo "🏗️ Jenkins kontrol ediliyor..."
if ! command -v jenkins >/dev/null 2>&1; then
    echo "⬇️ Jenkins kuruluyor..."
    brew install jenkins-lts
    echo "📝 Jenkins kuruldu. Başlatmak için: brew services start jenkins-lts"
    echo "🌐 Jenkins URL: http://localhost:8080"
else
    echo "✅ Jenkins zaten kurulu"
fi

# Maven kontrolü
if ! command -v mvn >/dev/null 2>&1; then
    echo "⬇️ Maven kuruluyor..."
    brew install maven
fi
echo "✅ Maven: $(mvn --version | head -1)"

# Git kontrolü
if ! command -v git >/dev/null 2>&1; then
    echo "⬇️ Git kuruluyor..."
    brew install git
fi
echo "✅ Git: $(git --version)"

# Frontend dizini kontrolü
echo "📁 Frontend dizini kontrol ediliyor..."
if [ ! -d "./frontend" ]; then
    echo "⚠️ ./frontend dizini bulunamadı"
    echo "📝 Frontend projenizin ./frontend dizininde olduğundan emin olun"
else
    echo "✅ Frontend dizini mevcut"

    # package.json kontrolü
    if [ -f "./frontend/package.json" ]; then
        echo "✅ Frontend package.json mevcut"
    else
        echo "⚠️ Frontend package.json bulunamadı"
    fi
fi

echo ""
echo "🎉 Local Jenkins ortamı kurulum tamamlandı!"
echo "=========================================================="
echo "📋 Kurulu yazılımlar:"
echo "   - Docker Desktop: ✅"
echo "   - Node.js: ✅"
echo "   - npm: ✅"
echo "   - Google Chrome: ✅"
echo "   - ChromeDriver: ✅"
echo "   - Jenkins: ✅"
echo "   - Maven: ✅"
echo "   - Git: ✅"
echo ""
echo "🚀 Başlatma komutları:"
echo "   - Jenkins: brew services start jenkins-lts"
echo "   - Docker: Docker Desktop uygulamasını çalıştırın"
echo ""
echo "🌐 URL'ler:"
echo "   - Jenkins: http://localhost:8080"
echo "   - Backend: http://localhost:8081"
echo "   - Frontend: http://localhost:5173"
echo "   - H2 Console: http://localhost:8081/h2-console"
echo ""
echo "🔄 Test Akışı:"
echo "   - Unit/Integration testleri → Backend container'da"
echo "   - Selenium testleri → Local Chrome ile Frontend'e karşı"
echo "   - Frontend URL: http://localhost:5173 (Selenium için)"
