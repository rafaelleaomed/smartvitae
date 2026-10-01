import { DecisionProvider } from "./types";
import { JevDecisionProvider } from "./jev-provider";
import { LocalRuleDecisionProvider } from "./local-provider";

export * from "./types";
export * from "./local-provider";
export * from "./jev-provider";

export function getDecisionProvider(): DecisionProvider {
  if (process.env.ENABLE_JEV === "true" && process.env.TYPESAFE_API_KEY) {
    return new JevDecisionProvider();
  }
  return new LocalRuleDecisionProvider();
}
