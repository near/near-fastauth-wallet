import { setupFastAuthWallet } from './near-fastauth-wallet';

describe('nearFastauthWallet', () => {
  it('should work', () => {
    expect(setupFastAuthWallet()).toEqual('near-fastauth-wallet');
  });
});
