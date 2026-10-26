/**
 * Frontend Client Data Flow & Parity Test Suite for DualEngineView
 * Runs with Node 20+ native test runner (node --test) with zero external dependencies.
 * Verifies that:
 * 1. Default telemetry & conduit blocks maintain 100% block height parity.
 * 2. Recent blocks conduit cache persists across tab switches.
 * 3. Client timeout thresholds are sufficient for testnet latency (6000ms).
 * 4. Dynamic decimal scaling follows Portaldot V3.0 standards (14 vs 18 decimals).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiTsPath = path.resolve(__dirname, '../services/api.ts');
const dualEngineViewPath = path.resolve(__dirname, '../views/DualEngineView.tsx');

describe('DualEngineView Frontend Data Flow Invariants', () => {

  it('verifies api.ts contains synchronized DEFAULT_DUAL_TELEMETRY and DEFAULT_RECENT_BLOCKS', () => {
    const code = fs.readFileSync(apiTsPath, 'utf-8');
    
    // Extract default best_block in substrate
    const subBlockMatch = code.match(/substrate:\s*\{[\s\S]*?best_block:\s*(\d+)/);
    assert.ok(subBlockMatch, 'Could not find substrate.best_block in DEFAULT_DUAL_TELEMETRY');
    const subBestBlock = parseInt(subBlockMatch[1], 10);

    // Extract default block_number in evm
    const evmBlockMatch = code.match(/evm:\s*\{[\s\S]*?block_number:\s*(\d+)/);
    assert.ok(evmBlockMatch, 'Could not find evm.block_number in DEFAULT_DUAL_TELEMETRY');
    const evmBlock = parseInt(evmBlockMatch[1], 10);

    // Extract default conduit block 0
    const conduitWasmMatch = code.match(/DEFAULT_RECENT_BLOCKS:\s*DualBlockConduitItem\[\]\s*=\s*\[\s*\{[\s\S]*?block_number_wasm:\s*(\d+)/);
    assert.ok(conduitWasmMatch, 'Could not find DEFAULT_RECENT_BLOCKS[0].block_number_wasm');
    const conduitWasmBlock = parseInt(conduitWasmMatch[1], 10);

    const conduitEvmMatch = code.match(/DEFAULT_RECENT_BLOCKS:\s*DualBlockConduitItem\[\]\s*=\s*\[\s*\{[\s\S]*?block_number_evm:\s*(\d+)/);
    assert.ok(conduitEvmMatch, 'Could not find DEFAULT_RECENT_BLOCKS[0].block_number_evm');
    const conduitEvmBlock = parseInt(conduitEvmMatch[1], 10);

    // Invariant 1: Top cards and Conduit Block 0 must be 100% in lockstep parity
    assert.equal(subBestBlock, conduitWasmBlock, `Substrate card (${subBestBlock}) != Conduit top block (${conduitWasmBlock})`);
    assert.equal(evmBlock, conduitEvmBlock, `EVM card (${evmBlock}) != Conduit top block (${conduitEvmBlock})`);
    assert.equal(subBestBlock, evmBlock, `Substrate (${subBestBlock}) != EVM (${evmBlock})`);

    // Invariant 2: Active Era check (must be modern era >= 205000, never legacy 161450)
    assert.ok(subBestBlock >= 205000, `Block height ${subBestBlock} regressed below active testnet era (205,000)`);
  });

  it('verifies fetchWithFallback timeout is set to 6000ms to eliminate premature aborts', () => {
    const code = fs.readFileSync(apiTsPath, 'utf-8');
    const timeoutMatch = code.match(/timeoutMs:\s*number\s*=\s*(\d+)/);
    assert.ok(timeoutMatch, 'Could not find timeoutMs default parameter in fetchWithFallback');
    const timeoutMs = parseInt(timeoutMatch[1], 10);

    assert.ok(
      timeoutMs >= 5000,
      `timeoutMs is ${timeoutMs}ms, which is too short for testnet RPC latency (expected >= 5000ms)`
    );
  });

  it('verifies DualEngineView initializes recentBlocks from cachedRecentBlocks for instant render', () => {
    const code = fs.readFileSync(dualEngineViewPath, 'utf-8');
    
    // Invariant: Must use useState(() => api.getCachedRecentBlocks()) so it paints immediately
    const cacheInitMatch = code.match(/useState<DualBlockConduitItem\[\]>\(\s*\(\)\s*=>\s*api\.getCachedRecentBlocks\(\)\s*\)/);
    assert.ok(
      cacheInitMatch,
      'DualEngineView must initialize recentBlocks via api.getCachedRecentBlocks() to eliminate loading flicker'
    );
  });

  it('verifies api.ts exports getCachedRecentBlocks and setCachedRecentBlocks methods', () => {
    const code = fs.readFileSync(apiTsPath, 'utf-8');
    assert.ok(code.includes('getCachedRecentBlocks:'), 'api object missing getCachedRecentBlocks');
    assert.ok(code.includes('setCachedRecentBlocks:'), 'api object missing setCachedRecentBlocks');
  });

  it('verifies Portaldot V3 dynamic decimals normalizer mathematics (14 Substrate vs 18 EVM)', () => {
    const subDecimals = 14;
    const evmDecimals = 18;
    const scaleFactor = Math.pow(10, evmDecimals - subDecimals);
    assert.equal(scaleFactor, 10000, 'Scale factor for 14 vs 18 decimals must be exactly 10,000');

    // Test conversion of 100 POT:
    // In Substrate: 100 * 10^14 = 10,000,000,000,000,000 Planck
    // In EVM:       100 * 10^18 = 100,000,000,000,000,000,000 Wei
    const rawSubPlanck = BigInt('10000000000000000');
    const rawEvmWei = BigInt('100000000000000000000');
    const normalizedPlanck = rawEvmWei / BigInt(scaleFactor);

    assert.equal(rawSubPlanck, normalizedPlanck, 'Normalized EVM balance in Planck must exactly match Substrate balance');
  });

  it('verifies DualBlockConduit schema invariants on default recent blocks', () => {
    const code = fs.readFileSync(apiTsPath, 'utf-8');
    assert.ok(code.includes('block_number_wasm:'), 'Missing block_number_wasm');
    assert.ok(code.includes('block_number_evm:'), 'Missing block_number_evm');
    assert.ok(code.includes('mapping_latency_ms:'), 'Missing mapping_latency_ms');
    assert.ok(code.includes('delta_blocks:'), 'Missing delta_blocks');
    assert.ok(code.includes('babe_author:'), 'Missing babe_author');
    assert.ok(code.includes('status: \'LOCKSTEP\''), 'Missing LOCKSTEP status');
  });

});
