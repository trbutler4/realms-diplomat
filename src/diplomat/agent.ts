import { ChainOfThought } from "../core/chain-of-thought";
import { diplomatCharacter } from "./character";

export class DiplomatAgent {
  constructor(
    private realmId: string,
    private chainOfThought: ChainOfThought,
  ) {
    // Initialize with diplomatic character and context
    this.chainOfThought = chainOfThought;
  }

  private formatMessage(
    type: string,
    targetRealmId: string,
    payload: any = {},
  ) {
    return diplomatCharacter.templates?.thoughtTemplate?.replace(
      /\{\{(\w+)\}\}/g,
      (match, key) => {
        switch (key) {
          case "type":
            return type;
          case "source_realm":
            return this.realmId;
          case "target_realm":
            return targetRealmId;
          case "timestamp":
            return Date.now().toString();
          case "payload":
            return JSON.stringify(payload, null, 2);
          default:
            return match;
        }
      },
    );
  }

  async sendGreeting(targetRealmId: string): Promise<void> {
    const greeting = this.formatMessage("GREETING", targetRealmId, {
      intent: "ESTABLISH_COMMUNICATION",
      authority_level: "LEVEL_1",
      verification_required: true,
    });

    if (greeting) {
      await this.chainOfThought.think(greeting);
    }
  }

  async receiveGreeting(sourceRealmId: string, message: string): Promise<void> {
    const response = this.formatMessage("GREETING_RESPONSE", sourceRealmId, {
      acknowledgment: "RECEIVED",
      authority_level: "LEVEL_1",
      relationship_state: "NEUTRAL",
      next_action: "AWAITING_VERIFICATION",
    });

    if (response) {
      await this.chainOfThought.think(response);
    }
  }
}
