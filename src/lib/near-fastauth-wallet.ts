import { encodeSignedDelegate, SignedDelegate } from '@near-js/transactions';
import type {
  Account,
  Action,
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
import {
  NearNetworkIds,
  ChainSignatureContracts,
  BTCNetworkIds,
  fetchDerivedBTCAddress,
  fetchDerivedEVMAddress,
} from 'multichain-tools';

import icon from './fast-auth-icon';
import {
  FastAuthWalletConnection,
  SendMultichainMessage,
} from './fastAuthWalletConnection';

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

interface DerivedAddressParamEVM {
  type: 'EVM';
  path: string;
  contract: ChainSignatureContracts;
}

interface DerivedAddressParamBTC {
  type: 'BTC';
  path: string;
  btcNetworkId: BTCNetworkIds;
  contract: ChainSignatureContracts;
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
    transactions: Optional<Transaction, 'signerId'>[]
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
          new BN(accessKey.access_key.nonce).add(new BN(1)),
          actions,
          nearAPI.utils.serialize.base_decode(block.header.hash)
        );
      })
    );
  };

  const _signAndSendWithRelayer = async ({
    transactions,
    callbackUrl,
  }: {
    transactions: Optional<Transaction, 'signerId'>[];
    callbackUrl?: string;
  }): Promise<void> => {
    const account = _state.wallet.account();
    const needsFAK = await _getNeedFAK(transactions, account);

    if (needsFAK) {
      const { closeDialog, signedDelegates } = await _state.wallet.requestSign({
        transactions: await transformTransactions(transactions),
        callbackUrl,
        type: 'delegates',
      });

      closeDialog();
      await Promise.allSettled(
        signedDelegates.map(async (signedDelegate) => {
          await fetch(relayerUrl, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(
              Array.from(encodeSignedDelegate(signedDelegate))
            ),
            headers: new Headers({ 'Content-Type': 'application/json' }),
          });
        })
      );
    } else {
      const sendTransaction = async (receiverId: string, actions: Action[]) => {
        const signedDelegate = await account.signedDelegate({
          actions: actions.map((action) => createAction(action)),
          blockHeightTtl: 60,
          receiverId,
        });

        const res = await fetch(relayerUrl, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(
            Array.from(encodeSignedDelegate(signedDelegate))
          ),
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });

        // Remove the cached access key to prevent nonce reuse
        delete account.accessKeyByPublicKeyCache[
          signedDelegate.delegateAction.publicKey.toString()
        ];

        return res.json();
      };

      for (const { receiverId, actions } of transactions) {
        const resJSON = await sendTransaction(receiverId, actions);

        // Retry transaction on nonce error
        if (
          resJSON?.status?.Failure?.ActionError?.kind
            ?.DelegateActionInvalidNonce
        ) {
          const retryResJSON = await sendTransaction(receiverId, actions);

          if (!retryResJSON.ok) {
            throw new Error('Failed to send transaction on retry.');
          }
        }
      }
    }
  };

  const _signAndSend = async ({
    transactions,
    callbackUrl,
  }: {
    transactions: Optional<Transaction, 'signerId'>[];
    callbackUrl?: string;
  }): Promise<void> => {
    const account = _state.wallet.account();
    const needsFAK = await _getNeedFAK(transactions, account);

    if (needsFAK) {
      const { closeDialog, signedTransactions } =
        await _state.wallet.requestSign({
          transactions: await transformTransactions(transactions),
          callbackUrl,
          type: 'transactions',
        });

      closeDialog();
      await Promise.allSettled(
        signedTransactions.map(async (signedTransaction) => {
          _state.wallet._near.connection.provider.sendTransaction(
            signedTransaction
          );
        })
      );
    } else {
      for (const { receiverId, actions } of transactions) {
        await account.signAndSendTransaction({
          receiverId,
          actions: actions.map((action) => createAction(action)),
        });
      }
    }
  };

  const _getNeedFAK = async (
    transactions: Optional<Transaction, 'signerId'>[],
    account: nearAPI.ConnectedWalletAccount
  ): Promise<boolean> => {
    const { accessKey } = await account.findAccessKey('', []);
    return transactions.some(({ receiverId }) => {
      return (
        accessKey.permission !== 'FullAccess' &&
        accessKey.permission.FunctionCall.receiver_id !== receiverId
      );
    });
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

    async signAndSendTransaction({ receiverId, actions }): Promise<void> {
      await _signAndSend({ transactions: [{ receiverId, actions }] });
    },

    async signAndSendTransactions({
      transactions,
      callbackUrl,
    }): Promise<void> {
      await _signAndSend({
        transactions,
        callbackUrl,
      });
    },

    async signAndSendDelegateAction({
      receiverId,
      actions,
    }: {
      receiverId: string;
      actions: Action[];
    }): Promise<void> {
      await _signAndSendWithRelayer({
        transactions: [{ receiverId, actions }],
      });
    },

    async signAndSendDelegateActions({
      transactions,
      callbackUrl,
    }: {
      transactions: Optional<Transaction, 'signerId'>[];
      callbackUrl?: string;
    }): Promise<void> {
      await _signAndSendWithRelayer({
        transactions,
        callbackUrl,
      });
    },

    async getDerivedAddress(
      args: DerivedAddressParamEVM | DerivedAddressParamBTC
    ) {
      const account = _state.wallet.account();

      if (args.type === 'EVM') {
        return await fetchDerivedEVMAddress(
          account.accountId,
          args.path,
          account.connection.networkId as NearNetworkIds,
          args.contract
        );
      } else if (args.type === 'BTC') {
        const address = await fetchDerivedBTCAddress(
          account.accountId,
          args.path,
          account.connection.networkId as NearNetworkIds,
          args.btcNetworkId,
          args.contract
        );
        return address;
      } else {
        throw new Error('Unsupported chain type');
      }
    },
    async signAndSendMultiChainTransaction(data: SendMultichainMessage) {
      await _state.wallet.requestSignAndSendMultiChain(data);
    },
    setRelayerUrl({ relayerUrl: relayerUrlArg }) {
      relayerUrl = relayerUrlArg;
    },
    resetRelayerUrl() {
      relayerUrl = params.relayerUrl;
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
