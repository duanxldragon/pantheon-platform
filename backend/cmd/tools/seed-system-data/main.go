package main

import (
	"fmt"
	"log"

	"github.com/google/uuid"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	toolenv "pantheon-platform/backend/cmd/tools/internal/tool_env"
	"pantheon-platform/backend/internal/modules/system/menu"
	"pantheon-platform/backend/internal/modules/system/model"
)

func main() {
	db, err := gorm.Open(mysql.Open(toolenv.MasterDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to DB: %v", err)
	}

	fmt.Println("🌱 正在注入系统核心菜单数据...")

	var superRole model.Role
	if err := db.Where("code = ?", "SUPER_ADMIN").Or("code = ?", "super_admin").First(&superRole).Error; err != nil {
		log.Fatalf("❌ 未找到超级管理员角色，请先运行权限诊断脚本！")
	}

	systemMenuID := uuid.New()
	menus := []menu.Menu{
		{ID: systemMenuID, Name: "系统管理", Code: "SystemManagement", Path: "/system", Icon: "Settings", Type: "menu", Sort: 1, Status: "active"},
		{ID: uuid.New(), Name: "用户管理", Code: "UserManagement", Path: "/system/user", Icon: "Users", Type: "menu", ParentID: &systemMenuID, Sort: 1, Status: "active"},
		{ID: uuid.New(), Name: "角色管理", Code: "RoleManagement", Path: "/system/role", Icon: "Shield", Type: "menu", ParentID: &systemMenuID, Sort: 2, Status: "active"},
		{ID: uuid.New(), Name: "部门管理", Code: "DepartmentManagement", Path: "/system/dept", Icon: "Building2", Type: "menu", ParentID: &systemMenuID, Sort: 3, Status: "active"},
		{ID: uuid.New(), Name: "菜单管理", Code: "MenuManagement", Path: "/system/menu", Icon: "Menu", Type: "menu", ParentID: &systemMenuID, Sort: 4, Status: "active"},
		{ID: uuid.New(), Name: "租户管理", Code: "TenantManagement", Path: "/tenant", Icon: "Building", Type: "menu", Sort: 2, Status: "active"},
	}

	for _, item := range menus {
		var existing menu.Menu
		if err := db.Where("code = ?", item.Code).First(&existing).Error; err == gorm.ErrRecordNotFound {
			db.Create(&item)
			fmt.Printf("✅ 已创建菜单: %s\n", item.Name)
			rel := menu.RoleMenuRelation{ID: uuid.New(), RoleID: superRole.ID.String(), MenuID: item.ID.String()}
			db.Create(&rel)
		} else {
			fmt.Printf("ℹ️ 菜单已存在: %s\n", item.Name)
			var rel existingRel
			db.Table("system_role_menus").Where("role_id = ? AND menu_id = ?", superRole.ID.String(), existing.ID.String()).First(&rel)
			if rel.ID == "" {
				db.Exec("INSERT INTO system_role_menus (id, role_id, menu_id) VALUES (?, ?, ?)", uuid.New().String(), superRole.ID.String(), existing.ID.String())
				fmt.Printf("✅ 已补全菜单关联: %s\n", item.Name)
			}
		}
	}

	fmt.Println("\n✨ 菜单注入与关联完成。")
}

type existingRel struct {
	ID string
}
