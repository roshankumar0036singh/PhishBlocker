import os
import secrets
import hashlib
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

# Simple API Key management for Phase 47
# In a full production system, these would be in a database (PostgreSQL/Redis)
# Here we'll use an environment-based master key or a generated list

class AuthManager:
    def __init__(self, master_key: Optional[str] = None):
        self.master_key = master_key or os.getenv("PHISHBLOCKER_API_MASTER_KEY")
        # For demo/local, if no key is set, we'll allow a default "dev_key_fixed_length_32_chars_long"
        if not self.master_key:
            self.master_key = "pb_dev_master_auth_token_secure_32"
            
    def verify_api_key(self, api_key: str) -> bool:
        """
        Verify if the provided API key is valid.
        Currently checks against the master key.
        """
        if not api_key:
            return False
            
        # Constant time comparison to prevent timing attacks
        # Added .strip() to handle potential whitespace from env/headers
        return secrets.compare_digest(api_key.strip(), self.master_key.strip())

    @staticmethod
    def generate_new_key() -> str:
        """Generate a secure new API key"""
        return secrets.token_urlsafe(32)

auth_manager = AuthManager()
