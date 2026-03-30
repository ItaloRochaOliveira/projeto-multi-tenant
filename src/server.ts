import "reflect-metadata";
import { appDataSource } from "@/db/appDataSource";
import { env } from "@/env";
import app from "./app";

async function bootstrap() {
  try {
    await appDataSource.initialize();
    console.log("Database conectada com sucesso.");
  } catch (err) {
    console.error("Falha ao conectar ao banco:", err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 HTTP Server is running! url: http://localhost:${env.PORT}`);
  });
}

void bootstrap();
