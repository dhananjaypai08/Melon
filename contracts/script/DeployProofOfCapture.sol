// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {ProofOfCapture} from "../src/ProofOfCapture.sol";

contract ProofOfCaptureScript is Script {
    ProofOfCapture public proofOfCapture;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        proofOfCapture = new ProofOfCapture();

        vm.stopBroadcast();
        console.log("Contract deployed on : ", address(proofOfCapture));
    }
}
