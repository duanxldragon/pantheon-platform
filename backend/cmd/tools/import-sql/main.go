package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	toolenv "pantheon-platform/backend/cmd/tools/internal/tool_env"
)

func main() {
	db, err := gorm.Open(mysql.Open(toolenv.MasterDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to DB: %v", err)
	}

	files := []string{
		"scripts/demo/demo_menus_permissions.sql",
	}

	for _, file := range files {
		fmt.Printf("importing %s ...\n", file)
		content, err := os.ReadFile(file)
		if err != nil {
			log.Printf("unable to read %s: %v", file, err)
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

		fmt.Printf("executed %d SQL statements\n", count)
	}

	fmt.Println("\nSQL import completed.")
}
