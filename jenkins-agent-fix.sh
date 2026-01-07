#!/bin/bash
# Jenkins Mac Agent Başlatma - WebSocket Olmadan

cd ~/jenkins-agent

# Agent JAR'ı indir
curl -sO http://localhost:8080/jnlpJars/agent.jar

# WebSocket OLMADAN bağlan (handshake error'ları önlemek için)
echo "Jenkins agent başlatılıyor (WebSocket olmadan)..."
java -jar agent.jar \
    -url http://localhost:8080/ \
    -secret c816e8298ee9ff8ad5ca4eb88423a74dd9520ce573d53466e1aced6218b5858e \
    -name "Mac-agent" \
    -workDir "/Users/mehmetcaninan/jenkins-agent"

# Eğer yukarıdaki çalışmazsa, JNLP yöntemini dene:
# java -jar agent.jar \
#     -jnlpUrl http://localhost:8080/computer/Mac-agent/slave-agent.jnlp \
#     -secret c816e8298ee9ff8ad5ca4eb88423a74dd9520ce573d53466e1aced6218b5858e \
#     -workDir "/Users/mehmetcaninan/jenkins-agent"
