#!/bin/bash

# Run Redis
echo "Starting Redis server..."
cd Redis_Server
node index.js &
REDIS_PID=$!

# Run Mongo
echo "Starting Mongo server..."
cd ../Server
npm run dev &
MONGO_PID=$!

# Run frontend
echo "Starting frontend..."
cd ../client
npm run dev &
FRONT_PID=$!

# Open the frontend in the default web browser
echo "Opening frontend in browser..."
Start-Process "http://localhost:5173"

# Now trap Ctrl+C to stop all servers
trap 'echo; echo "Stopping all servers..."; kill 0' SIGINT

# Wait for all to finish (until Ctrl+C)
wait
