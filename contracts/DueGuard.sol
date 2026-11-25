// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {IOmni,FeePayer} from "./Protocol.sol";
contract DueGuard is FeePayer {
 address public constant SYSTEM=0x8888888888888888888888888888888888888888;
 address public constant CRON_SOURCE=0x0000000000000000000000000000000000fffFfF;
 uint256 public constant LASNA=5318007;uint256 public constant BASE_SEPOLIA=84532;
 uint256 public constant IGNORE=0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad;
 uint256 public constant SCHEDULE_TOPIC=uint256(keccak256("Schedule(bytes32,uint64,uint64,bool)"));
 uint256 public constant CRON_TOPIC=0xb49937fb8970e19fd46d48f7e3fb00d659deac0347f79cd7cb542f0fc1503c70;
 uint256 public constant MAX_TASKS=64;uint256 public constant SCAN_LIMIT=4;uint256 public constant MAX_CALLBACKS=2;
 uint64 public constant CALLBACK_GAS=500000;
 address public immutable owner;address public immutable book;address public inbox;
 bool public paused;bool private armed;uint256 public cursor;
 struct Task {uint64 revision;uint64 dueAt;bool enabled;uint8 attempts;}
 mapping(bytes32=>Task) public tasks;bytes32[] public ids;
 event Observed(bytes32 indexed id,uint64 revision);event CapacityIgnored(bytes32 indexed id);
 event Requested(bytes32 indexed id,uint64 revision,uint8 attempt);
 modifier onlyOwner(){if(msg.sender!=owner)revert Unauthorized();_;}
 constructor(address book_) payable FeePayer(SYSTEM){require(block.chainid==LASNA,"testnet only");if(book_==address(0))revert BadConfiguration();owner=msg.sender;book=book_;_source(true);}
 function setInbox(address target) external onlyOwner {if(inbox!=address(0)||target==address(0))revert BadConfiguration();inbox=target;armed=true;if(!paused)_cron(true);}
 function setPaused(bool value) external onlyOwner {if(paused==value)return;paused=value;_source(!value);if(armed)_cron(!value);}
 function settleDebt() external onlyOwner {_settle();}
 function taskCount() external view returns(uint256){return ids.length;}
 function _source(bool add) private {if(add)IOmni(SYSTEM).subscribe(BASE_SEPOLIA,book,SCHEDULE_TOPIC,IGNORE,IGNORE,IGNORE);else IOmni(SYSTEM).unsubscribe(BASE_SEPOLIA,book,SCHEDULE_TOPIC,IGNORE,IGNORE,IGNORE);}
 function _cron(bool add) private {if(add)IOmni(SYSTEM).subscribe(LASNA,CRON_SOURCE,CRON_TOPIC,IGNORE,IGNORE,IGNORE);else IOmni(SYSTEM).unsubscribe(LASNA,CRON_SOURCE,CRON_TOPIC,IGNORE,IGNORE,IGNORE);}
 function react(IOmni.LogRecord calldata log_) external onlyProvider {
  if(paused)return;
  if(log_.chainId==BASE_SEPOLIA&&log_.contractAddress==book&&log_.topic0==SCHEDULE_TOPIC){
   if(log_.opCode!=2||log_.topic2!=0||log_.topic3!=0||log_.data.length!=96||log_.topic1==0)return;
   (uint256 rev,uint256 due,uint256 enabled)=abi.decode(log_.data,(uint256,uint256,uint256));
   if(rev==0||rev>type(uint64).max||due>type(uint64).max||enabled>1||(enabled==1&&due==0))return;
   bytes32 id=bytes32(log_.topic1);Task storage t=tasks[id];if(rev<=t.revision)return;
   if(t.revision==0){if(ids.length==MAX_TASKS){emit CapacityIgnored(id);return;}ids.push(id);}
   tasks[id]=Task(uint64(rev),uint64(due),enabled==1,0);emit Observed(id,uint64(rev));
  }else if(log_.chainId==LASNA&&log_.contractAddress==CRON_SOURCE&&log_.topic0==CRON_TOPIC&&log_.opCode==1&&log_.data.length==32){
   if(!armed)return;uint256 count=ids.length;if(count==0)return;
   uint256 scanned;uint256 sent;
   while(scanned<SCAN_LIMIT&&scanned<count){
    bytes32 id=ids[cursor];cursor=(cursor+1)%count;scanned++;
    Task storage t=tasks[id];if(t.enabled&&t.attempts==0&&block.timestamp>=t.dueAt){_request(id,t);sent++;if(sent==MAX_CALLBACKS)break;}
   }
  }
 }
 function _request(bytes32 id,Task storage t) private {
  t.attempts++;
  IOmni(SYSTEM).requestCallbackV_1_0(IOmni.CallbackConfiguration_V_1_0(BASE_SEPOLIA,inbox,CALLBACK_GAS,abi.encodeWithSignature("notify(address,bytes32,uint64,uint64)",address(0),id,t.revision,t.dueAt)));
  emit Requested(id,t.revision,t.attempts);
 }
 /// @notice Manual retry ONLY after inspecting actual callback receipts. Never automatic.
 function retry(bytes32 id) external onlyOwner {Task storage t=tasks[id];if(paused||!armed||!t.enabled||t.attempts==0||t.attempts>=3||block.timestamp<t.dueAt)revert BadConfiguration();_request(id,t);}
}
