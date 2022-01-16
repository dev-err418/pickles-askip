import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";

// const RPC_URLS: { [chainId: number]: string } = {
//   1: process.env.RPC_URL_1 as string,
//   4: process.env.RPC_URL_4 as string,
// };

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42],
});

export const walletlink = new WalletLinkConnector({
  //   url: RPC_URLS[1],
  //a placer dans un .env file !!!
  url: "https://mainnet.infura.io/v3/60ab76e16df54c808e50a79975b4779f",
  appName: "web3-react example",
});
