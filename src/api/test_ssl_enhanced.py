import asyncio
import os
import sys

# Ensure src is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.api.ssl_analyzer import SSLCertificateAnalyzer

async def test_ssl_analyzer():
    from datetime import datetime, timedelta
    analyzer = SSLCertificateAnalyzer()
    
    print("--- Testing Real URL (google.com) ---")
    res1 = analyzer.analyze_certificate("https://google.com")
    print(f"Has SSL: {res1.get('has_ssl')}")
    print(f"Is Valid: {res1.get('is_valid')}")
    print(f"Issuer: {res1.get('issuer')}")
    print(f"Risk Score: {res1.get('risk_score')}")
    print(f"Warnings: {res1.get('warnings')}")
    
    print("\n--- Testing HTTP URL (insecure) ---")
    res2 = analyzer.analyze_certificate("http://example.com")
    print(f"Has SSL: {res2.get('has_ssl')}")
    print(f"Warnings: {res2.get('warnings')}")
    
    print("\n--- Testing Potential Phishing Indicators (Free CA + New) ---")
    # We can't easily mock a live socket certificate here without complex mocking,
    # but we can test the internal risk score logic by passing a mock cert dict
    mock_cert = {
        'subject': ((('commonName', 'phishing-site.com'),),),
        'issuer': ((('commonName', 'Let\'s Encrypt Authority X3'),),),
        'notBefore': (datetime.now() - timedelta(days=2)).strftime('%b %d %H:%M:%S %Y GMT'),
        'notAfter': (datetime.now() + timedelta(days=88)).strftime('%b %d %H:%M:%S %Y GMT'),
        'subjectAltName': (('DNS', 'phishing-site.com'), ('DNS', 'www.phishing-site.com'))
    }
    
    # Internal logic check
    validity = analyzer._check_validity(mock_cert)
    age = analyzer._calculate_age(mock_cert)
    is_free = analyzer._is_free_ca(mock_cert)
    match = analyzer._check_subject_match(mock_cert, 'phishing-site.com')
    
    risk = analyzer._calculate_risk_score(validity, age, True, match, is_free)
    print(f"Mock Phishing Cert Risk Score: {risk}")
    print(f"Is Free CA: {is_free}")
    print(f"Warnings: {analyzer._get_warnings(validity, age, True, match, is_free)}")

if __name__ == "__main__":
    asyncio.run(test_ssl_analyzer())
