#!/bin/bash
set -e

# Install dependencies with more flexible version requirements
pip install -r requirements.txt || echo "Some packages may not be installed with exact versions"

# Create necessary directories
mkdir -p ./data

# Copy required data files
if [ -d "../../backend/data" ]; then
  cp -r ../../backend/data/* ./data/
fi

# Create models directory
mkdir -p ./models

# Create utils directory for text_utils
mkdir -p ./utils

# Copy model files if they exist
if [ -d "../../backend/models" ]; then
  cp -r ../../backend/models/*.py ./models/ 2>/dev/null || echo "No model Python files to copy"
  cp -r ../../backend/models/*.pkl ./models/ 2>/dev/null || echo "No model PKL files to copy"
fi

# Copy utils files
if [ -d "../../backend/utils" ]; then
  cp -r ../../backend/utils/*.py ./utils/ 2>/dev/null || echo "No utils files to copy"
fi

# Copy services files
if [ -d "../../backend/services" ]; then
  mkdir -p ./services
  cp -r ../../backend/services/*.py ./services/ 2>/dev/null || echo "No services files to copy"
fi

# Download nltk data
python -m nltk.downloader -d ./nltk_data punkt brown

echo "Build script completed successfully"