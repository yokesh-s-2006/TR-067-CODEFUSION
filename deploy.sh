#!/bin/bash
echo "🚀 RailAssistAI - ONE CLICK DEPLOY"

# Check Docker
if ! docker --version; then
  echo "❌ Install Docker first!"
  exit 1
fi

# Create directories if missing
mkdir -p backend/src/routes backend/src/models ai-service/src frontend/lib

echo "📦 Building & Starting services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting 60 seconds for initialization..."
sleep 60

echo "🔍 Testing services..."
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
  echo "✅ Backend OK"
else
  echo "❌ Backend failed - Check: docker-compose logs backend"
fi

if curl -f http://localhost:3002/health >/dev/null 2>&1; then
  echo "✅ AI Service OK"
else
  echo "❌ AI failed - Check OPENAI_API_KEY"
fi

echo ""
echo "🎉 SUCCESS! RailAssistAI is LIVE!"
echo "🌐 Backend API: http://localhost:3001"
echo "🤖 AI Chat: http://localhost:3002" 
echo "📱 Flutter: cd frontend && flutter run"
echo "📊 Status: docker-compose ps"
echo "📜 Logs: docker-compose logs -f"
