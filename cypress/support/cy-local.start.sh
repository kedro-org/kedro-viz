#!/bin/bash

# This file is used to run e2e tests on Kedro-Viz locally. 
# Pre-requisite: All the Kedro-Viz dependencies need to be installed. You can find more info at https://github.com/kedro-org/kedro-viz/blob/main/CONTRIBUTING.md

# logging
e2e_process_start_time=$(date +%s)

# Store the process IDs of the started processes
process_ids=()

# constants
KEDRO_VIZ_FRONTEND_PORT=4141
KEDRO_VIZ_BACKEND_PORT=4142
KEDRO_VIZ_FRONTEND_TIMEOUT=30
KEDRO_VIZ_BACKEND_TIMEOUT=90

# Function to terminate processes
terminate_processes() {
  echo "Terminating processes..."
  for pgid in "${process_ids[@]}"; do
    kill -- "-$pgid" >/dev/null 2>&1
  done
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

# Function to check if a port is in use
is_port_in_use() {
  local port=$1
  nc -z localhost $port >/dev/null 2>&1
  return $?
}


# Check if Kedro-Viz Backend is already running
if is_port_in_use $KEDRO_VIZ_BACKEND_PORT; then
  echo "Kedro-Viz Backend is already running..."
else
  # Start Kedro-Viz Backend
  echo
  echo "Starting Kedro-Viz Backend..."
  echo
  make run &
  process_group=$(ps -o pgid $$ | tail -n 1 | awk '{print $1}')
  process_ids+=("$process_group")
fi

# Wait for Kedro-Viz Backend to start
wait_for_service "Kedro-Viz Backend" "localhost" $KEDRO_VIZ_BACKEND_PORT $KEDRO_VIZ_BACKEND_TIMEOUT

# Check if Kedro-Viz Frontend is already running
if is_port_in_use $KEDRO_VIZ_FRONTEND_PORT; then
  echo "Kedro-Viz Frontend is already running..."
else
  # Start Kedro-Viz frontend
  echo
  echo "Starting Kedro-Viz frontend..."
  echo
  BROWSER=none npm start &
  process_group=$(ps -o pgid $$ | tail -n 1 | awk '{print $1}')
  process_ids+=("$process_group")
fi

# Wait for Kedro-Viz Frontend to start
wait_for_service "Kedro-Viz Frontend" "localhost" $KEDRO_VIZ_FRONTEND_PORT $KEDRO_VIZ_FRONTEND_TIMEOUT

# Run Cypress E2E tests
echo
echo "Running Cypress E2E tests in headless mode ..."
cypress run

# logging
e2e_process_end_time=$(date +%s)

total_e2e_process_time=$((e2e_process_end_time - e2e_process_start_time))
echo "Total E2E process execution time: $total_e2e_process_time seconds"

# Terminate the processes
terminate_processes

