# 🚂 RailAssistAI - Indian Train App + AI Chatbot

## Quick Start
```bash
chmod +x deploy.sh
./deploy.sh
cd frontend && flutter run
```

## Test API
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123"}'
```

---

## 🎯 STEP-BY-STEP DEPLOYMENT (Copy-Paste Ready)

### 1. Create Project (2 mins)
```bash
mkdir RailAssistAI && cd RailAssistAI

# Copy ALL Files Above
# Create folders:
mkdir -p backend/src/{routes,models} ai-service/src frontend/lib
# Copy each file content exactly as shown
```

### 2. Services

| Service | URL |
|---|---|
| Backend API | http://localhost:3001 |
| AI Chat | http://localhost:3002 |
| Flutter App | Device/Emulator |

### 3. Useful Commands
```bash
# Status
docker-compose ps

# Logs
docker-compose logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```
