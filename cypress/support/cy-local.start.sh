#!/bin/bash

# This file is used to run e2e tests on Kedro-Viz locally. 
# Pre-requisite: All the Kedro-Viz dependencies need to be installed. You can find more info at https://github.com/kedro-org/kedro-viz/blob/main/CONTRIBUTING.md

e2e_process_start_time=$(date +%s)

# Store the process IDs of the started processes
process_ids=()

# Function to terminate processes
terminate_processes() {
  echo "Terminating processes..."
  kill -- "-${process_group}"
}

# Function to wait for a service to start with a timeout
wait_for_service() {
  local service=$1
  local host=$2
  local port=$3
  local timeout=$4

  echo "Waiting for $service to start on $host:$port ..."
  start_time=$(date +%s)
  while ! nc -z $host $port; do
    current_time=$(date +%s)
    elapsed_time=$((current_time - start_time))
    if [[ $elapsed_time -gt $timeout ]]; then
      echo "$service at $host:$port did not start within the timeout. Exiting..."
      terminate_processes
      exit 1
    fi
    sleep 1
  done
}

# Start Kedro-Viz Backend
echo
echo "Starting Kedro-Viz Backend..."
echo
make run &
process_group=$(ps -o pgid $$ | tail -n 1)
process_ids+=($!)

# Wait for Kedro-Viz Backend to start
wait_for_service "Kedro-Viz Backend" "localhost" 4142 60

# Start Kedro-Viz frontend
echo
echo "Starting Kedro-Viz frontend..."
echo
npm start &
process_group=$(ps -o pgid $$ | tail -n 1)
process_ids+=($!)

# Wait for Kedro-Viz Frontend to start
wait_for_service "Kedro-Viz Frontend" "localhost" 4141 30

# Run Cypress E2E tests
echo "Running Cypress E2E tests..."
cypress run


e2e_process_end_time=$(date +%s)

total_e2e_process_time=$((e2e_process_end_time - e2e_process_start_time))
echo "Total E2E process execution time: $total_e2e_process_time seconds"
# Terminate the processes
terminate_processes

