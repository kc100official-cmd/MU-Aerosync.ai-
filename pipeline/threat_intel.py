import json
from typing import Dict, Any, Optional

class ThreatIntelDatabase:
    """
    Threat Intelligence knowledge base containing known malicious wallet signatures,
    cybercrime syndicate attribution profiles, mixer addresses, and exchange off-ramps.
    """

    KNOWN_ENTITIES = {
        # Tornado Cash Mixers
        "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b": {
            "entity": "Tornado Cash Router",
            "category": "MIXER",
            "risk": 98,
            "sanctioned": True,
            "details": "OFAC Sanctioned smart contract mixer"
        },
        "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936": {
            "entity": "Tornado Cash 0.1 ETH",
            "category": "MIXER",
            "risk": 95,
            "sanctioned": True,
            "details": "Tornado Cash anonymity pool"
        },
        "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf": {
            "entity": "Tornado Cash 1 ETH",
            "category": "MIXER",
            "risk": 95,
            "sanctioned": True,
            "details": "Tornado Cash anonymity pool"
        },
        "0xa160ba730345f3275467007266e351342770b258": {
            "entity": "Tornado Cash 10 ETH",
            "category": "MIXER",
            "risk": 95,
            "sanctioned": True,
            "details": "Tornado Cash anonymity pool"
        },
        "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc": {
            "entity": "Tornado Cash 100 ETH",
            "category": "MIXER",
            "risk": 95,
            "sanctioned": True,
            "details": "Tornado Cash anonymity pool"
        },

        # Instant No-KYC Swaps / Bridges commonly abused by drainers
        "0x35653606f7df160deeaec21dd51a1936c507a2a0": {
            "entity": "FixedFloat Automated Liquidity",
            "category": "NO_KYC_SWAP",
            "risk": 75,
            "sanctioned": False,
            "details": "High-velocity non-custodial swap frequently observed in drainer laundering hops"
        },
        "0x6b175474e89094c44da98b954eedeac495271d0f": {
            "entity": "MakerDAO DAI Vault",
            "category": "DEFI",
            "risk": 15,
            "sanctioned": False,
            "details": "Legitimate DeFi lending pool"
        },

        # Known Centralized Exchange (CEX) Deposit Hot Wallets
        "0x28c6c06298d514db089934071355e5743bf21d60": {
            "entity": "Binance 14",
            "category": "CEX_EXCHANGE",
            "risk": 30,
            "sanctioned": False,
            "details": "Binance Centralized Exchange Hot Wallet (Potential Off-Ramp)"
        },
        "0x21a31ee1afc51d94c2efccaa2092ad1028285549": {
            "entity": "Binance 15",
            "category": "CEX_EXCHANGE",
            "risk": 30,
            "sanctioned": False,
            "details": "Binance Centralized Exchange Hot Wallet (Potential Off-Ramp)"
        },
        "0x503828976d22510aad0201ac7ec88293211d23da": {
            "entity": "Coinbase 1",
            "category": "CEX_EXCHANGE",
            "risk": 20,
            "sanctioned": False,
            "details": "Coinbase Hot Wallet (Potential Off-Ramp)"
        },
        "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43": {
            "entity": "Coinbase 10",
            "category": "CEX_EXCHANGE",
            "risk": 20,
            "sanctioned": False,
            "details": "Coinbase Hot Wallet (Potential Off-Ramp)"
        },
        "0x2faf487a4414fe30e230961afea6568b3c1d8de7": {
            "entity": "Kraken Hot Wallet",
            "category": "CEX_EXCHANGE",
            "risk": 25,
            "sanctioned": False,
            "details": "Kraken Centralized Exchange (Potential Off-Ramp)"
        },
        "0x70faa28a6b8d6829a4b1e649d26ec9a2a39ba413": {
            "entity": "OKX Hot Wallet",
            "category": "CEX_EXCHANGE",
            "risk": 30,
            "sanctioned": False,
            "details": "OKX Exchange (Potential Off-Ramp)"
        },

        # Advanced Threat Actors & Drainers
        "0x0948564949f059caeb7546513470ffbd4a6e8df8": {
            "entity": "Inferno Drainer Cluster Alpha",
            "category": "PHISHING_DRAINER",
            "risk": 99,
            "sanctioned": False,
            "details": "Malicious Permit2 / Approve drainer infrastructure"
        },
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
            "entity": "USD Coin (USDC) Contract",
            "category": "STABLECOIN",
            "risk": 5,
            "sanctioned": False,
            "details": "Centre Consortium USDC ERC-20 token contract"
        }
    }

    THREAT_ACTOR_PROFILES = {
        "INFERNO_DRAINER": {
            "name": "Inferno Drainer Cybercrime Syndicate",
            "description": "Prolific phishing and Permit2 authorization drainer suite specializing in NFT and multi-token sweeps.",
            "signatures": ["permit2_sweep", "scatter_gather_3hop", "instant_dex_swap"]
        },
        "PINK_DRAINER": {
            "name": "Pink Drainer / Angel Syndicate",
            "description": "Social engineering and Discord compromise drainer with aggressive peel-chain laundering.",
            "signatures": ["discord_clickjacking", "peeling_chain", "tornado_funnel"]
        },
        "LAZARUS_GROUP": {
            "name": "Lazarus Group (APT38 / TraderTraitor)",
            "description": "State-sponsored North Korean cyber operations known for Ronin Bridge, Harmony Horizon, and Bybit exploitations.",
            "signatures": ["cross_chain_bridge_hop", "sinbad_mixer", "railgun_layering"]
        },
        "LOCKBIT_RANSOMWARE": {
            "name": "LockBit 3.0 Ransomware Affiliates",
            "description": "Ransomware extortion group demanding payment in BTC/Monero and laundering via decentralized instant swaps.",
            "signatures": ["ransom_extortion", "utxo_peel_chain", "split_merge_cascade"]
        }
    }

    @classmethod
    def lookup_address(cls, address: str) -> Optional[Dict[str, Any]]:
        addr = address.lower().strip()
        return cls.KNOWN_ENTITIES.get(addr, None)
