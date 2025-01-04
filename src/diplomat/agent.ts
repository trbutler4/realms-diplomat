import { ChainOfThought } from "../core/chain-of-thought";
import { diplomatCharacter } from "./character";

export class DiplomatAgent {
  constructor(
    private realmId: string,
    private chainOfThought: ChainOfThought,
  ) {}

  async sendGreeting(targetRealmId: string): Promise<void> {
    const greeting = `DIPLOMATIC_GREETING::INIT {
source_realm: ${this.realmId},
target_realm: ${targetRealmId},
message_type: "GREETING",
protocol_version: "1.0",
timestamp: ${Date.now()}}`;

    await this.chainOfThought.think(greeting);
  }

  async receiveGreeting(sourceRealmId: string, message: string): Promise<void> {
    const response = `DIPLOMATIC_GREETING::RESPONSE {
source_realm: ${this.realmId},
target_realm: ${sourceRealmId},
message_type: "GREETING_RESPONSE",
protocol_version: "1.0",
timestamp: ${Date.now()},
acknowledgment: "RECEIVED"}`;

    await this.chainOfThought.think(response);
  }
}
