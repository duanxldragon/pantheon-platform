package main

import (
	"fmt"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"pantheon-platform/backend/cmd/tools/internal/toolenv"
	"pantheon-platform/backend/internal/modules/system/model"
)

func main() {
	db, err := gorm.Open(mysql.Open(toolenv.MasterDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to master DB: %v", err)
	}

	fmt.Println("🔍 正在诊断 admin 用户权限与菜单关联...")

	var admin model.User
	if err := db.Where("username = ?", "admin").First(&admin).Error; err != nil {
		log.Fatalf("❌ 未找到 admin 用户: %v", err)
	}
	fmt.Printf("✅ 找到 admin 用户: ID=%s, TenantID=%s\n", admin.ID, admin.TenantID)

	var roles []model.Role
	db.Raw("SELECT r.* FROM system_roles r INNER JOIN system_user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?", admin.ID).Scan(&roles)
	if len(roles) == 0 {
		fmt.Println("⚠️ admin 用户未关联任何角色！正在修复...")

		var superRole model.Role
		if err := db.Where("code = ?", "SUPER_ADMIN").First(&superRole).Error; err != nil {
			fmt.Println("ℹ️ 未找到 SUPER_ADMIN 角色，正在创建...")
			superRole = model.Role{Name: "超级管理员", Code: "SUPER_ADMIN", Status: "active"}
			db.Create(&superRole)
		}

		db.Exec("INSERT INTO system_user_roles (user_id, role_id) VALUES (?, ?)", admin.ID, superRole.ID)
		fmt.Println("✅ 已为 admin 关联超级管理员角色")
		roles = append(roles, superRole)
	} else {
		for _, role := range roles {
			fmt.Printf("✅ admin 已关联角色: %s (%s)\n", role.Name, role.Code)
		}
	}

	for _, role := range roles {
		var menuCount int64
		db.Table("system_role_menus").Where("role_id = ?", role.ID).Count(&menuCount)
		fmt.Printf("📊 角色 [%s] 关联菜单数: %d\n", role.Name, menuCount)

		if menuCount == 0 {
			fmt.Printf("⚠️ 角色 [%s] 未关联任何菜单！正在尝试关联所有可用菜单...\n", role.Name)
			var allMenuIDs []string
			db.Table("system_menus").Select("id").Find(&allMenuIDs)
			if len(allMenuIDs) > 0 {
				for _, menuID := range allMenuIDs {
					db.Exec("INSERT IGNORE INTO system_role_menus (role_id, menu_id) VALUES (?, ?)", role.ID, menuID)
				}
				fmt.Printf("✅ 已为角色 [%s] 关联了 %d 个菜单\n", role.Name, len(allMenuIDs))
			} else {
				fmt.Println("❌ 数据库中没有任何菜单记录，请先运行 demo 导入脚本！")
			}
		}
	}

	if len(roles) > 0 {
		var casbinCount int64
		db.Table("casbin_rules").Where("v0 = ?", roles[0].ID.String()).Count(&casbinCount)
		fmt.Printf("🛡️ 角色 [%s] 的 Casbin 策略条数: %d\n", roles[0].Name, casbinCount)
		if casbinCount == 0 {
			fmt.Println("⚠️ Casbin 策略缺失，正在为超级管理员添加全局通行证...")
			db.Exec("INSERT INTO casbin_rules (ptype, v0, v1, v2) VALUES ('p', ?, '/api/v1/*', '*')", roles[0].ID.String())
			fmt.Println("✅ 已添加 Casbin 全局策略")
		}
	}

	fmt.Println("\n✨ 权限诊断与修复完成。请重启后端并刷新前端页面。")
}
