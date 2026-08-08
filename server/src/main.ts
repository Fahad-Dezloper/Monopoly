import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origin = process.env.CORS_ORIGIN?.split(",") ?? [
    "http://localhost:3000",
  ];
  app.enableCors({ origin, credentials: true });
  app.setGlobalPrefix("api");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("RobinVerse API")
    .setDescription("HTTP API for RobinVerse server")
    .setVersion("1.0")
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`Robinverse server on http://localhost:${port}`, "Bootstrap");
  Logger.log(`Swagger docs on http://localhost:${port}/api/docs`, "Bootstrap");
  Logger.log(`WebSocket namespace: /game`, "Bootstrap");
}

bootstrap();
