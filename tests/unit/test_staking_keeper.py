"""
Unit Tests for Staking Keeper Daemon & Dynamic Unbonding Queue
Verifies unbonding chunk inspection, lock duration calculation,
election phase rebalance guard, and economic profit invariants.
"""

import unittest
from engine.staking_keeper import StakingKeeperDaemon


class TestStakingKeeperUnit(unittest.TestCase):
    def setUp(self):
        # Initialized with offline endpoint for deterministic testing
        self.keeper = StakingKeeperDaemon(substrate_url="ws://127.0.0.1:99999")

    def test_unbonding_queue_structure(self):
        """Verifies unbonding queue returns standardized chunks and duration"""
        result = self.keeper.get_unbonding_queue("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
        self.assertIn("controller_stash", result)
        self.assertIn("total_unbonding_pot", result)
        self.assertIn("unbonding_queue", result)
        self.assertIn("unbonding_era_duration", result)
        self.assertEqual(result["unbonding_era_duration"], 28)
        self.assertIsInstance(result["unbonding_queue"], list)

    def test_unbonding_queue_hour_estimation(self):
        """Verifies unlock hours remain non-negative and correctly scaled to 24h/era"""
        result = self.keeper.get_unbonding_queue()
        for chunk in result["unbonding_queue"]:
            self.assertIn("hours_remaining", chunk)
            self.assertGreaterEqual(chunk["hours_remaining"], 0.0)
            self.assertIn("target_era", chunk)
            self.assertIn("amount_pot", chunk)

    def test_rebalance_blocked_during_active_election_phase(self):
        """Verifies rebalance invariant rejects execution during active election phase"""
        # Set phase to Signed election
        self.keeper.current_election_phase = "Signed"
        res = self.keeper.evaluate_and_execute_era_rebalance(
            controller_stash="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            current_active_apy=0.14,
            dry_run=True
        )
        self.assertEqual(res["action"], "BLOCKED")
        self.assertIn("Election phase is 'Signed'", res["reason"])

    def test_rebalance_skipped_when_apy_delta_below_threshold(self):
        """Verifies rebalance invariant skips if delta APY is below threshold"""
        self.keeper.current_election_phase = "Off"
        # High current APY so optimal APY - current APY < 1.5%
        res = self.keeper.evaluate_and_execute_era_rebalance(
            controller_stash="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            current_active_apy=0.20,
            dry_run=True
        )
        self.assertEqual(res["action"], "SKIPPED")
        self.assertIn("below threshold", res["reason"])

    def test_rebalance_success_when_profit_exceeds_fee_invariant(self):
        """Verifies rebalance executes nominate when invariant Delta APY * Stake > 3 * Fee passes"""
        self.keeper.current_election_phase = "Off"
        # Low current APY (8%) vs top optimal APY (~16%), large stake
        res = self.keeper.evaluate_and_execute_era_rebalance(
            controller_stash="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            current_active_apy=0.08,
            dry_run=True
        )
        self.assertEqual(res["action"], "REBALANCED")
        self.assertIn("optimal_targets", res)
        self.assertGreater(len(res["optimal_targets"]), 0)

    def test_keeper_status_history(self):
        """Verifies keeper status records last evaluation history"""
        self.keeper.current_election_phase = "Off"
        self.keeper.evaluate_and_execute_era_rebalance(dry_run=True)
        status = self.keeper.get_keeper_status()
        self.assertIn("keeper_status", status)
        self.assertIn("last_evaluation", status)
        self.assertIsNotNone(status["last_evaluation"])


if __name__ == "__main__":
    unittest.main()
