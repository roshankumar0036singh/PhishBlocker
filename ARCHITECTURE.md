# PhishBlocker Architecture

This document provides a detailed overview of the system architecture, design patterns, and technical specifications of the PhishBlocker project.

## Overview

PhishBlocker is designed as a distributed, high-performance security system. It prioritizes low latency and high accuracy by offloading intensive lexical analysis to local ML models and using LLMs for deep contextual verification only when necessary.

## Core Components

### 1. Intelligence Engine (Python/FastAPI)
The heart of the system, responsible for URL analysis and threat classification.
- **Ensemble Models**: Combines LightGBM (lexical features), TensorFlow (structural features), and Transformer models for a holistic view.
- **LLM Contextualizer**: Uses Google Gemini 2.5 Flash to analyze page content and URL structures for sophisticated phishing attempts.
- **Resilience Layer**: Implements multi-layer caching (L1 In-Memory, L2 Redis) to achieve sub-100ms response times for repeat vectors.

### 2. Forensic Dashboard (React/Vite)
A high-contrast "Night Ops" styled interface for real-time monitoring.
- **Telemetry Stream**: Connected via Redis global counters for live statistical aggregation.
- **Forensic Detail**: Provides deep-frame inspection of scanned URLs, showing confidence scores and risk factors.
- **Neural Matrix**: Visual mapping of threat distribution and hourly activity.

### 3. Browser Extension (React/Tiptap)
The tactical edge of the system, deployed to user browsers.
- **Zero-Trust Navigation**: Scans every navigation event against the centralized API.
- **Trusted Enclave**: Manages local whitelists and bypass settings to minimize friction.
- **Local Fallback**: Implements heuristic analysis if the central neural link is severed.

## Data Flow

1.  **Intercept**: The extension intercepts a navigation event.
2.  **Probe**: The URL is sent to the `/api/scan` endpoint.
3.  **Analyze**: 
    - Cache check (L1/L2).
    - ML Ensemble prediction.
    - (Optional) LLM analysis for high-uncertainty vectors.
4.  **Synchronize**: Results are updated in Redis telemetry and returned to the extension.
5.  **Visualize**: The dashboard reflects the update in the global activity timeline.

## Infrastructure

- **API Gateway**: FastAPI running via Uvicorn.
- **Persistence**: PostgreSQL for historical scan logs.
- **Coordination**: Redis for telemetry counters, real-time lists, and L2 caching.
- **Containerization**: Full Docker-Compose environment for seamless deployment.
