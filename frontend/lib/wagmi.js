import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "ETHGlobal",
  projectId: "2ef30f97cc3cd1fc5fbc037b40b98e43",
  chains: [sepolia],
  ssr: true,
});
