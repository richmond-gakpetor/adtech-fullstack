import httpx
import hmac
import hashlib
from typing import Dict, Any, Optional
from app.config import settings
from app.core.exceptions import PaymentException, ServiceUnavailableException


class PaystackService:
    """Paystack payment gateway integration"""
    
    BASE_URL = "https://api.paystack.co"
    
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.public_key = settings.PAYSTACK_PUBLIC_KEY
        self.webhook_secret = settings.PAYSTACK_WEBHOOK_SECRET
        
    def _get_headers(self) -> Dict[str, str]:
        """Get authorization headers for Paystack API"""
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    async def initialize_transaction(
        self,
        email: str,
        amount_pesewas: int,
        reference: str,
        callback_url: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Initialize a Paystack transaction
        
        Args:
            email: Customer email
            amount_pesewas: Amount in pesewas (GHS * 100)
            reference: Unique payment reference
            callback_url: URL to redirect after payment
            metadata: Additional metadata
            
        Returns:
            Dict with authorization_url, access_code, and reference
        """
        payload = {
            "email": email,
            "amount": amount_pesewas,
            "currency": "GHS",
            "reference": reference,
            "callback_url": callback_url,
            "metadata": metadata or {}
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/transaction/initialize",
                    json=payload,
                    headers=self._get_headers(),
                    timeout=30.0
                )
                
                result = response.json()
                
                if not result.get("status"):
                    raise PaymentException(
                        detail=result.get("message", "Payment initialization failed")
                    )
                
                return result["data"]
                
        except httpx.TimeoutException:
            raise ServiceUnavailableException(
                detail="Payment gateway timeout. Please try again."
            )
        except httpx.HTTPError as e:
            raise ServiceUnavailableException(
                detail=f"Payment gateway error: {str(e)}"
            )
    
    async def verify_transaction(self, reference: str) -> Dict[str, Any]:
        """
        Verify a Paystack transaction
        
        Args:
            reference: Payment reference to verify
            
        Returns:
            Dict with transaction details
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/transaction/verify/{reference}",
                    headers=self._get_headers(),
                    timeout=30.0
                )
                
                result = response.json()
                
                if not result.get("status"):
                    raise PaymentException(
                        detail=result.get("message", "Payment verification failed")
                    )
                
                return result["data"]
                
        except httpx.TimeoutException:
            raise ServiceUnavailableException(
                detail="Payment gateway timeout. Please try again."
            )
        except httpx.HTTPError as e:
            raise ServiceUnavailableException(
                detail=f"Payment gateway error: {str(e)}"
            )
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Paystack webhook signature
        
        Args:
            payload: Raw request body
            signature: X-Paystack-Signature header value
            
        Returns:
            True if signature is valid, False otherwise
        """
        if not self.webhook_secret:
            return False
        
        computed_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature, signature)
    
    @staticmethod
    def generate_reference(prefix: str = "XP") -> str:
        """
        Generate a unique payment reference
        
        Args:
            prefix: Reference prefix (default: "XP")
            
        Returns:
            Unique reference string
        """
        import time
        import random
        import string
        
        timestamp = int(time.time() * 1000)  # Milliseconds
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        return f"{prefix}_{timestamp}_{random_str}"
    
    @staticmethod
    def convert_to_pesewas(amount_ghs: float) -> int:
        """Convert GHS to pesewas"""
        return int(round(amount_ghs * 100))
    
    @staticmethod
    def convert_to_ghs(amount_pesewas: int) -> float:
        """Convert pesewas to GHS"""
        return amount_pesewas / 100


paystack_service = PaystackService()
