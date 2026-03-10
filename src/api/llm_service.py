"""
Mistral AI Service for Intelligent Phishing Analysis
Provides natural language explanations and context-aware threat assessment
"""

import httpx
from typing import Dict, Optional, List, Any
import asyncio
import json
import logging
from datetime import datetime
import hashlib
import os

logger = logging.getLogger(__name__)

class MistralPhishingAnalyzer:
    """
    Advanced phishing analysis using Mistral AI
    Provides natural language explanations and intelligent threat assessment
    """
    
    def __init__(self, api_key: str, model_name: str = "mistral-large-latest"):
        """
        Initialize Mistral analyzer
        
        Args:
            api_key: Mistral API key
            model_name: Mistral model to use (default: mistral-large-latest)
        """
        if not api_key:
            raise ValueError("Mistral API key is required")
        
        self.api_key = api_key
        self.model_name = model_name
        self.api_url = "https://api.mistral.ai/v1/chat/completions"
        self.cache = {}  # In-memory cache
        self.request_count = 0
        self.cache_hits = 0
        
        logger.info(f"Initialized Mistral analyzer with model: {model_name}")
    
    async def analyze_url(
        self, 
        url: str, 
        ml_features: Dict[str, Any],
        ml_prediction: Dict[str, Any],
        dom_data: Optional[Dict[str, Any]] = None,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze URL using Mistral AI with context from ML model
        """
        try:
            if use_cache:
                cache_key = self._generate_cache_key(url)
                if cache_key in self.cache:
                    self.cache_hits += 1
                    return self.cache[cache_key]
            
            prompt = self._build_analysis_prompt(url, ml_features, ml_prediction, dom_data)
            
            self.request_count += 1
            logger.info(f"Calling Mistral API for URL: {url}")
            
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": "You are an expert cybersecurity analyst. Return ONLY JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"}
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.api_url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                content = result['choices'][0]['message']['content']
            
            analysis = json.loads(content)
            
            # Add metadata
            analysis['analyzed_at'] = datetime.now().isoformat()
            analysis['model_used'] = self.model_name
            analysis['url'] = url
            
            if use_cache:
                cache_key = self._generate_cache_key(url)
                self.cache[cache_key] = analysis
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in Mistral analysis: {str(e)}")
            return self._get_fallback_analysis(url, ml_prediction)

    def _build_analysis_prompt(self, url: str, features: Dict[str, Any], prediction: Dict[str, Any], dom: Optional[Dict[str, Any]] = None) -> str:
        https_status = "Yes ✓" if features.get('is_https') else "No ✗"
        
        dom_context = ""
        if dom:
            dom_context = f"""
            DOM Metrics:
            - Has Password Field: {dom.get('has_password_field')}
            - Hidden Iframes: {dom.get('hidden_iframes')}
            - Suspicious Scripts: {dom.get('suspicious_scripts')}
            - Brand Indicators: {", ".join(dom.get('brand_indicators', []))}
            - Meta Description: {dom.get('meta_description', 'N/A')}
            - Page Content Snippet: {dom.get('page_text', '')[:1000]}
            """

        return f"""Analyze this URL and its content for phishing threats:
URL: {url}
Technical Features: HTTPS: {https_status}, Domain Age: {features.get('domain_age_days')} days.
ML Prediction: Level: {prediction.get('threat_level')}, Confidence: {prediction.get('confidence', 0):.1%}.
{dom_context}

Return a JSON object exactly matching this structure:
{{
  "phishing_probability": float (0.0 to 1.0),
  "threat_assessment": "concise explanation",
  "risk_factors": ["risk1", "risk2"],
  "legitimate_indicators": ["legit1"],
  "user_recommendation": "safe|caution|block",
  "confidence_explanation": "why this confidence",
  "educational_tip": "actionable tip",
  "technical_summary": "technical brief"
}}"""

    def _generate_cache_key(self, url: str) -> str:
        return hashlib.sha256(url.encode()).hexdigest()

    def _get_fallback_analysis(self, url: str, ml_prediction: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "phishing_probability": ml_prediction.get('confidence', 0.5) if ml_prediction.get('is_phishing') else 0.1,
            "threat_assessment": f"LLM analysis unavailable. Standard ML predicts {ml_prediction.get('threat_level')} risk.",
            'risk_factors': ['Mistral API unavailable - using ML fallback'],
            'legitimate_indicators': [],
            'user_recommendation': 'caution' if ml_prediction.get('is_phishing') else 'safe',
            'confidence_explanation': 'Based on machine learning model only',
            'educational_tip': 'Always verify URLs before clicking.',
            'technical_summary': 'Fallback mode active',
            'analyzed_at': datetime.now().isoformat(),
            'model_used': 'fallback',
            'url': url
        }

    def get_stats(self) -> Dict[str, Any]:
        return {
            'api_calls': self.request_count,
            'cache_hits': self.cache_hits,
            'cache_size': len(self.cache)
        }

# Global instance manager
_mistral_analyzer: Optional[MistralPhishingAnalyzer] = None

def get_mistral_analyzer() -> Optional[MistralPhishingAnalyzer]:
    global _mistral_analyzer
    return _mistral_analyzer

def init_mistral_analyzer(api_key: str = None, model_name: str = "mistral-large-latest") -> MistralPhishingAnalyzer:
    global _mistral_analyzer
    if _mistral_analyzer is None:
        api_key = api_key or os.getenv("MISTRAL_API_KEY")
        _mistral_analyzer = MistralPhishingAnalyzer(api_key, model_name)
    return _mistral_analyzer

def get_llm_analyzer():
    """Generic getter for the current active LLM analyzer"""
    return get_mistral_analyzer()
