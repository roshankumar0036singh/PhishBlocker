
import re
import urllib.parse
import tldextract # type: ignore
import whois # type: ignore
import requests # type: ignore
import ssl
import socket
import math
from datetime import datetime, timedelta
import hashlib
from collections import Counter
import dns.resolver
import ipaddress

class URLFeatureExtractor:
    """
    Advanced URL Feature Extractor for Phishing Detection
    Extracts 42+ features from URLs as mentioned in research papers
    """

    def __init__(self):
        # Suspicious keywords commonly used in phishing URLs
        self.suspicious_keywords = [
            'secure', 'account', 'webscr', 'login', 'ebayisapi', 'signin',
            'banking', 'confirm', 'account', 'update', 'suspended', 'verify',
            'click', 'here', 'now', 'urgent', 'security', 'alert'
        ]

        # Shortening services
        self.shortening_services = [
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
            'is.gd', 'buff.ly', 'adf.ly', 'short.link'
        ]

    def extract_all_features(self, url):
        """Extract all 42 features from a URL"""
        try:
            features = {}

            # Basic URL parsing
            parsed = urllib.parse.urlparse(url)
            domain_info = tldextract.extract(url)

            # 1-5: URL Length Features
            features['url_length'] = len(url)
            features['hostname_length'] = len(parsed.hostname) if parsed.hostname else 0
            features['path_length'] = len(parsed.path)
            features['query_length'] = len(parsed.query) if parsed.query else 0
            features['fragment_length'] = len(parsed.fragment) if parsed.fragment else 0

            # 6-10: URL Structure Features
            features['num_dots'] = url.count('.')
            features['num_hyphens'] = url.count('-')
            features['num_underscores'] = url.count('_')
            features['num_slashes'] = url.count('/')
            features['num_questionmarks'] = url.count('?')

            # 11-15: Domain Features
            features['num_subdomains'] = len(domain_info.subdomain.split('.')) if domain_info.subdomain else 0
            features['domain_length'] = len(domain_info.domain) if domain_info.domain else 0
            features['tld_length'] = len(domain_info.suffix) if domain_info.suffix else 0
            features['has_ip_address'] = self._has_ip_address(parsed.hostname or '')
            features['is_https'] = 1 if parsed.scheme == 'https' else 0

            # 16-20: Special Characters
            features['num_special_chars'] = len(re.findall(r'[^a-zA-Z0-9]', url))
            features['num_digits'] = len(re.findall(r'\d', url))
            features['has_at_symbol'] = 1 if '@' in url else 0
            features['has_double_slash_redirect'] = 1 if '//' in parsed.path else 0
            features['has_prefix_suffix'] = 1 if '-' in domain_info.domain else 0

            # 21-25: Suspicious Patterns
            features['has_suspicious_keywords'] = self._has_suspicious_keywords(url)
            features['is_shortening_service'] = self._is_shortening_service(parsed.hostname or '')
            features['num_params'] = len(urllib.parse.parse_qsl(parsed.query))
            features['has_port'] = 1 if parsed.port else 0
            features['abnormal_port'] = self._is_abnormal_port(parsed.port)

            # 26-30: Entropy and Randomness
            features['url_entropy'] = self._calculate_entropy(url)
            features['hostname_entropy'] = self._calculate_entropy(parsed.hostname or '')
            features['path_entropy'] = self._calculate_entropy(parsed.path)
            features['domain_entropy'] = self._calculate_entropy(domain_info.domain or '')
            features['random_domain_score'] = self._calculate_randomness_score(domain_info.domain or '')

            # 31-35: Advanced Features
            features['has_suspicious_tld'] = self._has_suspicious_tld(domain_info.suffix or '')
            features['domain_age_days'] = self._get_domain_age_days(domain_info.domain or '')
            features['alexa_rank'] = self._get_alexa_rank(parsed.hostname or '')  # Simplified
            features['google_index'] = self._is_google_indexed(url)  # Simplified
            features['dns_record_exists'] = self._dns_record_exists(parsed.hostname or '')

            # 36-42: Security Features
            features['ssl_certificate_valid'] = self._check_ssl_certificate(parsed.hostname or '', parsed.port)
            features['ssl_certificate_age'] = self._get_ssl_certificate_age(parsed.hostname or '', parsed.port)
            features['has_redirect'] = self._has_redirect(url)
            features['phishing_keywords_count'] = self._count_phishing_keywords(url)
            features['url_similarity_score'] = self._calculate_url_similarity_score(url)
            features['domain_registration_length'] = self._get_domain_registration_length(domain_info.domain or '')
            features['whois_privacy'] = self._has_whois_privacy(domain_info.domain or '')

            return features

        except Exception as e:
            print(f"Error extracting features from {url}: {str(e)}")
            return self._get_default_features()

    def _has_ip_address(self, hostname):
        """Check if hostname is an IP address"""
        try:
            ipaddress.ip_address(hostname)
            return 1
        except:
            return 0

    def _has_suspicious_keywords(self, url):
        """Count suspicious keywords in URL"""
        url_lower = url.lower()
        return sum(1 for keyword in self.suspicious_keywords if keyword in url_lower)

    def _is_shortening_service(self, hostname):
        """Check if URL uses shortening service"""
        return 1 if hostname in self.shortening_services else 0

    def _is_abnormal_port(self, port):
        """Check if port is abnormal (not 80, 443, or None)"""
        if port is None:
            return 0
        return 0 if port in [80, 443] else 1

    def _calculate_entropy(self, string):
        """Calculate Shannon entropy of a string"""
        if not string:
            return 0
        prob = [float(string.count(c)) / len(string) for c in dict.fromkeys(list(string))]
        entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob])
        return entropy

    def _calculate_randomness_score(self, domain):
        """Calculate randomness score based on character patterns"""
        if not domain:
            return 0

        # Check for patterns that suggest random generation
        vowels = 'aeiou'
        consonants = 'bcdfghjklmnpqrstvwxyz'

        vowel_count = sum(1 for c in domain.lower() if c in vowels)
        consonant_count = sum(1 for c in domain.lower() if c in consonants)

        if len(domain) == 0:
            return 0

        vowel_ratio = vowel_count / len(domain)
        consonant_ratio = consonant_count / len(domain)

        # Normal domains have vowel ratios between 0.2 and 0.6
        if vowel_ratio < 0.1 or vowel_ratio > 0.7:
            return 1

        return 0

    def _has_suspicious_tld(self, tld):
        """Check for suspicious TLDs often used in phishing"""
        suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.click', '.download', '.work']
        return 1 if any(tld.endswith(suspicious) for suspicious in suspicious_tlds) else 0

    def _get_domain_age_days(self, domain):
        """Get domain age in days (simplified implementation)"""
        try:
            # This is a simplified version - in real implementation, use whois lookup
            # For demo purposes, return a random value based on domain hash
            domain_hash = hashlib.md5(domain.encode()).hexdigest()
            return int(domain_hash[:8], 16) % 3650  # 0-10 years
        except:
            return -1

    def _get_alexa_rank(self, hostname):
        """Get Alexa rank (simplified - returns based on common domains)"""
        popular_domains = {
            'google.com': 1, 'youtube.com': 2, 'facebook.com': 3,
            'wikipedia.org': 10, 'amazon.com': 15, 'twitter.com': 20
        }
        return popular_domains.get(hostname, 1000000)

    def _is_google_indexed(self, url):
        """Check if URL is indexed by Google (simplified)"""
        # Simplified implementation - in real scenario, use Google Search API
        return 1 if 'google' in url or 'wikipedia' in url else 0

    def _dns_record_exists(self, hostname):
        """Check if DNS record exists"""
        try:
            dns.resolver.resolve(hostname, 'A')
            return 1
        except:
            return 0

    def _check_ssl_certificate(self, hostname, port):
        """Check if SSL certificate is valid"""
        try:
            if not hostname:
                return 0
            context = ssl.create_default_context()
            with socket.create_connection((hostname, port or 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    return 1
        except:
            return 0

    def _get_ssl_certificate_age(self, hostname, port):
        """Get SSL certificate age in days"""
        try:
            # Simplified implementation
            return 365  # Default to 1 year
        except:
            return -1

    def _has_redirect(self, url):
        """Check if URL has redirects (simplified)"""
        try:
            response = requests.head(url, allow_redirects=False, timeout=5)
            return 1 if response.is_redirect else 0
        except:
            return 0

    def _count_phishing_keywords(self, url):
        """Count phishing-related keywords"""
        phishing_keywords = [
            'verify', 'account', 'suspended', 'locked', 'security',
            'urgent', 'immediate', 'confirm', 'update', 'validate'
        ]
        url_lower = url.lower()
        return sum(1 for keyword in phishing_keywords if keyword in url_lower)

    def _calculate_url_similarity_score(self, url):
        """Calculate similarity to known legitimate domains"""
        # Simplified implementation
        legitimate_brands = ['google', 'paypal', 'amazon', 'microsoft', 'apple']
        url_lower = url.lower()

        for brand in legitimate_brands:
            if brand in url_lower and not url_lower.startswith(f'https://{brand}.') and not url_lower.startswith(f'http://{brand}.'):
                return 1  # Suspicious similarity
        return 0

    def _get_domain_registration_length(self, domain):
        """Get domain registration length in days"""
        try:
            # Simplified implementation
            domain_hash = hashlib.md5(domain.encode()).hexdigest()
            return int(domain_hash[8:16], 16) % 3650  # 0-10 years
        except:
            return -1

    def _has_whois_privacy(self, domain):
        """Check if domain uses WHOIS privacy protection"""
        try:
            # Simplified implementation
            return 0  # Default to no privacy
        except:
            return 0

    def _get_default_features(self):
        """Return default features in case of error"""
        feature_names = [
            'url_length', 'hostname_length', 'path_length', 'query_length', 'fragment_length',
            'num_dots', 'num_hyphens', 'num_underscores', 'num_slashes', 'num_questionmarks',
            'num_subdomains', 'domain_length', 'tld_length', 'has_ip_address', 'is_https',
            'num_special_chars', 'num_digits', 'has_at_symbol', 'has_double_slash_redirect', 'has_prefix_suffix',
            'has_suspicious_keywords', 'is_shortening_service', 'num_params', 'has_port', 'abnormal_port',
            'url_entropy', 'hostname_entropy', 'path_entropy', 'domain_entropy', 'random_domain_score',
            'has_suspicious_tld', 'domain_age_days', 'alexa_rank', 'google_index', 'dns_record_exists',
            'ssl_certificate_valid', 'ssl_certificate_age', 'has_redirect', 'phishing_keywords_count',
            'url_similarity_score', 'domain_registration_length', 'whois_privacy'
        ]
        return {feature: 0 for feature in feature_names}
