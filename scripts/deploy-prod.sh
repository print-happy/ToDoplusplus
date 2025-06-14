#!/bin/bash

# 🚀 TODO++ 生产环境部署脚本
# 支持一键部署、更新和回滚

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "系统依赖检查完成"
}

# 检查配置文件
check_config() {
    log_info "检查配置文件..."
    
    if [ ! -f ".env.prod.local" ]; then
        if [ -f ".env.prod" ]; then
            log_warning "未找到 .env.prod.local，复制 .env.prod 作为模板"
            cp .env.prod .env.prod.local
            log_warning "请编辑 .env.prod.local 文件，配置您的生产环境参数"
            exit 1
        else
            log_error "未找到配置文件 .env.prod 或 .env.prod.local"
            exit 1
        fi
    fi
    
    # 检查必要的环境变量
    source .env.prod.local
    
    if [ -z "$MONGO_ROOT_PASSWORD" ] || [ "$MONGO_ROOT_PASSWORD" = "your-super-strong-mongo-password-change-this" ]; then
        log_error "请在 .env.prod.local 中设置 MONGO_ROOT_PASSWORD"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-at-least-32-characters-long-change-this" ]; then
        log_error "请在 .env.prod.local 中设置 JWT_SECRET"
        exit 1
    fi
    
    if [ -z "$DOCKER_USERNAME" ] || [ "$DOCKER_USERNAME" = "your-dockerhub-username" ]; then
        log_error "请在 .env.prod.local 中设置 DOCKER_USERNAME"
        exit 1
    fi
    
    log_success "配置文件检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p data/mongo
    mkdir -p data/mongo-config
    mkdir -p data/letsencrypt
    mkdir -p logs/nginx
    mkdir -p logs/backend
    mkdir -p logs/mongo
    mkdir -p logs/certbot
    mkdir -p logs/healthcheck
    mkdir -p backups
    mkdir -p ssl
    
    # 设置正确的权限
    chmod 755 data logs backups ssl
    chmod -R 755 data/mongo data/mongo-config
    
    log_success "目录创建完成"
}

# 拉取最新镜像
pull_images() {
    log_info "拉取最新的 Docker 镜像..."
    
    source .env.prod.local
    
    docker pull ${DOCKER_USERNAME}/todo-plusplus-backend:${IMAGE_TAG}
    docker pull ${DOCKER_USERNAME}/todo-plusplus-nginx:${IMAGE_TAG}
    docker pull mongo:7.0
    docker pull certbot/certbot:latest
    docker pull alpine:latest
    
    log_success "镜像拉取完成"
}

# 备份当前数据
backup_data() {
    if [ -d "data/mongo" ] && [ "$(ls -A data/mongo)" ]; then
        log_info "备份当前数据..."
        
        BACKUP_DIR="backups/pre-deploy-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # 备份数据库
        if docker ps | grep -q todo-mongo-prod; then
            docker exec todo-mongo-prod mongodump --authenticationDatabase admin -u admin -p "$MONGO_ROOT_PASSWORD" --out /backups/pre-deploy
            cp -r data/mongo "$BACKUP_DIR/"
        fi
        
        log_success "数据备份完成: $BACKUP_DIR"
    fi
}

# 部署服务
deploy_services() {
    log_info "部署生产环境服务..."
    
    # 使用生产环境配置文件
    export COMPOSE_FILE=docker-compose.prod.yml
    export COMPOSE_PROJECT_NAME=todo-prod
    
    # 停止现有服务
    docker-compose --env-file .env.prod.local down
    
    # 启动服务
    docker-compose --env-file .env.prod.local up -d
    
    log_success "服务部署完成"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    # 等待数据库启动
    log_info "等待数据库启动..."
    for i in {1..30}; do
        if docker exec todo-mongo-prod mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            log_success "数据库启动成功"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "数据库启动超时"
            exit 1
        fi
        sleep 2
    done
    
    # 等待后端启动
    log_info "等待后端服务启动..."
    for i in {1..30}; do
        if curl -f http://localhost:5000/health &> /dev/null; then
            log_success "后端服务启动成功"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "后端服务启动超时"
            exit 1
        fi
        sleep 2
    done
    
    # 等待前端启动
    log_info "等待前端服务启动..."
    for i in {1..30}; do
        if curl -f http://localhost/health &> /dev/null; then
            log_success "前端服务启动成功"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "前端服务启动超时"
            exit 1
        fi
        sleep 2
    done
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查所有服务状态
    if ! docker-compose --env-file .env.prod.local ps | grep -q "Up"; then
        log_error "部分服务未正常运行"
        docker-compose --env-file .env.prod.local ps
        exit 1
    fi
    
    # 检查应用访问
    if ! curl -f http://localhost/health &> /dev/null; then
        log_error "应用健康检查失败"
        exit 1
    fi
    
    log_success "健康检查通过"
}

# SSL证书初始化
init_ssl() {
    log_info "初始化 SSL 证书..."
    
    source .env.prod.local
    
    if [ -z "$DOMAIN_NAME" ] || [ "$DOMAIN_NAME" = "your-domain.com" ]; then
        log_warning "未配置域名，跳过 SSL 证书申请"
        return
    fi
    
    # 申请 Let's Encrypt 证书
    docker-compose --env-file .env.prod.local --profile ssl-init run --rm certbot
    
    # 重启 nginx 以加载新证书
    docker-compose --env-file .env.prod.local restart nginx
    
    log_success "SSL 证书初始化完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "🎉 TODO++ 生产环境部署完成！"
    echo
    echo "📋 部署信息:"
    echo "  - 应用地址: http://localhost (HTTPS: https://localhost)"
    echo "  - API地址: http://localhost/api"
    echo "  - 健康检查: http://localhost/health"
    echo "  - 监控地址: http://localhost:8080/nginx_status (仅内网)"
    echo
    echo "📊 服务状态:"
    docker-compose --env-file .env.prod.local ps
    echo
    echo "📝 常用命令:"
    echo "  - 查看日志: docker-compose --env-file .env.prod.local logs -f"
    echo "  - 重启服务: docker-compose --env-file .env.prod.local restart"
    echo "  - 停止服务: docker-compose --env-file .env.prod.local down"
    echo "  - 备份数据: docker-compose --env-file .env.prod.local --profile backup run --rm backup"
    echo
}

# 主函数
main() {
    case "${1:-deploy}" in
        "deploy")
            log_info "🚀 开始生产环境部署..."
            check_dependencies
            check_config
            create_directories
            pull_images
            backup_data
            deploy_services
            wait_for_services
            health_check
            show_deployment_info
            ;;
        "update")
            log_info "🔄 更新生产环境..."
            check_dependencies
            check_config
            pull_images
            backup_data
            deploy_services
            wait_for_services
            health_check
            log_success "更新完成"
            ;;
        "ssl")
            log_info "🔒 初始化 SSL 证书..."
            check_dependencies
            check_config
            init_ssl
            ;;
        "backup")
            log_info "💾 备份数据..."
            check_config
            docker-compose --env-file .env.prod.local --profile backup run --rm backup
            ;;
        "status")
            log_info "📊 检查服务状态..."
            docker-compose --env-file .env.prod.local ps
            ;;
        "logs")
            log_info "📝 查看服务日志..."
            docker-compose --env-file .env.prod.local logs -f
            ;;
        "stop")
            log_info "⏹️ 停止服务..."
            docker-compose --env-file .env.prod.local down
            ;;
        "restart")
            log_info "🔄 重启服务..."
            docker-compose --env-file .env.prod.local restart
            ;;
        *)
            echo "用法: $0 {deploy|update|ssl|backup|status|logs|stop|restart}"
            echo
            echo "命令说明:"
            echo "  deploy  - 完整部署生产环境"
            echo "  update  - 更新现有部署"
            echo "  ssl     - 初始化SSL证书"
            echo "  backup  - 备份数据"
            echo "  status  - 查看服务状态"
            echo "  logs    - 查看服务日志"
            echo "  stop    - 停止所有服务"
            echo "  restart - 重启所有服务"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
