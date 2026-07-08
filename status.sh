#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PIDS_DIR="$SCRIPT_DIR/pids"
KAFKA_PID="$PIDS_DIR/kafka.pid"
APP_PID="$PIDS_DIR/app.pid"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Kafka Chat Application Status${NC}"
echo -e "${BLUE}========================================${NC}\n"

check_service() {
    local service_name=$1
    local pid_file=$2
    local port=$3
    
    echo -e "${BLUE}$service_name:${NC}"
    
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "  Status: ${GREEN}✓ Running${NC}"
            echo -e "  PID: $pid"
            if [ -n "$port" ]; then
                if nc -z localhost "$port" 2>/dev/null; then
                    echo -e "  Port $port: ${GREEN}✓ Listening${NC}"
                else
                    echo -e "  Port $port: ${RED}✗ Not listening${NC}"
                fi
            fi
        else
            echo -e "  Status: ${RED}✗ Not running${NC} (stale PID file)"
            rm -f "$pid_file"
        fi
    else
        echo -e "  Status: ${RED}✗ Not running${NC}"
    fi
    echo ""
}

echo -e "${BLUE}PostgreSQL:${NC}"
if pg_isready > /dev/null 2>&1; then
    echo -e "  Status: ${GREEN}✓ Running${NC}"
    psql_version=$(psql --version | head -n1)
    echo -e "  Version: $psql_version"
else
    echo -e "  Status: ${RED}✗ Not running${NC}"
fi
echo ""

check_service "Kafka" "$KAFKA_PID" "9092"

check_service "Application" "$APP_PID" "3000"

echo -e "${BLUE}========================================${NC}"

all_running=true
[ ! -f "$KAFKA_PID" ] && all_running=false
[ ! -f "$APP_PID" ] && all_running=false

if $all_running; then
    if ps -p "$(cat $KAFKA_PID)" > /dev/null 2>&1 && \
       ps -p "$(cat $APP_PID)" > /dev/null 2>&1; then
        echo -e "${GREEN}All services are running!${NC}"
        echo -e "\n${BLUE}Application URL:${NC} ${GREEN}http://localhost:3000${NC}"
    else
        echo -e "${YELLOW}Some services are not running${NC}"
        echo -e "Run ${GREEN}./start.sh${NC} to start all services"
    fi
else
    echo -e "${YELLOW}Services are not running${NC}"
    echo -e "Run ${GREEN}./start.sh${NC} to start all services"
fi

echo -e "${BLUE}========================================${NC}\n"

if [ -f "logs/app.log" ] && [ -f "$APP_PID" ]; then
    echo -e "${BLUE}Recent application logs:${NC}"
    echo -e "${YELLOW}------------------------${NC}"
    tail -n 10 "$SCRIPT_DIR/logs/app.log"
    echo -e "${YELLOW}------------------------${NC}"
    echo -e "View full logs: ${GREEN}tail -f $SCRIPT_DIR/logs/app.log${NC}\n"
fi
