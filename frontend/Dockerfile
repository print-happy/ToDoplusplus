# frontend/Dockerfile

# 使用与后端一致的 Node.js 版本
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖配置文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有项目文件
COPY . .

# 暴露 React 开发服务器的端口
EXPOSE 3000

# 启动应用的命令
CMD [ "npm", "start" ]