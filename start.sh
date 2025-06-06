#!/bin/bash

# TODO++ 快速启动脚本
# 用于快速启动Docker开发环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_success() {
    print_message "$1" "$GREEN"
}

print_error() {
    print_message "$1" "$RED"
}

print_warning() {
    print_message "$1" "$YELLOW"
}

print_info() {
    print_message "$1" "$BLUE"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装Docker"
        print_info "安装命令: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装Docker Compose"
        print_info "安装命令: sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        print_info "权限设置: sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi

    print_success "✓ Docker 和 Docker Compose 已安装"
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f "backend/.env" ]; then
        print_warning "⚠ 未找到 backend/.env 文件"
        print_info "正在从示例文件创建..."
        
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_success "✓ 已创建 backend/.env 文件"
            print_warning "请编辑 backend/.env 文件，填入您的配置信息"
            print_info "特别是 SILICONFLOW_API_KEY 和 JWT_SECRET"
        else
            print_error "未找到 backend/.env.example 文件"
            exit 1
        fi
    else
        print_success "✓ 环境变量文件已存在"
    fi
}

# 停止现有服务
stop_services() {
    print_info "正在停止现有服务..."
    docker-compose down 2>/dev/null || true
    print_success "✓ 现有服务已停止"
}

# 构建并启动服务
start_services() {
    print_info "正在构建并启动服务..."
    
    # 构建镜像
    print_info "构建Docker镜像..."
    docker-compose build
    
    # 启动服务
    print_info "启动所有服务..."
    docker-compose up -d
    
    print_success "✓ 服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_info "等待服务启动..."
    
    # 等待后端服务
    print_info "等待后端服务 (http://localhost:5000)..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:5000 >/dev/null 2>&1; then
            print_success "✓ 后端服务已就绪"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "⚠ 后端服务启动超时，请检查日志"
    fi
    
    # 等待前端服务
    print_info "等待前端服务 (http://localhost:3000)..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "✓ 前端服务已就绪"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "⚠ 前端服务启动超时，请检查日志"
    fi
}

# 显示服务状态
show_status() {
    print_info "服务状态:"
    docker-compose ps
    
    echo ""
    print_success "🎉 TODO++ 应用已启动!"
    echo ""
    print_info "访问地址:"
    print_info "  前端应用: http://localhost:3000"
    print_info "  后端API: http://localhost:5000"
    print_info "  MongoDB: localhost:27017"
    echo ""
    print_info "常用命令:"
    print_info "  查看日志: docker-compose logs -f"
    print_info "  停止服务: docker-compose down"
    print_info "  重启服务: docker-compose restart"
    print_info "  查看状态: docker-compose ps"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "TODO++ 快速启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  start     启动所有服务 (默认)"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  status    查看服务状态"
    echo "  logs      查看服务日志"
    echo "  clean     清理所有容器和数据"
    echo "  help      显示此帮助信息"
    echo ""
}

# 主函数
main() {
    case "${1:-start}" in
        "start")
            print_info "🚀 启动 TODO++ 应用..."
            check_docker
            check_env_file
            stop_services
            start_services
            wait_for_services
            show_status
            ;;
        "stop")
            print_info "🛑 停止 TODO++ 应用..."
            docker-compose down
            print_success "✓ 应用已停止"
            ;;
        "restart")
            print_info "🔄 重启 TODO++ 应用..."
            docker-compose restart
            print_success "✓ 应用已重启"
            ;;
        "status")
            print_info "📊 服务状态:"
            docker-compose ps
            ;;
        "logs")
            print_info "📋 查看服务日志:"
            docker-compose logs -f
            ;;
        "clean")
            print_warning "⚠ 这将删除所有容器和数据，确定要继续吗? (y/N)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                docker-compose down -v
                docker system prune -f
                print_success "✓ 清理完成"
            else
                print_info "取消清理操作"
            fi
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
