# near-fastauth-wallet

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build --buildLibsFromSource` to build the library.

## Deploying

Need to make sure npm is installed and user is authenticated
Run `cd dist/near-fastauth-wallet && npm publish` to publish npm package

## Running unit tests

Run `nx test near-fastauth-wallet` to execute the unit tests via [Jest](https://jestjs.io).

# Documentation

## `getDerivedAddress`

### Purpose:

The `getDerivedAddress` method is designed to get a derived address for either Ethereum Virtual Machine (EVM) or Bitcoin (BTC) networks based on the provided parameters.

### Parameters:

- `args`: This parameter is an object that must conform to either `DerivedAddressParamEVM` or `DerivedAddressParamBTC` interfaces, depending on the type of network (EVM or BTC) you are working with.

#### For EVM (`DerivedAddressParamEVM`):

- `type` (string): Must be 'EVM'.
- `path` (string): The derivation path for the address. See: [NEAR Chain Signatures Documentation](https://docs.near.org/build/chain-abstraction/chain-signatures)
- `contract` (`ChainSignatureContracts`): The contract used to send get the signature and public key. Use: `v2.multichain-mpc.testnet`

#### For BTC (`DerivedAddressParamBTC`):

- `type` (string): Must be 'BTC'.
- `path` (string): The derivation path for the address. See: [NEAR Chain Signatures Documentation](https://docs.near.org/build/chain-abstraction/chain-signatures)
- `btcNetworkId` (`BTCNetworkIds`): The Bitcoin network ID. Options are 'mainnet' or 'testnet'.
- `contract` (`ChainSignatureContracts`): The contract used to send get the signature and public key. Use: `v2.multichain-mpc.testnet`

### Return Value:

The method returns a promise that resolves to the derived address for the specified blockchain network.

### Code Examples:

#### Example 1: Deriving an EVM Address

```typescript
const derivedEVMAddress = await fastAuthWallet.getDerivedAddress({
  type: 'EVM',
  path: 'near.org,test.near,1',
  contract: 'v2.multichain-mpc.testnet',
});

console.log('Derived EVM Address:', derivedEVMAddress);
```

#### Example 2: Deriving a BTC Address

```typescript
const derivedBTCAddress = await fastAuthWallet.getDerivedAddress({
  type: 'BTC',
  path: 'near.org,test.near,1',
  btcNetworkId: 'testnet',
  contract: 'v2.multichain-mpc.testnet',
});

console.log('Derived BTC Address:', derivedBTCAddress);
```

### Repository Examples:

For more practical examples and a deeper understanding of how to use the `fastAuthWallet`, you can refer to the following repository:

- [NEAR Multichain Demo](https://github.com/near/near-multichain-demo): This repository provides a comprehensive demo of how to integrate and use the `fastAuthWallet` for multi-chain interactions, including address derivation for both EVM and BTC networks.
