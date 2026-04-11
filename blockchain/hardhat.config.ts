import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || '';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

const networks: any = {
  hardhat: {
    chainId: 31337,
  },
};

if (SEPOLIA_RPC_URL && DEPLOYER_PRIVATE_KEY) {
  networks.sepolia = {
    url: SEPOLIA_RPC_URL,
    accounts: [
      DEPLOYER_PRIVATE_KEY.startsWith('0x')
        ? DEPLOYER_PRIVATE_KEY
        : `0x${DEPLOYER_PRIVATE_KEY}`,
    ],
    chainId: 11155111,
  };
}

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks,
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
