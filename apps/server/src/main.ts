import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TrpcRouter } from '@server/trpc/trpc.router';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });

    const trpc = app.get(TrpcRouter);
    trpc.applyMiddleware(app);

    const port = process.env.PORT || 4000;
    console.log(`[server]: Server is running at http://localhost:${port}`);
    console.log(`[server]: Environment: ${process.env.NODE_ENV || 'development'}`);

    await app.listen(port);
  } catch (error) {
    console.error('Failed to start the application:', error);
    process.exit(1); // quit.
  }
}
bootstrap();
