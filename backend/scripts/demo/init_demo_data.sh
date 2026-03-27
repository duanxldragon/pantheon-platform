#!/bin/bash
# ========================================
# Pantheon Platform - Demo Data Initialization Script
# ========================================
# 说明：一键初始化所有演示数据
# 使用方法：./init_demo_data.sh [mysql_host] [mysql_user] [mysql_password]
# ========================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
MYSQL_HOST="${1:-localhost}"
MYSQL_USER="${2:-root}"
MYSQL_PASSWORD="${3:-}"
MASTER_DB="pantheon_master"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 租户配置
declare -A TENANTS
TENANTS[enterprise]="00000000-0000-0000-0000-000000000010:pantheon_enterprise"
TENANTS[dev]="00000000-0000-0000-0000-000000000020:pantheon_dev"
TENANTS[demo]="00000000-0000-0000-0000-000000000030:pantheon_demo"

# MySQL 命令
MYSQL_CMD="mysql -h ${MYSQL_HOST} -u ${MYSQL_USER}"
if [ -n "${MYSQL_PASSWORD}" ]; then
    MYSQL_CMD="${MYSQL_CMD} -p${MYSQL_PASSWORD}"
fi

# 打印信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 MySQL 连接
check_mysql_connection() {
    print_info "检查 MySQL 连接..."

    if ! ${MYSQL_CMD} -e "SELECT 1;" &>/dev/null; then
        print_error "无法连接到 MySQL 服务器"
        print_error "请检查："
        print_error "  1. MySQL 服务是否启动"
        print_error "  2. 主机地址、用户名、密码是否正确"
        exit 1
    fi

    print_success "MySQL 连接正常"
}

# 检查主数据库
check_master_database() {
    print_info "检查主数据库 ${MASTER_DB}..."

    if ! ${MYSQL_CMD} -e "USE ${MASTER_DB};" &>/dev/null; then
        print_warning "主数据库 ${MASTER_DB} 不存在，跳过租户数据初始化"
        return 1
    fi

    print_success "主数据库 ${MASTER_DB} 存在"
    return 0
}

# 执行 SQL 脚本
execute_sql() {
    local db=$1
    local file=$2
    local desc=$3

    print_info "执行: ${desc}"

    if [ ! -f "${file}" ]; then
        print_error "文件不存在: ${file}"
        return 1
    fi

    if ${MYSQL_CMD} "${db}" < "${file}" &>/dev/null; then
        print_success "${desc} 完成"
        return 0
    else
        print_error "${desc} 失败"
        return 1
    fi
}

# 替换 SQL 文件中的占位符
replace_placeholder() {
    local file=$1
    local tenant_id=$2
    local temp_file="${file}.tmp"

    sed "s/{tenant_id}/${tenant_id}/g" "${file}" > "${temp_file}"
    echo "${temp_file}"
}

# 清理临时文件
cleanup_temp_files() {
    print_info "清理临时文件..."
    rm -f "${SCRIPT_DIR}"/*.tmp
}

# 初始化主数据库租户数据
init_master_data() {
    print_info "========================================"
    print_info "初始化主数据库租户数据"
    print_info "========================================"

    local file="${SCRIPT_DIR}/01_demo_tenants.sql"
    if execute_sql "${MASTER_DB}" "${file}" "租户数据"; then
        print_success "主数据库租户数据初始化完成"
    else
        print_error "主数据库租户数据初始化失败"
        return 1
    fi
}

# 初始化租户业务数据
init_tenant_data() {
    print_info "========================================"
    print_info "初始化租户业务数据"
    print_info "========================================"

    for tenant_code in "${!TENANTS[@]}"; do
        IFS=':' read -r tenant_id tenant_db <<< "${TENANTS[$tenant_code]}"

        print_info "----------------------------------------"
        print_info "处理租户: ${tenant_code}"
        print_info "租户ID: ${tenant_id}"
        print_info "数据库: ${tenant_db}"
        print_info "----------------------------------------"

        # 检查租户数据库是否存在
        if ! ${MYSQL_CMD} -e "USE ${tenant_db};" &>/dev/null; then
            print_warning "数据库 ${tenant_db} 不存在，跳过租户 ${tenant_code}"
            continue
        fi

        # 执行部门数据
        local dept_file="${SCRIPT_DIR}/02_demo_departments.sql"
        local dept_tmp=$(replace_placeholder "${dept_file}" "${tenant_id}")
        if [ -f "${dept_tmp}" ]; then
            execute_sql "${tenant_db}" "${dept_tmp}" "部门数据"
            rm -f "${dept_tmp}"
        fi

        # 执行角色数据
        local role_file="${SCRIPT_DIR}/03_demo_roles.sql"
        local role_tmp=$(replace_placeholder "${role_file}" "${tenant_id}")
        if [ -f "${role_tmp}" ]; then
            execute_sql "${tenant_db}" "${role_tmp}" "角色数据"
            rm -f "${role_tmp}"
        fi

        # 执行用户数据
        local user_file="${SCRIPT_DIR}/04_demo_users.sql"
        local user_tmp=$(replace_placeholder "${user_file}" "${tenant_id}")
        if [ -f "${user_tmp}" ]; then
            execute_sql "${tenant_db}" "${user_tmp}" "用户数据"
            rm -f "${user_tmp}"
        fi

        # 执行菜单和权限数据（仅 enterprise 租户）
        if [ "${tenant_code}" == "enterprise" ]; then
            local menu_file="${SCRIPT_DIR}/05_demo_menus_permissions.sql"
            local menu_tmp=$(replace_placeholder "${menu_file}" "${tenant_id}")
            if [ -f "${menu_tmp}" ]; then
                execute_sql "${tenant_db}" "${menu_tmp}" "菜单和权限数据"
                rm -f "${menu_tmp}"
            fi
        fi

        print_success "租户 ${tenant_code} 数据初始化完成"
    done
}

# 验证数据
verify_data() {
    print_info "========================================"
    print_info "验证数据"
    print_info "========================================"

    # 验证租户数量
    local tenant_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM ${MASTER_DB}.tenants WHERE code IN ('enterprise', 'dev', 'demo', 'suspended', 'pending');" 2>/dev/null || echo "0")
    print_info "演示租户数量: ${tenant_count}"

    # 验证用户数量
    local enterprise_user_count=0
    if ${MYSQL_CMD} -e "USE pantheon_enterprise;" &>/dev/null; then
        enterprise_user_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM pantheon_enterprise.system_users;" 2>/dev/null || echo "0")
        print_info "Enterprise 租户用户数量: ${enterprise_user_count}"
    fi

    local dev_user_count=0
    if ${MYSQL_CMD} -e "USE pantheon_dev;" &>/dev/null; then
        dev_user_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM pantheon_dev.system_users;" 2>/dev/null || echo "0")
        print_info "Dev 租户用户数量: ${dev_user_count}"
    fi

    local demo_user_count=0
    if ${MYSQL_CMD} -e "USE pantheon_demo;" &>/dev/null; then
        demo_user_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM pantheon_demo.system_users;" 2>/dev/null || echo "0")
        print_info "Demo 租户用户数量: ${demo_user_count}"
    fi

    # 验证菜单数量（仅 enterprise）
    if ${MYSQL_CMD} -e "USE pantheon_enterprise;" &>/dev/null; then
        local menu_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM pantheon_enterprise.system_menus;" 2>/dev/null || echo "0")
        print_info "Enterprise 租户菜单数量: ${menu_count}"
    fi

    print_success "数据验证完成"
}

# 主函数
main() {
    print_info "========================================"
    print_info "Pantheon Platform Demo Data 初始化"
    print_info "========================================"
    print_info "MySQL Host: ${MYSQL_HOST}"
    print_info "MySQL User: ${MYSQL_USER}"
    print_info "Master Database: ${MASTER_DB}"
    print_info "Script Directory: ${SCRIPT_DIR}"
    print_info "========================================"

    # 检查 MySQL 连接
    check_mysql_connection

    # 检查主数据库
    if ! check_master_database; then
        print_warning "主数据库不存在，跳过所有初始化"
        exit 0
    fi

    # 初始化主数据库租户数据
    init_master_data

    # 初始化租户业务数据
    init_tenant_data

    # 清理临时文件
    cleanup_temp_files

    # 验证数据
    verify_data

    print_info "========================================"
    print_success "演示数据初始化完成！"
    print_info "========================================"
    print_info "默认登录账户："
    print_info "  Enterprise: zhangsan / admin123 (研发总监)"
    print_info "  Dev: dev_user / admin123 (开发人员)"
    print_info "  Demo: demo_user / admin123 (演示用户)"
    print_info "========================================"
}

# 信号处理
trap cleanup_temp_files EXIT

# 执行主函数
main
