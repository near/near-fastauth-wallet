import type {
  InMemorySigner,
  keyStores,
  Near,
  WalletConnection,
} from 'near-api-js';
import { KeyPair, utils } from 'near-api-js';
import { ConnectedWalletAccount } from 'near-api-js';
import { deserialize } from 'near-api-js/lib/utils/serialize';
import type { Transaction } from '@near-js/transactions';
import {
  SCHEMA,
  SignedDelegate,
  SignedTransaction,
} from '@near-js/transactions';
import { loadIframeDialog } from '../ui/reactApp';

const LOGIN_PATH = '/login/';
const CREATE_ACCOUNT_PATH = '/create-account/';
const LOCAL_STORAGE_KEY_SUFFIX = '_wallet_auth_key';
const PENDING_ACCESS_KEY_PREFIX = 'pending_key'; // browser storage key for a pending access key (i.e. key has been generated but we are not sure it was added yet)

type SignMessageEventType = 'signedTransactions' | 'signedDelegates';

type SignedTransactionsResult = {
  signedTransactions: SignedTransaction[];
  closeDialog: () => void;
  error?: string;
};

type SignedDelegatesResult = {
  signedDelegates: SignedDelegate[];
  closeDialog: () => void;
  error?: string;
};
interface SignInOptions {
  contractId?: string;
  methodNames?: string[];
  // TODO: Replace following with single callbackUrl
  successUrl?: string;
  failureUrl?: string;
  email?: string;
  accountId?: string;
  isRecovery?: boolean;
}

/**
 * Information to send NEAR wallet for signing transactions and redirecting the browser back to the calling application
 */
interface RequestSignTransactionsOptions {
  /** list of transactions to sign */
  transactions: Transaction[];
  /** url NEAR Wallet will redirect to after transaction signing is complete */
  callbackUrl?: string;
  /** meta information NEAR Wallet will send back to the application. `meta` will be attached to the `callbackUrl` as a url search param */
  meta?: string;
}

interface BaseSendMultichainMessage {
  chain: number;
  domain?: string;
  to: string;
  value: bigint;
  meta?: { [k: string]: any };
  from: string;
}

type EvmSendMultichainMessage = BaseSendMultichainMessage & {
  chainId: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasLimit?: number;
};

type BTCSendMultichainMessage = BaseSendMultichainMessage & {
  network: 'mainnet' | 'testnet';
};

type SendMultichainMessage =
  | BTCSendMultichainMessage
  | EvmSendMultichainMessage;

export class FastAuthWalletConnection {
  /** @hidden */
  _walletBaseUrl: string;

  /** @hidden */
  _authDataKey: string;

  /** @hidden */
  _keyStore: keyStores.KeyStore;

  /** @hidden */
  _authData: { accountId?: string; allKeys?: string[] };

  /** @hidden */
  _networkId: string;

  /** @hidden */
  // _near: Near;
  _near: Near;

  /** @hidden */
  _connectedAccount: ConnectedWalletAccount;

  /** @hidden */
  _completeSignInPromise: Promise<void>;

  constructor(near: Near, appKeyPrefix: string) {
    if (typeof appKeyPrefix !== 'string') {
      throw new Error(
        'Please define a clear appKeyPrefix for this WalletConnection instance as the second argument to the constructor'
      );
    }

    if (typeof window === 'undefined') {
      return new Proxy(this, {
        get(target, property) {
          if (property === 'isSignedIn') {
            return () => false;
          }
          if (property === 'getAccountId') {
            return () => '';
          }
          if (
            target[property as keyof FastAuthWalletConnection] &&
            typeof target[property as keyof FastAuthWalletConnection] ===
              'function'
          ) {
            return () => {
              throw new Error(
                'No window found in context, please ensure you are using WalletConnection on the browser'
              );
            };
          }
          return target[property as keyof FastAuthWalletConnection];
        },
      });
    }
    this._near = near;
    const authDataKey = appKeyPrefix + LOCAL_STORAGE_KEY_SUFFIX;
    const authData = JSON.parse(
      window.localStorage.getItem(authDataKey) as string
    );
    this._networkId = near.config.networkId;
    this._walletBaseUrl = near.config.walletUrl;
    appKeyPrefix = appKeyPrefix || near.config.contractName || 'default';
    this._keyStore = (near.connection.signer as InMemorySigner).keyStore;
    this._authData = authData || { allKeys: [] };
    this._authDataKey = authDataKey;
    if (!this.isSignedIn()) {
      this._completeSignInPromise = this._completeSignInWithAccessKey();
    }
  }

  /**
   * Returns true, if this WalletConnection is authorized with the wallet.
   * @example
   * ```js
   * const wallet = new WalletConnection(near, 'my-app');
   * wallet.isSignedIn();
   * ```
   */
  isSignedIn() {
    return !!this._authData.accountId;
  }

  /**
   * Returns promise of completing signing in after redirecting from wallet
   * @example
   * ```js
   * // on login callback page
   * const wallet = new WalletConnection(near, 'my-app');
   * wallet.isSignedIn(); // false
   * await wallet.isSignedInAsync(); // true
   * ```
   */
  async isSignedInAsync() {
    if (!this._completeSignInPromise) {
      return this.isSignedIn();
    }

    await this._completeSignInPromise;
    return this.isSignedIn();
  }

  /**
   * Returns authorized Account ID.
   * @example
   * ```js
   * const wallet = new WalletConnection(near, 'my-app');
   * wallet.getAccountId();
   * ```
   */
  getAccountId() {
    return this._authData.accountId || '';
  }

  /**
   * Redirects current page to the wallet authentication page.
   * @param options An optional options object
   * @param options.contractId The NEAR account where the contract is deployed
   * @param options.successUrl URL to redirect upon success. Default: current url
   * @param options.failureUrl URL to redirect upon failure. Default: current url
   *
   * @example
   * ```js
   * const wallet = new WalletConnection(near, 'my-app');
   * // redirects to the NEAR Wallet
   * wallet.requestSignIn({ contractId: 'account-with-deploy-contract.near' });
   * ```
   */
  async requestSignIn({
    contractId,
    methodNames,
    successUrl,
    failureUrl,
    email,
    accountId,
    isRecovery,
  }: SignInOptions) {
    const currentUrl = new URL(window.location.href);
    const URL_SUFFIX = isRecovery ? LOGIN_PATH : CREATE_ACCOUNT_PATH;
    const newUrl = new URL(this._walletBaseUrl + URL_SUFFIX);

    newUrl.searchParams.set('success_url', successUrl || currentUrl.href);
    newUrl.searchParams.set('failure_url', failureUrl || currentUrl.href);
    if (contractId) {
      /* Throws exception if contract account does not exist */
      const contractAccount = await this._near.account(contractId);
      await contractAccount.state();

      newUrl.searchParams.set('contract_id', contractId);
      const accessKey = KeyPair.fromRandom('ed25519');
      newUrl.searchParams.set(
        'public_key',
        accessKey.getPublicKey().toString()
      );
      await this._keyStore.setKey(
        this._networkId,
        PENDING_ACCESS_KEY_PREFIX + accessKey.getPublicKey(),
        accessKey
      );
    }

    if (methodNames) {
      methodNames.forEach((methodName) => {
        newUrl.searchParams.append('methodNames', methodName);
      });
    }

    if (email) {
      newUrl.searchParams.append('email', email);
    }
    if (accountId) {
      newUrl.searchParams.append('accountId', accountId);
    }
    if (isRecovery !== undefined) {
      newUrl.searchParams.append('isRecovery', isRecovery + '');
    }

    loadIframeDialog(newUrl.toString());

    const {
      publicKey,
      allKeys,
      accountId: signedInAccountId,
    } = (await new Promise((resolve) => {
      const listener = (e: MessageEvent) => {
        if (
          e.data.params &&
          e.data.params.request_type === 'complete_authentication'
        ) {
          window.removeEventListener('message', listener);
          resolve({
            publicKey: e.data.params.publicKey,
            allKeys: e.data.params.allKeys,
            accountId: e.data.params.accountId,
          });
        }
      };

      window.addEventListener('message', listener);
    })) as {
      publicKey: string;
      allKeys: string;
      accountId: string;
    };

    if (publicKey && allKeys && signedInAccountId) {
      currentUrl.searchParams.append('public_key', publicKey);
      currentUrl.searchParams.append('all_keys', allKeys);
      currentUrl.searchParams.append('account_id', signedInAccountId);
      window.location.replace(currentUrl);
    }
  }

  private createSignRequestUrl({
    transactions,
    meta,
    callbackUrl,
  }: RequestSignTransactionsOptions): URL {
    const currentUrl = new URL(window.location.href);
    const newUrl = new URL(this._walletBaseUrl + '/sign/');

    newUrl.searchParams.set(
      'transactions',
      transactions
        .map((transaction) => utils.serialize.serialize(SCHEMA, transaction))
        .map((serialized) => Buffer.from(serialized).toString('base64'))
        .join(',')
    );
    newUrl.searchParams.set('success_url', callbackUrl || currentUrl.href);
    newUrl.searchParams.set('failure_url', callbackUrl || currentUrl.href);

    if (meta) newUrl.searchParams.set('meta', meta);

    return newUrl;
  }

  private handleSignMessageEvent<T extends SignMessageEventType>(
    resolve: (
      value: T extends 'signedTransactions'
        ? SignedTransactionsResult
        : SignedDelegatesResult
    ) => void,
    expectedKey: T
  ) {
    const listener = (e: MessageEvent) => {
      if (!Object.prototype.hasOwnProperty.call(e.data, expectedKey)) return;

      window.removeEventListener('message', listener);

      const deserializeData = (data: string) => {
        const buffer = Buffer.from(data, 'base64');
        if (expectedKey === 'signedTransactions') {
          return deserialize(SCHEMA, SignedTransaction, buffer);
        } else {
          return deserialize(SCHEMA, SignedDelegate, buffer);
        }
      };

      const result = {
        [expectedKey]: e.data[expectedKey]
          ? e.data[expectedKey].split(',').map(deserializeData)
          : [],
        closeDialog: () => undefined,
        error: e.data.error,
      };

      resolve(
        result as T extends 'signedTransactions'
          ? SignedTransactionsResult
          : SignedDelegatesResult
      );
    };

    return listener;
  }

  async requestSign({
    transactions,
    meta,
    callbackUrl,
    type,
  }: RequestSignTransactionsOptions & {
    type: 'transactions' | 'delegates';
  }): Promise<{
    signedTransactions?: SignedTransaction[];
    signedDelegates?: SignedDelegate[];
    closeDialog: () => void;
    error?: string;
  }> {
    const newUrl = this.createSignRequestUrl({
      transactions,
      meta,
      callbackUrl,
    });
    loadIframeDialog(newUrl.toString());

    return new Promise((resolve) => {
      let eventType: SignMessageEventType;
      if (type === 'transactions') {
        eventType = 'signedTransactions';
      } else {
        eventType = 'signedDelegates';
      }
      const listener = this.handleSignMessageEvent(resolve, eventType);
      window.addEventListener('message', listener);
    });
  }

  /**
   * @hidden
   * Complete sign in for a given account id and public key. To be invoked by the app when getting a callback from the wallet.
   */
  async _completeSignInWithAccessKey() {
    const currentUrl = new URL(window.location.href);
    const publicKey = currentUrl.searchParams.get('public_key') || '';
    const allKeys = (currentUrl.searchParams.get('all_keys') || '').split(',');
    const accountId = currentUrl.searchParams.get('account_id') || '';
    // TODO: Handle errors during login
    if (accountId) {
      const authData = {
        accountId,
        allKeys,
      };
      window.localStorage.setItem(this._authDataKey, JSON.stringify(authData));
      if (publicKey) {
        await this._moveKeyFromTempToPermanent(accountId, publicKey);
      }
      this._authData = authData;
    }
    currentUrl.searchParams.delete('public_key');
    currentUrl.searchParams.delete('all_keys');
    currentUrl.searchParams.delete('account_id');
    currentUrl.searchParams.delete('meta');
    currentUrl.searchParams.delete('transactionHashes');

    window.history.replaceState({}, document.title, currentUrl.toString());
  }

  /**
   * @hidden
   * @param accountId The NEAR account owning the given public key
   * @param publicKey The public key being set to the key store
   */
  async _moveKeyFromTempToPermanent(accountId: string, publicKey: string) {
    const keyPair = await this._keyStore.getKey(
      this._networkId,
      PENDING_ACCESS_KEY_PREFIX + publicKey
    );
    await this._keyStore.setKey(this._networkId, accountId, keyPair);
    await this._keyStore.removeKey(
      this._networkId,
      PENDING_ACCESS_KEY_PREFIX + publicKey
    );
  }

  /**
   * Sign out from the current account
   * @example
   * walletConnection.signOut();
   */
  signOut() {
    this._authData = {};
    window.localStorage.removeItem(this._authDataKey);
  }

  /**
   * Returns the current connected wallet account
   */
  account() {
    if (!this._connectedAccount) {
      this._connectedAccount = new ConnectedWalletAccount(
        this as unknown as WalletConnection,
        this._near.connection,
        this._authData.accountId as string
      );
    }
    return this._connectedAccount;
  }

  async requestSignMultiChain(data: SendMultichainMessage) {
    const newUrl = new URL(this._walletBaseUrl + '/sign-multichain/');
    const iframe = await loadIframeDialog(newUrl.toString());

    const waitForPageLoad = (): Promise<string> =>
      new Promise((innerResolve, innerReject) => {
        const checkPageLoad = (event: MessageEvent): void => {
          if (event.data.type === 'signMultiChainLoaded') {
            window.removeEventListener('message', checkPageLoad);
            innerResolve('Page loaded successfully');
          }
        };

        window.addEventListener('message', checkPageLoad);

        setTimeout(() => {
          window.removeEventListener('message', checkPageLoad);
          innerReject('Page load timeout');
        }, 500);
      });

    try {
      await waitForPageLoad();

      iframe.contentWindow?.postMessage(
        {
          type: 'multiChainRequest',
          data,
        },
        '*'
      );
    } catch (error) {
      console.error(error);
    }

    return new Promise((resolve) => {
      const listener = (event: MessageEvent): void => {
        if (event.data.type === 'multiChainResponse') {
          window.removeEventListener('message', listener);
          resolve(event.data);
        }
      };

      window.addEventListener('message', listener);
    });
  }
}
