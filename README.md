# PhishBlocker: AI-Powered Phishing Detection System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

A comprehensive phishing detection system combining ensemble machine learning models with Large Language Model (LLM) integration for real-time threat analysis. The system includes a browser extension, a forensic analytics dashboard, and a high-throughput RESTful API.

## Intelligence Architecture

PhishBlocker utilizes a multi-layered defense strategy:

*   **Ensemble ML Engine**: Leverages LightGBM, TensorFlow, and Transformer-based URL analysis.
*   **LLM Verification**: Deep contextual threat assessment via Google Gemini.
*   **Distributed Telemetry**: Real-time stats synchronization across all neural endpoints.

## Key Features

### Multi-Layer Detection
*   **Vector Analysis**: Lexical and structural URL inspection.
*   **Contextual Insight**: LLM-driven forensic reporting for complex threats.
*   **Performance**: Sub-100ms response times for core ML predictions.
*   **Accuracy**: 98.3% verified detection rate in benchmark testing.

### Protection Suite
*   **Browser Extension**: Real-time page scanning during navigation.
*   **Forensic Dashboard**: Live threat monitoring and URL probe gateway.
*   **Whitelisting**: Trusted enclave management for verified domains.
*   **System Bypass**: Robust administrative controls for false-positive override.

## System Architecture

Detailed technical specifications can be found in [ARCHITECTURE.md](ARCHITECTURE.md).

```
[ UI Layer ] <--- [ API Gateway ] <--- [ Intelligence Engine ] <--- [ Data Layer ]
  Extension         FastAPI             ML Models (LGBM/TF)       PostgreSQL
  Dashboard         Redis Cache         Gemini LLM Integration    Redis Persistence
```

## Quick Start

### Prerequisites
*   Docker and Docker Compose
*   Node.js 20+ (Development)
*   Python 3.11+ (Development)
*   Google Gemini API Key

### Installation

1.  **Clone Repository**
    ```bash
    git clone https://github.com/roshankumar0036singh/PhishBlocker.git
    cd PhishBlocker
    ```

2.  **Neural Model Setup**
    The models are excluded from Git to keep the repository lightweight.
    *   Download the model bundle from [GitHub Releases](https://github.com/roshankumar0036singh/PhisBlocker/releases).
    *   Place all files (`.h5`, `.txt`, `.pkl`, `.json`) into the `models/` directory.
    *   For the extension, ensure `url_classifier.onnx` is in `extension-react/public/models/`.

3.  **Environment Configuration**
    Copy `.env.production` to `.env` and provide your API credentials.
    ```bash
    cp .env.production .env
    ```

4.  **Deployment**
    ```bash
    docker-compose up -d
    ```

### Access Points
*   Dashboard: `http://localhost:3000`
*   API Service: `http://localhost:8000`
*   API Documentation: `http://localhost:8000/docs`

## Technical Documentation

*   [Architecture Overview](ARCHITECTURE.md)
*   [Contributing Guidelines](CONTRIBUTING.md)
*   [Security Protocols](docs/PHASE4_SECURITY_MONITORING_GUIDE.md)

## License

PhishBlocker is released under the [MIT License](LICENSE).

---

**Developed for Advanced Threat Detection and User Protection.**
