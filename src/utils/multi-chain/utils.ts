import * as bitcoin from 'bitcoinjs-lib';
import { generateBTCAddress, generateEthereumAddress } from './kdf';
import { getRootPublicKey } from './signature';
import {
  NearNetworkIds,
  ChainSignatureContracts,
  BTCNetworkIds,
} from './types';

/**
 * Derives an Ethereum address for a given signer ID and derivation path.
 *
 * This method leverages the root public key associated with the signer ID to generate an Ethereum address
 * and public key based on the specified derivation path.
 *
 * @param {string} signerId - The identifier of the signer.
 * @param {string} path - The derivation path used for generating the address.
 * @param {string} nearNetworkId - The near network id used to interact with the NEAR blockchain.
 * @param {ChainSignatureContracts} multichainContractId - The contract identifier used to get the root public key.
 * @returns {Promise<string>} A promise that resolves to the derived Ethereum address.
 */
export async function fetchDerivedEVMAddress(
  signerId: string,
  path: string,
  nearNetworkId: NearNetworkIds,
  multichainContractId: ChainSignatureContracts
): Promise<string> {
  const contractRootPublicKey = await getRootPublicKey(
    multichainContractId,
    nearNetworkId
  );

  return generateEthereumAddress(signerId, path, contractRootPublicKey);
}

/**
 * Derives a Bitcoin address and its corresponding public key for a given signer ID and derivation path.
 * This method utilizes the root public key associated with the signer ID to generate a Bitcoin address
 * and public key buffer based on the specified derivation path and network.
 *
 * @param {string} signerId - The unique identifier of the signer.
 * @param {string} path - The derivation path used to generate the address.
 * @param {bitcoin.networks.Network} network - The Bitcoin network (e.g., mainnet, testnet).
 * @param {string} nearNetworkId - The network id used to interact with the NEAR blockchain.
 * @param {ChainSignatureContracts} contract - The mpc contract's accountId on the NEAR blockchain.
 * @returns {Promise<{ address: string; publicKey: Buffer }>} An object containing the derived Bitcoin address and its corresponding public key buffer.
 */
export async function fetchDerivedBTCAddressAndPublicKey(
  signerId: string,
  path: string,
  network: BTCNetworkIds,
  nearNetworkId: NearNetworkIds,
  contract: ChainSignatureContracts
): Promise<{ address: string; publicKey: Buffer }> {
  const contractRootPublicKey = await getRootPublicKey(contract, nearNetworkId);

  const derivedKey = await generateBTCAddress(
    signerId,
    path,
    contractRootPublicKey
  );

  const publicKeyBuffer = Buffer.from(derivedKey, 'hex');

  const { address } = bitcoin.payments.p2pkh({
    pubkey: publicKeyBuffer,
    network:
      network === 'mainnet'
        ? bitcoin.networks.bitcoin
        : bitcoin.networks.testnet,
  });

  return { address, publicKey: publicKeyBuffer };
}
