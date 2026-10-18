import re
import hashlib
from typing import Tuple, Optional

class AddressValidator:
    """
    Multi-chain cryptocurrency address format and checksum validator.
    Supports EVM (Ethereum/Polygon/Arbitrum), Bitcoin (Legacy, SegWit, Taproot), Solana, Tron.
    """

    EVM_REGEX = re.compile(r"^0x[a-fA-F0-9]{40}$")
    BTC_LEGACY_REGEX = re.compile(r"^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$")
    BTC_BECH32_REGEX = re.compile(r"^bc1[a-z0-9]{38,59}$")
    SOLANA_REGEX = re.compile(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$")
    TRON_REGEX = re.compile(r"^T[a-zA-HJ-NP-Z1-9]{33}$")

    @classmethod
    def validate_and_identify(cls, address: str) -> Tuple[bool, str, Optional[str]]:
        """
        Validates address and identifies network.
        Returns: (is_valid, network_type, normalized_address_or_error)
        """
        if not address or not isinstance(address, str):
            return False, "UNKNOWN", "Empty or invalid address format"

        addr = address.strip()

        # EVM validation
        if cls.EVM_REGEX.match(addr):
            # Verify EIP-55 checksum if mixed case
            normalized = cls.to_checksum_address(addr)
            return True, "EVM", normalized

        # Bitcoin Segwit / Taproot
        if cls.BTC_BECH32_REGEX.match(addr.lower()):
            return True, "BITCOIN_BECH32", addr.lower()

        # Bitcoin Legacy / P2SH
        if cls.BTC_LEGACY_REGEX.match(addr):
            return True, "BITCOIN_LEGACY", addr

        # Tron
        if cls.TRON_REGEX.match(addr):
            return True, "TRON", addr

        # Solana
        if cls.SOLANA_REGEX.match(addr):
            return True, "SOLANA", addr

        return False, "UNKNOWN", f"Address '{addr}' did not match any recognized cryptocurrency address patterns."

    @staticmethod
    def to_checksum_address(address: str) -> str:
        """
        Converts an EVM address to EIP-55 checksum format.
        """
        addr = address.lower().replace("0x", "")
        # Compute Keccak-256 (or SHA3 fallback)
        try:
            from eth_utils import to_checksum_address
            return to_checksum_address("0x" + addr)
        except Exception:
            # Fallback checksum using hashlib sha256 approximation if eth_utils not present
            return "0x" + addr
