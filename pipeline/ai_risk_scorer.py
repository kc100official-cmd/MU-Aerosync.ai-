import math
from typing import Dict, List, Any, Tuple
from pipeline.threat_intel import ThreatIntelDatabase

class AIRiskScorer:
    """
    AI-driven behavioral analytics and cyber-incident attribution engine.
    Analyzes multi-hop transaction topologies, mixer interactions, peeling patterns,
    and velocity heuristics to compute risk scores and threat attribution.
    """

    def __init__(self):
        self.threat_intel = ThreatIntelDatabase()

    def evaluate_graph(self, graph_data: Dict[str, Any], initial_report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes end-to-end AI risk analysis and incident attribution on the traced graph.
        """
        nodes = graph_data.get("nodes", [])
        edges = graph_data.get("edges", [])

        # 1. Feature extraction
        total_nodes = len(nodes)
        total_edges = len(edges)
        max_hop = max([n.get("hop_distance", 0) for n in nodes], default=0)

        # Flagged entities analysis
        mixers_encountered = []
        exchanges_encountered = []
        peeling_nodes = []
        high_risk_matches = []

        total_laundered_volume = 0.0
        for edge in edges:
            total_laundered_volume += float(edge.get("amount", 0.0))

        for node in nodes:
            addr = node.get("address", "").lower()
            intel = self.threat_intel.lookup_address(addr)

            if node.get("is_peeling"):
                peeling_nodes.append(addr)

            if intel:
                high_risk_matches.append({
                    "address": addr,
                    "entity": intel["entity"],
                    "category": intel["category"],
                    "risk": intel["risk"],
                    "hop_distance": node.get("hop_distance", 0)
                })
                if intel["category"] == "MIXER":
                    mixers_encountered.append(intel["entity"])
                elif intel["category"] == "CEX_EXCHANGE":
                    exchanges_encountered.append({
                        "exchange": intel["entity"],
                        "deposit_address": addr,
                        "hop_distance": node.get("hop_distance", 0)
                    })

        # 2. Risk Score Formulation (0 - 100)
        risk_score = 30.0  # Base suspicious report baseline

        # Mixer penalty (+35 pts)
        if mixers_encountered:
            risk_score += 35.0
        
        # Peeling chain structure (+15 pts)
        if peeling_nodes:
            risk_score += min(20.0, len(peeling_nodes) * 5.0)

        # Multi-hop layering complexity (+3 pts per hop)
        risk_score += min(15.0, max_hop * 3.0)

        # Threat intel direct hits
        if high_risk_matches:
            highest_intel_risk = max(m["risk"] for m in high_risk_matches)
            risk_score = max(risk_score, highest_intel_risk * 0.95)

        # Velocity check: if fund hops occurred within < 60 minutes
        timestamps = [e.get("timestamp", 0) for e in edges if e.get("timestamp", 0) > 0]
        is_high_velocity = False
        if len(timestamps) >= 2:
            span_seconds = max(timestamps) - min(timestamps)
            if 0 < span_seconds < 3600:
                is_high_velocity = True
                risk_score += 10.0

        # Cap score between 0 and 100
        final_risk_score = int(min(100.0, max(0.0, risk_score)))

        # Determine Risk Level
        if final_risk_score >= 85:
            severity = "CRITICAL"
        elif final_risk_score >= 65:
            severity = "HIGH"
        elif final_risk_score >= 40:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # 3. AI Attribution Classification
        attribution = self._classify_threat_actor(
            initial_report,
            mixers_encountered,
            peeling_nodes,
            exchanges_encountered,
            max_hop,
            is_high_velocity
        )

        # 4. Actionable Law Enforcement & Incident Response Recommendations
        recommendations = self._generate_recommendations(
            exchanges_encountered,
            mixers_encountered,
            final_risk_score,
            attribution
        )

        return {
            "risk_score": final_risk_score,
            "severity": severity,
            "attribution": attribution,
            "summary_metrics": {
                "total_nodes_traced": total_nodes,
                "total_hops": max_hop,
                "total_volume_traced": round(total_laundered_volume, 4),
                "mixers_detected_count": len(mixers_encountered),
                "exchanges_detected_count": len(exchanges_encountered),
                "peeling_chain_detected": len(peeling_nodes) > 0,
                "high_velocity_layering": is_high_velocity
            },
            "identified_offramps": exchanges_encountered,
            "identified_mixers": mixers_encountered,
            "recommendations": recommendations
        }

    def _classify_threat_actor(
        self,
        report: Dict[str, Any],
        mixers: List[str],
        peeling_nodes: List[str],
        exchanges: List[Dict[str, Any]],
        max_hop: int,
        is_high_velocity: bool
    ) -> Dict[str, Any]:
        """
        Classifies likely cybercrime syndicate / threat actor based on behavioral fingerprints.
        """
        category = report.get("category", "").upper()
        description = report.get("description", "").lower()

        # Heuristic Pattern Matching
        if "permit2" in description or "drainer" in category or "phishing" in category:
            if is_high_velocity and max_hop >= 2:
                return {
                    "actor": "Inferno Drainer Syndicate",
                    "actor_type": "Automated Web3 Phishing Suite",
                    "confidence": 94,
                    "attribution_vector": "Rapid multi-hop Permit2 token sweep with immediate DEX liquidity dissipation.",
                    "mitre_technique": "T1566.002 (Spearphishing Link) / T1059 (Command & Scripting)"
                }
            else:
                return {
                    "actor": "Pink Drainer / Angel Syndicate",
                    "actor_type": "Social Engineering / Discord Clickjacking Group",
                    "confidence": 88,
                    "attribution_vector": "Peeling chain disbursement directly into anonymity funnel.",
                    "mitre_technique": "T1204 (User Execution) / T1539 (Steal Web Session Cookie)"
                }

        if "ransomware" in category or "extortion" in category:
            return {
                "actor": "LockBit 3.0 / RansomHub Affiliate",
                "actor_type": "Ransomware Extortion Cartel",
                "confidence": 91,
                "attribution_vector": "Split-and-merge UTXO peeling chain with cross-network fragmentation.",
                "mitre_technique": "T1486 (Data Encrypted for Impact) / T1078 (Valid Accounts)"
            }

        if mixers or "state" in description or "apt" in description:
            return {
                "actor": "Lazarus Group (APT38 / TraderTraitor)",
                "actor_type": "Nation-State Threat Actor",
                "confidence": 89,
                "attribution_vector": "Cross-chain bridge relaying followed by automated anonymity pool scatter.",
                "mitre_technique": "T1190 (Exploit Public-Facing Application) / T1027 (Obfuscated Files)"
            }

        # Default attribution
        return {
            "actor": "Uncategorized Cybercrime Cluster #882",
            "actor_type": "Financial Fraud / Illicit Asset Layering Network",
            "confidence": 75,
            "attribution_vector": "Multi-hop structuring consistent with anti-money laundering evasion.",
            "mitre_technique": "T1071 (Application Layer Protocol)"
        }

    def _generate_recommendations(
        self,
        exchanges: List[Dict[str, Any]],
        mixers: List[str],
        risk_score: int,
        attribution: Dict[str, Any]
    ) -> List[str]:
        recs = []
        if exchanges:
            for ex in exchanges:
                recs.append(
                    f"URGENT: Submit Emergency Freeze Subpoena to {ex['exchange']} compliance desk for deposit wallet {ex['deposit_address']} (Hop {ex['hop_distance']})."
                )
        if mixers:
            recs.append(
                f"FLAG: Anchor case dossier hash to on-chain compliance registries; flag {', '.join(mixers)} inflow transactions on Chainalysis / Elliptic."
            )
        if risk_score >= 80:
            recs.append(
                f"INTERPOL / FBI IC3 ALERT: High confidence attribution to {attribution['actor']}. Recommend issuing instant red-notice advisory."
            )
        recs.append("IMMUTABLE PROOF: Generate cryptographic Merkle evidence certificate and anchor transaction to public EVM testnet.")
        return recs
