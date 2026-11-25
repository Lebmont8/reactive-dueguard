// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {FeePayer} from "./Protocol.sol";
interface IBook {function plans(bytes32)external view returns(uint64,uint64,bool);}
contract DeadlineInbox is FeePayer {
 address public constant BASE_PROXY=0x476F44b11F5C942c58f4c8E3d0300E5710743585;
 address public immutable reactive;address public immutable book;address public immutable owner;
 mapping(bytes32=>uint64) public deliveredRevision;
 event Due(bytes32 indexed taskId,uint64 revision,uint64 dueAt,uint256 deliveredAt);
 event Ignored(bytes32 indexed taskId,uint64 revision);
 constructor(address book_,address reactive_) payable FeePayer(BASE_PROXY){
  require(block.chainid==84532,"testnet only");if(book_==address(0)||reactive_==address(0))revert BadConfiguration();book=book_;reactive=reactive_;owner=msg.sender;
 }
 function notify(address sender,bytes32 id,uint64 revision,uint64 dueAt) external onlyProvider {
  if(sender!=reactive)revert Unauthorized();
  (uint64 current,uint64 deadline,bool enabled)=IBook(book).plans(id);
  if(!enabled||current!=revision||deadline!=dueAt||block.timestamp<dueAt||deliveredRevision[id]>=revision){emit Ignored(id,revision);return;}
  deliveredRevision[id]=revision;emit Due(id,revision,dueAt,block.timestamp);
 }
 function settleDebt() external {if(msg.sender!=owner)revert Unauthorized();_settle();}
}
