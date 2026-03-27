package toolenv

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/redis/go-redis/v9"
)

const (
	defaultRedisDB = 0
)

func mustGetenv(key string) string {
	value, exists := os.LookupEnv(key)
	if !exists || strings.TrimSpace(value) == "" {
		log.Fatalf("missing required environment variable: %s", key)
	}
	return strings.TrimSpace(value)
}

func getenv(key, fallback string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		return fallback
	}
	return value
}

func getenvInt(key string, fallback int) int {
	value, exists := os.LookupEnv(key)
	if !exists || strings.TrimSpace(value) == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		log.Fatalf("invalid integer environment variable %s: %v", key, err)
	}
	return parsed
}

func mustGetenvInt(key string) int {
	value := mustGetenv(key)
	parsed, err := strconv.Atoi(value)
	if err != nil {
		log.Fatalf("invalid integer environment variable %s: %v", key, err)
	}
	return parsed
}

func MasterDSN() string {
	return mustGetenv("PANTHEON_TOOL_MASTER_DSN")
}

func MySQLRootDSN() string {
	return mustGetenv("PANTHEON_TOOL_MYSQL_ROOT_DSN")
}

func MasterDBHost() string {
	return mustGetenv("PANTHEON_TOOL_MASTER_DB_HOST")
}

func MasterDBPort() int {
	return mustGetenvInt("PANTHEON_TOOL_MASTER_DB_PORT")
}

func MasterDBName() string {
	return mustGetenv("PANTHEON_TOOL_MASTER_DB_NAME")
}

func MasterDBUser() string {
	return mustGetenv("PANTHEON_TOOL_MASTER_DB_USER")
}

func MasterDBPassword() string {
	return mustGetenv("PANTHEON_TOOL_MASTER_DB_PASSWORD")
}

func RedisOptions() *redis.Options {
	return &redis.Options{
		Addr:     mustGetenv("PANTHEON_TOOL_REDIS_ADDR"),
		Password: getenv("PANTHEON_TOOL_REDIS_PASSWORD", ""),
		DB:       getenvInt("PANTHEON_TOOL_REDIS_DB", defaultRedisDB),
	}
}

func PrintConfigSummary() {
	fmt.Printf("[toolenv] master_dsn=%s\n", MasterDSN())
	fmt.Printf("[toolenv] mysql_root_dsn=%s\n", MySQLRootDSN())
	fmt.Printf("[toolenv] master_db_host=%s\n", MasterDBHost())
	fmt.Printf("[toolenv] master_db_port=%d\n", MasterDBPort())
	fmt.Printf("[toolenv] master_db_name=%s\n", MasterDBName())
	fmt.Printf("[toolenv] master_db_user=%s\n", MasterDBUser())
	fmt.Printf("[toolenv] redis_addr=%s\n", RedisOptions().Addr)
	fmt.Printf("[toolenv] redis_db=%d\n", RedisOptions().DB)
}
