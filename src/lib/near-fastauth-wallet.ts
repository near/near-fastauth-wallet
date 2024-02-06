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
     * Signs a transaction by calling a smart contract method with the given payload and derivation path.
     * The payload is expected to be a 32-byte array, and it will be used along with the path in the smart contract method:
     * pub fn sign(&mut self, payload: [u8; 32], path: String) -> Promise: https://github.com/near/mpc-recovery/blob/94f9c662e2affb2f7bf149c8a0a47649e36e11ba/contract/src/lib.rs#L263
     * @param {Object} params - The parameters for invoking the smart contract method.
     * @param {Uint8Array} params.payload - The 32-byte payload to be used in the smart contract method.
     * @param {string} params.path - The derivation path to be used in the smart contract method.
     */
    async signMultiChainTransaction({
      payload,
      path,
    }: {
      payload: Uint8Array;
      path: string;
    }) {
      const account = _state.wallet.account();

      const functionCall = nearAPI.transactions.functionCall(
        'sign',
        {
          payload,
          path,
        },
        new BN('2500000000000'), // TODO: How much gos is enough
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
        account.accountId,
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
      console.log('2');
      signedDelegates.forEach(async (signedDelegate) => {
        const res = await fetch(relayerUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(
            Array.from(encodeSignedDelegate(signedDelegate))
          ),
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
        console.log(res);
        debugger;
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
