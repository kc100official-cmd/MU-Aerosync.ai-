import unittest
import os
import json
from pipeline.address_validator import AddressValidator
from pipeline.cpp_engine_bridge import CPPEngineBridge
from pipeline.ai_risk_scorer import AIRiskScorer
from pipeline.report_generator import ForensicReportGenerator
from anchor.anchor_service import BlockchainAnchorService

class TestChainForensixPipeline(unittest.TestCase):

    def test_address_validator(self):
        # Valid EVM
        ok, net, norm = AddressValidator.validate_and_identify("0x71c7656ec7ab88b098defb751b7401b5f6d8976f")
        self.assertTrue(ok)
        self.assertEqual(net, "EVM")
        self.assertTrue(norm.startswith("0x"))

        # Valid Bitcoin Bech32
        ok_btc, net_btc, norm_btc = AddressValidator.validate_and_identify("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")
        self.assertTrue(ok_btc)
        self.assertEqual(net_btc, "BITCOIN_BECH32")

        # Invalid Address
        bad_ok, bad_net, _ = AddressValidator.validate_and_identify("0xinvalidxyz")
        self.assertFalse(bad_ok)

    def test_cpp_engine_and_attribution(self):
        sample_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "sample_data",
            "drainer_incident.json"
        )
        self.assertTrue(os.path.exists(sample_path))

        with open(sample_path, "r") as f:
            sample = json.load(f)

        bridge = CPPEngineBridge()
        graph = bridge.trace_graph(
            seed_address=sample["suspect_address"],
            transactions=sample["transactions"],
            max_depth=4
        )

        self.assertGreaterEqual(graph["discovered_nodes_count"], 2)
        self.assertGreaterEqual(graph["discovered_edges_count"], 1)

        # AI Scorer
        scorer = AIRiskScorer()
        eval_result = scorer.evaluate_graph(graph, sample)
        self.assertIn("risk_score", eval_result)
        self.assertGreaterEqual(eval_result["risk_score"], 60)
        self.assertEqual(eval_result["attribution"]["actor"], "Inferno Drainer Syndicate")

        # Report Generator
        dossier = ForensicReportGenerator.generate_dossier(sample, graph, eval_result)
        self.assertIn("report_hash", dossier)
        self.assertTrue(dossier["report_hash"].startswith("0x"))

        # Anchor Service
        anchor = BlockchainAnchorService()
        receipt = anchor.anchor_dossier(dossier)
        self.assertTrue(receipt["success"])
        self.assertIn("tx_hash", receipt["receipt"])

        # Verification check
        verify = anchor.verify_on_chain(dossier["case_id"], dossier["report_hash"])
        self.assertTrue(verify["verified"])

if __name__ == "__main__":
    unittest.main()
