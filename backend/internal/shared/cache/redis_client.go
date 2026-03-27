package cache

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"pantheon-platform/backend/internal/config"
)

// RedisClient wraps the redis client used across the backend.
type RedisClient struct {
	client *redis.Client
}

// NewRedisClient creates a new redis client.
func NewRedisClient(cfg config.RedisConfig) (*RedisClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	return &RedisClient{client: client}, nil
}

// GetClient returns the underlying redis client.
func (r *RedisClient) GetClient() *redis.Client {
	return r.client
}

// Set stores a value in redis with expiration.
func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return r.client.Set(ctx, key, value, expiration).Err()
}

// Get retrieves a value from redis.
func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	return r.client.Get(ctx, key).Result()
}

// Del deletes a key from redis.
func (r *RedisClient) Del(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}

// Exists checks whether a key exists in redis.
func (r *RedisClient) Exists(ctx context.Context, key string) (bool, error) {
	n, err := r.client.Exists(ctx, key).Result()
	return n > 0, err
}

// Incr increments a key by 1.
func (r *RedisClient) Incr(ctx context.Context, key string) (int64, error) {
	return r.client.Incr(ctx, key).Result()
}

// Expire sets an expiration time on a key.
func (r *RedisClient) Expire(ctx context.Context, key string, expiration time.Duration) error {
	return r.client.Expire(ctx, key, expiration).Err()
}

// Close closes the redis client.
func (r *RedisClient) Close() error {
	return r.client.Close()
}

var releaseLockScript = redis.NewScript(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
else
    return 0
end
`)

// ErrLockNotAcquired indicates that a distributed lock is already held.
var ErrLockNotAcquired = errors.New("redis lock not acquired")

// AcquireLock tries to acquire a distributed lock with the given key and ttl.
// It returns a unique token when the lock is acquired successfully.
func (r *RedisClient) AcquireLock(ctx context.Context, key string, ttl time.Duration) (string, error) {
	if r == nil || r.client == nil {
		return "", errors.New("redis client is not initialized")
	}

	token := uuid.NewString()
	ok, err := r.client.SetNX(ctx, key, token, ttl).Result()
	if err != nil {
		return "", err
	}
	if !ok {
		return "", ErrLockNotAcquired
	}
	return token, nil
}

// ReleaseLock releases a distributed lock identified by key and token.
func (r *RedisClient) ReleaseLock(ctx context.Context, key, token string) error {
	if r == nil || r.client == nil {
		return errors.New("redis client is not initialized")
	}
	return releaseLockScript.Run(ctx, r.client, []string{key}, token).Err()
}
