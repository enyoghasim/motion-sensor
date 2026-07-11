import logging
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.exceptions import InvalidSignature

logger = logging.getLogger(__name__)

class CryptoService:
    @staticmethod
    def verify_ed25519_signature(public_key_hex: str, message: bytes, signature_hex: str) -> bool:
        """
        Verifies an Ed25519 signature.
        
        :param public_key_hex: 64-character hex string representing the 32-byte public key
        :param message: The raw bytes that were signed
        :param signature_hex: 128-character hex string representing the 64-byte signature
        :return: True if valid, False otherwise
        """
        try:
            public_key_bytes = bytes.fromhex(public_key_hex)
            signature_bytes = bytes.fromhex(signature_hex)
            
            if len(public_key_bytes) != 32:
                logger.error(f"Invalid public key length: {len(public_key_bytes)}")
                return False
                
            if len(signature_bytes) != 64:
                logger.error(f"Invalid signature length: {len(signature_bytes)}")
                return False

            public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
            public_key.verify(signature_bytes, message)
            return True
        except ValueError as e:
            logger.error(f"Hex decoding error: {e}")
            return False
        except InvalidSignature:
            logger.warning("Invalid signature")
            return False
        except Exception as e:
            logger.error(f"Unexpected crypto error: {e}")
            return False
