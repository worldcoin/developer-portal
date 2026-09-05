# World Chain workflow

Retrieve current network information, contract deployments, deployment guidance, and relevant EVM differences. Preserve the repository's Foundry/Hardhat/viem/ethers choices. Verify chain IDs, RPCs, and deployed addresses from current documentation and the target RPC instead of remembering them.

Resolve mainnet, Sepolia, or local fork explicitly. Do not treat a Portal app's environment as the chain selection. Adding network configuration does not authorize a deployment, transfer, bridge, or upgrade.

For World ID contracts, use the documented verifier and result mapping for the selected protocol. Enforce context binding and replay prevention in the contract before effects; backend proof verification is not a universal prerequisite.

Compile, test, and simulate the requested transaction when supported. Before a requested broadcast, resolve the actual chain/account and use the project's existing secret mechanism. After broadcast, reconcile an uncertain outcome by transaction hash or account nonce before sending again. Verify the receipt, chain, deployed bytecode and requested postconditions. Report local/fork testing separately from public-network results.
