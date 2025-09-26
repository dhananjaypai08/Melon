#!/bin/bash

cpu_serial=$(grep -m1 'Serial' /proc/cpuinfo | awk '{print $3}')
machine_id=$(cat /etc/machine-id 2>/dev/null)
mac_addr=$(cat /sys/class/net/eth0/address 2>/dev/null)

fingerprint=$(printf "%s%s%s" "$cpu_serial" "$machine_id" "$mac_addr" | sha256sum | cut -d' ' -f1)
echo "$fingerprint"


