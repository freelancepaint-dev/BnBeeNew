# BnBeeHive — BSC Testnet deployment package

This package compiles the supplied BakedBeans contract with pinned `solc@0.8.9`, then builds a mobile-first BSC Testnet deployment/UI site.

## Safety boundary
- Testnet only (BSC chain ID 97 / tBNB).
- The deployment UI is locked to public deployer `0x0F8C77d66BE897ded49b2793b71f2A3Eb63CCaA8`.
- No private key or seed phrase belongs in this repository.
- The deploying wallet becomes both `owner()` and the constructor-set fee recipient (`recAdd`).
- `seedMarket()` is owner-only and can be called once.
- This miner contract creates no external yield; payouts depend on contract liquidity.
- This package is not a professional security audit and is not a mainnet approval.

## GitHub build
Push all files to the repository. GitHub Actions installs the exact compiler package, compiles `contracts/BakedBeans.sol`, builds the website, and uploads `web/dist` as the `bnbeehive-site` artifact. A compiler mismatch or Solidity error fails the workflow.

## Local build
`npm install`
`npm --prefix web install`
`npm run build`

The compiler script asserts `0.8.9+commit.e5eed63a.Emscripten.clang` before emitting the ABI/bytecode artifact.

## Hosting
After the GitHub Action succeeds, publish `web/dist` on an HTTPS static host. Open the hosted site in a wallet-compatible iPhone browser. The UI requests BSC Testnet (0x61), checks the connected deployment address, and asks the wallet to approve each transaction.
