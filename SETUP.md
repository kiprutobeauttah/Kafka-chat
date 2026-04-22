# Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a database:
```sql
CREATE DATABASE kafka_chat;
```

#### Option B: Use Docker
```bash
docker run --name kafka-chat-db \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=kafka_chat \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and update the DATABASE_URL:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/kafka_chat"
```

### 4. Set Up Prisma
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate
```

### 5. Start Kafka
Make sure Kafka is running. Use the provided scripts:

**Linux/Mac:**
```bash
cd kafka
./download-kafka.sh  # First time only
./run-kafka-chat.sh
```

**Windows:**
```cmd
cd kafka
download-kafka.bat  # First time only
run-kafka-chat.bat
```

### 6. Start the Application
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Management

### View Database (Prisma Studio)
```bash
npm run prisma:studio
```
Opens a web interface at `http://localhost:5555`

### Create New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database
```bash
npx prisma migrate reset
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check your DATABASE_URL in `.env`
- Ensure the database exists

### Kafka Connection Issues
- Verify Kafka is running on `localhost:9092`
- Check Kafka logs in the kafka folder

### Port Already in Use
Change the PORT in `.env` file:
```
PORT=3001
```

## Production Deployment

### Environment Variables
Set these in your production environment:
- `DATABASE_URL`: Your production PostgreSQL connection string
- `SECRET_KEY`: A strong random secret key
- `NODE_ENV=production`

### Database Migration
```bash
npx prisma migrate deploy
```

### Start Server
```bash
node server.js
```
