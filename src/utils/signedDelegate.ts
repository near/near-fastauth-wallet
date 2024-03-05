import { SignedDelegate } from '@near-js/transactions';
import bs58 from 'bs58';

interface FunctionCall {
  FunctionCall: {
    method_name: string;
    args: string;
    gas: number;
    deposit: string;
  };
}

type Actions = FunctionCall;

interface DelegateActionRelayerFormat {
  actions: Actions[];
  nonce: number;
  max_block_height: number;
  public_key: string;
  receiver_id: string;
  sender_id: string;
}

interface SignedDelegateRelayerFormat {
  delegate_action: DelegateActionRelayerFormat;
  signature: string;
}

/**
 * Parses the signedDelegate object from the Multi-Party Computation (MPC) format to the Relayer format.
 * @param signedDelegate - The signedDelegate object in MPC format.
 * @returns The signedDelegate object in Relayer format.
 */
export function parseSignedDelegateForRelayer(
  signedDelegate: SignedDelegate
): SignedDelegateRelayerFormat {
  return {
    delegate_action: {
      actions: signedDelegate.delegateAction.actions
        .map((action) => {
          if (action.functionCall) {
            return {
              FunctionCall: {
                method_name: action.functionCall.methodName,
                args: Buffer.from(action.functionCall.args).toString('base64'),
                gas: action.functionCall.gas.toNumber(),
                deposit: action.functionCall.deposit.toString(),
              },
            };
          } else {
            return undefined;
          }
        })
        .filter((t) => t),
      nonce: signedDelegate.delegateAction.nonce.toNumber(),
      max_block_height: signedDelegate.delegateAction.maxBlockHeight.toNumber(),
      public_key: signedDelegate.delegateAction.publicKey.toString(),
      receiver_id: signedDelegate.delegateAction.receiverId,
      sender_id: signedDelegate.delegateAction.senderId,
    },
    signature: `ed25519:${bs58.encode(signedDelegate.signature.data)}`,
  };
}
