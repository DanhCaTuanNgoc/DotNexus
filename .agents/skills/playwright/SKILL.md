---
name: playwright
description: Browser automation, E2E frontend verification, and visual regression testing using Playwright and Microsoft Playwright MCP.
---

# Playwright Browser Testing & Automation

Use this skill when testing frontend views, verifying user interaction flows, capturing screenshots of live dashboards, or performing end-to-end (E2E) UI testing on DotNexus.

## Capabilities
- **Browser Navigation**: Launch and navigate to local dev server (`http://localhost:5173`) or live URLs.
- **Visual Verification**: Capture full-page or component screenshots for UI auditing against Craft Floor & Vercel design standards.
- **Interaction Testing**: Click buttons, fill inputs, test tabs, trigger alerts, and assert DOM state transitions.
- **Accessibility & Console Audits**: Detect console errors, broken images, and unhandled exceptions during live page runs.

## Common Workflows
1. **Frontend Dev Server Verification**:
   ```bash
   cd front-end && npm run dev
   ```
2. **Headless Snapshot**:
   Take snapshots or run test scripts via Playwright MCP tools or direct Playwright CLI.
3. **Audit Assertions**:
   - Check navigation between tabs: Topology Radar, Security Guard, Staking Yield, Canvas Board.
   - Verify modal dialogs (e.g. RPC Circuit Breaker, Keystore isolation) open and close cleanly without DOM clipping.
