# PhishBlocker API Documentation

## Overview

The PhishBlocker API provides real-time phishing detection capabilities through RESTful endpoints. It leverages an ensemble of machine learning models and LLM integration to deliver high-fidelity threat assessments.

## Service Access

```
Production: https://api.phishblocker.com
Development: http://localhost:8000
```

## Authentication Protocol

Authentication is required for production environments. API keys must be provided in the Authorization header.

```http
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting

*   **Standard Intelligence**: 100 requests per minute
*   **Neural Scanning**: 60 requests per minute
*   **Batch Operations**: 10 requests per minute

Headers provided in every response:
*   `X-RateLimit-Limit`: Maximum requests per window
*   `X-RateLimit-Remaining`: Available requests
*   `X-RateLimit-Reset`: Token refresh timestamp

## Core Endpoints

### System Health
Verify API availability and sub-system status.

```http
GET /health
```

**Response Architecture:**
```json
{
  "status": "healthy",
  "detector_loaded": true,
  "redis_connected": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### URL Forensic Scanning
Perform a deep-frame analysis of a single URL.

```http
POST /scan
```

**Request Payload:**
```json
{
  "url": "https://example.com",
  "user_id": "optional-user-id",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response Payload:**
```json
{
  "url": "https://example.com",
  "is_phishing": false,
  "confidence": 0.95,
  "threat_level": "Low",
  "risk_factors": [],
  "timestamp": "2024-01-15T10:30:00Z",
  "scan_id": "abc123def456"
}
```

### Confidence Scoping & Blocking Policy
The system categorizes threats based on confidence scores derived from the ensemble engine.

*   **Low**: Confidence < 0.3 (Safe)
*   **Medium**: 0.3 ≤ Confidence < 0.7 (Suspicious - Warning Issued)
*   **High**: Confidence ≥ 0.7 (Malicious - Active Protocol Interception)

> [!IMPORTANT]
> **Active Blocking Threshold**: The browser extension only performs mandatory URL blocking when the neural confidence exceeds **0.7**. Detections below this threshold will result in a UI warning but will not prevent navigation unless explicitly configured by the administrator.

### Batch Intelligence
Analyze multiple vectors in a single high-throughput request.

```http
POST /scan-batch
```

**Request Payload:**
```json
{
  "urls": [
    "https://example1.com",
    "https://example2.com"
  ],
  "user_id": "optional-user-id"
}
```

---

## SDK Integration

### Intelligence Client (Python)
```python
import requests

class PhishBlockerClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url

    def probe_url(self, url, user_id=None):
        response = requests.post(
            f"{self.base_url}/scan",
            json={"url": url, "user_id": user_id}
        )
        return response.json()
```

---

## Observability & Metrics

### System Performance
*   **Average Latency**: <100ms
*   **Peak Throughput**: 1000+ req/sec
*   **Operational Uptime**: 99.9%
*   **Neural Cache Hit Rate**: 85%+

---

**Technical Documentation for PhishBlocker Advanced Threat Detection.**
