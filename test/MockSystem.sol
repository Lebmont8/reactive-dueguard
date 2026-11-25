// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {IOmni} from "../contracts/Protocol.sol";
// Test-only local EVM system stub, NOT a deployed network implementation.
contract MockSystem {
 bytes public lastPayload;address public lastRecipient;uint256 public requests;uint256 public subscriptions;uint256 public unsubscriptions;bool public failRequests;
 event Sent(uint256 chainId,address recipient,uint64 gasLimit,bytes payload);
 function subscribe(uint256,address,uint256,uint256,uint256,uint256)external{subscriptions++;}
 function unsubscribe(uint256,address,uint256,uint256,uint256,uint256)external{unsubscriptions++;}
 function requestCallbackV_1_0(IOmni.CallbackConfiguration_V_1_0 calldata c)external{require(!failRequests,"mock failure");require(c.chainId==84532&&c.gasLimit>=100000);lastPayload=c.payload;lastRecipient=c.recipient;requests++;emit Sent(c.chainId,c.recipient,c.gasLimit,c.payload);}
 function debt(address)external pure returns(uint256){return 0;}
 function setFailure(bool value)external{failRequests=value;}
 receive() external payable{}
}
