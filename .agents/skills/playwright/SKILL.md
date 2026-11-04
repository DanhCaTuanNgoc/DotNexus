---
name: playwright
description: Token-optimized browser automation, E2E frontend verification, and visual regression testing using Playwright and Microsoft Playwright MCP.
---

# Playwright Browser Testing & Token-Optimized Automation

Use this skill when testing frontend views, verifying user interaction flows, capturing screenshots of live dashboards, or performing end-to-end (E2E) UI testing on DotNexus.

---

## ⚡ Token-Efficiency & Quota Preservation Protocols (MANDATORY)

To prevent rapid exhaustion of LLM weekly token allowances during UI testing, the Agent MUST adhere to these four core rules:

### 1. Protocol: Prefer Script-Based Execution Over Interactive Multi-Turn Steps
* **Anti-Pattern**: Making 10+ sequential MCP tool calls (`navigate` -> `click` -> `type` -> `click` -> `snapshot` -> `evaluate` -> `evaluate`...) where every single step carries the entire conversation history forward, consuming 30,000–60,000+ tokens.
* **Best Practice**: For multi-step workflows, create a standalone Node.js test script (e.g. in `tests/e2e/test_<feature>.mjs` or scratch space) using Playwright API. Execute it via `run_command`:
  ```bash
  node tests/e2e/test_terminal_e2e.mjs
  ```
* **Savings**: Ingesting the console summary of pass/fail assertions uses **< 500 tokens** (90%+ token reduction) while providing identical 100% real Chromium verification.

### 2. Protocol: Targeted `browser_evaluate` Over Full `browser_snapshot`
* **Anti-Pattern**: Calling `browser_snapshot` repeatedly on complex screens. Dumps the entire page Accessibility Tree (10,000–30,000 tokens) into context.
* **Best Practice**: Use targeted `browser_evaluate` with precise CSS selectors (`document.querySelector(...)`, `getBoundingClientRect()`, `window.getComputedStyle()`) to assert only the relevant DOM elements and state transitions.

### 3. Protocol: Selective Screenshot Capture
* **Rule**: Only call `browser_take_screenshot` when the user explicitly asks for visual proof or when submitting a bug report image.
* **Constraint**: Never take repetitive full-page screenshots between minor interactions.

### 4. Protocol: Proactive Context Management
* **Rule**: Recommend `/compact` to the user after completing extensive browser test suites to compact historical test traces and keep the conversation context window lean.

---

## Capabilities & Common Workflows

### 1. Dev Server Pre-Check
Always ensure frontend (port 5173) and backend (port 5050) are active before initiating tests:
```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 5173, 5050 }
```

### 2. Standalone Script Template (`tests/e2e/template.mjs`)
```javascript
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173/canvas');
    // Targeted assertions...
    console.log('[PASS] Test completed successfully');
  } catch (err) {
    console.error('[FAIL]', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
```

### 3. Interactive MCP Mode (For Quick 1-2 Step Probing)
When quick ad-hoc inspection is needed:
- `browser_navigate`: Go to `http://localhost:5173/<route>`.
- `browser_evaluate`: Read targeted DOM properties or dispatch events.
- `browser_resize`: Test responsive viewports (e.g., 375x667 for mobile drawer positioning).
- `browser_close`: Always cleanly close open tabs after testing.
