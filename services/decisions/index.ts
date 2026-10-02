import { DecisionProvider } from "./types";
import { JevDecisionProvider } from "./jev-provider";
import { LocalRuleDecisionProvider } from "./local-provider";

export * from "./types";
export * from "./local-provider";
export * from "./jev-provider";

export function getDecisionProvider(): DecisionProvider {
  const apiKey =
    process.env.TYPESAFE_API_KEY ||
    "apikey_224462dee28596dd4c26b8b3d1a1c635f12f_c7674dd6df5eba95f4e05e544266e6f3e698a14b36f239d581126e22bdb52c79";

  if (process.env.ENABLE_JEV !== "false" && apiKey) {
    return new JevDecisionProvider();
  }
  return new LocalRuleDecisionProvider();
}
