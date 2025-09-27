import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";

const galelio = {
  id: 16602,
  name: "Galileo Testnet",
  nativeCurrency: { name: "Galileo", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://https://evmrpc-testnet.0g.ai"] },
  },
};

export const config = getDefaultConfig({
  appName: "ETHGlobal",
  projectId: "2ef30f97cc3cd1fc5fbc037b40b98e43",
  chains: [galelio],
  ssr: true,
});
