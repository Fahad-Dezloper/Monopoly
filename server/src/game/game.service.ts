import { Injectable } from "@nestjs/common";
import type { GameAction } from "../engine";
import { RoomsService } from "../rooms/rooms.service";

/**
 * Thin wrapper over the local game engine (`src/engine`).
 * All Monopoly rules live in the engine package — this service
 * only authorizes and persists room game state.
 */
@Injectable()
export class GameService {
  constructor(private readonly rooms: RoomsService) {}

  async dispatch(code: string, playerId: string, action: GameAction) {
    return this.rooms.applyAction(code, playerId, action);
  }

  /** Roll dice OR end turn — engine uses NEXT for both. */
  next(code: string, playerId: string) {
    return this.dispatch(code, playerId, { type: "NEXT" });
  }

  buy(code: string, playerId: string) {
    return this.dispatch(code, playerId, { type: "BUY" });
  }

  declineBuy(code: string, playerId: string) {
    return this.dispatch(code, playerId, { type: "DECLINE_BUY" });
  }

  async buildHouse(code: string, playerId: string, propertyIndex: number) {
    await this.dispatch(code, playerId, { type: "SELECT_PROPERTY", index: propertyIndex });
    return this.dispatch(code, playerId, { type: "BUY_HOUSE" });
  }

  async sellHouse(code: string, playerId: string, propertyIndex: number) {
    await this.dispatch(code, playerId, { type: "SELECT_PROPERTY", index: propertyIndex });
    return this.dispatch(code, playerId, { type: "SELL_HOUSE" });
  }
}
