#!/bin/bash

# TODO++ Docker镜像构建和发布脚本
# 使用方法: ./build-and-push.sh [版本号] [Docker Hub用户名]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
DEFAULT_VERSION="latest"
DEFAULT_REGISTRY="docker.io"
PROJECT_NAME="todo-plusplus"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示使用说明
show_usage() {
    echo "TODO++ Docker镜像构建和发布工具"
    echo ""
    echo "使用方法:"
    echo "  $0 [版本号] [Docker Hub用户名]"
    echo ""
    echo "参数说明:"
    echo "  版本号          - 镜像版本标签 (默认: latest)"
    echo "  Docker Hub用户名 - 您的Docker Hub用户名"
    echo ""
    echo "示例:"
    echo "  $0 v1.0.0 myusername"
    echo "  $0 latest myusername"
    echo ""
    echo "环境变量:"
    echo "  DOCKER_USERNAME - Docker Hub用户名"
    echo "  DOCKER_PASSWORD - Docker Hub密码或访问令牌"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    
    log_success "系统依赖检查通过"
}

# 获取Git信息
get_git_info() {
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    log_info "Git信息: 分支=$GIT_BRANCH, 提交=$GIT_COMMIT"
}

# 构建前端镜像
build_frontend() {
    local version=$1
    local username=$2
    local image_name="${username}/${PROJECT_NAME}-frontend"
    
    log_info "构建前端镜像: ${image_name}:${version}"
    
    cd frontend
    
    # 构建镜像
    docker build \
        -f Dockerfile.prod \
        -t "${image_name}:${version}" \
        -t "${image_name}:latest" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg GIT_COMMIT="${GIT_COMMIT}" \
        --build-arg GIT_BRANCH="${GIT_BRANCH}" \
        --build-arg VERSION="${version}" \
        .
    
    cd ..
    
    log_success "前端镜像构建完成"
    return 0
}

# 构建后端镜像
build_backend() {
    local version=$1
    local username=$2
    local image_name="${username}/${PROJECT_NAME}-backend"
    
    log_info "构建后端镜像: ${image_name}:${version}"
    
    cd backend
    
    # 构建镜像
    docker build \
        -f Dockerfile.prod \
        -t "${image_name}:${version}" \
        -t "${image_name}:latest" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg GIT_COMMIT="${GIT_COMMIT}" \
        --build-arg GIT_BRANCH="${GIT_BRANCH}" \
        --build-arg VERSION="${version}" \
        .
    
    cd ..
    
    log_success "后端镜像构建完成"
    return 0
}

# 构建Nginx镜像
build_nginx() {
    local version=$1
    local username=$2
    local image_name="${username}/${PROJECT_NAME}-nginx"
    
    log_info "构建Nginx镜像: ${image_name}:${version}"
    
    # 创建临时Dockerfile
    cat > nginx/Dockerfile.prod << EOF
FROM nginx:1.25-alpine

# 安装必要工具
RUN apk add --no-cache curl wget

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建日志目录
RUN mkdir -p /var/log/nginx && \\
    chown -R nginx:nginx /var/log/nginx

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost/health || exit 1

# 暴露端口
EXPOSE 80 443

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
EOF
    
    cd nginx
    
    # 构建镜像
    docker build \
        -f Dockerfile.prod \
        -t "${image_name}:${version}" \
        -t "${image_name}:latest" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg GIT_COMMIT="${GIT_COMMIT}" \
        --build-arg VERSION="${version}" \
        .
    
    # 清理临时文件
    rm -f Dockerfile.prod
    
    cd ..
    
    log_success "Nginx镜像构建完成"
    return 0
}

# Docker Hub登录
docker_login() {
    log_info "登录到Docker Hub..."
    
    if [ -n "$DOCKER_PASSWORD" ]; then
        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    else
        docker login -u "$DOCKER_USERNAME"
    fi
    
    log_success "Docker Hub登录成功"
}

# 推送镜像
push_images() {
    local version=$1
    local username=$2
    
    log_info "推送镜像到Docker Hub..."
    
    # 推送前端镜像
    docker push "${username}/${PROJECT_NAME}-frontend:${version}"
    docker push "${username}/${PROJECT_NAME}-frontend:latest"
    
    # 推送后端镜像
    docker push "${username}/${PROJECT_NAME}-backend:${version}"
    docker push "${username}/${PROJECT_NAME}-backend:latest"
    
    # 推送Nginx镜像
    docker push "${username}/${PROJECT_NAME}-nginx:${version}"
    docker push "${username}/${PROJECT_NAME}-nginx:latest"
    
    log_success "所有镜像推送完成"
}

# 显示镜像信息
show_images() {
    local username=$1
    
    log_info "构建的镜像列表:"
    echo ""
    docker images | grep "${username}/${PROJECT_NAME}"
    echo ""
    
    log_info "Docker Hub镜像地址:"
    echo "  🖥️  前端: docker pull ${username}/${PROJECT_NAME}-frontend"
    echo "  🔧 后端: docker pull ${username}/${PROJECT_NAME}-backend"
    echo "  🌐 Nginx: docker pull ${username}/${PROJECT_NAME}-nginx"
}

# 清理本地镜像
cleanup_images() {
    local username=$1
    
    read -p "是否清理本地构建的镜像? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "清理本地镜像..."
        docker rmi $(docker images "${username}/${PROJECT_NAME}-*" -q) 2>/dev/null || true
        log_success "本地镜像清理完成"
    fi
}

# 主函数
main() {
    # 解析参数
    local version=${1:-$DEFAULT_VERSION}
    local username=${2:-$DOCKER_USERNAME}
    
    # 检查参数
    if [ -z "$username" ]; then
        log_error "请提供Docker Hub用户名"
        show_usage
        exit 1
    fi
    
    # 显示构建信息
    echo "======================================"
    echo "TODO++ Docker镜像构建和发布"
    echo "======================================"
    echo "版本: $version"
    echo "用户: $username"
    echo "项目: $PROJECT_NAME"
    echo "======================================"
    echo ""
    
    # 确认构建
    read -p "确认开始构建和发布? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "构建已取消"
        exit 0
    fi
    
    # 执行构建流程
    check_dependencies
    get_git_info
    
    # 构建镜像
    build_frontend "$version" "$username"
    build_backend "$version" "$username"
    build_nginx "$version" "$username"
    
    # 登录并推送
    docker_login
    push_images "$version" "$username"
    
    # 显示结果
    show_images "$username"
    
    # 可选清理
    cleanup_images "$username"
    
    log_success "🎉 所有镜像构建和发布完成!"
    echo ""
    echo "使用方法:"
    echo "  docker-compose -f docker-compose.hub.yml up -d"
}

# 处理帮助参数
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_usage
    exit 0
fi

# 执行主函数
main "$@"
