import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get(":code")
  async list(@Param("code") code: string) {
    return { messages: await this.chat.list(code) };
  }

  @Post(":code")
  async post(
    @Param("code") code: string,
    @Body()
    body: {
      playerId: string;
      username?: string;
      color?: string;
      text: string;
    },
  ) {
    return { messages: await this.chat.post(code, body) };
  }
}
