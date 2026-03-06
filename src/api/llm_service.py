"""
Gemini LLM Service for Intelligent Phishing Analysis
Provides natural language explanations and context-aware threat assessment
"""

import google.generativeai as genai
from typing import Dict, Optional, List, Any
import asyncio
import json
import re
import logging
from datetime import datetime
from functools import lru_cache
import hashlib

logger = logging.getLogger(__name__)


class GeminiPhishingAnalyzer:
    """
    Advanced phishing analysis using Google Gemini LLM
    Provides natural language explanations and intelligent threat assessment
    """
    
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash-exp"):
        """
        Initialize Gemini analyzer
        
        Args:
            api_key: Google AI Studio API key
            model_name: Gemini model to use (default: gemini-2.0-flash-exp)
        """
        if not api_key:
            raise ValueError("Gemini API key is required")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.model_name = model_name
        self.cache = {}  # In-memory cache
        self.request_count = 0
        self.cache_hits = 0
        
        logger.info(f"Initialized Gemini analyzer with model: {model_name}")
    
    async def analyze_url(
        self, 
        url: str, 
        ml_features: Dict[str, Any],
        ml_prediction: Dict[str, Any],
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze URL using Gemini LLM with context from ML model
        
        Args:
            url: URL to analyze
            ml_features: Extracted features from URL
            ml_prediction: ML model prediction results
            use_cache: Whether to use cached results
            
        Returns:
            Dict containing LLM analysis with threat assessment and recommendations
        """
        try:
            # Check cache first
            if use_cache:
                cache_key = self._generate_cache_key(url)
                if cache_key in self.cache:
                    self.cache_hits += 1
                    logger.debug(f"Cache hit for URL: {url}")
                    return self.cache[cache_key]
            
            # Build comprehensive prompt
            prompt = self._build_analysis_prompt(url, ml_features, ml_prediction)
            
            # Call Gemini API
            self.request_count += 1
            logger.info(f"Calling Gemini API for URL: {url}")
            response = await self._call_gemini_async(prompt)
            
            # Parse and structure response
            analysis = self._parse_llm_response(response)
            
            # Add metadata
            analysis['analyzed_at'] = datetime.now().isoformat()
            analysis['model_used'] = self.model_name
            analysis['url'] = url
            
            # Cache result
            if use_cache:
                cache_key = self._generate_cache_key(url)
                self.cache[cache_key] = analysis
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in LLM analysis: {str(e)}")
            return self._get_fallback_analysis(url, ml_prediction)
    
    def _build_analysis_prompt(
        self, 
        url: str, 
        features: Dict[str, Any], 
        prediction: Dict[str, Any]
    ) -> str:
        """Build comprehensive analysis prompt for Gemini"""
        
        # Format features for better readability
        https_status = "Yes ✓" if features.get('is_https') else "No ✗"
        has_ip = "Yes ⚠️" if features.get('has_ip') else "No ✓"
        
        prompt = f"""You are an expert cybersecurity analyst specializing in phishing detection. Analyze this URL and provide actionable insights.

🔍 URL ANALYSIS REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**URL:** {url}

**Technical Features:**
• URL Length: {features.get('url_length', 0)} characters
• HTTPS Enabled: {https_status}
• Domain Age: {features.get('domain_age_days', 'Unknown')} days
• Suspicious Keywords: {features.get('suspicious_keywords', 0)} found
• URL Entropy: {features.get('url_entropy', 0):.2f}
• Uses IP Address: {has_ip}
• Number of Dots: {features.get('num_dots', 0)}
• Number of Hyphens: {features.get('num_hyphens', 0)}
• Has @ Symbol: {features.get('has_at_symbol', False)}
• Shortening Service: {features.get('is_shortening', False)}

**ML Model Prediction:**
• Threat Level: {prediction.get('threat_level', 'Unknown')}
• Confidence: {prediction.get('confidence', 0):.1%}
• Classification: {prediction.get('label', 'Unknown')}
• Is Phishing: {prediction.get('is_phishing', False)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**REQUIRED OUTPUT FORMAT (JSON):**
Provide your analysis in this exact JSON structure:

{{
  "threat_assessment": "A clear, concise explanation of the threat level (2-3 sentences)",
  "risk_factors": ["specific risk 1", "specific risk 2", "specific risk 3"],
  "legitimate_indicators": ["legitimate sign 1", "legitimate sign 2"],
  "user_recommendation": "safe|caution|block",
  "confidence_explanation": "Brief explanation of why this confidence level",
  "educational_tip": "One actionable security tip for the user",
  "technical_summary": "Brief technical explanation for advanced users"
}}

**GUIDELINES:**
1. Be concise but thorough
2. Focus on actionable insights
3. Use clear, non-technical language for main fields
4. Provide specific examples when identifying risks
5. Consider both ML prediction and technical features
6. If legitimate, explain why it's safe
7. If suspicious, explain what makes it risky

Provide ONLY the JSON response, no additional text."""

        return prompt
    
    async def _call_gemini_async(self, prompt: str, max_retries: int = 3) -> str:
        """
        Call Gemini API with async support and retry logic
        
        Args:
            prompt: Analysis prompt
            max_retries: Maximum number of retry attempts
            
        Returns:
            LLM response text
        """
        for attempt in range(max_retries):
            try:
                response = await asyncio.to_thread(
                    self.model.generate_content,
                    prompt,
                    generation_config={
                        "temperature": 0.3,  # Lower for consistent analysis
                        "top_p": 0.8,
                        "top_k": 40,
                        "max_output_tokens": 1024,
                    },
                    safety_settings=[
                        {
                            "category": "HARM_CATEGORY_HARASSMENT",
                            "threshold": "BLOCK_NONE"
                        },
                        {
                            "category": "HARM_CATEGORY_HATE_SPEECH",
                            "threshold": "BLOCK_NONE"
                        },
                        {
                            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            "threshold": "BLOCK_NONE"
                        },
                        {
                            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                            "threshold": "BLOCK_NONE"
                        }
                    ]
                )
                
                return response.text
                
            except Exception as e:
                logger.warning(f"Gemini API call attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                # Exponential backoff
                await asyncio.sleep(2 ** attempt)
    
    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """
        Parse and validate LLM response
        
        Args:
            response: Raw LLM response text
            
        Returns:
            Structured analysis dictionary
        """
        if not response:
            return self._get_fallback_structure("Empty response")

        try:
            # Clean up response (remove potential intro/outro text)
            clean_response = response.strip()
            
            # Remove markdown code blocks if present
            if '```json' in clean_response:
                try:
                    clean_response = clean_response.split('```json')[1].split('```')[0].strip()
                except IndexError:
                    pass
            elif '```' in clean_response:
                try:
                    clean_response = clean_response.split('```')[1].split('```')[0].strip()
                except IndexError:
                    pass
                
            # Robustly extract the FIRST JSON object found
            start_idx = clean_response.find('{')
            end_idx = clean_response.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = clean_response[start_idx:end_idx+1]
            else:
                json_str = clean_response
            
            try:
                analysis = json.loads(json_str)
            except json.JSONDecodeError:
                # Attempt to repair truncated JSON
                logger.warning(f"Attempting to repair truncated LLM JSON response for input: {json_str[:50]}...")
                repaired_json = self._repair_json(json_str)
                analysis = json.loads(repaired_json)
            
            # Validate required fields
            required_fields = [
                'threat_assessment', 'risk_factors', 'user_recommendation',
                'confidence_explanation', 'educational_tip'
            ]
            
            for field in required_fields:
                if field not in analysis:
                    logger.warning(f"Missing field in LLM response: {field}")
                    analysis[field] = self._get_default_value(field)
            
            # Ensure lists are lists
            if not isinstance(analysis.get('risk_factors'), list):
                analysis['risk_factors'] = []
            if not isinstance(analysis.get('legitimate_indicators'), list):
                analysis['legitimate_indicators'] = []
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error parsing LLM response: {str(e)}")
            logger.error(f"Raw response (first 500 chars): {response[:500] if response else 'None'}")
            
            # Return fallback structure
            return {
                "threat_assessment": response[:200] if response else "Analysis completed",
                "risk_factors": [],
                "legitimate_indicators": [],
                "user_recommendation": "review",
                "confidence_explanation": "Analysis completed with limited information",
                "educational_tip": "Always verify URLs before clicking, especially in emails",
                "technical_summary": "Unable to parse detailed analysis"
            }
    
    def _repair_json(self, json_str: str) -> str:
        """
        Attempt to repair truncated JSON by closing quotes and braces
        """
        json_str = json_str.strip()
        
        # If it doesn't start with {, it's hopeless
        if not json_str.startswith('{'):
            return "{}"
            
        # Count braces and quotes
        open_braces = json_str.count('{')
        close_braces = json_str.count('}')
        quotes = json_str.count('"')
        
        # Repair unclosed quote
        if quotes % 2 != 0:
            # If the last character is not a quote, add one
            if not json_str.endswith('"'):
                json_str += '"'
        
        # Add missing close braces
        while open_braces > close_braces:
            if not json_str.endswith('"') and not json_str.endswith('}') and not json_str.endswith(']'):
                # We might be in the middle of a value, try to close it
                if json_str.rstrip().endswith(':'):
                    json_str += ' "Truncated"'
            
            json_str += '}'
            close_braces += 1
            
        return json_str
    
    def _get_default_value(self, field: str) -> Any:
        """Get default value for missing fields"""
        defaults = {
            'threat_assessment': 'Analysis completed',
            'risk_factors': [],
            'legitimate_indicators': [],
            'user_recommendation': 'review',
            'confidence_explanation': 'Standard analysis performed',
            'educational_tip': 'Always verify URLs before clicking',
            'technical_summary': 'Analysis completed'
        }
        return defaults.get(field, '')
    
    def _generate_cache_key(self, url: str) -> str:
        """Generate cache key from URL"""
        return hashlib.sha256(url.encode()).hexdigest()
    
    def _get_fallback_analysis(self, url: str, ml_prediction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide fallback analysis when LLM fails
        
        Args:
            url: URL being analyzed
            ml_prediction: ML model prediction
            
        Returns:
            Basic analysis dictionary
        """
        threat_level = ml_prediction.get('threat_level', 'Unknown')
        is_phishing = ml_prediction.get('is_phishing', False)
        
        if is_phishing:
            recommendation = 'block'
            assessment = f"This URL has been classified as {threat_level} risk by our ML model. Exercise caution."
            tip = "Avoid clicking on suspicious links, especially from unknown sources."
        else:
            recommendation = 'safe'
            assessment = f"This URL appears legitimate based on our analysis. Threat level: {threat_level}."
            tip = "Even legitimate sites can be compromised. Stay vigilant."
        
        return {
            'threat_assessment': assessment,
            'risk_factors': ['LLM analysis unavailable - using ML model only'],
            'legitimate_indicators': [],
            'user_recommendation': recommendation,
            'confidence_explanation': 'Based on machine learning model prediction',
            'educational_tip': tip,
            'technical_summary': 'Fallback analysis using ML model only',
            'analyzed_at': datetime.now().isoformat(),
            'model_used': 'fallback',
            'url': url
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get analyzer statistics"""
        total_requests = self.request_count + self.cache_hits
        cache_hit_rate = self.cache_hits / total_requests if total_requests > 0 else 0
        
        return {
            'total_requests': total_requests,
            'api_calls': self.request_count,
            'cache_hits': self.cache_hits,
            'cache_hit_rate': cache_hit_rate,
            'cache_size': len(self.cache),
            'estimated_cost_saved': self.cache_hits * 0.001  # $0.001 per call
        }
    
    def clear_cache(self):
        """Clear the in-memory cache"""
        self.cache.clear()
        logger.info("LLM cache cleared")
# Global instance
_gemini_analyzer: Optional[GeminiPhishingAnalyzer] = None


def get_gemini_analyzer() -> Optional[GeminiPhishingAnalyzer]:
    """Get global Gemini analyzer instance"""
    global _gemini_analyzer
    return _gemini_analyzer


def init_gemini_analyzer(api_key: str = None, model_name: str = "gemini-2.0-flash-exp") -> GeminiPhishingAnalyzer:
    """Initialize global Gemini analyzer"""
    global _gemini_analyzer
    if _gemini_analyzer is None:
        import os
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        _gemini_analyzer = GeminiPhishingAnalyzer(api_key, model_name)
    return _gemini_analyzer
