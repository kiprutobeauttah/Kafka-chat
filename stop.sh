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
echo -e "${BLUE}  Stopping Kafka Chat Application${NC}"
echo -e "${BLUE}========================================${NC}\n"

stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $service_name (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null
            
            local count=0
            while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "${YELLOW}Force stopping $service_name...${NC}"
                kill -9 "$pid" 2>/dev/null
            fi
            
            echo -e "${GREEN}✓ $service_name stopped${NC}"
        else
            echo -e "${YELLOW}$service_name is not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}$service_name PID file not found${NC}"
    fi
}

stop_service "Application" "$APP_PID"
echo ""

stop_service "Kafka" "$KAFKA_PID"
echo ""

if [ -d "$PIDS_DIR" ] && [ -z "$(ls -A $PIDS_DIR)" ]; then
    rmdir "$PIDS_DIR"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All Services Stopped${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Note: PostgreSQL is still running (if it was started separately)${NC}"
echo -e "${YELLOW}To stop PostgreSQL: sudo systemctl stop postgresql${NC}\n"
