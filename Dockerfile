# 构建阶段（使用 slim 镜像，Alpine 下 sharp 等原生模块易构建失败）
FROM node:20-slim AS builder

# sharp 等原生模块在 Linux 上可能需要的运行时库
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制包管理文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用（提高 Node 内存上限，避免 OOM；失败时输出完整日志）
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build > /tmp/build.log 2>&1; r=$?; cat /tmp/build.log; exit $r

# 生产阶段
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建产物
COPY --from=builder /app/.output ./.output

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# 启动应用
CMD ["node", ".output/server/index.mjs"]