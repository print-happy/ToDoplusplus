#!/bin/sh

# 🔍 TODO++ 健康检查脚本
# 监控所有服务的健康状态

# 日志文件
LOG_FILE="/logs/healthcheck.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 日志函数
log() {
    echo "[$DATE] $1" >> "$LOG_FILE"
    echo "[$DATE] $1"
}

# 检查服务健康状态
check_service() {
    local service_name="$1"
    local url="$2"
    local timeout="${3:-5}"
    
    if curl -f -m "$timeout" "$url" > /dev/null 2>&1; then
        log "✅ $service_name: 健康"
        return 0
    else
        log "❌ $service_name: 不健康 ($url)"
        return 1
    fi
}

# 检查容器状态
check_container() {
    local container_name="$1"
    
    if [ "$(docker inspect -f '{{.State.Health.Status}}' "$container_name" 2>/dev/null)" = "healthy" ]; then
        log "✅ 容器 $container_name: 健康"
        return 0
    else
        log "❌ 容器 $container_name: 不健康"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    local threshold=80
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        log "✅ 磁盘空间: ${usage}% (正常)"
        return 0
    else
        log "⚠️ 磁盘空间: ${usage}% (警告: 超过${threshold}%)"
        return 1
    fi
}

# 检查内存使用
check_memory() {
    local threshold=80
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -lt "$threshold" ]; then
        log "✅ 内存使用: ${usage}% (正常)"
        return 0
    else
        log "⚠️ 内存使用: ${usage}% (警告: 超过${threshold}%)"
        return 1
    fi
}

# 主健康检查
main() {
    log "🔍 开始健康检查..."
    
    # 初始化计数器
    failed_checks=0
    total_checks=0
    
    # 检查前端服务
    total_checks=$((total_checks + 1))
    if ! check_service "前端服务" "http://nginx/health"; then
        failed_checks=$((failed_checks + 1))
    fi
    
    # 检查后端API
    total_checks=$((total_checks + 1))
    if ! check_service "后端API" "http://backend:5000/health"; then
        failed_checks=$((failed_checks + 1))
    fi
    
    # 检查Nginx状态
    total_checks=$((total_checks + 1))
    if ! check_service "Nginx状态" "http://nginx:8080/nginx_status"; then
        failed_checks=$((failed_checks + 1))
    fi
    
    # 检查容器健康状态
    for container in todo-nginx-prod todo-backend-prod todo-mongo-prod; do
        total_checks=$((total_checks + 1))
        if ! check_container "$container"; then
            failed_checks=$((failed_checks + 1))
        fi
    done
    
    # 检查系统资源
    total_checks=$((total_checks + 1))
    if ! check_disk_space; then
        failed_checks=$((failed_checks + 1))
    fi
    
    total_checks=$((total_checks + 1))
    if ! check_memory; then
        failed_checks=$((failed_checks + 1))
    fi
    
    # 汇总结果
    if [ "$failed_checks" -eq 0 ]; then
        log "🎉 所有检查通过 ($total_checks/$total_checks)"
        exit 0
    else
        log "⚠️ 检查完成，发现 $failed_checks 个问题 (通过: $((total_checks - failed_checks))/$total_checks)"
        
        # 如果失败检查超过一半，发送告警
        if [ "$failed_checks" -gt $((total_checks / 2)) ]; then
            log "🚨 严重告警: 超过一半的检查失败，系统可能存在严重问题"
            exit 2
        fi
        
        exit 1
    fi
}

# 执行健康检查
main
