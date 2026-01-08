#!/bin/bash

# Jenkins Docker Pipeline Test Scripti
echo "🐳 Jenkins Docker Pipeline Test"
echo "==============================="

# Docker durumunu kontrol et
if ! command -v docker &> /dev/null; then
    echo "❌ Docker bulunamadı!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose bulunamadı!"
    exit 1
fi

echo "✅ Docker: $(docker --version)"
echo "✅ Docker Compose: $(docker-compose --version)"

# Jenkins'te çalışıyoruz kontrolü
if [ "$CI" = "true" ]; then
    echo "🏗️ Jenkins CI ortamında çalışıyoruz"

    # Unique project name for Jenkins builds
    PROJECT_NAME="jenkins-test-${BUILD_NUMBER:-$(date +%s)}"
    export COMPOSE_PROJECT_NAME="$PROJECT_NAME"

    echo "📦 Docker Compose Project: $PROJECT_NAME"

    # Quick smoke test
    echo "🧪 Docker ortamı smoke test..."
    docker-compose -p "$PROJECT_NAME" config --quiet
    echo "✅ docker-compose.yml geçerli"

    # Cleanup any previous test containers
    docker-compose -p "$PROJECT_NAME" down --remove-orphans >/dev/null 2>&1 || true

else
    echo "💻 Local test ortamında çalışıyoruz"
fi

echo "==============================="
echo "✅ Jenkins Docker Pipeline hazır!"
echo "Bu script Jenkins tarafından otomatik çağrılacak"
echo "==============================="
