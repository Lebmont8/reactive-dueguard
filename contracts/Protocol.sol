// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
// Original minimal interoperability declarations. ABI facts pinned in SOURCE_REGISTER.json.
// No implementation from the UNLICENSED upstream reference is incorporated.
interface IOmni {
 struct LogRecord {uint256 chainId;address contractAddress;uint256 topic0;uint256 topic1;uint256 topic2;uint256 topic3;bytes data;uint256 blockNumber;uint256 opCode;uint256 blockHash;uint256 txHash;uint256 logIndex;}
 struct CallbackConfiguration_V_1_0 {uint256 chainId;address recipient;uint64 gasLimit;bytes payload;}
 function subscribe(uint256,address,uint256,uint256,uint256,uint256) external;
 function unsubscribe(uint256,address,uint256,uint256,uint256,uint256) external;
 function requestCallbackV_1_0(CallbackConfiguration_V_1_0 calldata) external;
 function debt(address) external view returns(uint256);
}
abstract contract FeePayer {
 address public immutable feeProvider;
 error Unauthorized();error PaymentFailed();error BadConfiguration();
 constructor(address provider){if(provider==address(0))revert BadConfiguration();feeProvider=provider;}
 modifier onlyProvider(){if(msg.sender!=feeProvider)revert Unauthorized();_;}
 receive() external payable{}
 function pay(uint256 amount) external onlyProvider {if(amount>address(this).balance)revert PaymentFailed();if(amount!=0){(bool sent,)=payable(feeProvider).call{value:amount}("");if(!sent)revert PaymentFailed();}}
 function _settle() internal {uint256 due=IOmni(feeProvider).debt(address(this));if(due>address(this).balance)revert PaymentFailed();if(due!=0){(bool sent,)=payable(feeProvider).call{value:due}("");if(!sent)revert PaymentFailed();}}
}
