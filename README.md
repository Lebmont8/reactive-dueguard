# DueGuard
Event-driven deadline inbox for Reactive Omni and Base Sepolia. Solidity contracts plus an unsigned Node.js CLI.

DeadlineBook schedules or revises a deadline. DueGuard consumes bounded source events and Cron100 ticks; DeadlineInbox validates the callback sender, current revision and due time before accepting a notification. Cancelled, rescheduled, duplicate and premature callbacks are rejected.

## Local verification
Node.js 24 recommended (minimum 22).
~~~sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run demo
node unsigned.mjs book
~~~
Tests execute compiled bytecode in isolated in-memory EVMs with a mocked system/network. They are not live-chain proofs. The CLI emits unsigned envelopes: it does not connect a wallet, sign or broadcast.

The implementation bounds its queue to 64 task IDs, four scanned slots and two callback requests per tick. Deployment requires an operator to verify the current network contracts, registration, funding and terms. No mainnet or unattended production readiness is claimed.

MIT licensed. Original implementation developed with AI assistance.

## Continuous integration
A reference GitHub Actions workflow is included at ci/github-actions.yml. To activate it in your own repository, place it under .github/workflows/. Its presence as a reference does not mean hosted CI is enabled or has passed.
