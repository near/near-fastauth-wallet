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

The `getDerivedAddress` method is designed to get a derived address for either Ethereum Virtual Machine (EVM) or Bitcoin (BTC) networks based on the provided path.

### Parameters:

- `args`: This parameter is an object that must conform to either `DerivedAddressParamEVM` or `DerivedAddressParamBTC` interfaces, depending on the type of network (EVM or BTC) you are working with.

#### For EVM (`DerivedAddressParamEVM`):

- `type` (string): Must be 'EVM'.
- `path` (string): The derivation path for the address. See: [NEAR Chain Signatures Documentation](https://docs.near.org/build/chain-abstraction/chain-signatures)
- `contract` (`ChainSignatureContracts`): The contract used to send get the signature and public key. Use `v2.multichain-mpc.testnet` for testnet

#### For BTC (`DerivedAddressParamBTC`):

- `type` (string): Must be 'BTC'.
- `path` (string): The derivation path for the address. See: [NEAR Chain Signatures Documentation](https://docs.near.org/build/chain-abstraction/chain-signatures)
- `btcNetworkId` (`BTCNetworkIds`): The Bitcoin network ID. Options are 'mainnet' or 'testnet'.
- `contract` (`ChainSignatureContracts`): The contract used to send get the signature and public key. Use `v2.multichain-mpc.testnet` for testnet

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

#### Example 3: Getting the path

```typescript
import canonicalize from 'canonicalize';

const path = canonicalize({
  chain: 60,
  domain: 'http://localhost:4200',
});

console.log('Derivation Path:', path);
```

## `signAndSendMultiChainTransaction`

### Purpose:

The signAndSendMultiChainTransaction method is designed to handle the signing and sending of transactions across multiple blockchain networks. Currently supports EVM and BTC.

### Parameters:

- `data`: This parameter is an object that conforms to the `SendMultichainMessage` type, which can be either `BTCSendMultichainMessage` or `EvmSendMultichainMessage`.

#### For EVM (`EvmSendMultichainMessage`):

- `chain` (number): The unique identifier for the blockchain. See: [SLIP-0044 documentation](https://github.com/satoshilabs/slips/blob/master/slip-0044.md) for more details.
- `domain` (optional, string): The key domain used on the derivation path. See: [NEAR Chain Signatures Documentation](https://docs.near.org/build/chain-abstraction/chain-signatures)
- `to` (string): The recipient address.
- `value` (bigint): The value to be transferred in wei
- `meta` (optional, object): Additional metadata for the transaction.
- `from` (string): The sender address.
- `chainId` (bigint): The chainId for the EVM network. See: [Chainlist](https://chainlist.org/).
- `maxFeePerGas` (optional, bigint): The maximum fee per gas unit
- `maxPriorityFeePerGas` (optional, bigint): The maximum priority fee per gas unit
- `gasLimit` (optional, number): The gas limit for the transaction

#### For BTC (`BTCSendMultichainMessage`):

- `chain` (number): The unique identifier for the blockchain. See: [SLIP-0044 documentation](https://github.com/satoshilabs/slips/blob/master/slip-0044.md) for more details.
- `domain` (optional, string): The key domain used on the derivation path. See: [NEAR Chain Signatures Documentation](https://docs.near.org/build/chain-abstraction/chain-signatures)
- `to` (string): The recipient address.
- `value` (bigint): The value to be transferred in satoshis
- `meta` (optional, object): Additional metadata for the transaction.
- `from` (string): The sender address.
- `network` ('mainnet' | 'testnet'): The Bitcoin network type.

### Return Value:

The method returns a promise that resolves once the multi-chain transaction signing request is completed.

### Code Examples:

#### Example 1: Signing an EVM Transaction

```typescript
const evmTransactionData = {
  chain: 60,
  domain: 'http://localhost:4200',
  to: '0x4174678c78fEaFd778c1ff319D5D326701449b25',
  value: 10000000000000000n,
  from: '0x0e80ec32e58cf38eb69ac9bff0adb2e637dc49f5',
  chainId: 11155111n,
};

await fastAuthWallet.signAndSendMultiChainTransaction(evmTransactionData);
console.log('EVM transaction signed successfully');
```

#### Example 2: Signing a BTC Transaction

```typescript
const btcTransactionData = {
  chain: 0,
  from: 'mq3jS53tKSBGt3hfyDVaaKHQ37N3EWY7uQ',
  network: 'testnet',
  to: 'tb1qz9f5pqk3t0lhrsuppyzrctdtrtlcewjhy0jngu',
  value: 1000000n,
};

await fastAuthWallet.signAndSendMultiChainTransaction(btcTransactionData);
console.log('BTC transaction signed successfully');
```

### Repository Examples:

For more practical examples and a deeper understanding of how to use the `fastAuthWallet`, you can refer to the following repository:

- [NEAR Multichain Demo](https://github.com/near/near-multichain-demo): This repository provides a comprehensive demo of how to integrate and use the `fastAuthWallet` for multi-chain interactions, including address derivation for both EVM and BTC networks.
