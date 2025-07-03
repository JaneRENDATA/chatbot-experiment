import { INestApplication, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';

// 已移除 PrismaService 相关内容

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    // 已移除 prisma: PrismaService
  ) {}

  appRouter = this.trpc.router({
    sayHello: this.trpc.procedure
      .input(
        z.object({
          name: z.string(),
        }),
      )
      .query(({ input }) => {
        const { name } = input;
        return {
          greeting: `Hello ${name ? name : `Bilbo`}`,
        };
      }),
    // 已移除 getUsers 路由
  });

  async applyMiddleware(app: INestApplication) {
    app.use(
      `/trpc`,
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
      }),
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
