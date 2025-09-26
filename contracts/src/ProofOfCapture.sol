// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import { Ownable } from "@openzeppelin-contracts/contracts/access/Ownable.sol";
import { IProofOfCapture } from "../interfaces/IProofOfCapture.sol";
import { Constants } from "./constants.sol";
import { ReentrancyGuard } from "@openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract ProofOfCapture is Ownable, IProofOfCapture, Constants, ReentrancyGuard {
    mapping(string => address) public hardwareIdOfOwner;
    mapping(address => ImageProof) public hardwareOwnerProofs;
    mapping(address => bool) public isStaked;

    constructor() Ownable(msg.sender) {}

    function stakeTokens(string memory deviceId, string memory imageHash, uint256 nonce, 
        string memory firmware, 
        string memory signatureAlgo) 
        external payable nonReentrant {
        if(bytes(deviceId).length == 0 || bytes(imageHash).length == 0 || bytes(signatureAlgo).length == 0){
            revert InvalidInputs();
        }
        if(isStaked[msg.sender]){
            revert alreadyStaked(msg.sender);
        }
        if(msg.value != STAKING_AMOUNT){
            revert NotExactAmount(msg.value);
        }
        
        hardwareIdOfOwner[deviceId] = msg.sender;
        isStaked[msg.sender] = true;
        ImageProof memory imageProof = ImageProof(deviceId, block.timestamp, imageHash, nonce, firmware, signatureAlgo, msg.sender);
        hardwareOwnerProofs[msg.sender] = imageProof;
        emit Stake(msg.sender, msg.value, block.timestamp);
    }

    function slashUser(address user, uint256 amount) external onlyOwner() nonReentrant {
        address payable zeroAddress = payable(ZERO_ADDRESS);
        isStaked[user] = false;
        
        (bool success, ) = zeroAddress.call{value: amount}("");
        if(!success){
            revert TransactionUnsuccessful();
        }
        emit Slash(user, amount, block.timestamp);
    }

    function withdraw(address payable _recipient) external onlyOwner() nonReentrant {
        if(_recipient == ZERO_ADDRESS){
            revert ZeroAddress();
        }
        (bool success, ) = _recipient.call{value: address(this).balance}("");
        if(!success){
            revert TransactionUnsuccessful();
        }
        emit Withdraw(_recipient);
    }

    function getOwnerHardwareProofs(address user) public view returns(ImageProof memory){
        return hardwareOwnerProofs[user];
    }

}

