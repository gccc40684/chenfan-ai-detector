#!/bin/bash

# Test script for AI Detector Worker API

BASE_URL="http://localhost:8787"

echo "=== AI Detector Worker API Test ==="
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
curl -s "$BASE_URL/health" | jq .
echo ""

# Test 2: CORS preflight
echo "Test 2: CORS Preflight"
curl -s -X OPTIONS -i "$BASE_URL/api/detect" -H "Origin: http://localhost:5173" | head -20
echo ""

# Test 3: Detect AI text (simple)
echo "Test 3: Detect AI Text (Simple)"
curl -s -X POST "$BASE_URL/api/detect" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The advancement of artificial intelligence has revolutionized numerous industries. Machine learning algorithms can now process vast amounts of data with remarkable efficiency. Natural language processing enables computers to understand and generate human-like text. Computer vision systems can identify objects and patterns in images with high accuracy. These technological developments have significant implications for the future of work and society.",
    "detailLevel": "simple"
  }' | jq .
echo ""

# Test 4: Detect human text (detailed)
echo "Test 4: Detect Human Text (Detailed)"
curl -s -X POST "$BASE_URL/api/detect" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Ugh, I stayed up way too late last night trying to fix this stupid bug. Three hours of my life gone! And you know what? It was just a missing semicolon. Can you believe it? I mean, seriously, sometimes I wonder why I even got into programming. But then when it finally works... man, that feeling is just the best. Anyway, gotta grab some coffee now or Ill be useless all day.",
    "detailLevel": "detailed"
  }' | jq .
echo ""

# Test 5: Validation error (too short)
echo "Test 5: Validation Error (Too Short)"
curl -s -X POST "$BASE_URL/api/detect" \
  -H "Content-Type: application/json" \
  -d '{"text": "Short"}' | jq .
echo ""

# Test 6: Validation error (missing text)
echo "Test 6: Validation Error (Missing Text)"
curl -s -X POST "$BASE_URL/api/detect" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
echo ""

echo "=== Tests Complete ==="