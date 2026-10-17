"""
Unit Tests for NPoS Dynamic Optimizer & Staking Pre-Flight Verifications
Verifies validator scoring, top 16 recommendation, Phragmén simulation, fee erosion, and async nonce manager.
"""

import unittest
from engine.npos_optimizer import NPoSOptimizer
from tests.conftest import MockLiveSubstrateClient


class TestNPoSOptimizerUnit(unittest.TestCase):
    def setUp(self):
        self.npos_optimizer = NPoSOptimizer()

    def test_npos_validator_scoring(self):
        """Verifies multi-factor scoring heavily penalizes 100% commission & oversubscription"""
        validators = self.npos_optimizer.scan_validators(force_refresh=True)
        self.assertGreater(len(validators), 0)

        for val in validators:
            if val["commission_pct"] >= 100.0 or val["is_oversubscribed"]:
                self.assertEqual(val["recommendation"], "REJECT_UNFAVORABLE")

    def test_npos_top_16_recommendation(self):
        """Verifies recommendation targets count satisfies NPoS constraints"""
        top_rec = self.npos_optimizer.get_top_16_recommendation()
        self.assertGreater(top_rec["top_validators_count"], 0)
        self.assertLessEqual(top_rec["top_validators_count"], 16)
        self.assertGreater(top_rec["auto_compounded_apy"], top_rec["average_nominal_apy"])
        self.assertIn("targets", top_rec)

    def test_npos_phragmen_and_preflight_checks(self):
        """Verifies Client-Side Sequential Phragmén Simulator and Fee Erosion pre-flight check"""
        # Sequential Phragmén simulation
        rec = self.npos_optimizer.get_top_16_recommendation()
        self.assertEqual(rec["election_algorithm"], "Client-Side Sequential Phragmén Simulator")
        self.assertEqual(len(rec["targets"]), 16)

        # Fee Erosion Check: Small profit < 3x fee must be rejected
        passed, reason = self.npos_optimizer.verify_pre_flight_nomination(
            bonded_stake_pot=100.0,
            expected_apy_gain_pct=0.0001,
            estimated_fee_pot=1.0
        )
        self.assertFalse(passed)
        self.assertIn("Fee Erosion", reason)

    def test_npos_election_window_lock_and_async_nonce_concurrency(self):
        """Verifies Election Window rejection and AsyncNonceManager guarantees sequential nonces"""
        class MockElectionActiveClient:
            def query(self, pallet, storage):
                class MockValue:
                    value = "Signed"
                return MockValue()

        rejected, reason = self.npos_optimizer.verify_pre_flight_nomination(
            bonded_stake_pot=1000.0,
            expected_apy_gain_pct=2.5,
            live_client=MockElectionActiveClient()
        )
        self.assertFalse(rejected)
        self.assertIn("Election Window is open", reason)

        # Test AsyncNonceManager concurrency
        test_account = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        nonce1 = self.npos_optimizer.nonce_manager.get_next_nonce(test_account)
        nonce2 = self.npos_optimizer.nonce_manager.get_next_nonce(test_account)
        nonce3 = self.npos_optimizer.nonce_manager.get_next_nonce(test_account)
        self.assertEqual(nonce2, nonce1 + 1)
        self.assertEqual(nonce3, nonce2 + 1)

    def test_npos_live_onchain_storage_query(self):
        """Test live on-chain Substrate storage query decoding and graceful fallback"""
        # 1. Fallback when disconnected
        optimizer = NPoSOptimizer(substrate_url="ws://127.0.0.1:99999")
        vals = optimizer.scan_validators(force_refresh=True)
        self.assertGreaterEqual(len(vals), 16, "Must fallback to deterministic candidate pool")
        self.assertIn("health_score", vals[0])

        # 2. Live storage decoding via mock client from conftest
        mock_client = MockLiveSubstrateClient()
        live_vals = optimizer._fetch_live_validators_from_chain(mock_client, "0xabcd1234")
        self.assertEqual(len(live_vals), 2, "Must decode exactly 2 active validators from Session.Validators")

        v0 = live_vals[0]
        self.assertEqual(v0["stash_address"], "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
        self.assertEqual(v0["commission_pct"], 2.5, "Commission Perbill 25,000,000 must convert to 2.5%")
        self.assertEqual(v0["nominator_count"], 99)
        self.assertEqual(v0["total_stake_pot"], 1250000.0)
        self.assertEqual(v0["era_points"], 19500)

    def test_pao_phragmen_algorithm_and_rugpull_detection(self):
        """Verifies PAO-Phragmén Stake Safety Margin M_v(u), Rug-Pull penalty, and objective score"""
        # 1. High Headroom Safe Validator
        safe_val = {
            "identity": "Secure-Whale-Proof-Node",
            "commission_pct": 2.0,
            "estimated_apy": 15.0,
            "slash_count": 0,
            "min_rewarded_stake_pot": 100.0,
            "median_stake_pot": 5000.0,
            "commission_history": [2.0, 2.0, 2.0],
            "is_oversubscribed": False
        }
        pao_safe = self.npos_optimizer.compute_pao_phragmen_score(safe_val, user_stake_pot=10000.0)
        self.assertGreater(pao_safe["safety_margin_mvu"], 1.5)
        self.assertEqual(pao_safe["safety_margin_rating"], "SECURE_WHALE_RESISTANT")
        self.assertFalse(pao_safe["is_rugpull_risk"])
        self.assertGreater(pao_safe["pao_score"], 10.0)

        # 2. Critical Eviction Risk (User stake below minimum rewarded threshold)
        small_stake_val = {
            "identity": "Whale-Heavy-Node",
            "commission_pct": 2.0,
            "estimated_apy": 15.0,
            "slash_count": 0,
            "min_rewarded_stake_pot": 500.0,
            "median_stake_pot": 8000.0,
            "commission_history": [2.0, 2.0],
            "is_oversubscribed": False
        }
        pao_small = self.npos_optimizer.compute_pao_phragmen_score(small_stake_val, user_stake_pot=200.0)
        self.assertLessEqual(pao_small["safety_margin_mvu"], 0.0)
        self.assertEqual(pao_small["safety_margin_rating"], "CRITICAL_EVICTION_RISK")
        self.assertEqual(pao_small["pao_score"], 0.0)

        # 3. Commission Rug-Pull Detection (Node bait-and-switch: 0% -> 25% or 100%)
        rugpull_val = {
            "identity": "Bait-And-Switch-Validator",
            "commission_pct": 25.0,
            "estimated_apy": 15.0,
            "slash_count": 0,
            "min_rewarded_stake_pot": 100.0,
            "median_stake_pot": 5000.0,
            "commission_history": [0.0, 0.0, 25.0],
            "is_oversubscribed": False
        }
        pao_rug = self.npos_optimizer.compute_pao_phragmen_score(rugpull_val, user_stake_pot=10000.0)
        self.assertTrue(pao_rug["is_rugpull_risk"])
        self.assertGreaterEqual(pao_rug["rugpull_penalty"], 0.85)

        # 4. Verified in Top 16 recommendation payload
        rec = self.npos_optimizer.get_top_16_recommendation()
        self.assertTrue(rec.get("pao_phragmen_active"))
        self.assertIn("pao_algorithm_name", rec)
        self.assertIn("pao_metrics", rec["validators"][0])


if __name__ == "__main__":
    unittest.main()
