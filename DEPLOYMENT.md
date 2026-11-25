# Owner-gated testnet continuation
No step below has been dispatched. No private keys are requested or accepted by these tools.
## Preconditions
Fresh owner STOP/lease/effect status; actual DoraHacks registration and personally accepted current terms. Verify exact approved track/deadline/eligibility. Owner chooses controlled testnet-only signing accounts on Base Sepolia84532 and Lasna5318007, obtains test ETH/lREACT within zero-new-cash rule. No mainnet funds; no agent faucet transfer/signature. Fee budget/debt/reserves/provider parameters must be queried before activation.
Pinned docs: dev.reactive.network/reactive-mainnet, origins-and-destinations, economy. Lasna RPC https://lasna-rpc.rnk.dev/; system0x8888888888888888888888888888888888888888. Base Sepolia callback proxy0x476F44b11F5C942c58f4c8E3d0300E5710743585. Refresh from primary sources and verify chain IDs; a URL alone is not proof.
## Deployment order (every external write reserve -> owner signing -> fresh primary receipt)
1. Generate unsigned Book payload: node unsigned.mjs book. Owner deploys on84532. Record actual receipt/address/owner, deployed bytecode and block identity.
2. node unsigned.mjs reactive ACTUAL_BOOK. Owner deploys DueGuard on5318007. Record actual source subscription and receipt/address. Do not pass a guessed Book address.
3. node unsigned.mjs inbox ACTUAL_BOOK ACTUAL_REACTIVE. Owner deploys Inbox on84532. Verify immutable proxy/book/reactive sender, code and receipt.
4. node unsigned.mjs activate ACTUAL_REACTIVE ACTUAL_INBOX. Owner calls setInbox once. Verify exact source+cron subscription criteria, funding/reserves/debt on BOTH service providers and gas budget. No agent fund transfer.
5. node unsigned.mjs schedule ACTUAL_BOOK 0xACTUAL_64_HEX_TASK_ID FUTURE_UTC_ISO. Human verifies and signs on84532. Record actual Schedule receipt. Use a genuine near-future deadline, never synthetic IDs/receipts as proof.
6. Observe actual Omni react/Requested receipt and actual destination Inbox Due receipt. Polling/followup bounded and read-only; unknown external outcomes reconciled, not resent.
7. Capture raw eth_getTransactionByHash, eth_getTransactionReceipt and eth_getBlockByHash results on their correct networks with eth_chainId. Form captured-loop.json per audit-loop.mjs; preserve raw response SHA/URLs/check time. The offline checker is structural only; verify primary RPC/explorer/deployed bytecode independently before declaring live execution.
8. Exercise an actual cancel-before-delivery and reschedule scenario within approved testnet signing scope; demonstrate no duplicate Due. Show paused/resume-sync behavior and debt limits truthfully.
9. Record a genuine working <3min demo; include addresses/hashes/source/license/README and AI disclosure. Reserve exact repository/project submission effect only after eligibility is verified, then one dispatch and actual remote receipt. Do not submit from preparing.
## Recovery
Callback failure may still charge gas. Inspect callbacks(getCallbacks) and destination receipt first. Only owner may trigger a bounded explicit retry; no timer blindly resends. Cancellation/reschedule invalidates old callbacks at Inbox. Chain clock skew can reject an early callback; inspect then retry after actual destination deadline.
Unknown receipt/broadcast means reconcile by transaction hash/address/code, NEVER blindly recreate. Re-deploy if immutable wrong; not by altering claimed evidence.
