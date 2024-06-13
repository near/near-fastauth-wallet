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
- `signerId` (string): The NEAR accountId of the signer.
- `path` (string): The derivation path for the address. See: [NEAR Chain Signatures Documentation](https://docs.near.org/build/chain-abstraction/chain-signatures)
- `networkId` (`NearNetworkIds`): The NEAR network ID. Options are 'mainnet' or 'testnet'.
- `contract` (`ChainSignatureContracts`): The contract used to send get the signature and public key. Use: `v2.multichain-mpc.testnet`

#### For BTC (`DerivedAddressParamBTC`):

- `type` (string): Must be 'BTC'.
- `signerId` (string): The NEAR accountId of the signer.
- `path` (string): The derivation path for the address. See: [NEAR Chain Signatures Documentation](https://docs.near.org/build/chain-abstraction/chain-signatures)
- `networkId` (`NearNetworkIds`): The NEAR network ID. Options are 'mainnet' or 'testnet'.
- `btcNetworkId` (`BTCNetworkIds`): The Bitcoin network ID. Options are 'mainnet' or 'testnet'.
- `contract` (`ChainSignatureContracts`): The contract used to send get the signature and public key. Use: `v2.multichain-mpc.testnet`

### Return Value:

The method returns a promise that resolves to the derived address for the specified blockchain network.

### Code Examples:

#### Example 1: Deriving an EVM Address

```typescript
const derivedEVMAddress = await fastAuthWallet.getDerivedAddress({
  type: 'EVM',
  signerId: 'example-signer.near',
  path: 'near.org,test.near,1',
  networkId: 'testnet',
  contract: ChainSignatureContracts.EVM_CONTRACT,
});

console.log('Derived EVM Address:', derivedEVMAddress);
```

#### Example 2: Deriving a BTC Address

```typescript
const derivedBTCAddress = await fastAuthWallet.getDerivedAddress({
  type: 'BTC',
  signerId: 'example-signer.near',
  path: 'near.org,test.near,1',
  networkId: 'testnet',
  btcNetworkId: 'testnet',
  contract: ChainSignatureContracts.BTC_CONTRACT,
});

console.log('Derived BTC Address:', derivedBTCAddress);
```

### Detailed Explanation:

#### EVM Address Derivation:

This example derives an Ethereum-compatible address for a signer using the specified derivation path, NEAR network, and EVM contract. The address can be used for interacting with Ethereum-based applications.

#### BTC Address Derivation:

This example derives a Bitcoin address for a signer using the specified derivation path, NEAR network, Bitcoin network, and BTC contract. The address can be used for Bitcoin transactions or related functionalities.

This method allows applications to seamlessly integrate multi-chain functionalities by deriving necessary addresses from NEAR accounts, enhancing interoperability and flexibility in blockchain interactions.

### Repository Examples:

For more practical examples and a deeper understanding of how to use the `fastAuthWallet`, you can refer to the following repository:

- [NEAR Multichain Demo](https://github.com/near/near-multichain-demo): This repository provides a comprehensive demo of how to integrate and use the `fastAuthWallet` for multi-chain interactions, including address derivation for both EVM and BTC networks. It includes setup instructions, code examples, and detailed explanations to help you get started quickly.
