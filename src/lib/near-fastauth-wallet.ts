import { encodeSignedDelegate } from '@near-js/transactions';
import type {
  Account,
  BrowserWallet,
  Network,
  Optional,
  Transaction,
  WalletBehaviourFactory,
  WalletModuleFactory,
} from '@near-wallet-selector/core';
import { createAction } from '@near-wallet-selector/wallet-utils';
import * as nearAPI from 'near-api-js';
import BN from 'bn.js';
import { createHash } from 'crypto';
import { serialize } from 'borsh';
import bs58 from 'bs58';

import icon from './fast-auth-icon';
import { FastAuthWalletConnection } from './fastAuthWalletConnection';
export interface FastAuthWalletParams {
  walletUrl?: string;
  iconUrl?: string;
  deprecated?: boolean;
  successUrl?: string;
  failureUrl?: string;
  relayerUrl?: string;
}

interface FastAuthWalletExtraOptions {
  walletUrl: string;
  relayerUrl: string;
}

interface FastAuthWalletState {
  wallet: FastAuthWalletConnection;
  keyStore: nearAPI.keyStores.BrowserLocalStorageKeyStore;
  near: any;
}

const resolveWalletUrl = (network: Network, walletUrl?: string) => {
  if (walletUrl) {
    return walletUrl;
  }

  switch (network.networkId) {
    case 'mainnet':
      return 'https://wallet.near.org/fastauth';
    case 'testnet':
      return 'https://wallet.testnet.near.org/fastauth';
    default:
      throw new Error('Invalid wallet url');
  }
};

const setupWalletState = async (
  params: FastAuthWalletExtraOptions,
  network: Network
): Promise<FastAuthWalletState> => {
  const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();

  const near = await nearAPI.connect({
    keyStore,
    walletUrl: params.walletUrl,
    ...network,
    headers: {},
  });

  const wallet = new FastAuthWalletConnection(near, 'near_app');

  return {
    wallet,
    keyStore,
    near,
  };
};

const FastAuthWallet: WalletBehaviourFactory<
  BrowserWallet,
  { params: FastAuthWalletExtraOptions }
> = async ({ metadata, options, store, params, logger }) => {
  const _state = await setupWalletState(params, options.network);
  let relayerUrl = params.relayerUrl;
  const getAccounts = async (): Promise<Array<Account>> => {
    const accountId = _state.wallet.getAccountId();
    const account = _state.wallet.account();

    if (!accountId || !account) {
      return [];
    }

    const publicKey = await account.connection.signer.getPublicKey(
      account.accountId,
      options.network.networkId
    );
    return [
      {
        accountId,
        publicKey: publicKey ? publicKey.toString() : '',
      },
    ];
  };

  const transformTransactions = async (
    transactions: Array<Optional<Transaction, 'signerId'>>
  ) => {
    const account = _state.wallet.account();
    const { networkId, signer, provider } = account.connection;

    const localKey = await signer.getPublicKey(account.accountId, networkId);

    return Promise.all(
      transactions.map(async (transaction, index) => {
        const actions = transaction.actions.map((action) =>
          createAction(action)
        );
        const accessKey = await account.accessKeyForTransaction(
          transaction.receiverId,
          actions,
          localKey
        );

        if (!accessKey) {
          throw new Error(
            `Failed to find matching key for transaction sent to ${transaction.receiverId}`
          );
        }

        const block = await provider.block({ finality: 'final' });

        return nearAPI.transactions.createTransaction(
          account.accountId,
          nearAPI.utils.PublicKey.from(accessKey.public_key),
          transaction.receiverId,
          accessKey.access_key.nonce + index + 1,
          actions,
          nearAPI.utils.serialize.base_decode(block.header.hash)
        );
      })
    );
  };

  return {
    async signIn({
      contractId,
      methodNames,
      successUrl,
      failureUrl,
      email,
      accountId,
      isRecovery,
    }: any) {
      const existingAccounts = await getAccounts();

      if (existingAccounts.length) {
        return existingAccounts;
      }

      await _state.wallet.requestSignIn({
        contractId,
        methodNames,
        successUrl,
        failureUrl,
        email,
        accountId,
        isRecovery,
      });

      return getAccounts();
    },

    async signOut() {
      if (_state.wallet.isSignedIn()) {
        _state.wallet.signOut();
      }
    },

    async getAccounts() {
      return getAccounts();
    },

    async verifyOwner() {
      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async signAndSendTransaction({ receiverId, actions, signerId }) {
      const account = _state.wallet.account();

      const { accessKey } = await account.findAccessKey(
        receiverId as string,
        []
      );

      const needsFAK =
        accessKey.permission !== 'FullAccess' &&
        accessKey.permission.FunctionCall.receiver_id !== receiverId;

      if (needsFAK) {
        const { signer, networkId, provider } = account.connection;
        const block = await provider.block({ finality: 'final' });
        const localKey = await signer.getPublicKey(
          account.accountId,
          networkId
        );
        const txAccessKey = await account.accessKeyForTransaction(
          receiverId as string,
          actions.map(createAction),
          localKey
        );
        const transaction = nearAPI.transactions.createTransaction(
          account.accountId,
          nearAPI.utils.PublicKey.from(txAccessKey.public_key),
          receiverId as string,
          txAccessKey.access_key.nonce + 1,
          actions.map(createAction),
          nearAPI.utils.serialize.base_decode(block.header.hash)
        );
        const arg = {
          transactions: [transaction],
        };
        const { closeDialog, signedDelegates } =
          await _state.wallet.requestSignTransactions(arg);
        closeDialog();
        signedDelegates.forEach((signedDelegate) =>
          fetch(relayerUrl, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(
              Array.from(encodeSignedDelegate(signedDelegate))
            ),
            headers: new Headers({ 'Content-Type': 'application/json' }),
          })
        );
      } else {
        const signedDelegate = await account.signedDelegate({
          actions: actions.map((action) => createAction(action)),
          blockHeightTtl: 60,
          receiverId: receiverId as string,
        });

        await fetch(relayerUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(
            Array.from(encodeSignedDelegate(signedDelegate))
          ),
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      }
    },

    async signAndSendTransactions({ transactions, callbackUrl }) {
      const account = _state.wallet.account();
      const { accessKey } = await account.findAccessKey('', []);

      const needsFAK = transactions.some(({ receiverId }) => {
        return (
          accessKey.permission !== 'FullAccess' &&
          accessKey.permission.FunctionCall.receiver_id !== receiverId
        );
      });

      if (needsFAK) {
        const arg = {
          transactions: await transformTransactions(transactions),
          callbackUrl,
        };
        const { closeDialog, signedDelegates } =
          await _state.wallet.requestSignTransactions(arg);
        closeDialog();
        signedDelegates.forEach((signedDelegate) =>
          fetch(relayerUrl, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(
              Array.from(encodeSignedDelegate(signedDelegate))
            ),
            headers: new Headers({ 'Content-Type': 'application/json' }),
          })
        );
      } else {
        for (const { receiverId, signerId, actions } of transactions) {
          const signedDelegate = await account.signedDelegate({
            actions: actions.map((action) => createAction(action)),
            blockHeightTtl: 60,
            receiverId: receiverId as string,
          });

          await fetch(relayerUrl, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(
              Array.from(encodeSignedDelegate(signedDelegate))
            ),
            headers: new Headers({ 'Content-Type': 'application/json' }),
          });
        }
      }
    },
    /**
     * Signs a transaction by calling a smart contract method with the given payload in a structured format,
     * hashing algorithm configuration, and key path. The structured payload will be serialized and hashed
     * using the specified algorithm and salt before being used in the smart contract method.
     * @param {Object} params - The parameters for invoking the smart contract method.
     * @param {Object} params.payload - The structured payload to be serialized, hashed, and used in the smart contract method.
     * @param {Object} params.hashingAlgorithmConfig - The configuration for the hashing algorithm, including the name and salt.
     * @param {string} params.hashingAlgorithmConfig.name - The name of the hashing algorithm to be used.
     * @param {Uint8Array} params.hashingAlgorithmConfig.salt - The salt to be used in the hashing process.
     * @param {string} params.keyPath - The key keyPath to be used in the smart contract method.
     */
    async signMultiChainTransaction({
      payload,
      hashingAlgorithmConfig: { name, salt },
      serializationConfig, // Updated to use serializationConfig object
      chain,
      chainId,
      keyPath,
    }: {
      payload: unknown;
      hashingAlgorithmConfig: {
        name: 'SHA-256' | 'SHA-3' | 'Keccak-256' | 'BLAKE2b';
        salt: Uint8Array;
      };
      serializationConfig: {
        format: 'Borsh' | 'RLP' | 'CustomBinary' | 'Amino';
        schema?: any;
      };
      chain: 'Bitcoin' | 'Ethereum' | 'BinanceChain' | 'NEAR';
      chainId?: string;
      keyPath: string;
    }) {
      let serializedPayload;
      switch (serializationConfig.format) {
        case 'Borsh':
          if (!serializationConfig.schema) {
            throw new Error('Schema is required for Borsh serialization');
          }
          // Serialize using Borsh with the provided schema
          serializedPayload = serialize(serializationConfig.schema, payload);
          break;
        // case 'Amino':
        //   if (!serializationConfig.schema) {
        //     throw new Error('Schema is required for Amino serialization');
        //   }
        //   // Serialize using Amino with the provided schema
        //   serializedPayload = serializeAmino(serializationConfig.schema, payload);
        //   break;
        // case 'RLP':
        //   // Serialize using RLP (no schema required)
        //   serializedPayload = serializeRLP(payload);
        //   break;
        // case 'CustomBinary':
        //   // Handle custom binary serialization, which may or may not require a schema
        //   serializedPayload = serializeCustomBinary(serializationConfig.schema, payload);
        //   break;
        default:
          throw new Error('Unsupported serialization format');
      }

      const sha256 = createHash('sha256');

      let hashedPayload;
      switch (name) {
        case 'SHA-256':
          hashedPayload = sha256
            .update(Buffer.from(JSON.stringify(serializedPayload)))
            .digest('hex');
          break;
        // case 'SHA-3':
        //   const { sha3_256 } = require('js-sha3');
        //   hashedPayload = sha3_256(Buffer.from(JSON.stringify(serializedPayload)));
        //   break;
        // case 'Keccak-256':
        //   const { keccak256 } = require('js-sha3');
        //   hashedPayload = keccak256(Buffer.from(JSON.stringify(serializedPayload)));
        //   break;
        // case 'BLAKE2b':
        //   const { blake2bHex } = require('blakejs');
        //   hashedPayload = blake2bHex(Buffer.from(JSON.stringify(serializedPayload)));
        //   break;
        default:
          throw new Error('Unsupported hashing algorithm');
      }

      function hexStringToUint8Array(hexString) {
        if (hexString.length % 2 !== 0) {
          throw new Error('Hex string must have an even length');
        }

        const arrayLength = hexString.length / 2;
        const uint8Array = new Uint8Array(arrayLength);

        for (let i = 0; i < arrayLength; i++) {
          const byteValue = parseInt(hexString.substr(i * 2, 2), 16);
          uint8Array[i] = byteValue;
        }

        return uint8Array;
      }

      const account = _state.wallet.account();
      const payloadArr = hexStringToUint8Array(hashedPayload);

      // debugger

      const functionCall = nearAPI.transactions.functionCall(
        'sign',
        {
          payload: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2,
            3, 4, 5, 6, 7, 8, 9, 1, 2,
          ],
          path: 'test',
        },
        new BN('300000000000000'),
        0
      );

      const { signer, networkId, provider } = account.connection;
      const block = await provider.block({ finality: 'final' });
      const localKey = await signer.getPublicKey(account.accountId, networkId);
      const txAccessKey = await account.accessKeyForTransaction(
        account.accountId,
        [functionCall],
        localKey
      );
      const transaction = nearAPI.transactions.createTransaction(
        account.accountId,
        nearAPI.utils.PublicKey.from(txAccessKey.public_key),
        'multichain-testnet-2.testnet',
        txAccessKey.access_key.nonce + 1,
        [functionCall],
        nearAPI.utils.serialize.base_decode(block.header.hash)
      );
      const arg = {
        transactions: [transaction],
      };
      const { closeDialog, signedDelegates } =
        await _state.wallet.requestSignTransactions(arg);
      closeDialog();

      signedDelegates.forEach(async (signedDelegate) => {
        const res = await fetch(
          'http://near-relayer-testnet.api.pagoda.co/relay',
          {
            method: 'POST',
            mode: 'cors',
            // body: JSON.stringify({
            //   delegate_action: {
            //     actions: [
            //       {
            //         FunctionCall: {
            //           deposit:
            //             signedDelegate.delegateAction.actions[0].functionCall
            //               .deposit,
            //           args: Buffer.from(
            //             signedDelegate.delegateAction.actions[0].functionCall
            //               .args
            //           ).toString('base64'),
            //           gas: parseInt(
            //             signedDelegate.delegateAction.actions[0].functionCall
            //               .gas,
            //             10
            //           ),
            //           method_name:
            //             signedDelegate.delegateAction.actions[0].functionCall
            //               .methodName,
            //         },
            //       },
            //     ],
            //     nonce: parseInt(signedDelegate.delegateAction.nonce, 10),
            //     max_block_height: parseInt(
            //       signedDelegate.delegateAction.maxBlockHeight,
            //       10
            //     ),
            //     public_key: signedDelegate.delegateAction.publicKey.toString(),
            //     receiver_id: signedDelegate.delegateAction.receiverId,
            //     sender_id: signedDelegate.delegateAction.senderId,
            //   },
            //   signature: `ed25519:${bs58.encode(
            //     signedDelegate.signature.data
            //   )}`,
            // }),
            body: JSON.stringify(
              Array.from(encodeSignedDelegate(signedDelegate))
            ),
            headers: new Headers({ 'Content-Type': 'application/json' }),
          }
        );
        const resJSON = await res.text();
        console.log(resJSON);
      });
    },
    setRelayerUrl({ relayerUrl: relayerUrlArg }) {
      relayerUrl = relayerUrlArg;
    },
    resetRelayerUrl() {
      relayerUrl = params.relayerUrl;
    },
    async signMultiChain() {
      console.log('calling signAndSendTransactionMultiChain');
    },
  };
};

export function setupFastAuthWallet({
  walletUrl,
  iconUrl = icon,
  deprecated = false,
  successUrl = '',
  failureUrl = '',
  relayerUrl = '',
}: FastAuthWalletParams = {}): WalletModuleFactory<BrowserWallet> {
  return async (moduleOptions) => {
    return {
      id: 'fast-auth-wallet',
      type: 'browser',
      metadata: {
        name: 'FastAuthWallet',
        description: null,
        iconUrl,
        deprecated,
        available: true,
        successUrl,
        failureUrl,
        walletUrl: resolveWalletUrl(moduleOptions.options.network, walletUrl),
      },
      init: (options) => {
        return FastAuthWallet({
          ...options,
          params: {
            walletUrl: resolveWalletUrl(options.options.network, walletUrl),
            relayerUrl,
          },
        });
      },
    };
  };
}
