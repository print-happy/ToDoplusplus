#!/bin/bash

# TODO++ Docker Hub镜像部署脚本
# 使用方法: ./deploy-hub.sh [start|stop|restart|logs|status|pull] [Docker Hub用户名]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
COMPOSE_FILE="docker-compose.hub.yml"
ENV_FILE=".env.hub"

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
    echo "TODO++ Docker Hub镜像部署工具"
    echo ""
    echo "使用方法:"
    echo "  $0 [命令] [Docker Hub用户名]"
    echo ""
    echo "命令:"
    echo "  start   - 启动服务"
    echo "  stop    - 停止服务"
    echo "  restart - 重启服务"
    echo "  logs    - 查看日志"
    echo "  status  - 查看状态"
    echo "  pull    - 拉取最新镜像"
    echo "  update  - 更新并重启服务"
    echo ""
    echo "示例:"
    echo "  $0 start myusername"
    echo "  $0 pull myusername"
    echo "  $0 logs"
}

# 检查依赖
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 检查环境文件
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "环境配置文件 $ENV_FILE 不存在"
        log_info "请复制 .env.hub.example 并修改配置"
        exit 1
    fi
    
    # 检查关键配置
    if grep -q "your-dockerhub-username" "$ENV_FILE"; then
        log_warning "请修改 $ENV_FILE 中的Docker Hub用户名"
    fi
    
    if grep -q "your-strong-password" "$ENV_FILE"; then
        log_warning "请修改 $ENV_FILE 中的默认密码"
    fi
}

# 设置Docker Hub用户名
set_docker_username() {
    local username=$1
    
    if [ -n "$username" ]; then
        export DOCKER_USERNAME="$username"
        log_info "使用Docker Hub用户名: $username"
        
        # 更新环境文件中的用户名
        if command -v sed &> /dev/null; then
            sed -i.bak "s/DOCKER_USERNAME=.*/DOCKER_USERNAME=$username/" "$ENV_FILE"
            log_info "已更新环境文件中的Docker Hub用户名"
        fi
    else
        # 从环境文件读取用户名
        if [ -f "$ENV_FILE" ]; then
            export DOCKER_USERNAME=$(grep "^DOCKER_USERNAME=" "$ENV_FILE" | cut -d'=' -f2)
        fi
        
        if [ -z "$DOCKER_USERNAME" ] || [ "$DOCKER_USERNAME" = "your-dockerhub-username" ]; then
            log_error "请提供Docker Hub用户名或在 $ENV_FILE 中配置"
            show_usage
            exit 1
        fi
    fi
}

# 拉取最新镜像
pull_images() {
    log_info "拉取最新Docker镜像..."
    
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    log_success "镜像拉取完成"
}

# 启动服务
start_services() {
    log_info "启动TODO++服务 (使用Docker Hub镜像)..."
    
    check_dependencies
    check_env_file
    
    # 创建必要目录
    mkdir -p nginx/logs backend/logs backend/uploads mongo/logs logs
    
    # 启动服务
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    log_success "服务启动完成"
    log_info "等待服务就绪..."
    sleep 30
    
    # 检查服务状态
    check_services_health
}

# 停止服务
stop_services() {
    log_info "停止TODO++服务..."
    
    docker-compose -f "$COMPOSE_FILE" down
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启TODO++服务..."
    
    stop_services
    start_services
}

# 更新服务
update_services() {
    log_info "更新TODO++服务..."
    
    pull_images
    restart_services
    
    log_success "服务更新完成"
}

# 查看日志
view_logs() {
    local service=${2:-""}
    
    if [ -n "$service" ]; then
        log_info "查看 $service 服务日志..."
        docker-compose -f "$COMPOSE_FILE" logs -f "$service"
    else
        log_info "查看所有服务日志..."
        docker-compose -f "$COMPOSE_FILE" logs -f
    fi
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."
    
    # 检查nginx
    if curl -f http://localhost/health &> /dev/null; then
        log_success "✅ Nginx 服务正常"
    else
        log_error "❌ Nginx 服务异常"
    fi
    
    # 检查后端API
    if curl -f http://localhost/api/health &> /dev/null; then
        log_success "✅ 后端API服务正常"
    else
        log_error "❌ 后端API服务异常"
    fi
    
    # 显示容器状态
    docker-compose -f "$COMPOSE_FILE" ps
}

# 显示状态
show_status() {
    log_info "TODO++服务状态 (Docker Hub镜像):"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "使用的镜像:"
    docker images | grep "${DOCKER_USERNAME}/todo-plusplus" || log_warning "未找到相关镜像"
    
    echo ""
    log_info "服务访问地址:"
    echo "  🌐 前端应用: http://localhost"
    echo "  🔧 API接口: http://localhost/api"
    echo "  📊 监控面板: http://localhost:9090 (如果启用)"
    
    echo ""
    check_services_health
}

# 主函数
main() {
    local command=${1:-"start"}
    local username=${2:-""}
    
    # 设置Docker Hub用户名
    set_docker_username "$username"
    
    case "$command" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            view_logs "$@"
            ;;
        status)
            show_status
            ;;
        pull)
            pull_images
            ;;
        update)
            update_services
            ;;
        *)
            log_error "未知命令: $command"
            show_usage
            exit 1
            ;;
    esac
}

# 处理帮助参数
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_usage
    exit 0
fi

# 执行主函数
main "$@"
