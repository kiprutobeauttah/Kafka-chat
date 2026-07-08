#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

KAFKA_LOG="$LOG_DIR/kafka.log"
APP_LOG="$LOG_DIR/app.log"

PIDS_DIR="$SCRIPT_DIR/pids"
mkdir -p "$PIDS_DIR"

KAFKA_PID="$PIDS_DIR/kafka.pid"
APP_PID="$PIDS_DIR/app.pid"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Kafka Chat Application Startup${NC}"
echo -e "${BLUE}========================================${NC}\n"

is_running() {
    if [ -f "$1" ]; then
        pid=$(cat "$1")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

wait_for_service() {
    local service_name=$1
    local check_command=$2
    local max_wait=$3
    local waited=0
    
    echo -e "${YELLOW}Waiting for $service_name to start...${NC}"
    while [ $waited -lt $max_wait ]; do
        if eval "$check_command" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service_name is ready!${NC}"
            return 0
        fi
        sleep 2
        waited=$((waited + 2))
        echo -n "."
    done
    echo -e "\n${RED}✗ $service_name failed to start within $max_wait seconds${NC}"
    return 1
}

echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if pg_isready > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}\n"
else
    echo -e "${RED}✗ PostgreSQL is not running!${NC}"
    echo -e "${YELLOW}Please start PostgreSQL first:${NC}"
    echo -e "  sudo systemctl start postgresql"
    echo -e "  or use Docker: docker start kafka-chat-db\n"
    exit 1
fi

KAFKA_HOME="/home/beauttah8qn/kafka"

if [ ! -d "$KAFKA_HOME" ]; then
    echo -e "${RED}✗ Kafka not found at $KAFKA_HOME${NC}"
    echo -e "${YELLOW}Downloading Kafka...${NC}\n"
    cd kafka
    ./download-kafka.sh
    cd ..
    echo -e "${GREEN}✓ Kafka downloaded${NC}\n"
fi

LOG_DIRS=$(grep "^log.dirs=" "$KAFKA_HOME/config/server.properties" | cut -d'=' -f2)
if [ ! -z "$LOG_DIRS" ] && [ ! -f "$LOG_DIRS/meta.properties" ]; then
    echo -e "${YELLOW}Formatting Kafka storage (first time setup)...${NC}"
    CLUSTER_ID=$("$KAFKA_HOME/bin/kafka-storage.sh" random-uuid)
    "$KAFKA_HOME/bin/kafka-storage.sh" format -t "$CLUSTER_ID" -c "$KAFKA_HOME/config/server.properties" --standalone > /dev/null 2>&1
    echo -e "${GREEN}✓ Kafka storage formatted${NC}\n"
fi

echo -e "${YELLOW}Starting Kafka Server...${NC}"
if is_running "$KAFKA_PID"; then
    echo -e "${GREEN}✓ Kafka is already running${NC}\n"
else
    cd "$KAFKA_HOME"
    nohup bin/kafka-server-start.sh config/server.properties > "$KAFKA_LOG" 2>&1 &
    KAFKA_PROCESS_PID=$!
    cd - > /dev/null
    echo $KAFKA_PROCESS_PID > "$KAFKA_PID"
    
    if wait_for_service "Kafka" "nc -z localhost 9092" 40; then
        echo ""
        echo -e "${YELLOW}Creating Kafka topic 'chat'...${NC}"
        "$KAFKA_HOME/bin/kafka-topics.sh" --create --topic chat --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 2>/dev/null || echo -e "${GREEN}✓ Topic 'chat' already exists${NC}"
    else
        echo -e "${RED}Failed to start Kafka. Check logs: $KAFKA_LOG${NC}\n"
        exit 1
    fi
fi

echo -e "${YELLOW}Checking database schema...${NC}"
if npm run prisma:generate > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}\n"
fi

echo -e "${YELLOW}Starting Node.js Application...${NC}"
if is_running "$APP_PID"; then
    echo -e "${GREEN}✓ Application is already running${NC}\n"
else
    nohup node server.js > "$APP_LOG" 2>&1 &
    APP_PROCESS_PID=$!
    echo $APP_PROCESS_PID > "$APP_PID"
    
    if wait_for_service "Application" "nc -z localhost 3000" 20; then
        echo ""
    else
        echo -e "${RED}Failed to start application. Check logs: $APP_LOG${NC}\n"
        exit 1
    fi
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All Services Started Successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Service Status:${NC}"
echo -e "  Kafka:       ${GREEN}✓ Running${NC} (PID: $(cat $KAFKA_PID))"
echo -e "  Application: ${GREEN}✓ Running${NC} (PID: $(cat $APP_PID))"
echo -e ""

echo -e "${BLUE}Access your application:${NC}"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo -e ""

echo -e "${BLUE}Log files:${NC}"
echo -e "  Kafka:       $KAFKA_LOG"
echo -e "  Application: $APP_LOG"
echo -e ""

echo -e "${BLUE}To view logs in real-time:${NC}"
echo -e "  tail -f $APP_LOG"
echo -e ""

echo -e "${BLUE}To stop all services:${NC}"
echo -e "  ./stop.sh"
echo -e ""

echo -e "${YELLOW}Press Ctrl+C to stop monitoring, services will continue running in background${NC}"
echo -e "${YELLOW}Monitoring application logs...${NC}\n"

tail -f "$APP_LOG"
