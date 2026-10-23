#!/usr/bin/env bash
# ==============================================================================
# DotNexus — Enterprise Validator Node Firewall Hardening Script
# Target Network: Portaldot Network V3.0 (Substrate WASM + EVM pallet-revive)
# Protects Portaldot Nodes from SYN Floods, Port Scanning & Public RPC Exposure
# ==============================================================================

set -euo pipefail

echo "🛡️  Initializing DotNexus Node Firewall Hardening..."

# Check root privileges
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: This script must be run as root (use sudo)."
  exit 1
fi

P2P_PORT=30333
SUBSTRATE_WS_PORT=9944
EVM_RPC_PORT=8545
DOTNEXUS_GATEWAY_PORT=5050
SSH_PORT=22

echo "⚙️  Configuring iptables security rules..."

# 1. Flush existing user rules (with caution)
iptables -F INPUT
iptables -F FORWARD

# 2. Allow Loopback interface unconditionally
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# 3. Allow established and related connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# 4. Protect SSH (port 22) with rate-limiting (max 4 new connections per minute per IP)
iptables -A INPUT -p tcp --dport "$SSH_PORT" -m conntrack --ctstate NEW -m recent --set --name SSH
iptables -A INPUT -p tcp --dport "$SSH_PORT" -m conntrack --ctstate NEW -m recent --update --seconds 60 --hitcount 4 --rttl --name SSH -j DROP
iptables -A INPUT -p tcp --dport "$SSH_PORT" -j ACCEPT

# 5. Harden Libp2p P2P Port 30333 against TCP SYN Floods (max 20 new conns/sec per IP)
echo "🔒 Applying Libp2p port $P2P_PORT anti-DDoS connection rate limits..."
iptables -A INPUT -p tcp --dport "$P2P_PORT" -m state --state NEW -m recent --set --name P2P_SYN
iptables -A INPUT -p tcp --dport "$P2P_PORT" -m state --state NEW -m recent --update --seconds 1 --hitcount 20 --name P2P_SYN -j DROP
iptables -A INPUT -p tcp --dport "$P2P_PORT" -j ACCEPT

# 6. Restrict raw Substrate WS (9944) and EVM RPC (8545) to localhost ONLY
echo "🛡️  Isolating raw RPC ports ($SUBSTRATE_WS_PORT and $EVM_RPC_PORT) to localhost loopback..."
iptables -A INPUT -p tcp -s 127.0.0.1 --dport "$SUBSTRATE_WS_PORT" -j ACCEPT
iptables -A INPUT -p tcp --dport "$SUBSTRATE_WS_PORT" -j DROP

iptables -A INPUT -p tcp -s 127.0.0.1 --dport "$EVM_RPC_PORT" -j ACCEPT
iptables -A INPUT -p tcp --dport "$EVM_RPC_PORT" -j DROP

# 7. Allow DotNexus Gateway (port 5050) for authenticated monitoring
iptables -A INPUT -p tcp --dport "$DOTNEXUS_GATEWAY_PORT" -j ACCEPT

# 8. Drop all other unhandled incoming traffic
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

echo "✅ DotNexus Node Firewall Hardening successfully applied!"
echo "📋 Active iptables summary:"
iptables -L INPUT -n -v --line-numbers
