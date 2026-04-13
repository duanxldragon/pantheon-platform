package cache

import (
	"context"
	"errors"
	"fmt"
	"log"
	"path"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"pantheon-platform/backend/internal/config"
)

// RedisClient wraps the redis client used across the backend.
type RedisClient struct {
	client *redis.Client
	memory *memoryStore
	mode   string
}

type memoryEntry struct {
	value     string
	hash      map[string]string
	expiresAt time.Time
}

type memoryStore struct {
	mu   sync.RWMutex
	data map[string]*memoryEntry
}

func newMemoryStore() *memoryStore {
	return &memoryStore{
		data: make(map[string]*memoryEntry),
	}
}

// NewRedisClient creates a new redis client.
func NewRedisClient(cfg config.RedisConfig, environment string) (*RedisClient, error) {
	if cfg.Enabled != "true" && cfg.Enabled != "1" {
		return nil, nil
	}

	options := &redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	}

	if cfg.PoolSize > 0 {
		options.PoolSize = cfg.PoolSize
	}
	if cfg.MinIdleConns > 0 {
		options.MinIdleConns = cfg.MinIdleConns
	}

	client := redis.NewClient(options)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		if strings.EqualFold(environment, "development") {
			log.Printf("warning: failed to connect to redis, using in-memory fallback for development: %v", err)
			return &RedisClient{
				memory: newMemoryStore(),
				mode:   "memory",
			}, nil
		}
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	return &RedisClient{client: client, mode: "remote"}, nil
}

// NewInMemoryRedisClient creates a redis client backed by in-memory storage.
func NewInMemoryRedisClient() *RedisClient {
	return &RedisClient{
		memory: newMemoryStore(),
		mode:   "memory",
	}
}

// GetClient returns the underlying redis client.
func (r *RedisClient) GetClient() *redis.Client {
	return r.client
}

// Mode returns the current backend mode.
func (r *RedisClient) Mode() string {
	if r == nil {
		return ""
	}
	if r.mode != "" {
		return r.mode
	}
	if r.client != nil {
		return "remote"
	}
	if r.memory != nil {
		return "memory"
	}
	return ""
}

// Ping checks whether the backing store is reachable.
func (r *RedisClient) Ping(ctx context.Context) error {
	if r == nil {
		return errors.New("redis client is not initialized")
	}
	if r.client != nil {
		return r.client.Ping(ctx).Err()
	}
	if r.memory != nil {
		return nil
	}
	return errors.New("redis client is not initialized")
}

// Set stores a value in redis with expiration.
func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	if r == nil {
		return errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		r.memory.set(key, fmt.Sprint(value), expiration)
		return nil
	}
	return r.client.Set(ctx, key, value, expiration).Err()
}

// Get retrieves a value from redis.
func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	if r == nil {
		return "", errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		return r.memory.get(key)
	}
	return r.client.Get(ctx, key).Result()
}

// Del deletes a key from redis.
func (r *RedisClient) Del(ctx context.Context, key string) error {
	if r == nil {
		return errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		r.memory.del(key)
		return nil
	}
	return r.client.Del(ctx, key).Err()
}

// Exists checks whether a key exists in redis.
func (r *RedisClient) Exists(ctx context.Context, key string) (bool, error) {
	if r == nil {
		return false, errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		return r.memory.exists(key), nil
	}
	n, err := r.client.Exists(ctx, key).Result()
	return n > 0, err
}

// Incr increments a key by 1.
func (r *RedisClient) Incr(ctx context.Context, key string) (int64, error) {
	if r == nil {
		return 0, errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		return r.memory.incr(key)
	}
	return r.client.Incr(ctx, key).Result()
}

// Expire sets an expiration time on a key.
func (r *RedisClient) Expire(ctx context.Context, key string, expiration time.Duration) error {
	if r == nil {
		return errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		return r.memory.expire(key, expiration)
	}
	return r.client.Expire(ctx, key, expiration).Err()
}

// HSet stores one hash field.
func (r *RedisClient) HSet(ctx context.Context, key, field, value string) error {
	if r == nil {
		return errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		r.memory.hset(key, field, value)
		return nil
	}
	return r.client.HSet(ctx, key, field, value).Err()
}

// HGetAll returns all hash fields.
func (r *RedisClient) HGetAll(ctx context.Context, key string) (map[string]string, error) {
	if r == nil {
		return nil, errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		return r.memory.hgetall(key), nil
	}
	return r.client.HGetAll(ctx, key).Result()
}

// Scan returns matched keys.
func (r *RedisClient) Scan(ctx context.Context, cursor uint64, pattern string, count int64) ([]string, uint64, error) {
	if r == nil {
		return nil, 0, errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		return r.memory.scan(pattern), 0, nil
	}
	return r.client.Scan(ctx, cursor, pattern, count).Result()
}

// Close closes the redis client.
func (r *RedisClient) Close() error {
	if r == nil || r.memory != nil {
		return nil
	}
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
	if r == nil || (r.client == nil && r.memory == nil) {
		return "", errors.New("redis client is not initialized")
	}

	token := uuid.NewString()
	if r.memory != nil {
		ok := r.memory.setNX(key, token, ttl)
		if !ok {
			return "", ErrLockNotAcquired
		}
		return token, nil
	}

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
	if r == nil || (r.client == nil && r.memory == nil) {
		return errors.New("redis client is not initialized")
	}
	if r.memory != nil {
		r.memory.releaseLock(key, token)
		return nil
	}
	return releaseLockScript.Run(ctx, r.client, []string{key}, token).Err()
}

func (m *memoryStore) set(key, value string, expiration time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry := m.getOrCreateLocked(key)
	entry.value = value
	entry.hash = nil
	entry.expiresAt = expiryTime(expiration)
}

func (m *memoryStore) get(key string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.getLocked(key)
	if !ok || entry.hash != nil {
		return "", redis.Nil
	}
	return entry.value, nil
}

func (m *memoryStore) del(key string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.data, key)
}

func (m *memoryStore) exists(key string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	_, ok := m.getLocked(key)
	return ok
}

func (m *memoryStore) incr(key string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.getLocked(key)
	if !ok {
		entry = m.getOrCreateLocked(key)
		entry.value = "0"
	}
	if entry.hash != nil {
		return 0, errors.New("value is not an integer")
	}

	value, err := strconv.ParseInt(strings.TrimSpace(entry.value), 10, 64)
	if err != nil {
		return 0, err
	}
	value++
	entry.value = strconv.FormatInt(value, 10)
	return value, nil
}

func (m *memoryStore) expire(key string, expiration time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.getLocked(key)
	if !ok {
		return redis.Nil
	}
	entry.expiresAt = expiryTime(expiration)
	return nil
}

func (m *memoryStore) hset(key, field, value string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.getLocked(key)
	if !ok {
		entry = m.getOrCreateLocked(key)
	}
	if entry.hash == nil {
		entry.hash = make(map[string]string)
		entry.value = ""
	}
	entry.hash[field] = value
}

func (m *memoryStore) hgetall(key string) map[string]string {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.getLocked(key)
	if !ok || entry.hash == nil {
		return map[string]string{}
	}

	result := make(map[string]string, len(entry.hash))
	for field, value := range entry.hash {
		result[field] = value
	}
	return result
}

func (m *memoryStore) scan(pattern string) []string {
	m.mu.Lock()
	defer m.mu.Unlock()

	keys := make([]string, 0)
	for key := range m.data {
		if m.isExpiredLocked(key) {
			delete(m.data, key)
			continue
		}
		matched, err := path.Match(pattern, key)
		if err != nil || !matched {
			continue
		}
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

func (m *memoryStore) setNX(key, value string, expiration time.Duration) bool {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.getLocked(key); ok {
		return false
	}
	m.data[key] = &memoryEntry{
		value:     value,
		expiresAt: expiryTime(expiration),
	}
	return true
}

func (m *memoryStore) releaseLock(key, token string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.getLocked(key)
	if !ok || entry.value != token {
		return
	}
	delete(m.data, key)
}

func (m *memoryStore) getLocked(key string) (*memoryEntry, bool) {
	if m.isExpiredLocked(key) {
		delete(m.data, key)
		return nil, false
	}
	entry, ok := m.data[key]
	return entry, ok
}

func (m *memoryStore) getOrCreateLocked(key string) *memoryEntry {
	if entry, ok := m.getLocked(key); ok {
		return entry
	}
	entry := &memoryEntry{}
	m.data[key] = entry
	return entry
}

func (m *memoryStore) isExpiredLocked(key string) bool {
	entry, ok := m.data[key]
	if !ok || entry == nil {
		return false
	}
	return !entry.expiresAt.IsZero() && time.Now().After(entry.expiresAt)
}

func expiryTime(expiration time.Duration) time.Time {
	if expiration <= 0 {
		return time.Time{}
	}
	return time.Now().Add(expiration)
}
