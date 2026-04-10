package main

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatal(err)
	}

	// Delete all auth lock keys
	iter := rdb.Scan(ctx, 0, "*", 0).Iterator()
	var keys []string

	for iter.Next(ctx) {
		key := iter.Val()
		if contains(key, "login") || contains(key, "lock") || contains(key, "attempt") {
			keys = append(keys, key)
		}
	}

	if len(keys) > 0 {
		if err := rdb.Del(ctx, keys...).Err(); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Cleared %d lock keys\n", len(keys))
	} else {
		fmt.Println("No lock keys found")
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || findSubstring(s, substr))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
