import re

with open('engine/dual_tracker.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add threading import
content = content.replace(
    'import hashlib\nfrom urllib.parse import urlparse',
    'import hashlib\nimport threading\nfrom urllib.parse import urlparse'
)
content = content.replace(
    'import hashlib\r\nfrom urllib.parse import urlparse',
    'import hashlib\r\nimport threading\r\nfrom urllib.parse import urlparse'
)

# 2. Update __init__ mocks and add dual_state_cache + poller state
old_init_block = '''        # Simulation fallback state (in case local node is offline)
        self._mock_substrate_block = 161450
        self._mock_finalized_block = 161448
        self._mock_evm_block = 161450
        self._mock_peers_count = 14
        self._mock_highest_block = 161450
        self._mock_last_tick = time.time()

        # Active SRE & Remediation State
        self.circuit_breaker_enabled: bool = True
        self.last_remediation: Optional[Dict[str, Any]] = None

        # Dual-VM Realtime Block Lockstep Stream Caches
        self._recent_blocks_cache: List[Dict[str, Any]] = []
        self._recent_blocks_cache_time: float = 0.0
        self._recent_blocks_cache_ttl: float = 2.5
        self._historical_blocks_cache: Dict[int, Dict[str, Any]] = {}'''

new_init_block = '''        # Simulation fallback state (in case local node is offline)
        self._mock_substrate_block = 205100
        self._mock_finalized_block = 205098
        self._mock_evm_block = 205100
        self._mock_peers_count = 14
        self._mock_highest_block = 205100
        self._mock_last_tick = time.time()

        # Active SRE & Remediation State
        self.circuit_breaker_enabled: bool = True
        self.last_remediation: Optional[Dict[str, Any]] = None

        # Dual-VM Realtime Block Lockstep Stream Caches
        self._recent_blocks_cache: List[Dict[str, Any]] = []
        self._recent_blocks_cache_time: float = 0.0
        self._recent_blocks_cache_ttl: float = 3.0
        self._historical_blocks_cache: Dict[int, Dict[str, Any]] = {}

        # Telemetry State Cache (sub-millisecond instant responses)
        self._dual_state_cache: Optional[Dict[str, Any]] = None
        self._dual_state_cache_time: float = 0.0
        self._dual_state_cache_ttl: float = 3.0
        self._cache_lock = threading.Lock()

        # Background Poller State
        self._poller_thread: Optional[threading.Thread] = None
        self._poller_running: bool = False'''

# Handle both line endings
if old_init_block in content:
    content = content.replace(old_init_block, new_init_block)
else:
    old_init_crlf = old_init_block.replace('\n', '\r\n')
    new_init_crlf = new_init_block.replace('\n', '\r\n')
    assert old_init_crlf in content, "old_init_block not found!"
    content = content.replace(old_init_crlf, new_init_crlf)

# 3. Add poller methods after __init__
poller_methods = '''
    def start_background_poller(self, interval: float = 2.5) -> None:
        """Starts background daemon poller to keep dual state and recent blocks hot in cache."""
        with self._cache_lock:
            if self._poller_running:
                return
            self._poller_running = True
            self._poller_thread = threading.Thread(
                target=self._background_poller_loop,
                args=(interval,),
                daemon=True,
                name="DotNexusDualPoller"
            )
            self._poller_thread.start()
            logger.info("DualEngineTracker background poller daemon started.")

    def stop_background_poller(self) -> None:
        """Stops background daemon poller."""
        self._poller_running = False

    def _background_poller_loop(self, interval: float) -> None:
        time.sleep(0.5)
        while self._poller_running:
            try:
                self._compute_dual_state()
                self._refresh_recent_dual_blocks(limit=5)
            except Exception as e:
                logger.debug(f"Background poller tick error: {e}")
            time.sleep(interval)
'''

# Insert before def _init_substrate(self) -> bool:
target_sub = '    def _init_substrate(self) -> bool:'
if '\r\n' in content:
    poller_methods_crlf = poller_methods.replace('\n', '\r\n')
    content = content.replace(target_sub, poller_methods_crlf + '\r\n' + target_sub)
else:
    content = content.replace(target_sub, poller_methods + '\n' + target_sub)

# 4. In get_dual_state, rename to _compute_dual_state and wrap in get_dual_state
old_get_dual_state = '''    def get_dual_state(self) -> Dict[str, Any]:
        """
        Calculates synchronicity delta, mempool distribution, 3-tier root-cause diagnosis,
        and decimal mapping normalization.
        """'''

new_compute_dual_state = '''    def _compute_dual_state(self) -> Dict[str, Any]:
        """
        Calculates synchronicity delta, mempool distribution, 3-tier root-cause diagnosis,
        and decimal mapping normalization from live nodes or simulation.
        """'''

if old_get_dual_state in content:
    content = content.replace(old_get_dual_state, new_compute_dual_state)
else:
    old_gds_crlf = old_get_dual_state.replace('\n', '\r\n')
    new_cds_crlf = new_compute_dual_state.replace('\n', '\r\n')
    assert old_gds_crlf in content, "old_get_dual_state not found!"
    content = content.replace(old_gds_crlf, new_cds_crlf)

# Save cache before return in _compute_dual_state
old_return_state = '''        return {
            "timestamp": time.time(),
            "substrate": sub_telemetry,
            "evm": evm_telemetry,'''

new_return_state = '''        state_result = {
            "timestamp": time.time(),
            "substrate": sub_telemetry,
            "evm": evm_telemetry,'''

if old_return_state in content:
    content = content.replace(old_return_state, new_return_state)
else:
    old_rs_crlf = old_return_state.replace('\n', '\r\n')
    new_rs_crlf = new_return_state.replace('\n', '\r\n')
    assert old_rs_crlf in content, "old_return_state not found!"
    content = content.replace(old_rs_crlf, new_rs_crlf)

# End of _compute_dual_state dictionary creation
old_end_state = '''                "track_4_ecosystem_dapps": {
                    "label": "Ecosystem DApps & Contracts",
                    "status": "OPTIMAL",
                    "base_fee_gwei": evm_telemetry.get("base_fee_gwei", 18.0),
                    "storage_deposit_rate": "0.08 POT / byte",
                    "pallet_revive_ready": True
                }
            }
        }

    def toggle_circuit_breaker(self,'''

new_end_state = '''                "track_4_ecosystem_dapps": {
                    "label": "Ecosystem DApps & Contracts",
                    "status": "OPTIMAL",
                    "base_fee_gwei": evm_telemetry.get("base_fee_gwei", 18.0),
                    "storage_deposit_rate": "0.08 POT / byte",
                    "pallet_revive_ready": True
                }
            }
        }
        self._dual_state_cache = state_result
        self._dual_state_cache_time = time.time()
        return state_result

    def get_dual_state(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Calculates synchronicity delta, mempool distribution, 3-tier root-cause diagnosis,
        and decimal mapping normalization.
        Uses thread-safe cached telemetry with 3.0s TTL for sub-millisecond response time.
        """
        now = time.time()
        if not force_refresh and self._dual_state_cache is not None:
            if (now - self._dual_state_cache_time) < self._dual_state_cache_ttl:
                return self._dual_state_cache

        with self._cache_lock:
            now = time.time()
            if not force_refresh and self._dual_state_cache is not None:
                if (now - self._dual_state_cache_time) < self._dual_state_cache_ttl:
                    return self._dual_state_cache
            return self._compute_dual_state()

    def toggle_circuit_breaker(self,'''

if old_end_state in content:
    content = content.replace(old_end_state, new_end_state)
else:
    old_es_crlf = old_end_state.replace('\n', '\r\n')
    new_es_crlf = new_end_state.replace('\n', '\r\n')
    assert old_es_crlf in content, "old_end_state not found!"
    content = content.replace(old_es_crlf, new_es_crlf)

# 5. In execute_remediation force_fc_sync: clear caches
old_force_fc = '''        if action == "force_fc_sync":
            self.substrate_client = None
            self.web3_client = None
            self._last_substrate_probe_time = 0.0
            self._last_evm_probe_time = 0.0
            sub = self.get_substrate_telemetry()'''

new_force_fc = '''        if action == "force_fc_sync":
            self.substrate_client = None
            self.web3_client = None
            self._last_substrate_probe_time = 0.0
            self._last_evm_probe_time = 0.0
            self._dual_state_cache = None
            self._recent_blocks_cache = []
            sub = self.get_substrate_telemetry()'''

if old_force_fc in content:
    content = content.replace(old_force_fc, new_force_fc)
else:
    old_fc_crlf = old_force_fc.replace('\n', '\r\n')
    new_fc_crlf = new_force_fc.replace('\n', '\r\n')
    assert old_fc_crlf in content, "old_force_fc not found!"
    content = content.replace(old_fc_crlf, new_fc_crlf)

# 6. In get_recent_dual_blocks, rename to _refresh_recent_dual_blocks and wrap
old_get_recent = '''    def get_recent_dual_blocks(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves real-time correlated block feed between Substrate WASM and Frontier EVM.
        Calculates fc-mapping-sync latency, block delta, and cross-VM status.
        Uses historical LRU block cache and 2.5s TTL stream cache for optimal performance.
        """
        limit = max(1, min(limit, 10))
        now = time.time()

        # Check short-term stream cache
        if self._recent_blocks_cache and (now - self._recent_blocks_cache_time < self._recent_blocks_cache_ttl):
            if len(self._recent_blocks_cache) >= limit:
                return self._recent_blocks_cache[:limit]'''

new_get_recent = '''    def _refresh_recent_dual_blocks(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves real-time correlated block feed between Substrate WASM and Frontier EVM.
        Calculates fc-mapping-sync latency, block delta, and cross-VM status.
        Uses historical LRU block cache and 3.0s TTL stream cache for optimal performance.
        """
        limit = max(1, min(limit, 10))
        now = time.time()'''

if old_get_recent in content:
    content = content.replace(old_get_recent, new_get_recent)
else:
    old_gr_crlf = old_get_recent.replace('\n', '\r\n')
    new_gr_crlf = new_get_recent.replace('\n', '\r\n')
    assert old_gr_crlf in content, "old_get_recent not found!"
    content = content.replace(old_gr_crlf, new_gr_crlf)

# At end of _refresh_recent_dual_blocks, add get_recent_dual_blocks wrapper
old_end_recent = '''        self._recent_blocks_cache = fallback_items
        self._recent_blocks_cache_time = now
        return fallback_items


# Global Tracker Instance'''

new_end_recent = '''        self._recent_blocks_cache = fallback_items
        self._recent_blocks_cache_time = now
        return fallback_items

    def get_recent_dual_blocks(self, limit: int = 5, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Retrieves real-time correlated block feed between Substrate WASM and Frontier EVM.
        Uses historical LRU block cache and 3.0s TTL stream cache for sub-millisecond response.
        """
        limit = max(1, min(limit, 10))
        now = time.time()

        if not force_refresh and self._recent_blocks_cache and (now - self._recent_blocks_cache_time < self._recent_blocks_cache_ttl):
            if len(self._recent_blocks_cache) >= limit:
                return self._recent_blocks_cache[:limit]

        with self._cache_lock:
            now = time.time()
            if not force_refresh and self._recent_blocks_cache and (now - self._recent_blocks_cache_time < self._recent_blocks_cache_ttl):
                if len(self._recent_blocks_cache) >= limit:
                    return self._recent_blocks_cache[:limit]
            return self._refresh_recent_dual_blocks(limit=limit)


# Global Tracker Instance'''

if old_end_recent in content:
    content = content.replace(old_end_recent, new_end_recent)
else:
    old_er_crlf = old_end_recent.replace('\n', '\r\n')
    new_er_crlf = new_end_recent.replace('\n', '\r\n')
    assert old_er_crlf in content, "old_end_recent not found!"
    content = content.replace(old_er_crlf, new_end_recent.replace('\n', '\r\n'))

with open('engine/dual_tracker.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched engine/dual_tracker.py")
