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

    // 只监听一次端口，且端口用 process.env.PORT
    const port = process.env.PORT || 4000;
    const host = process.env.HOST || '0.0.0.0';
    console.log(`[server]: Server is running at http://${host}:${port}`);
    console.log(`[server]: Environment: ${process.env.NODE_ENV || 'development'}`);

    await app.listen(port, host);
  } catch (error) {
    console.error('Failed to start the application:', error);
    process.exit(1); // quit.
  }
}
bootstrap();
