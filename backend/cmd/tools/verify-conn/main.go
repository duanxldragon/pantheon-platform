package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"pantheon-platform/backend/cmd/tools/internal/toolenv"
)

func main() {
	db, err := gorm.Open(mysql.Open(toolenv.MySQLRootDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ MySQL 连接失败: %v", err)
	}
	fmt.Println("✅ MySQL 连接成功!")

	err = db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s", toolenv.MasterDBName())).Error
	if err != nil {
		log.Printf("⚠️ 无法创建数据库 %s: %v\n", toolenv.MasterDBName(), err)
	} else {
		fmt.Printf("✅ 数据库 %s 已就绪\n", toolenv.MasterDBName())
	}

	rdb := redis.NewClient(toolenv.RedisOptions())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pong, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("❌ Redis 连接失败: %v", err)
	}
	fmt.Printf("✅ Redis 连接成功: %s\n", pong)
}
