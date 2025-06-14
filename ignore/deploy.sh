#!/bin/bash

# TODO++ 生产环境部署脚本
# 使用方法: ./deploy.sh [start|stop|restart|logs|status|backup]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_NAME="todo-plusplus"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

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
    
    log_success "系统依赖检查通过"
}

# 检查环境文件
check_env_file() {
    log_info "检查环境配置文件..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "环境配置文件 $ENV_FILE 不存在"
        log_info "请复制 .env.production.example 并修改配置"
        exit 1
    fi
    
    # 检查关键配置
    if grep -q "your-strong-password" "$ENV_FILE"; then
        log_warning "检测到默认密码，请修改生产环境密码"
    fi
    
    if grep -q "your-super-secret-jwt-key" "$ENV_FILE"; then
        log_warning "检测到默认JWT密钥，请修改生产环境密钥"
    fi
    
    log_success "环境配置文件检查完成"
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    
    mkdir -p nginx/logs
    mkdir -p backend/logs
    mkdir -p backend/uploads
    mkdir -p mongo/logs
    mkdir -p logs
    mkdir -p backups
    
    log_success "目录创建完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端应用..."
    
    cd frontend
    
    # 设置生产环境变量
    export REACT_APP_API_URL="/api"
    export NODE_ENV="production"
    export GENERATE_SOURCEMAP="false"
    
    # 安装依赖并构建
    npm ci --silent
    npm run build
    
    cd ..
    
    log_success "前端构建完成"
}

# 启动服务
start_services() {
    log_info "启动 TODO++ 生产环境..."
    
    check_dependencies
    check_env_file
    create_directories
    build_frontend
    
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
    log_info "停止 TODO++ 服务..."
    
    docker-compose -f "$COMPOSE_FILE" down
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启 TODO++ 服务..."
    
    stop_services
    start_services
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

# 备份数据
backup_data() {
    log_info "开始数据备份..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份MongoDB
    docker-compose -f "$COMPOSE_FILE" exec -T mongo mongodump \
        --host localhost:27017 \
        --db todoapp \
        --out /tmp/backup
    
    docker cp todo-mongo:/tmp/backup "$backup_dir/mongodb"
    
    # 备份上传文件
    if [ -d "backend/uploads" ]; then
        cp -r backend/uploads "$backup_dir/"
    fi
    
    # 创建备份信息文件
    cat > "$backup_dir/backup_info.txt" << EOF
备份时间: $(date)
项目: TODO++
数据库: MongoDB
文件: uploads目录
EOF
    
    log_success "数据备份完成: $backup_dir"
}

# 显示状态
show_status() {
    log_info "TODO++ 服务状态:"
    docker-compose -f "$COMPOSE_FILE" ps
    
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
    case "${1:-start}" in
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
        backup)
            backup_data
            ;;
        health)
            check_services_health
            ;;
        *)
            echo "使用方法: $0 {start|stop|restart|logs|status|backup|health}"
            echo ""
            echo "命令说明:"
            echo "  start   - 启动所有服务"
            echo "  stop    - 停止所有服务"
            echo "  restart - 重启所有服务"
            echo "  logs    - 查看日志 (可指定服务名)"
            echo "  status  - 显示服务状态"
            echo "  backup  - 备份数据"
            echo "  health  - 检查服务健康状态"
            echo ""
            echo "示例:"
            echo "  $0 start"
            echo "  $0 logs nginx"
            echo "  $0 backup"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
