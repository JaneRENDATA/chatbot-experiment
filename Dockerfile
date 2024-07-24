# Use Node.js as the base image
FROM node:18-alpine

# 安装 pnpm
RUN npm install -g pnpm

# 设置 pnpm 的全局 bin 目录
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

# 安装全局依赖
RUN pnpm add -g @nestjs/cli next


# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Copy package.json from web and server
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build server
RUN cd apps/server && pnpm install

# Build web (with CI=false to ignore warnings)
RUN cd apps/web  && pnpm install

# Expose ports for web and server
EXPOSE 3000 4000

# Create a startup script
RUN echo '#!/bin/sh' > start.sh && \
  echo 'npm run dev &' >> start.sh && \
  echo 'wait' >> start.sh && \
  chmod +x start.sh

# Start both services
CMD ["./start.sh"]
