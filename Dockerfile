# 构建阶段
FROM node:20-slim AS builder

# sharp 等原生模块在 Linux 上可能需要的运行时库
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 只复制 package.json，用 npm 安装（不依赖 pnpm-lock.yaml）
COPY package.json ./
RUN npm install

# 复制源码并构建（失败时打印完整日志便于排查）
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build > /tmp/build.log 2>&1; e=$?; cat /tmp/build.log; exit $e

# 生产阶段（与 builder 同用 Debian，否则 sharp 在 Alpine/musl 下无法加载）
FROM node:20-slim AS production

# sharp 运行时依赖（仅运行时库，非 -dev）
RUN apt-get update && apt-get install -y --no-install-recommends libvips \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
