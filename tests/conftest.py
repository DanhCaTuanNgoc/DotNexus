"""
DotNexus Test Fixtures & Shared Mock Utilities
Provides reusable mocks for Substrate and EVM JSON-RPC calls.
"""

import os
from engine.config import LOCK_FILE


def cleanup_test_locks():
    """Removes lingering session lock files before and after tests"""
    if LOCK_FILE.exists():
        try:
            os.remove(LOCK_FILE)
        except Exception:
            pass


class MockQueryResult:
    """Mock result object imitating Substrate query response"""
    def __init__(self, value):
        self.value = value


class MockLiveSubstrateClient:
    """Mock live Substrate client for pallet storage queries"""
    def __init__(self, active_era: int = 50, commission_perbill: int = 25000000):
        self.active_era = active_era
        self.commission_perbill = commission_perbill

    def query(self, module: str, storage_function: str, params=None, block_hash=None):
        if module == "Staking" and storage_function == "ActiveEra":
            return MockQueryResult({"index": self.active_era})
        elif module == "Session" and storage_function == "Validators":
            return MockQueryResult([
                "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
                "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
            ])
        elif module == "Staking" and storage_function == "Validators":
            return MockQueryResult({"commission": self.commission_perbill, "blocked": False})
        elif module == "Staking" and storage_function == "ErasStakersOverview":
            return MockQueryResult({
                "total": 1250000 * (10 ** 14),
                "own": 250000 * (10 ** 14),
                "nominator_count": 99
            })
        elif module == "Staking" and storage_function == "ErasRewardPoints":
            return MockQueryResult({"individual": {"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY": 19500}})
        return None
