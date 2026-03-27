#!/bin/bash
# ========================================
# Pantheon Platform - Demo Data Initialization Script
# ========================================
# Usage:
#   ./init_demo_data.sh [mysql_host] [mysql_user] [mysql_password]
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MYSQL_HOST="${1:-localhost}"
MYSQL_USER="${2:-root}"
MYSQL_PASSWORD="${3:-}"
MASTER_DB="pantheon_master"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

declare -A TENANTS
TENANTS[enterprise]="00000000-0000-0000-0000-000000000010:pantheon_enterprise"
TENANTS[dev]="00000000-0000-0000-0000-000000000020:pantheon_dev"
TENANTS[demo]="00000000-0000-0000-0000-000000000030:pantheon_demo"

MYSQL_CMD="mysql -h ${MYSQL_HOST} -u ${MYSQL_USER}"
if [ -n "${MYSQL_PASSWORD}" ]; then
    MYSQL_CMD="${MYSQL_CMD} -p${MYSQL_PASSWORD}"
fi

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

check_mysql_connection() {
    print_info "Checking MySQL connection..."

    if ! ${MYSQL_CMD} -e "SELECT 1;" &>/dev/null; then
        print_error "Unable to connect to MySQL."
        print_error "Please verify the MySQL service, host, username, and password."
        exit 1
    fi

    print_success "MySQL connection is healthy."
}

check_master_database() {
    print_info "Checking master database ${MASTER_DB}..."

    if ! ${MYSQL_CMD} -e "USE ${MASTER_DB};" &>/dev/null; then
        print_warning "Master database ${MASTER_DB} does not exist. Demo initialization will be skipped."
        return 1
    fi

    print_success "Master database ${MASTER_DB} is available."
    return 0
}

execute_sql() {
    local db=$1
    local file=$2
    local desc=$3

    print_info "Running: ${desc}"

    if [ ! -f "${file}" ]; then
        print_error "File does not exist: ${file}"
        return 1
    fi

    if ${MYSQL_CMD} "${db}" < "${file}" &>/dev/null; then
        print_success "${desc} completed."
        return 0
    fi

    print_error "${desc} failed."
    return 1
}

replace_placeholder() {
    local file=$1
    local tenant_id=$2
    local temp_file="${file}.tmp"

    sed "s/{tenant_id}/${tenant_id}/g" "${file}" > "${temp_file}"
    echo "${temp_file}"
}

cleanup_temp_files() {
    print_info "Cleaning temporary files..."
    rm -f "${SCRIPT_DIR}"/*.tmp
}

init_master_data() {
    print_info "========================================"
    print_info "Initializing master tenant data"
    print_info "========================================"

    local file="${SCRIPT_DIR}/demo_tenants.sql"
    if execute_sql "${MASTER_DB}" "${file}" "tenant seed data"; then
        print_success "Master tenant data initialized."
        return 0
    fi

    print_error "Master tenant data initialization failed."
    return 1
}

init_tenant_data() {
    print_info "========================================"
    print_info "Initializing tenant business data"
    print_info "========================================"

    for tenant_code in "${!TENANTS[@]}"; do
        IFS=':' read -r tenant_id tenant_db <<< "${TENANTS[$tenant_code]}"

        print_info "----------------------------------------"
        print_info "Processing tenant: ${tenant_code}"
        print_info "Tenant ID: ${tenant_id}"
        print_info "Database: ${tenant_db}"
        print_info "----------------------------------------"

        if ! ${MYSQL_CMD} -e "USE ${tenant_db};" &>/dev/null; then
            print_warning "Database ${tenant_db} does not exist. Skipping tenant ${tenant_code}."
            continue
        fi

        local dept_file="${SCRIPT_DIR}/demo_departments.sql"
        local dept_tmp
        dept_tmp=$(replace_placeholder "${dept_file}" "${tenant_id}")
        if [ -f "${dept_tmp}" ]; then
            execute_sql "${tenant_db}" "${dept_tmp}" "department seed data"
            rm -f "${dept_tmp}"
        fi

        local role_file="${SCRIPT_DIR}/demo_roles.sql"
        local role_tmp
        role_tmp=$(replace_placeholder "${role_file}" "${tenant_id}")
        if [ -f "${role_tmp}" ]; then
            execute_sql "${tenant_db}" "${role_tmp}" "role seed data"
            rm -f "${role_tmp}"
        fi

        local user_file="${SCRIPT_DIR}/demo_users.sql"
        local user_tmp
        user_tmp=$(replace_placeholder "${user_file}" "${tenant_id}")
        if [ -f "${user_tmp}" ]; then
            execute_sql "${tenant_db}" "${user_tmp}" "user seed data"
            rm -f "${user_tmp}"
        fi

        if [ "${tenant_code}" == "enterprise" ]; then
            local menu_file="${SCRIPT_DIR}/demo_menus_permissions.sql"
            local menu_tmp
            menu_tmp=$(replace_placeholder "${menu_file}" "${tenant_id}")
            if [ -f "${menu_tmp}" ]; then
                execute_sql "${tenant_db}" "${menu_tmp}" "menu and permission seed data"
                rm -f "${menu_tmp}"
            fi
        fi

        print_success "Tenant ${tenant_code} initialization completed."
    done
}

verify_data() {
    print_info "========================================"
    print_info "Verifying demo data"
    print_info "========================================"

    local tenant_count
    tenant_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM ${MASTER_DB}.tenants WHERE code IN ('enterprise', 'dev', 'demo', 'suspended', 'pending');" 2>/dev/null || echo "0")
    print_info "Demo tenant count: ${tenant_count}"

    local enterprise_user_count=0
    if ${MYSQL_CMD} -e "USE pantheon_enterprise;" &>/dev/null; then
        enterprise_user_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM pantheon_enterprise.system_users;" 2>/dev/null || echo "0")
        print_info "Enterprise user count: ${enterprise_user_count}"
    fi

    local dev_user_count=0
    if ${MYSQL_CMD} -e "USE pantheon_dev;" &>/dev/null; then
        dev_user_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM pantheon_dev.system_users;" 2>/dev/null || echo "0")
        print_info "Dev user count: ${dev_user_count}"
    fi

    local demo_user_count=0
    if ${MYSQL_CMD} -e "USE pantheon_demo;" &>/dev/null; then
        demo_user_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM pantheon_demo.system_users;" 2>/dev/null || echo "0")
        print_info "Demo user count: ${demo_user_count}"
    fi

    if ${MYSQL_CMD} -e "USE pantheon_enterprise;" &>/dev/null; then
        local menu_count
        menu_count=$(${MYSQL_CMD} -N -e "SELECT COUNT(*) FROM pantheon_enterprise.system_menus;" 2>/dev/null || echo "0")
        print_info "Enterprise menu count: ${menu_count}"
    fi

    print_success "Demo data verification completed."
}

main() {
    print_info "========================================"
    print_info "Pantheon Platform Demo Data Initialization"
    print_info "========================================"
    print_info "MySQL Host: ${MYSQL_HOST}"
    print_info "MySQL User: ${MYSQL_USER}"
    print_info "Master Database: ${MASTER_DB}"
    print_info "Script Directory: ${SCRIPT_DIR}"
    print_info "========================================"

    check_mysql_connection

    if ! check_master_database; then
        exit 0
    fi

    init_master_data
    init_tenant_data
    cleanup_temp_files
    verify_data

    print_info "========================================"
    print_success "Demo data initialization completed."
    print_info "========================================"
    print_info "Default demo accounts:"
    print_info "  Enterprise: zhangsan / admin123"
    print_info "  Dev: dev_user / admin123"
    print_info "  Demo: demo_user / admin123"
    print_info "========================================"
}

trap cleanup_temp_files EXIT

main
