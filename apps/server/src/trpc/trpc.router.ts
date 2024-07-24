import { INestApplication, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';

import { PrismaService } from '@server/db/prisma.service';
// 定义 User 模型的 Zod schema
const userSchema = z.object({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string(),
});

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly prisma: PrismaService,
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
    getUsers: this.trpc.procedure.query(async () => {
      const users = await this.prisma.user.findMany();
      // if users is empty. You can run `prisma studio` and open 'http://localhost:5555/' to add one data into users.

      return { users: z.array(userSchema).parse(users) };
    }),
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
