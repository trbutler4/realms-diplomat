import { Core } from "../core/core";
import { ChromaVectorDB } from "../core/vectorDb";
import { EventProcessor } from "../core/processor";
import { RoomManager } from "../core/roomManager";
import { CoreActionRegistry } from "../core/actions";
import { LLMIntentExtractor } from "../core/intent";
import { TwitterClient } from "../clients/twitterClient";
import { env } from "../core/env";
import { LogLevel } from "../core/logger";
import { LLMClient } from "../core/llm-client";
import { defaultCharacter } from "../core/character";
import { Consciousness } from "../core/consciousness";
import { ChainOfThought } from "../core/chain-of-thought";
import { ETERNUM_CONTEXT } from "../core/contexts";
import * as readline from "readline";
import { type GoalStatus } from "../core/goalManager";
import chalk from "chalk";
import { DiplomatAgent } from "./agent";

async function getCliInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printGoalStatus(status: GoalStatus): string {
  const colors: Record<GoalStatus, string> = {
    pending: chalk.yellow("⏳ PENDING"),
    active: chalk.blue("▶️ ACTIVE"),
    completed: chalk.green("✅ COMPLETED"),
    failed: chalk.red("❌ FAILED"),
    ready: chalk.cyan("🎯 READY"),
    blocked: chalk.red("🚫 BLOCKED"),
  };
  return colors[status] || status;
}

async function main() {
  // Initialize VectorDB first
  const vectorDb = new ChromaVectorDB("memories", {
    chromaUrl: "http://localhost:8000",
    logLevel: LogLevel.INFO,
  });

  // Initialize LLM client
  const llmClient = new LLMClient({
    provider: "anthropic",
    apiKey: env.ANTHROPIC_API_KEY,
  });

  const realm1Dreams = new ChainOfThought(llmClient, {
    worldState: ETERNUM_CONTEXT,
    queriesAvailable: "",
    availableActions: "",
  });

  const realm2Dreams = new ChainOfThought(llmClient, {
    worldState: ETERNUM_CONTEXT,
    queriesAvailable: "",
    availableActions: "",
  });

  const agent1 = new DiplomatAgent("6933", realm1Dreams); // Uw Rohi
  const agent2 = new DiplomatAgent("7777", realm2Dreams); // Example second realm

  [realm1Dreams, realm2Dreams].forEach((dreams, index) => {
    const realmId = index === 0 ? "6933" : "7777"; // TODO improve this

    dreams.on("step", (step) => {
      if (step.type === "system") {
        console.log(`\n💭 [Realm ${realmId}] System prompt:`, step.content);
      } else {
        console.log(`\n🤔 [Realm ${realmId}] New thought step:`, {
          content: step.content,
          tags: step.tags,
        });
      }
    });

    dreams.on("action:start", (action) => {
      console.log(`\n🎬 [Realm ${realmId}] Starting action:`, {
        type: action.type,
        payload: action.payload,
      });
    });

    dreams.on("action:complete", ({ action, result }) => {
      console.log(`\n✅ [Realm ${realmId}] Action complete:`, {
        type: action.type,
        result,
      });
    });

    dreams.on("action:error", ({ action, error }) => {
      console.log(`\n❌ [Realm ${realmId}] Action failed:`, {
        type: action.type,
        error,
      });
    });

    dreams.on("think:start", ({ query }) => {
      console.log(`\n🧠 [Realm ${realmId}] Starting to think about:`, query);
    });

    dreams.on("think:complete", ({ query }) => {
      console.log(`\n🎉 [Realm ${realmId}] Finished thinking about:`, query);
    });

    dreams.on("think:timeout", ({ query }) => {
      console.log(`\n⏰ [Realm ${realmId}] Thinking timed out for:`, query);
    });

    dreams.on("think:error", ({ query, error }) => {
      console.log(
        `\n💥 [Realm ${realmId}] Error while thinking about:`,
        query,
        error,
      );
    });

    // Add goal-related event handlers
    dreams.on("goal:created", ({ id, description }) => {
      console.log(chalk.cyan(`\n🎯 [Realm ${realmId}] New goal created:`), {
        id,
        description,
      });
    });

    dreams.on("goal:updated", ({ id, status }) => {
      console.log(
        chalk.yellow(`\n📝 [Realm ${realmId}] Goal status updated:`),
        {
          id,
          status: printGoalStatus(status),
        },
      );
    });

    dreams.on("goal:completed", ({ id, result }) => {
      console.log(chalk.green(`\n✨ [Realm ${realmId}] Goal completed:`), {
        id,
        result,
      });
    });

    dreams.on("goal:failed", ({ id, error }) => {
      console.log(chalk.red(`\n💥 [Realm ${realmId}] Goal failed:`), {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });

  while (true) {
    console.log(chalk.cyan("\n🤖 Choose action:"));
    console.log("1. Send greeting from Realm 6933 to 7777");
    console.log("2. Send greeting from Realm 7777 to 6933");
    console.log("3. Exit");

    const choice = await getCliInput("> ");

    if (choice === "3") {
      console.log(chalk.yellow("Goodbye! 👋"));
      break;
    }

    try {
      if (choice === "1") {
        await agent1.sendGreeting("7777");
        await agent2.receiveGreeting("6933", "greeting");
      } else if (choice === "2") {
        await agent2.sendGreeting("6933");
        await agent1.receiveGreeting("7777", "greeting");
      }
    } catch (error) {
      console.error(chalk.red("Error in diplomatic exchange:"), error);
    }
  }

  // Handle shutdown
  process.on("SIGINT", async () => {
    console.log(chalk.yellow("\nShutting down..."));
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
