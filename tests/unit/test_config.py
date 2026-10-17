"""
Unit Tests for DotNexus Configuration Module
Verifies Pydantic schema parameters, SS58 format, Token Decimals, and Scaling Multiplier.
"""

import unittest
from engine.config import CONFIG


class TestConfigParameters(unittest.TestCase):
    def test_config_parameters(self):
        """Verifies Portaldot V3.0 network protocol parameters and scale factors"""
        self.assertEqual(CONFIG.ss58_format, 42, "SS58 format must be 42 for Portaldot")
        self.assertEqual(CONFIG.token_symbol, "POT", "Token symbol must be POT")
        self.assertEqual(CONFIG.default_token_decimals, 14, "Substrate token decimals should be 14 (Planck)")
        self.assertEqual(CONFIG.evm_standard_decimals, 18, "EVM standard decimals should be 18 (Wei)")
        self.assertEqual(CONFIG.decimal_scale_multiplier, 10000, "Scale multiplier must be 10^4")
        self.assertEqual(CONFIG.max_desync_block_delta, 2)
        self.assertEqual(CONFIG.heartbeat_miss_threshold, 2)


if __name__ == "__main__":
    unittest.main()
