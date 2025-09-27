import { readContract } from '@wagmi/core';
import { config } from './wagmi.js';
import { PROOF_OF_CAPTURE_ADDRESS, PROOF_OF_CAPTURE_ABI } from './contract.js';

/**
 * Check if a hardware device is claimed by a staker
 * @param {string} deviceId - The hardware device ID
 * @returns {Promise<{isClaimed: boolean, owner: string}>}
 */
export async function checkHardwareOwnership(deviceId) {
  try {
    const owner = await readContract(config, {
      address: PROOF_OF_CAPTURE_ADDRESS,
      abi: PROOF_OF_CAPTURE_ABI,
      functionName: 'ownerOfDevice',
      args: [deviceId],
    });
    console.log("Owner address:", owner);
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const isClaimed = owner.toLowerCase() !== zeroAddress.toLowerCase();
    
    return {
      isClaimed,
      owner: isClaimed ? owner : null
    };
  } catch (error) {
    console.error("Error checking hardware ownership:", error);
    throw new Error(`Failed to verify hardware ownership: ${error.message}`);
  }
}