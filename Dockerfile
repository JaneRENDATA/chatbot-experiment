# Use Node.js as the base image
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set pnpm's global bin directory
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Install global dependencies
RUN pnpm add -g @nestjs/cli next

# Set working directory
WORKDIR /app

# Copy the entire application
COPY . .

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Copy package.json from web and server
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN pnpm install

# Build server
RUN cd apps/server && pnpm install

# Build web (with CI=false to ignore warnings)
RUN cd apps/web && pnpm install

# Remove apps/web/.next/ directory
RUN rm -rf apps/web/.next

# Build the entire application
RUN pnpm run build

# Expose ports for web and server
EXPOSE 3000 4000

# Create a startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'set -e' >> start.sh && \
    echo 'pnpm run start' >> start.sh && \
    chmod +x start.sh

# Start both services
CMD ["./start.sh"]