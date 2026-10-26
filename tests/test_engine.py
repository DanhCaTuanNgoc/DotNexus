"""
Master Test Suite for DotNexus Backend Engine
Aggregates and executes all modularized unit and integration test suites:
- tests.unit.test_config: Protocol parameters & Pydantic schemas
- tests.unit.test_dual_tracker: Telemetry, 3-tier root-cause, decimal normalizer, hardware metrics
- tests.unit.test_slash_guard: Session keys, anti-equivocation mutex, Dead Man's Switch
- tests.unit.test_rpc_shield: Archival getLogs, 256KB socket ceiling, rate limiting, Sybil analysis
- tests.unit.test_npos_optimizer: Phragmén election, fee erosion, async nonce manager
- tests.unit.test_staking_keeper: Unbonding queue, unlock timer, election phase guard, profit invariants
- tests.integration.test_dag_engine: Runbook execution & visual DAG state transitions
- tests.integration.test_worker_daemon: Kahn's tiers, cycle detection, token bucket limiter
- tests.integration.test_server_api: REST API Gateway, Prometheus exporter & security
- tests.integration.test_dual_engine_dataflow: DualEngineView schema contracts, lockstep parity & SWR cache
"""

import unittest

# Import unit test classes
from tests.unit.test_config import TestConfigParameters
from tests.unit.test_dual_tracker import TestDualTrackerUnit
from tests.unit.test_slash_guard import TestSlashGuardUnit
from tests.unit.test_rpc_shield import TestRPCShieldUnit
from tests.unit.test_npos_optimizer import TestNPoSOptimizerUnit
from tests.unit.test_staking_keeper import TestStakingKeeperUnit

# Import integration test classes
from tests.integration.test_dag_engine import TestDAGEngineIntegration
from tests.integration.test_worker_daemon import TestWorkerDaemonIntegration
from tests.integration.test_server_api import TestServerAPIIntegration
from tests.integration.test_dual_engine_dataflow import TestDualEngineDataFlowIntegration


def load_tests(loader, tests, pattern):
    """Discovers and builds unified test suite from all modular test modules"""
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(TestConfigParameters))
    suite.addTests(loader.loadTestsFromTestCase(TestDualTrackerUnit))
    suite.addTests(loader.loadTestsFromTestCase(TestSlashGuardUnit))
    suite.addTests(loader.loadTestsFromTestCase(TestRPCShieldUnit))
    suite.addTests(loader.loadTestsFromTestCase(TestNPoSOptimizerUnit))
    suite.addTests(loader.loadTestsFromTestCase(TestStakingKeeperUnit))
    suite.addTests(loader.loadTestsFromTestCase(TestDAGEngineIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestWorkerDaemonIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestServerAPIIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestDualEngineDataFlowIntegration))
    return suite


if __name__ == "__main__":
    unittest.main()
