import { Account, Connection, Contract } from '@near-js/accounts';
import { InMemoryKeyStore } from '@near-js/keystores';
import BN from 'bn.js';
import { ChainSignatureContracts } from './types';

const getMultichainContract = (
  account: Account,
  contract: ChainSignatureContracts
) =>
  new Contract(account, contract, {
    viewMethods: ['public_key'],
    changeMethods: ['sign'],
  }) as Contract & {
    public_key: () => Promise<string>;
    // eslint-disable-next-line no-unused-vars
    sign: (args: {
      args: {
        payload: number[];
        path: string;
      };
      gas: BN;
    }) => Promise<[string, string]>;
  };

export async function getRootPublicKey(
  contract: ChainSignatureContracts,
  nearNetworkId: string
): Promise<string | undefined> {
  const nearConnection = Connection.fromConfig({
    networkId: nearNetworkId,
    provider: {
      type: 'JsonRpcProvider',
      args: {
        url: {
          testnet: 'https://rpc.testnet.near.org',
          mainnet: 'https://rpc.mainnet.near.org',
        }[nearNetworkId],
      },
    },
    signer: { type: 'InMemorySigner', keyStore: new InMemoryKeyStore() },
  });

  const nearAccount = new Account(nearConnection, 'dontcare');
  const multichainContractAcc = getMultichainContract(nearAccount, contract);

  return multichainContractAcc.public_key();
}
