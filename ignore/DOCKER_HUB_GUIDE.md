# 🐳 TODO++ Docker Hub 构建和部署指南

## 📋 概览

本指南将帮助您将TODO++应用构建为Docker镜像并发布到Docker Hub，然后使用这些镜像进行部署。

### 🏗️ 镜像架构
- **前端镜像**: `{username}/todo-plusplus-frontend`
- **后端镜像**: `{username}/todo-plusplus-backend`  
- **Nginx镜像**: `{username}/todo-plusplus-nginx`

## 🚀 快速开始

### 1. 构建并发布镜像

```bash
# 设置Docker Hub凭据 (可选)
export DOCKER_USERNAME=your-dockerhub-username
export DOCKER_PASSWORD=your-dockerhub-password

# 构建并发布所有镜像
./build-and-push.sh v1.0.0 your-dockerhub-username

# 或使用latest标签
./build-and-push.sh latest your-dockerhub-username
```

### 2. 使用Docker Hub镜像部署

```bash
# 配置环境变量
cp .env.hub .env.hub.local
nano .env.hub.local  # 修改Docker Hub用户名和密码

# 部署服务
./deploy-hub.sh start your-dockerhub-username
```

## 🔧 详细步骤

### 第一步：准备Docker Hub账户

1. **注册Docker Hub账户**: https://hub.docker.com
2. **创建访问令牌** (推荐):
   - 登录Docker Hub
   - 进入 Account Settings → Security
   - 创建新的Access Token
   - 保存令牌用于后续认证

### 第二步：构建和发布镜像

#### 2.1 使用脚本构建 (推荐)

```bash
# 交互式构建
./build-and-push.sh

# 指定版本和用户名
./build-and-push.sh v1.0.0 myusername

# 使用环境变量
export DOCKER_USERNAME=myusername
export DOCKER_PASSWORD=my-access-token
./build-and-push.sh latest
```

#### 2.2 手动构建

```bash
# 构建前端镜像
cd frontend
docker build -f Dockerfile.prod -t myusername/todo-plusplus-frontend:latest .
cd ..

# 构建后端镜像
cd backend
docker build -f Dockerfile.prod -t myusername/todo-plusplus-backend:latest .
cd ..

# 构建Nginx镜像
cd nginx
docker build -f Dockerfile.prod -t myusername/todo-plusplus-nginx:latest .
cd ..

# 登录Docker Hub
docker login -u myusername

# 推送镜像
docker push myusername/todo-plusplus-frontend:latest
docker push myusername/todo-plusplus-backend:latest
docker push myusername/todo-plusplus-nginx:latest
```

### 第三步：配置部署环境

#### 3.1 环境变量配置

```bash
# 复制环境配置模板
cp .env.hub .env.hub.local

# 编辑配置文件
nano .env.hub.local
```

**必须修改的配置**:
```bash
# Docker Hub配置
DOCKER_USERNAME=your-dockerhub-username
IMAGE_TAG=latest

# 数据库密码
MONGO_ROOT_PASSWORD=your-super-strong-password

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# CORS域名
CORS_ORIGIN=http://localhost,https://your-domain.com
```

#### 3.2 部署服务

```bash
# 启动所有服务
./deploy-hub.sh start your-dockerhub-username

# 查看服务状态
./deploy-hub.sh status

# 查看日志
./deploy-hub.sh logs
```

## 🔄 运维操作

### 镜像管理

```bash
# 拉取最新镜像
./deploy-hub.sh pull your-dockerhub-username

# 更新服务 (拉取最新镜像并重启)
./deploy-hub.sh update your-dockerhub-username

# 查看本地镜像
docker images | grep todo-plusplus
```

### 服务管理

```bash
# 启动服务
./deploy-hub.sh start

# 停止服务
./deploy-hub.sh stop

# 重启服务
./deploy-hub.sh restart

# 查看状态
./deploy-hub.sh status

# 查看日志
./deploy-hub.sh logs
./deploy-hub.sh logs nginx  # 查看特定服务日志
```

### 版本管理

```bash
# 发布新版本
./build-and-push.sh v1.1.0 myusername

# 部署特定版本
# 在 .env.hub.local 中设置 IMAGE_TAG=v1.1.0
./deploy-hub.sh restart
```

## 📊 监控和调试

### 健康检查

```bash
# 检查服务健康状态
./deploy-hub.sh status

# 手动健康检查
curl http://localhost/health
curl http://localhost/api/health
```

### 日志查看

```bash
# 查看所有服务日志
./deploy-hub.sh logs

# 查看特定服务日志
./deploy-hub.sh logs nginx
./deploy-hub.sh logs backend
./deploy-hub.sh logs mongo

# 实时日志
docker-compose -f docker-compose.hub.yml logs -f
```

### 容器调试

```bash
# 进入容器
docker exec -it todo-backend sh
docker exec -it todo-nginx sh

# 查看容器资源使用
docker stats

# 查看镜像信息
docker inspect myusername/todo-plusplus-backend:latest
```

## 🔒 安全最佳实践

### 1. 访问令牌

```bash
# 使用访问令牌而不是密码
export DOCKER_PASSWORD=dckr_pat_your_access_token_here
```

### 2. 私有仓库 (可选)

```bash
# 创建私有仓库
# 在Docker Hub上将仓库设置为私有

# 部署时需要登录
docker login
./deploy-hub.sh start
```

### 3. 镜像签名 (高级)

```bash
# 启用Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# 构建和推送签名镜像
./build-and-push.sh v1.0.0 myusername
```

## 🚨 故障排除

### 构建问题

```bash
# 清理Docker缓存
docker system prune -a

# 重新构建无缓存
docker build --no-cache -f Dockerfile.prod -t myusername/todo-plusplus-backend .
```

### 推送问题

```bash
# 检查登录状态
docker info | grep Username

# 重新登录
docker logout
docker login
```

### 部署问题

```bash
# 检查镜像是否存在
docker pull myusername/todo-plusplus-backend:latest

# 检查环境变量
cat .env.hub.local

# 查看详细错误
docker-compose -f docker-compose.hub.yml logs
```

## 📈 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Build and Push to Docker Hub

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build and Push
      env:
        DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
        DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
      run: |
        ./build-and-push.sh ${{ github.ref_name }} ${{ secrets.DOCKER_USERNAME }}
```

## 🎯 使用场景

### 开发环境
```bash
# 使用latest标签进行开发
./build-and-push.sh latest myusername
./deploy-hub.sh start myusername
```

### 生产环境
```bash
# 使用版本标签进行生产部署
./build-and-push.sh v1.0.0 myusername
# 在 .env.hub.local 中设置 IMAGE_TAG=v1.0.0
./deploy-hub.sh start myusername
```

### 多环境部署
```bash
# 开发环境
IMAGE_TAG=dev ./deploy-hub.sh start myusername

# 测试环境  
IMAGE_TAG=test ./deploy-hub.sh start myusername

# 生产环境
IMAGE_TAG=v1.0.0 ./deploy-hub.sh start myusername
```

---

**🎉 恭喜！您现在可以使用Docker Hub进行TODO++应用的镜像管理和部署了！**

**📞 技术支持**: 如遇问题，请检查日志文件或参考故障排除部分。
