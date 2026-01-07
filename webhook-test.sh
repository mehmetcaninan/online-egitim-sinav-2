#!/bin/bash
echo "🔗 GitHub Webhook Test Scripti"
echo "=============================="

# Bu dosya webhook'un çalıştığını test etmek için oluşturulmuştur
# Jenkins pipeline otomatik tetikleme testi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "Test zamanı: $TIMESTAMP"
echo "Commit hash: $GIT_COMMIT"
echo "Branch: $GIT_BRANCH"

# Test başarılı mesajı
echo "✅ Webhook test başarılı - Jenkins otomatik tetikleme çalışıyor!"

# Jenkins ortam değişkenlerini kontrol et
if [ "$JENKINS_URL" ]; then
    echo "🏗️ Jenkins URL: $JENKINS_URL"
else
    echo "⚠️ Jenkins ortamı tespit edilmedi"
fi

# GitHub bilgilerini kontrol et
if [ "$GIT_URL" ]; then
    echo "📂 Git Repository: $GIT_URL"
else
    echo "⚠️ Git repository bilgisi bulunamadı"
fi

# Webhook otomasyonu test sonucu
echo "=============================="
echo "🎯 WEBHOOK OTOMATIK TETİKLEME TEST SONUCU:"
echo "✅ Bu mesajı görüyorsanız webhook çalışıyor!"
echo "📅 Test tarihi: $(date '+%Y-%m-%d %H:%M:%S')"
echo "🔄 Pipeline otomatik tetiklendi"
echo "=============================="
echo "Webhook test tamamlandı"
