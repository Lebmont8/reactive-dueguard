// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
contract DeadlineBook {
 uint256 public constant BASE_SEPOLIA=84532;
 address public immutable owner;
 struct Plan {uint64 revision;uint64 dueAt;bool enabled;}
 mapping(bytes32=>Plan) public plans;
 event Schedule(bytes32 indexed taskId,uint64 revision,uint64 dueAt,bool enabled);
 error Unauthorized();error InvalidPlan();
 constructor(){require(block.chainid==BASE_SEPOLIA,"testnet only");owner=msg.sender;}
 modifier onlyOwner(){if(msg.sender!=owner)revert Unauthorized();_;}
 function schedule(bytes32 id,uint64 dueAt) external onlyOwner {
  if(id==bytes32(0)||dueAt<=block.timestamp||dueAt>block.timestamp+365 days)revert InvalidPlan();
  Plan storage p=plans[id];p.revision++;p.dueAt=dueAt;p.enabled=true;emit Schedule(id,p.revision,dueAt,true);
 }
 function cancel(bytes32 id) external onlyOwner {
  Plan storage p=plans[id];if(p.revision==0)revert InvalidPlan();p.revision++;p.enabled=false;emit Schedule(id,p.revision,p.dueAt,false);
 }
 /// @notice Re-emit state after subscription was paused. No off-chain polling.
 function sync(bytes32 id) external onlyOwner {Plan memory p=plans[id];if(p.revision==0)revert InvalidPlan();emit Schedule(id,p.revision,p.dueAt,p.enabled);}
}
