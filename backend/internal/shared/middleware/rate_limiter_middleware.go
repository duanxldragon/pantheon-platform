package middleware

import (
	"strconv"
	"sync"
	"time"

	"pantheon-platform/backend/internal/shared/response"

	"github.com/gin-gonic/gin"
)

// RateLimiter stores per-key in-memory request windows.
type RateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

// NewRateLimiter creates a new in-memory rate limiter.
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

// Limit applies rate limiting by client IP.
func (rl *RateLimiter) Limit() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP()
		allowed, remaining, resetAt := rl.allow(key)
		if !allowed {
			response.TooManyRequests(c, "RATE_LIMIT_EXCEEDED", "Request rate limit exceeded")
			c.Abort()
			return
		}

		c.Header("X-RateLimit-Limit", strconv.Itoa(rl.limit))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", resetAt.Format(time.RFC3339))

		c.Next()
	}
}

// UserRoleBasedRateLimiter applies different limits by user role.
type UserRoleBasedRateLimiter struct {
	regularUser *RateLimiter
	premiumUser *RateLimiter
	adminUser   *RateLimiter
}

// NewUserRoleBasedRateLimiter creates a role-aware rate limiter.
func NewUserRoleBasedRateLimiter() *UserRoleBasedRateLimiter {
	return &UserRoleBasedRateLimiter{
		regularUser: NewRateLimiter(100, time.Minute),
		premiumUser: NewRateLimiter(500, time.Minute),
		adminUser:   NewRateLimiter(1000, time.Minute),
	}
}

// Limit applies limits based on `user_role` from context.
func (urbl *UserRoleBasedRateLimiter) Limit() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("user_role")
		if !exists {
			role = "guest"
		}

		var limiter *RateLimiter
		switch role {
		case "admin":
			limiter = urbl.adminUser
		case "premium":
			limiter = urbl.premiumUser
		default:
			limiter = urbl.regularUser
		}

		limiter.Limit()(c)
	}
}

// APITokenLimiter applies token-specific rate limit policies.
type APITokenLimiter struct {
	limiters map[string]*RateLimiter
	mutex    sync.RWMutex
}

// NewAPITokenLimiter creates an API token limiter registry.
func NewAPITokenLimiter() *APITokenLimiter {
	return &APITokenLimiter{
		limiters: make(map[string]*RateLimiter),
	}
}

// AddToken registers a token-specific limiter.
func (atl *APITokenLimiter) AddToken(token string, limit int, window time.Duration) {
	atl.mutex.Lock()
	defer atl.mutex.Unlock()
	atl.limiters[token] = NewRateLimiter(limit, window)
}

// Limit applies rate limits using `X-API-Key`.
func (atl *APITokenLimiter) Limit() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("X-API-Key")
		if token == "" {
			c.Next()
			return
		}

		atl.mutex.RLock()
		limiter, exists := atl.limiters[token]
		atl.mutex.RUnlock()

		if !exists {
			atl.mutex.Lock()
			limiter, exists = atl.limiters[token]
			if !exists {
				limiter = NewRateLimiter(60, time.Minute)
				atl.limiters[token] = limiter
			}
			atl.mutex.Unlock()
		}

		limiter.Limit()(c)
	}
}

func (rl *RateLimiter) allow(key string) (bool, int, time.Time) {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	requests := rl.requests[key]
	validRequests := make([]time.Time, 0, len(requests)+1)
	for _, reqTime := range requests {
		if now.Sub(reqTime) < rl.window {
			validRequests = append(validRequests, reqTime)
		}
	}

	if len(validRequests) >= rl.limit {
		resetAt := validRequests[0].Add(rl.window)
		return false, 0, resetAt
	}

	validRequests = append(validRequests, now)
	rl.requests[key] = validRequests
	return true, rl.limit - len(validRequests), now.Add(rl.window)
}

// MemoryCleanup periodically removes expired in-memory request windows.
func (rl *RateLimiter) MemoryCleanup() {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		rl.mutex.Lock()
		now := time.Now()
		for key, requests := range rl.requests {
			validRequests := make([]time.Time, 0)
			for _, reqTime := range requests {
				if now.Sub(reqTime) < rl.window {
					validRequests = append(validRequests, reqTime)
				}
			}
			if len(validRequests) == 0 {
				delete(rl.requests, key)
			} else {
				rl.requests[key] = validRequests
			}
		}
		rl.mutex.Unlock()
	}
}
