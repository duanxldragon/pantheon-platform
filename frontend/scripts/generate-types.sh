#!/bin/bash

# API Types Generator
# 从运行中的后端服务器自动生成前端 TypeScript 类型定义

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo -e "  API Types Generator"
echo -e "  Pantheon Platform"
echo -e "======================================${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"

# 检查后端服务器是否运行
echo -e "${YELLOW}1. 检查后端服务器状态...${NC}"
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ 后端服务器运行中${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}   ✗ 后端服务器未运行${NC}"
    echo -e "${YELLOW}   请先启动后端服务器:${NC}"
    echo -e "   ${BLUE}cd backend && make run${NC}"
    echo ""
    echo -e "${YELLOW}是否继续使用本地 swagger 文件？(y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${RED}已取消${NC}"
        exit 1
    fi
    BACKEND_RUNNING=false
fi
echo ""

# 生成类型定义
echo -e "${YELLOW}2. 生成 TypeScript 类型定义...${NC}"

cd "$FRONTEND_DIR"

if [ "$BACKEND_RUNNING" = true ]; then
    # 从运行中的服务器生成
    echo -e "   从 http://localhost:8080/swagger/doc.json 生成..."
    npx openapi-typescript http://localhost:8080/swagger/doc.json -o src/api/types.ts

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✓ 类型定义生成成功${NC}"
        GENERATED=true
    else
        echo -e "${RED}   ✗ 类型定义生成失败${NC}"
        GENERATED=false
    fi
else
    # 从本地文件生成
    if [ -f "public/swagger.json" ]; then
        echo -e "   从本地 public/swagger.json 生成..."
        npx openapi-typescript ./public/swagger.json -o src/api/types.ts

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}   ✓ 类型定义生成成功${NC}"
            GENERATED=true
        else
            echo -e "${RED}   ✗ 类型定义生成失败${NC}"
            GENERATED=false
        fi
    else
        echo -e "${RED}   ✗ 找不到 swagger.json 文件${NC}"
        echo -e "${YELLOW}   请先复制 swagger 文件:${NC}"
        echo -e "   ${BLUE}cp backend/api/swagger/doc.json frontend/public/swagger.json${NC}"
        GENERATED=false
    fi
fi
echo ""

# 类型检查
if [ "$GENERATED" = true ]; then
    echo -e "${YELLOW}3. 运行类型检查...${NC}"
    npm run type-check

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✓ 类型检查通过${NC}"
    else
        echo -e "${YELLOW}   ⚠ 类型检查发现问题，请查看上方输出${NC}"
    fi
    echo ""
fi

# 统计信息
if [ "$GENERATED" = true ]; then
    echo -e "${GREEN}======================================"
    echo -e "  ✓ 生成完成！"
    echo -e "======================================${NC}"
    echo -e "${BLUE}生成的文件:${NC}"
    echo -e "  ${FRONTEND_DIR}/src/api/types.ts"
    echo ""
    echo -e "${BLUE}使用方法:${NC}"
    echo -e "  import { components } from '@/api/types';"
    echo -e "  type User = components['schemas']['UserResponse'];"
    echo ""
else
    echo -e "${RED}======================================"
    echo -e "  ✗ 生成失败"
    echo -e "======================================${NC}"
    echo -e "${YELLOW}请检查错误信息并重试${NC}"
    exit 1
fi
