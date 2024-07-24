# Tutorial: Prisma

Some importance to use Prisma:

This code requires variable: **DATABASE_URL**. Don't forget to configure it.

🌚 Avoid editing code within the **migrations** directory. However, it is good practice to track changes to this directory in your Git repository.

## Start DB Browser 📑

``` shell
npx prisma studio
# Prisma schema loaded from prisma/schema.prisma
# Prisma Studio is up on http://localhost:5555
```

## Re-generate sql file

``` shell
npx prisma generate
```

## If you encounter table does not exist error

``` shell
https://github.com/prisma/prisma/issues/10771
```

## More tutorials

[quicstart](https://prisma.org.cn/docs/getting-started/quickstart)
