// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IProofOfCapture {
    struct ImageProof {
        string deviceId;
        uint256 timestamp;
        address owner;
    }

    event Stake(address indexed user, uint256 amount, uint256 indexed timestamp);
    event Slash(address indexed user, uint256 amount, uint256 indexed timestamp);
    event Withdraw(address user);
    event ENSNameLinked(string indexed deviceId, bytes32 indexed node, string ensName);

    error alreadyStaked(address user);
    error NotExactAmount(uint256 amount);
    error TransactionUnsuccessful();
    error ZeroAddress();
    error InvalidInputs();
    error NotOwner();
}