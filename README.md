# 🎏 NestJS - NextJS - tRPC - Prisma stack app

## 🍰 Tech stack

- DB: PostgreSQL
- ORM: Prisma
- Node.js framework: NestJS
- End-to-end type-safe APIs: [tRPC](https://trpc.io/)
- Frontend: NextJS
- Style: Tailwind + [daisyUI](https://daisyui.com/)
- Node.js package manager: [pnpm](https://pnpm.io)
- Monorepo: [pnpm workspace](https://pnpm.io/workspaces)

## 🥕 Getting Started

Update [pnpm](https://pnpm.io):

```sh
pnpm i -g pnpm
```

Develop:

```sh
# create local environment variables
cp ./apps/web/.env.local.example ./apps/web/.env.local

pnpm dev
```

Following this, you can open `http://localhost:3000` in your browser.

If you want to install the `@nestjs/config` package. In the root of your directory, you can run:

```sh
pnpm add @nestjs/config --filter=server
```

## Deployment

This repo has been tested to run with railway.
You can fork and open railway to establish:
[deploy on railway](https://railway.app)

## 🧚‍♀️ Reference

- [Building a full-stack, fully type-safe pnpm monorepo with NestJS, NextJS & tRPC](https://www.tomray.dev/nestjs-nextjs-trpc)
- [nestjs-prisma](https://www.tomray.dev/nestjs-prisma)

### More docs in this repo

[server/Readme](/apps/server/README.md)

[web/Readme](/apps/web/README.md)
