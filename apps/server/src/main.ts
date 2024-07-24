import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TrpcRouter } from '@server/trpc/trpc.router';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const trpc = app.get(TrpcRouter);
  trpc.applyMiddleware(app);

  // const port = process.env.PORT;
  // console.log(`[server]: Server is running at http://localhost:${port}`);

  // await app.listen(process.env.PORT || 4000);
  await app.listen(4000);
}
bootstrap();
