import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    opBNBTestnet: {
      url: "https://opbnb-testnet-rpc.bnbchain.org",
      chainId: 5611,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    opBNBMainnet: {
      url: "https://opbnb-mainnet-rpc.bnbchain.org",
      chainId: 204,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      opBNBTestnet: process.env.OPBNB_SCAN_API_KEY || "",
      opBNBMainnet: process.env.OPBNB_SCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "opBNBTestnet",
        chainId: 5611,
        urls: {
          apiURL: "https://open-platform.nodereal.io/",
          browserURL: "https://testnet.opbnbscan.com",
        },
      },
      {
        network: "opBNBMainnet",
        chainId: 204,
        urls: {
          apiURL: "https://open-platform.nodereal.io/",
          browserURL: "https://opbnbscan.com",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
