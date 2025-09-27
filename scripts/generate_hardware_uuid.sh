#!/usr/bin/env bash
set -euo pipefail

# -------------------------
# Collect hardware identifiers
# -------------------------
cpu_serial=$(grep -m1 'Serial' /proc/cpuinfo | awk '{print $3}' || echo "unknown")
machine_id=$(cat /etc/machine-id 2>/dev/null || echo "unknown")
mac_addr=$(cat /sys/class/net/eth0/address 2>/dev/null || echo "unknown")

# -------------------------
# Generate fingerprint
# -------------------------
fingerprint=$(printf "%s%s%s" "$cpu_serial" "$machine_id" "$mac_addr" | sha256sum | cut -d' ' -f1)

# -------------------------
# Collect system details
# -------------------------
platform=$(uname -s)      # Kernel name (Linux, Darwin, etc.)
architecture=$(uname -m)  # Machine architecture (armv7l, aarch64, x86_64, etc.)
os_release=$(grep -m1 PRETTY_NAME /etc/os-release | cut -d= -f2- | tr -d '"')

# -------------------------
# Output
# -------------------------
echo "-----------------------------------"
echo "System Information"
echo "-----------------------------------"
echo "OS:          $os_release"
echo "Platform:    $platform"
echo "Architecture:$architecture"
echo "CPU Serial:  $cpu_serial"
echo "Machine ID:  $machine_id"
echo "MAC Address: $mac_addr"
echo "-----------------------------------"
echo "Your hardware-uuid:"
echo "$fingerprint"

