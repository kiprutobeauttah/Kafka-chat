#!/bin/bash
# Download and extract Kafka
curl -o kafka.tgz https://www.apache.org/dyn/closer.lua/kafka/4.2.0/kafka_2.13-4.2.0.tgz?action=download
tar -xvzf kafka.tgz -C ./kafka
rm kafka.tgz