"""
Unit Tests for NPoS Dynamic Optimizer & Staking Pre-Flight Verifications
Verifies validator scoring, top 16 recommendation, PAO-Phragmén simulation,
rug-pull detection, fee erosion, and async nonce manager.
"""

import unittest
from engine.npos_optimizer import NPoSOptimizer, AsyncNonceManager
from tests.conftest import MockLiveSubstrateClient


class TestNPoSOptimizerUnit(unittest.TestCase):
    def setUp(self):
        # Use offline loopback endpoint to avoid live network I/O
        self.npos_optimizer = NPoSOptimizer(substrate_url="ws://127.0.0.1:99999")

    def test_nonce_manager_initial_nonce_zero(self):
        """Verifies AsyncNonceManager starts uninitialized accounts at nonce 0"""
        mgr = AsyncNonceManager()
        account = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        self.assertEqual(mgr.get_next_nonce(account), 0)

    def test_nonce_manager_sequential_increment(self):
        """Verifies AsyncNonceManager increments nonce strictly sequentially"""
        mgr = AsyncNonceManager()
        account = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        n0 = mgr.get_next_nonce(account)
        n1 = mgr.get_next_nonce(account)
        n2 = mgr.get_next_nonce(account)
        self.assertEqual(n1, n0 + 1)
        self.assertEqual(n2, n1 + 1)

    def test_nonce_manager_distinct_accounts(self):
        """Verifies different accounts have independent nonce sequences"""
        mgr = AsyncNonceManager()
        acc1 = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        acc2 = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
        mgr.get_next_nonce(acc1)
        mgr.get_next_nonce(acc1)
        self.assertEqual(mgr.get_next_nonce(acc2), 0)

    def test_nonce_manager_async_lock_retrieval(self):
        """Verifies per-account async Lock retrieval"""
        mgr = AsyncNonceManager()
        lock = mgr.get_lock("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
        self.assertIsNotNone(lock)

    def test_nonce_manager_live_client_query(self):
        """Verifies RPC query to system_accountNextIndex when client is supplied"""
        mgr = AsyncNonceManager()
        class MockRpcClient:
            def rpc_request(self, method, params):
                return {"result": 42}
        nonce = mgr.get_next_nonce("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", live_client=MockRpcClient())
        self.assertEqual(nonce, 42)

    def test_preflight_negative_stake_rejected(self):
        """Verifies non-positive stake amounts are rejected by pre-flight fee erosion check"""
        passed, reason = self.npos_optimizer.verify_pre_flight_nomination(
            bonded_stake_pot=0.0,
            expected_apy_gain_pct=5.0
        )
        self.assertFalse(passed)
        self.assertIn("Fee Erosion", reason)

    def test_preflight_election_window_active_rejected(self):
        """Verifies nomination is rejected when Election Window is open on-chain"""
        class MockElectionActiveClient:
            def query(self, pallet, storage):
                class MockValue:
                    value = "Signed"
                return MockValue()

        passed, reason = self.npos_optimizer.verify_pre_flight_nomination(
            bonded_stake_pot=1000.0,
            expected_apy_gain_pct=2.5,
            live_client=MockElectionActiveClient()
        )
        self.assertFalse(passed)
        self.assertIn("Election Window is open", reason)

    def test_preflight_fee_erosion_small_profit_rejected(self):
        """Verifies small profit gain < 3x transaction fee is rejected due to Fee Erosion"""
        passed, reason = self.npos_optimizer.verify_pre_flight_nomination(
            bonded_stake_pot=10.0,
            expected_apy_gain_pct=0.0001,
            estimated_fee_pot=1.0
        )
        self.assertFalse(passed)
        self.assertIn("Fee Erosion", reason)

    def test_preflight_valid_nomination_accepted(self):
        """Verifies profitable nomination outside election window passes pre-flight checks"""
        passed, reason = self.npos_optimizer.verify_pre_flight_nomination(
            bonded_stake_pot=10000.0,
            expected_apy_gain_pct=5.0,
            estimated_fee_pot=0.015
        )
        self.assertTrue(passed)
        self.assertIn("passed", reason)

    def test_pao_phragmen_high_headroom_score(self):
        """Verifies high user stake headroom produces positive margin score"""
        val = {
            "identity": "Node-A",
            "commission_pct": 2.0,
            "estimated_apy": 15.0,
            "slash_count": 0,
            "min_rewarded_stake_pot": 100.0,
            "median_stake_pot": 500.0
        }
        res = self.npos_optimizer.compute_pao_phragmen_score(val, user_stake_pot=1000.0)
        self.assertGreater(res["safety_margin_mvu"], 0.5)
        self.assertEqual(res["safety_margin_rating"], "SECURE_WHALE_RESISTANT")

    def test_pao_phragmen_near_min_rewarded_penalty(self):
        """Verifies stake near minimum rewarded stake is flagged as high risk"""
        val = {
            "identity": "Node-B",
            "commission_pct": 5.0,
            "estimated_apy": 14.0,
            "slash_count": 0,
            "min_rewarded_stake_pot": 100.0,
            "median_stake_pot": 1000.0
        }
        res = self.npos_optimizer.compute_pao_phragmen_score(val, user_stake_pot=105.0)
        self.assertLess(res["safety_margin_mvu"], 0.25)
        self.assertEqual(res["safety_margin_rating"], "HIGH_OVERSUB_RISK")

    def test_pao_phragmen_below_min_rewarded_rejected(self):
        """Verifies user stake below minimum rewarded stake produces eviction risk"""
        val = {
            "identity": "Node-C",
            "commission_pct": 3.0,
            "estimated_apy": 15.0,
            "slash_count": 0,
            "min_rewarded_stake_pot": 500.0,
            "median_stake_pot": 2000.0
        }
        res = self.npos_optimizer.compute_pao_phragmen_score(val, user_stake_pot=100.0)
        self.assertLessEqual(res["safety_margin_mvu"], 0.0)
        self.assertEqual(res["safety_margin_rating"], "CRITICAL_EVICTION_RISK")

    def test_pao_phragmen_tanh_saturation(self):
        """Verifies hyperbolic tangent bounds the margin factor between 0 and 1"""
        val = {
            "identity": "Node-D",
            "commission_pct": 1.0,
            "estimated_apy": 16.0,
            "slash_count": 0,
            "min_rewarded_stake_pot": 10.0,
            "median_stake_pot": 100.0
        }
        res = self.npos_optimizer.compute_pao_phragmen_score(val, user_stake_pot=100_000_000.0)
        self.assertLessEqual(res["margin_factor_tanh"], 1.0)
        self.assertGreater(res["margin_factor_tanh"], 0.0)

    def test_rugpull_volatility_penalty_zero_for_stable(self):
        """Verifies zero penalty when validator commission is stable"""
        val = {"commission_pct": 3.0, "commission_history": [3.0, 3.0]}
        res = self.npos_optimizer.compute_pao_phragmen_score(val)
        self.assertEqual(res["rugpull_penalty"], 0.0)
        self.assertFalse(res["is_rugpull_risk"])

    def test_rugpull_volatility_penalty_high_for_spikes(self):
        """Verifies high penalty when validator spikes commission suddenly"""
        val = {"commission_pct": 20.0, "commission_history": [1.0, 20.0]}
        res = self.npos_optimizer.compute_pao_phragmen_score(val)
        self.assertGreater(res["rugpull_penalty"], 0.0)
        self.assertTrue(res["is_rugpull_risk"])

    def test_validator_scoring_100_percent_commission_rejection(self):
        """Verifies 100% commission validators are rejected as UNFAVORABLE"""
        val = {
            "commission_pct": 100.0,
            "is_oversubscribed": False,
            "uptime_pct": 99.5,
            "slash_count": 0,
            "nominator_count": 50,
            "max_nominators": 256,
            "estimated_apy": 14.5
        }
        scored = self.npos_optimizer._calculate_health_score(val)
        self.assertEqual(scored["recommendation"], "REJECT_UNFAVORABLE")

    def test_validator_scoring_oversubscribed_rejection(self):
        """Verifies oversubscribed validators (> 256 nominators) are rejected as UNFAVORABLE"""
        val = {
            "commission_pct": 2.0,
            "is_oversubscribed": True,
            "uptime_pct": 99.0,
            "slash_count": 0,
            "nominator_count": 300,
            "max_nominators": 256,
            "estimated_apy": 15.0
        }
        scored = self.npos_optimizer._calculate_health_score(val)
        self.assertEqual(scored["recommendation"], "REJECT_UNFAVORABLE")

    def test_validator_scoring_zero_slashes_bonus(self):
        """Verifies zero slashes yields higher score than a slashed validator"""
        val_clean = {"commission_pct": 2.0, "is_oversubscribed": False, "uptime_pct": 99.0, "slash_count": 0, "nominator_count": 50, "max_nominators": 256, "estimated_apy": 15.0}
        val_slashed = {"commission_pct": 2.0, "is_oversubscribed": False, "uptime_pct": 99.0, "slash_count": 2, "nominator_count": 50, "max_nominators": 256, "estimated_apy": 15.0}
        score_clean = self.npos_optimizer._calculate_health_score(val_clean)["health_score"]
        score_slashed = self.npos_optimizer._calculate_health_score(val_slashed)["health_score"]
        self.assertGreater(score_clean, score_slashed)

    def test_top_16_recommendation_count(self):
        """Verifies get_top_16_recommendation returns exactly 16 targets"""
        rec = self.npos_optimizer.get_top_16_recommendation()
        self.assertEqual(len(rec["targets"]), 16)
        self.assertEqual(rec["top_validators_count"], 16)

    def test_top_16_auto_compounded_apy_exceeds_nominal(self):
        """Verifies daily auto-compounded APY is mathematically greater than nominal APY"""
        rec = self.npos_optimizer.get_top_16_recommendation()
        self.assertGreater(rec["auto_compounded_apy"], rec["average_nominal_apy"])

    def test_live_storage_decoding_active_era(self):
        """Verifies decoding ActiveEra from mock Substrate pallet query"""
        mock_client = MockLiveSubstrateClient(active_era=50)
        vals = self.npos_optimizer._fetch_live_validators_from_chain(mock_client, "0xhead")
        self.assertEqual(len(vals), 2)
        self.assertEqual(vals[0]["stash_address"], "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")

    def test_live_storage_decoding_commission_perbill(self):
        """Verifies converting Perbill (25,000,000 / 10^9) to 2.5%"""
        mock_client = MockLiveSubstrateClient(commission_perbill=25000000)
        vals = self.npos_optimizer._fetch_live_validators_from_chain(mock_client, "0xhead")
        self.assertEqual(vals[0]["commission_pct"], 2.5)


if __name__ == "__main__":
    unittest.main()
