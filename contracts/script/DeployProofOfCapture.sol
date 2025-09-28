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

        proofOfCapture = new ProofOfCapture(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e, 0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5);

        vm.stopBroadcast();
        console.log("Contract deployed on : ", address(proofOfCapture));
    }
}
