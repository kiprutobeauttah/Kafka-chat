@echo off
REM Download and extract Kafka
curl -o kafka.tgz https://www.apache.org/dyn/closer.lua/kafka/4.2.0/kafka_2.13-4.2.0.tgz?action=download
powershell -Command "Expand-Archive -Path kafka.tgz -DestinationPath .\kafka"
del kafka.tgz
pause