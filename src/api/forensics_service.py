"""
Forensics Service for PhishBlocker
Handles domain age detection and email security records (SPF, DKIM, DMARC)
"""

import whois
import dns.resolver
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
import urllib.parse

logger = logging.getLogger(__name__)

class ForensicsService:
    """
    Forensic analysis for domains and email security
    """
    
    @staticmethod
    async def get_domain_age(domain: str) -> Dict[str, Any]:
        """
        Get the age of a domain using WHOIS
        """
        try:
            # Clean domain
            if "://" in domain:
                domain = urllib.parse.urlparse(domain).netloc
            
            w = whois.whois(domain)
            creation_date = w.creation_date
            
            # Handle multiple dates (whois sometimes returns a list)
            if isinstance(creation_date, list):
                creation_date = creation_date[0]
            
            if not creation_date:
                return {"status": "unknown", "message": "Creation date not found"}

            age_delta = datetime.now() - creation_date
            age_days = age_delta.days
            
            return {
                "status": "success",
                "domain": domain,
                "creation_date": creation_date.isoformat(),
                "age_days": age_days,
                "is_fresh": age_days < 2  # Less than 48 hours
            }
        except Exception as e:
            logger.error(f"WHOIS lookup failed for {domain}: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    async def check_email_security(domain: str) -> Dict[str, Any]:
        """
        Check SPF, DMARC, and basic DNS-level security records
        """
        results = {
            "domain": domain,
            "spf": {"status": "missing", "record": None},
            "dmarc": {"status": "missing", "record": None},
            "risk_level": "unknown"
        }
        
        try:
            # Check SPF
            try:
                spf_records = dns.resolver.resolve(domain, 'TXT')
                for rdata in spf_records:
                    txt = str(rdata)
                    if "v=spf1" in txt:
                        results["spf"] = {"status": "valid", "record": txt}
                        break
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
                pass
            
            # Check DMARC
            try:
                dmarc_records = dns.resolver.resolve(f"_dmarc.{domain}", 'TXT')
                for rdata in dmarc_records:
                    txt = str(rdata)
                    if "v=DMARC1" in txt:
                        results["dmarc"] = {"status": "valid", "record": txt}
                        break
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
                pass
            
            # Simple risk heuristic
            if results["spf"]["status"] == "missing" or results["dmarc"]["status"] == "missing":
                results["risk_level"] = "high"
            else:
                results["risk_level"] = "low"
                
            return results
            
        except Exception as e:
            logger.error(f"DNS forensic check failed for {domain}: {e}")
            return {"status": "error", "message": str(e)}

# Global instance
forensics = ForensicsService()
