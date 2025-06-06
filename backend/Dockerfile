# backend/Dockerfile

# 使用一个官方的 Node.js 镜像作为基础
FROM node:18-alpine

# 设置容器内的工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (或 yarn.lock)
# 这样做可以利用 Docker 的缓存，只有在依赖变化时才重新安装
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有项目文件到工作目录
COPY . .

# 暴露后端服务端口
EXPOSE 5000

# 启动应用的命令 (开发模式)
CMD [ "npm", "run", "dev" ]