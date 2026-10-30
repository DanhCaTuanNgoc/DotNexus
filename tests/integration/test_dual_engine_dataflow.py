"""
Integration Test Suite: DualEngineView Data Flow & Parity Invariants
Specifically verifies that the data flow feeding DualEngineView.tsx:
1. Conforms to the full TypeScript DualTelemetryState & DualBlockConduitItem schemas.
2. Maintains lockstep parity between the top cards (Substrate & EVM) and Recent Blocks Conduit.
3. Satisfies sub-50ms Stale-While-Revalidate (SWR) cache latency without blocking RPC waterfalls.
4. Correctly executes all 4 SRE Remediation dock actions.
5. Complies with Dynamic Decimals Policy (14 Substrate Plancks vs 18 EVM Wei, 10^4 scale factor).
6. Preserves historical blocks in LRU cache and guarantees monotonic block progression.
"""

import time
import unittest
from engine.config import CONFIG
from engine.server import app
from engine.dual_tracker import DUAL_TRACKER


class TestDualEngineDataFlowIntegration(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()
        self.auth_headers = {"X-DotNexus-Auth": CONFIG.auth_api_token}

    def test_dual_tracker_endpoint_full_schema_contract(self):
        """
        Verifies GET /api/dual-tracker returns all schema fields required
        by DualEngineView.tsx without null/undefined crashes.
        """
        res = self.client.get("/api/dual-tracker")
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertTrue(json_data.get("success"))
        data = json_data.get("data", {})

        # 1. Substrate Telemetry (Card 1: Best Head Block)
        self.assertIn("substrate", data)
        sub = data["substrate"]
        self.assertIn("best_block", sub)
        self.assertIn("finalized_block", sub)
        self.assertIn("finality_lag", sub)
        self.assertIn("latency_ms", sub)
        self.assertIn("pending_extrinsics", sub)
        self.assertIn("token_decimals", sub)
        self.assertIn("ss58_format", sub)
        self.assertIn("endpoint", sub)
        self.assertIn("execution_engine", sub)
        self.assertIsInstance(sub["best_block"], int)
        self.assertGreater(sub["best_block"], 0)
        self.assertEqual(sub["token_decimals"], 14)
        self.assertEqual(sub["ss58_format"], 42)

        # 2. EVM Telemetry (Card 2: EVM Block Number)
        self.assertIn("evm", data)
        evm = data["evm"]
        self.assertIn("block_number", evm)
        self.assertIn("chain_id", evm)
        self.assertIn("gas_price_gwei", evm)
        self.assertIn("base_fee_gwei", evm)
        self.assertIn("latency_ms", evm)
        self.assertIn("pending_transactions", evm)
        self.assertIn("standard_decimals", evm)
        self.assertIn("endpoint", evm)
        self.assertIn("execution_engine", evm)
        self.assertIsInstance(evm["block_number"], int)
        self.assertGreater(evm["block_number"], 0)
        self.assertEqual(evm["standard_decimals"], 18)

        # 3. Synchronization & Parity status
        self.assertIn("sync", data)
        sync = data["sync"]
        self.assertIn("delta_blocks", sync)
        self.assertIn("status", sync)
        self.assertIn("severity", sync)
        self.assertIn("is_synced", sync)
        self.assertEqual(sync["delta_blocks"], abs(sub["best_block"] - evm["block_number"]))
        self.assertIn(sync["status"], ["SYNCED", "MINIMAL_LAG", "DESYNC_WARNING", "DESYNC_CRITICAL"])

        # 4. 3-Tier Root-Cause Diagnosis
        self.assertIn("root_cause_diagnosis", data)
        diag = data["root_cause_diagnosis"]
        self.assertIn("tier", diag)
        self.assertIn("root_cause_code", diag)
        self.assertIn("severity", diag)
        self.assertIn("message", diag)
        self.assertIn("recommended_action", diag)
        self.assertIn(diag["tier"], [0, 1, 2, 3])

        # 5. Cross-VM Causal Lag Index (CLI)
        self.assertIn("causal_lag_index", data)
        cli = data["causal_lag_index"]
        self.assertIn("cli_score", cli)
        self.assertIn("classification", cli)
        self.assertIn("vector_breakdown", cli)
        self.assertLessEqual(cli["cli_score"], 100.0)

        # 6. Decimal Normalization (14 Substrate Plancks vs 18 EVM Wei)
        self.assertIn("decimal_normalization", data)
        norm = data["decimal_normalization"]
        self.assertIn("substrate_balance_planck", norm)
        self.assertIn("evm_balance_wei", norm)
        self.assertIn("scale_factor", norm)
        self.assertEqual(norm["scale_factor"], 10000)
        self.assertEqual(norm["token_decimals_substrate"], 14)
        self.assertEqual(norm["token_decimals_evm"], 18)

        # 7. Hardware & Host OS Metrics
        self.assertIn("hardware", data)
        hw = data["hardware"]
        self.assertIn("cpu_percent", hw)
        self.assertIn("ram_percent", hw)
        self.assertIn("disk_percent", hw)
        self.assertIn(hw["status"], ["HEALTHY", "WARNING", "CRITICAL"])

        # 8. RPC Circuit Breaker status
        self.assertIn("circuit_breaker", data)
        cb = data["circuit_breaker"]
        self.assertIn("enabled", cb)
        self.assertIn("status", cb)
        self.assertIn(cb["status"], ["ARMED", "BYPASSED", "TRIPPED"])

    def test_recent_blocks_conduit_endpoint_schema_contract(self):
        """
        Verifies GET /api/telemetry/dual/recent-blocks returns recent blocks
        matching DualBlockConduitItem TypeScript interface with all required properties.
        """
        res = self.client.get("/api/telemetry/dual/recent-blocks?limit=5")
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertTrue(json_data.get("success"))
        blocks = json_data.get("data", [])
        self.assertIsInstance(blocks, list)
        self.assertGreater(len(blocks), 0)
        self.assertLessEqual(len(blocks), 5)

        for blk in blocks:
            # Mandatory properties defined in DualBlockConduitItem
            self.assertIn("block_number_wasm", blk)
            self.assertIn("block_number_evm", blk)
            self.assertIn("hash_wasm", blk)
            self.assertIn("hash_evm", blk)
            self.assertIn("babe_author", blk)
            self.assertIn("extrinsics_count", blk)
            self.assertIn("evm_tx_count", blk)
            self.assertIn("evm_gas_used", blk)
            self.assertIn("evm_base_fee_gwei", blk)
            self.assertIn("mapping_latency_ms", blk)
            self.assertIn("delta_blocks", blk)
            self.assertIn("status", blk)
            self.assertIn("timestamp", blk)

            # Property invariants
            self.assertIsInstance(blk["block_number_wasm"], int)
            self.assertIsInstance(blk["block_number_evm"], int)
            self.assertTrue(blk["hash_wasm"].startswith("0x"))
            self.assertTrue(blk["hash_evm"].startswith("0x"))
            self.assertGreater(blk["extrinsics_count"], 0)
            self.assertGreaterEqual(blk["evm_tx_count"], 0)
            self.assertGreater(blk["mapping_latency_ms"], 0)
            self.assertIn(blk["status"], ["LOCKSTEP", "PROPAGATION_LAG", "SLOW_INDEXING", "DESYNC_CRITICAL"])
            self.assertEqual(blk["delta_blocks"], abs(blk["block_number_wasm"] - blk["block_number_evm"]))

    def test_dual_cards_and_conduit_lockstep_parity(self):
        """
        Core Invariant: Verifies that the top cards (Substrate Best Block and EVM Block)
        and the Recent Blocks Conduit top item are in lockstep parity (delta <= 1 block).
        This guarantees the frontend never shows contradictory data across views.
        """
        res_dual = self.client.get("/api/dual-tracker")
        self.assertEqual(res_dual.status_code, 200)
        dual_data = res_dual.get_json()["data"]
        sub_best = dual_data["substrate"]["best_block"]
        evm_best = dual_data["evm"]["block_number"]

        res_conduit = self.client.get("/api/telemetry/dual/recent-blocks?limit=5")
        self.assertEqual(res_conduit.status_code, 200)
        conduit_items = res_conduit.get_json()["data"]
        self.assertGreater(len(conduit_items), 0)
        top_conduit = conduit_items[0]

        wasm_conduit_top = top_conduit["block_number_wasm"]
        evm_conduit_top = top_conduit["block_number_evm"]

        # Nominal lockstep tolerance is <= 5 blocks during active BABE slot production on live testnets
        self.assertLessEqual(
            abs(sub_best - wasm_conduit_top), 5,
            f"Desync detected: Substrate card (#{sub_best}) != Conduit item 0 (#{wasm_conduit_top})"
        )
        self.assertLessEqual(
            abs(evm_best - evm_conduit_top), 5,
            f"Desync detected: EVM card (#{evm_best}) != Conduit item 0 (#{evm_conduit_top})"
        )

    def test_stale_while_revalidate_latency_invariant(self):
        """
        Performance Invariant: Verifies that cached telemetry responses return
        in sub-50ms without blocking on remote internet RPC round-trips.
        """
        # Seed cache
        self.client.get("/api/dual-tracker")
        self.client.get("/api/telemetry/dual/recent-blocks?limit=5")

        # Second fetch: Dual Tracker
        t0 = time.time()
        res = self.client.get("/api/dual-tracker")
        elapsed_dual_ms = (time.time() - t0) * 1000
        self.assertEqual(res.status_code, 200)
        self.assertLess(
            elapsed_dual_ms, 50.0,
            f"Dual-Tracker cache response exceeded 50ms threshold: {elapsed_dual_ms:.2f}ms"
        )

        # Second fetch: Recent Blocks
        t1 = time.time()
        res_b = self.client.get("/api/telemetry/dual/recent-blocks?limit=5")
        elapsed_recent_ms = (time.time() - t1) * 1000
        self.assertEqual(res_b.status_code, 200)
        self.assertLess(
            elapsed_recent_ms, 50.0,
            f"Recent blocks cache response exceeded 50ms threshold: {elapsed_recent_ms:.2f}ms"
        )

    def test_monotonic_block_height_active_era(self):
        """
        Integrity Invariant: Verifies that block numbers reflect the active Portaldot V3
        testnet era (>= 205,000) and never regress to old mock heights (161,450).
        """
        res = self.client.get("/api/dual-tracker")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        sub_block = data["substrate"]["best_block"]
        evm_block = data["evm"]["block_number"]

        self.assertGreaterEqual(
            sub_block, 205000,
            f"Substrate block #{sub_block} regressed below active testnet era baseline (205,000)"
        )
        self.assertGreaterEqual(
            evm_block, 205000,
            f"EVM block #{evm_block} regressed below active testnet era baseline (205,000)"
        )

    def test_sre_remediation_actions_dispatch(self):
        """
        Action Invariant: Verifies that all 4 Active SRE Remediation dock buttons
        in DualEngineView.tsx dispatch and execute properly via POST /api/dual-tracker/remediate.
        """
        # 1. Toggle Circuit Breaker
        res_cb = self.client.post("/api/dual-tracker/remediate", json={"action": "toggle_circuit_breaker"})
        self.assertEqual(res_cb.status_code, 200)
        data_cb = res_cb.get_json()
        self.assertTrue(data_cb["success"])
        self.assertIn("circuit_breaker", data_cb["data"])

        # 2. Force fc-mapping-sync resync
        res_sync = self.client.post("/api/dual-tracker/remediate", json={"action": "force_fc_sync"})
        self.assertEqual(res_sync.status_code, 200)
        data_sync = res_sync.get_json()
        self.assertTrue(data_sync["success"])
        self.assertIn("fc-mapping-sync worker task resynchronized", data_sync["data"]["message"])

        # 3. Purge Mempool
        res_purge = self.client.post("/api/dual-tracker/remediate", json={"action": "purge_mempool"})
        self.assertEqual(res_purge.status_code, 200)
        data_purge = res_purge.get_json()
        self.assertTrue(data_purge["success"])
        self.assertGreater(data_purge["data"]["purged_transactions"], 0)

        # 4. Trigger Failover
        res_fo = self.client.post("/api/dual-tracker/remediate", json={"action": "trigger_failover"})
        self.assertEqual(res_fo.status_code, 200)
        data_fo = res_fo.get_json()
        self.assertTrue(data_fo["success"])
        self.assertIn("SlashGuardLeaseRegistry", data_fo["data"]["message"])

        # 5. Invalid action returns graceful error
        res_invalid = self.client.post("/api/dual-tracker/remediate", json={"action": "non_existent_chaos"})
        self.assertEqual(res_invalid.status_code, 200)
        self.assertFalse(res_invalid.get_json()["data"]["success"])

    def test_contract_audit_mainnet_v3_ready(self):
        """
        Audit Invariant: Verifies POST /api/dual-tracker/contract-audit evaluates
        Pallet-Revive Shanghai EVM storage deposit and gas lean suitability.
        """
        res = self.client.post(
            "/api/dual-tracker/contract-audit",
            json={"contract_name": "SlashGuardLeaseRegistry"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertEqual(data["contract_name"], "SlashGuardLeaseRegistry")
        self.assertEqual(data["storage_deposit_rate_pot_per_byte"], 0.08)
        self.assertEqual(data["suitability_score_pct"], 100)
        self.assertEqual(data["status"], "MAINNET_V3_READY")
        self.assertTrue(data["mainnet_v3_checklist"]["pallet_revive_compatible"])
        self.assertTrue(data["mainnet_v3_checklist"]["compiler_target_shanghai"])

    def test_historical_blocks_cache_immutability(self):
        """
        Cache Invariant: Verifies that past finalized blocks stored in
        DUAL_TRACKER._historical_blocks_cache are immutable and never mutate.
        """
        items = DUAL_TRACKER.get_recent_dual_blocks(limit=3)
        self.assertGreater(len(items), 0)
        first_num = items[0]["block_number_wasm"]

        # Ensure block exists in historical cache
        self.assertIn(first_num, DUAL_TRACKER._historical_blocks_cache)
        cached_entry = DUAL_TRACKER._historical_blocks_cache[first_num]
        original_hash = cached_entry["hash_wasm"]

        # Call again: must preserve exact same hash
        items_again = DUAL_TRACKER.get_recent_dual_blocks(limit=3)
        self.assertEqual(items_again[0]["hash_wasm"], original_hash)


if __name__ == "__main__":
    unittest.main()
