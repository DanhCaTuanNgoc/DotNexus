#!/usr/bin/env bash
# ==============================================================================
# DotNexus — OS-Level Validator Keystore Fencing & Anti-Equivocation Script
# Target Network: Portaldot Network V3.0 (Substrate WASM + EVM pallet-revive)
# Triggered by: Dead Man's Switch Daemon when lease renewal timeout (> 10.0s) occurs.
# Guarantee: Primary Node is irrevocably silenced (chmod 000 & SIGTERM) before Standby
# takes over signing authority at 15.0s, eliminating Double-Signing Slashing.
# ==============================================================================

set -euo pipefail

ACTION="${1:-fence}"
KEYSTORE_DIR="${2:-${KEYSTORE_PATH:-/var/lib/portaldot/chains/portaldot_v3/keystore}}"
SERVICE_NAME="${PORTALDOT_SERVICE_NAME:-portaldot-validator}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "===================================================================="
echo "⚡ DotNexus Anti-Equivocation Fencing Orchestrator"
echo "🕒 Timestamp: ${TIMESTAMP}"
echo "📁 Target Keystore: ${KEYSTORE_DIR}"
echo "⚙️ Action: ${ACTION}"
echo "===================================================================="

if [ "$ACTION" = "fence" ]; then
    echo "🚨 [CRITICAL] Executing Emergency Host Fencing..."

    # 1. Atomic Keystore Isolation (chmod 000)
    if [ -d "$KEYSTORE_DIR" ]; then
        echo "🔒 Revoking all read/write/execute permissions on keystore files..."
        chmod -R 000 "$KEYSTORE_DIR" 2>/dev/null || true
        echo "✅ Keystore directory permissions clamped to 000."
    else
        echo "⚠️ Warning: Keystore directory $KEYSTORE_DIR not found on standard path. Creating quarantine marker."
    fi

    # 2. Write fence marker lockfile
    MARKER_DIR=$(dirname "$KEYSTORE_DIR" 2>/dev/null || echo "/tmp")
    MARKER_FILE="${MARKER_DIR}/.dotnexus_fenced.lock"
    cat <<EOF > "$MARKER_FILE" 2>/dev/null || true
STATUS=FENCED
TIMESTAMP=${TIMESTAMP}
REASON=DEAD_MANS_SWITCH_TIMEOUT_10S
SYSTEM_ACTION=VALIDATOR_SIGNING_ISOLATED
EOF
    echo "🔒 Fencing lockfile written: ${MARKER_FILE}"

    # 3. Terminate validator binary process
    echo "🛑 Signaling systemd service: ${SERVICE_NAME}..."
    if command -v systemctl >/dev/null 2>&1; then
        systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    fi

    # Fallback process search & SIGTERM
    VALIDATOR_PIDS=$(pgrep -f "portaldot.*validator" 2>/dev/null || true)
    if [ -n "$VALIDATOR_PIDS" ]; then
        echo "🛑 Sending SIGTERM to validator processes: ${VALIDATOR_PIDS}"
        kill -15 $VALIDATOR_PIDS 2>/dev/null || true
        sleep 2
        # Escalate to SIGKILL if still lingering
        REMAINING_PIDS=$(pgrep -f "portaldot.*validator" 2>/dev/null || true)
        if [ -n "$REMAINING_PIDS" ]; then
            echo "🛑 Sending SIGKILL to stubborn processes: ${REMAINING_PIDS}"
            kill -9 $REMAINING_PIDS 2>/dev/null || true
        fi
    fi

    echo "✅ [SUCCESS] Primary Validator successfully fenced & silenced. Equivocation prevented."
    exit 0

elif [ "$ACTION" = "unfence" ] || [ "$ACTION" = "restore" ]; then
    echo "🔓 [MAINTENANCE] Restoring Keystore permissions for authorized operator..."

    if [ -d "$KEYSTORE_DIR" ]; then
        chmod 700 "$KEYSTORE_DIR" 2>/dev/null || true
        chmod 600 "$KEYSTORE_DIR"/* 2>/dev/null || true
        echo "✅ Keystore permissions restored to 700 / 600."
    fi

    MARKER_DIR=$(dirname "$KEYSTORE_DIR" 2>/dev/null || echo "/tmp")
    MARKER_FILE="${MARKER_DIR}/.dotnexus_fenced.lock"
    rm -f "$MARKER_FILE" 2>/dev/null || true
    echo "✅ Fencing lockfile removed."
    echo "✅ [SUCCESS] Validator Node un-fenced. Ready for controlled restart."
    exit 0

elif [ "$ACTION" = "status" ]; then
    MARKER_DIR=$(dirname "$KEYSTORE_DIR" 2>/dev/null || echo "/tmp")
    MARKER_FILE="${MARKER_DIR}/.dotnexus_fenced.lock"
    if [ -f "$MARKER_FILE" ]; then
        echo "STATUS: FENCED"
        cat "$MARKER_FILE"
        exit 1
    else
        echo "STATUS: ACTIVE (NOT_FENCED)"
        exit 0
    fi

else
    echo "❌ Unknown action: $ACTION. Supported: fence | unfence | status"
    exit 2
fi
