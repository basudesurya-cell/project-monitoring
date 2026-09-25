#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "========================================="
echo "Step 1: Building React Vite Frontend..."
echo "========================================="
cd frontend
npm install
npm run build
cd ..

echo "========================================="
echo "Step 2: Installing Python Dependencies..."
echo "========================================="
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "========================================="
echo "Build complete! Ready to start."
echo "========================================="
