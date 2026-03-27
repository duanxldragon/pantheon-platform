package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"strings"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"pantheon-platform/backend/cmd/tools/internal/toolenv"
)

func main() {
	db, err := gorm.Open(mysql.Open(toolenv.MasterDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to DB: %v", err)
	}

	files := []string{
		"scripts/demo/05_demo_menus_permissions.sql",
	}

	for _, file := range files {
		fmt.Printf("📂 正在导入 %s ...\n", file)
		content, err := ioutil.ReadFile(file)
		if err != nil {
			log.Printf("⚠️ 无法读取文件 %s: %v", file, err)
			continue
		}

		queries := strings.Split(string(content), ";")
		count := 0
		for _, query := range queries {
			query = strings.TrimSpace(query)
			if query == "" {
				continue
			}
			if err := db.Exec(query).Error; err != nil {
				if !strings.Contains(err.Error(), "already exists") {
					continue
				}
			} else {
				count++
			}
		}
		fmt.Printf("✅ 成功执行了 %d 条 SQL 语句\n", count)
	}

	fmt.Println("\n✨ SQL 导入完成。")
}
