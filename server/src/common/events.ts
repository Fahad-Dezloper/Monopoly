/** Client → Server */
export const ClientEvents = {
  CREATE_ROOM: "CREATE_ROOM",
  JOIN_ROOM: "JOIN_ROOM",
  LEAVE_ROOM: "LEAVE_ROOM",
  READY: "READY",
  START_GAME: "START_GAME",
  ROLL_DICE: "ROLL_DICE",
  BUY_PROPERTY: "BUY_PROPERTY",
  DECLINE_BUY: "DECLINE_BUY",
  BUILD_HOUSE: "BUILD_HOUSE",
  BUILD_HOTEL: "BUILD_HOTEL",
  SELL_HOUSE: "SELL_HOUSE",
  END_TURN: "END_TURN",
  GAME_ACTION: "GAME_ACTION",
  RECONNECT: "RECONNECT",
  PING: "PING",
} as const;

/** Server → Client */
export const ServerEvents = {
  ROOM_CREATED: "ROOM_CREATED",
  ROOM_UPDATED: "ROOM_UPDATED",
  PLAYER_JOINED: "PLAYER_JOINED",
  PLAYER_LEFT: "PLAYER_LEFT",
  GAME_STARTED: "GAME_STARTED",
  GAME_STATE: "GAME_STATE",
  DICE_ROLLED: "DICE_ROLLED",
  PLAYER_MOVED: "PLAYER_MOVED",
  TURN_CHANGED: "TURN_CHANGED",
  PLAYER_BANKRUPT: "PLAYER_BANKRUPT",
  GAME_OVER: "GAME_OVER",
  ERROR: "ERROR",
  PONG: "PONG",
} as const;

export type ClientEvent = (typeof ClientEvents)[keyof typeof ClientEvents];
export type ServerEvent = (typeof ServerEvents)[keyof typeof ServerEvents];
