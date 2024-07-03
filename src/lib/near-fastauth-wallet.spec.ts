import { setupFastAuthWallet } from './near-fastauth-wallet';

describe('nearFastAuthWallet', () => {
  it('Should create a FastAuthWallet with correct metadata', async () => {
    const walletFactory = setupFastAuthWallet({
      walletUrl: 'https://wallet.url',
    });
    expect(walletFactory).toBeInstanceOf(Object);

    const factoryOptions = {
      languageCode: undefined,
      network: {
        networkId: 'testnet',
      },
      debug: false,
      optimizeWalletOrder: false,
      randomizeWalletOrder: false,
      relayerUrl: undefined,
    };

    const walletModule = await walletFactory({ options: factoryOptions });
    expect(walletModule.id).toBe('fast-auth-wallet');
    expect(walletModule.type).toBe('browser');
    expect(walletModule.metadata.name).toBe('FastAuthWallet');
    expect(walletModule.metadata.walletUrl).toBe('https://wallet.url');
  });
});
