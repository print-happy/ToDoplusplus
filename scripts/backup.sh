#!/bin/bash

# 💾 TODO++ 数据备份脚本
# 自动备份数据库和重要文件

set -e

# 配置
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="todo_backup_$DATE"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 创建备份目录
create_backup_dir() {
    local backup_path="$BACKUP_DIR/$BACKUP_NAME"
    mkdir -p "$backup_path"
    echo "$backup_path"
}

# 备份MongoDB数据库
backup_mongodb() {
    local backup_path="$1"
    
    log "开始备份 MongoDB 数据库..."
    
    # 使用mongodump备份
    mongodump \
        --host mongo:27017 \
        --authenticationDatabase admin \
        --username "$MONGO_ROOT_USERNAME" \
        --password "$MONGO_ROOT_PASSWORD" \
        --db "$MONGO_DATABASE" \
        --out "$backup_path/mongodb"
    
    log "MongoDB 数据库备份完成"
}

# 备份配置文件
backup_configs() {
    local backup_path="$1"
    
    log "开始备份配置文件..."
    
    mkdir -p "$backup_path/configs"
    
    # 备份环境配置（排除敏感信息）
    if [ -f "/.env.prod.local" ]; then
        # 创建脱敏的配置备份
        grep -v -E "(PASSWORD|SECRET|KEY)" /.env.prod.local > "$backup_path/configs/env.prod.template" || true
    fi
    
    # 备份nginx配置
    if [ -f "/etc/nginx/nginx.conf" ]; then
        cp /etc/nginx/nginx.conf "$backup_path/configs/" || true
    fi
    
    log "配置文件备份完成"
}

# 备份日志文件（最近7天）
backup_logs() {
    local backup_path="$1"
    
    log "开始备份日志文件..."
    
    mkdir -p "$backup_path/logs"
    
    # 备份最近的日志文件
    find /var/log -name "*.log" -mtime -7 -exec cp {} "$backup_path/logs/" \; 2>/dev/null || true
    
    log "日志文件备份完成"
}

# 压缩备份
compress_backup() {
    local backup_path="$1"
    
    log "开始压缩备份文件..."
    
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
    
    # 删除未压缩的目录
    rm -rf "$BACKUP_NAME"
    
    log "备份文件压缩完成: $BACKUP_NAME.tar.gz"
}

# 清理旧备份
cleanup_old_backups() {
    log "清理 $RETENTION_DAYS 天前的旧备份..."
    
    find "$BACKUP_DIR" -name "todo_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    log "旧备份清理完成"
}

# 验证备份
verify_backup() {
    local backup_file="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
    
    log "验证备份文件..."
    
    if [ ! -f "$backup_file" ]; then
        log "错误: 备份文件不存在"
        exit 1
    fi
    
    # 检查文件大小
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
    if [ "$file_size" -lt 1024 ]; then
        log "错误: 备份文件太小，可能备份失败"
        exit 1
    fi
    
    # 测试压缩文件完整性
    if ! tar -tzf "$backup_file" >/dev/null 2>&1; then
        log "错误: 备份文件损坏"
        exit 1
    fi
    
    log "备份验证通过，文件大小: $(echo $file_size | awk '{print int($1/1024/1024)"MB"}')"
}

# 发送备份通知（如果配置了邮件）
send_notification() {
    local status="$1"
    local message="$2"
    
    if [ -n "$ADMIN_EMAIL" ] && [ -n "$SMTP_HOST" ]; then
        # 这里可以添加邮件发送逻辑
        log "备份通知: $status - $message"
    fi
}

# 主备份流程
main() {
    log "🚀 开始 TODO++ 数据备份..."
    
    # 检查必要的环境变量
    if [ -z "$MONGO_ROOT_USERNAME" ] || [ -z "$MONGO_ROOT_PASSWORD" ]; then
        log "错误: 缺少数据库认证信息"
        exit 1
    fi
    
    # 创建备份目录
    backup_path=$(create_backup_dir)
    
    # 执行备份
    backup_mongodb "$backup_path"
    backup_configs "$backup_path"
    backup_logs "$backup_path"
    
    # 压缩备份
    compress_backup "$backup_path"
    
    # 验证备份
    verify_backup
    
    # 清理旧备份
    cleanup_old_backups
    
    log "✅ 备份完成: $BACKUP_NAME.tar.gz"
    
    # 发送成功通知
    send_notification "SUCCESS" "备份成功完成: $BACKUP_NAME.tar.gz"
}

# 错误处理
trap 'log "❌ 备份过程中发生错误"; send_notification "ERROR" "备份失败"; exit 1' ERR

# 执行主流程
main "$@"
