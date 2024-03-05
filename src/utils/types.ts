type EVMChainConfig = {
  name: string;
  id: number;
};

type BTCChainConfig = {
  name: string;
};

export type ChainsConfig = EVMChainConfig | BTCChainConfig;
