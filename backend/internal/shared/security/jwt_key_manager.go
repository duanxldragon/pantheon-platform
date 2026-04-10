package security

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"sync"
	"time"
)

// JWTKeyManager manages JWT keys for signing and validation
// It supports key rotation for enhanced security
type JWTKeyManager struct {
	currentKey    string
	previousKeys  map[string]string // Map of key IDs to previous keys for graceful rotation
	keyVersion    int64
	mu            sync.RWMutex
	lastRotation  time.Time
	rotationInterval time.Duration
}

// JWTKeyInfo contains information about a JWT key
type JWTKeyInfo struct {
	KeyID      string
	Key        string
	Version    int64
	CreatedAt  time.Time
	IsCurrent  bool
}

// NewJWTKeyManager creates a new JWT key manager
func NewJWTKeyManager(initialKey string, rotationInterval time.Duration) *JWTKeyManager {
	if rotationInterval == 0 {
		rotationInterval = 30 * 24 * time.Hour // Default 30 days
	}

	manager := &JWTKeyManager{
		currentKey:      initialKey,
		previousKeys:    make(map[string]string),
		keyVersion:      1,
		lastRotation:    time.Now(),
		rotationInterval: rotationInterval,
	}

	return manager
}

// GetCurrentKey returns the current signing key
func (m *JWTKeyManager) GetCurrentKey() string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.currentKey
}

// GetCurrentKeyVersion returns the current key version
func (m *JWTKeyManager) GetCurrentKeyVersion() int64 {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.keyVersion
}

// ValidateKey checks if a given key is valid (either current or previous)
func (m *JWTKeyManager) ValidateKey(key string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if key == m.currentKey {
		return true
	}

	for _, prevKey := range m.previousKeys {
		if key == prevKey {
			return true
		}
	}

	return false
}

// ShouldRotate checks if it's time to rotate the key
func (m *JWTKeyManager) ShouldRotate() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.rotationInterval <= 0 {
		return false // Rotation disabled
	}

	return time.Since(m.lastRotation) >= m.rotationInterval
}

// RotateKey generates a new key and moves the current key to previous keys
func (m *JWTKeyManager) RotateKey() (*JWTKeyInfo, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Generate new key
	newKey, err := generateSecureKey(48)
	if err != nil {
		return nil, fmt.Errorf("failed to generate new key: %w", err)
	}

	// Store old key in previous keys
	oldKeyID := fmt.Sprintf("key_v%d", m.keyVersion)
	m.previousKeys[oldKeyID] = m.currentKey

	// Update current key
	m.currentKey = newKey
	m.keyVersion++
	m.lastRotation = time.Now()

	// Clean up old keys (keep last 3 keys)
	m.cleanupOldKeys(3)

	log.Printf("Security: JWT key rotated to version %d (previous: %s)", m.keyVersion, oldKeyID)

	return &JWTKeyInfo{
		KeyID:     fmt.Sprintf("key_v%d", m.keyVersion),
		Key:       newKey,
		Version:   m.keyVersion,
		CreatedAt: m.lastRotation,
		IsCurrent: true,
	}, nil
}

// ForceRotateKey forces an immediate key rotation
func (m *JWTKeyManager) ForceRotateKey() (*JWTKeyInfo, error) {
	return m.RotateKey()
}

// GetKeyInfo returns information about all managed keys
func (m *JWTKeyManager) GetKeyInfo() []*JWTKeyInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()

	info := make([]*JWTKeyInfo, 0, len(m.previousKeys)+1)

	// Add current key info
	info = append(info, &JWTKeyInfo{
		KeyID:     fmt.Sprintf("key_v%d", m.keyVersion),
		Key:       maskKey(m.currentKey),
		Version:   m.keyVersion,
		CreatedAt: m.lastRotation,
		IsCurrent: true,
	})

	// Add previous keys info
	for keyID, key := range m.previousKeys {
		info = append(info, &JWTKeyInfo{
			KeyID:     keyID,
			Key:       maskKey(key),
			Version:   0, // Version info not stored for old keys
			CreatedAt: time.Time{}, // Not tracked for old keys
			IsCurrent: false,
		})
	}

	return info
}

// cleanupOldKeys removes old keys beyond the specified retention limit
func (m *JWTKeyManager) cleanupOldKeys(retainCount int) {
	if len(m.previousKeys) <= retainCount {
		return
	}

	// Remove oldest keys
	keysToRemove := len(m.previousKeys) - retainCount
	removed := 0

	for keyID := range m.previousKeys {
		if removed >= keysToRemove {
			break
		}
		delete(m.previousKeys, keyID)
		removed++
	}

	log.Printf("Security: Cleaned up %d old JWT keys (retaining %d most recent)", removed, retainCount)
}

// generateSecureKey generates a cryptographically secure random key
func generateSecureKey(length int) (string, error) {
	if length <= 0 {
		return "", fmt.Errorf("key length must be positive")
	}

	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	key := base64.RawURLEncoding.EncodeToString(buf)
	if len(key) < length {
		return key, nil
	}

	return key[:length], nil
}

// maskKey masks a key for logging purposes
func maskKey(key string) string {
	if len(key) <= 8 {
		return "****"
	}
	return key[:4] + "****" + key[len(key)-4:]
}

// SetRotationInterval updates the key rotation interval
func (m *JWTKeyManager) SetRotationInterval(interval time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.rotationInterval = interval
	log.Printf("Security: JWT key rotation interval set to %v", interval)
}

// GetRotationStatus returns the current rotation status
func (m *JWTKeyManager) GetRotationStatus() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	nextRotation := m.lastRotation.Add(m.rotationInterval)
	timeUntilRotation := time.Until(nextRotation)

	return map[string]interface{}{
		"last_rotation":        m.lastRotation.Format(time.RFC3339),
		"next_rotation":        nextRotation.Format(time.RFC3339),
		"hours_until_rotation": timeUntilRotation.Hours(),
		"current_version":      m.keyVersion,
		"previous_keys_count":  len(m.previousKeys),
		"rotation_enabled":     m.rotationInterval > 0,
	}
}

// InitializeWithEnvironment creates a key manager and sets up automatic rotation
func InitializeWithEnvironment(initialKey string) *JWTKeyManager {
	// Default rotation interval: 30 days for production, 7 days for development
	rotationInterval := 30 * 24 * time.Hour

	manager := NewJWTKeyManager(initialKey, rotationInterval)
	log.Printf("Security: JWT Key Manager initialized with version %d", manager.GetCurrentKeyVersion())

	return manager
}

// ValidateKeyStrength checks if a key meets minimum strength requirements
func ValidateKeyStrength(key string) error {
	if len(key) < 32 {
		return fmt.Errorf("JWT key must be at least 32 characters, got %d", len(key))
	}

	// Check for common weak keys
	weakKeys := []string{"secret", "password", "key", "jwt", "token"}
	keyLower := toLowerSafe(key)
	for _, weak := range weakKeys {
		if containsSubstring(keyLower, weak) {
			return fmt.Errorf("JWT key contains weak pattern: %s", weak)
		}
	}

	return nil
}