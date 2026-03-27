package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"time"
)

// TwoFactorAuth stores two-factor authentication settings.
type TwoFactorAuth struct {
	ID          uint   `gorm:"primaryKey"`
	UserID      string `gorm:"size:36;not null;index" json:"user_id"`
	TenantID    string `gorm:"size:36;not null;index" json:"tenant_id"`
	Secret      string `gorm:"type:text;not null" json:"secret"`      // TOTP secret.
	Enabled     bool   `gorm:"default:false;not null" json:"enabled"` // Whether 2FA is enabled.
	BackupCodes string `gorm:"type:text" json:"backup_codes"`         // Serialized backup codes.
	CreatedAt   int64  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   int64  `gorm:"autoUpdateTime" json:"updated_at"`
}

func (TwoFactorAuth) TableName() string {
	return "two_factor_auth"
}

// GenerateTOTPSecret generates a TOTP secret.
func GenerateTOTPSecret() (string, error) {
	secret := make([]byte, 20) // 160-bit key
	_, err := rand.Read(secret)
	if err != nil {
		return "", fmt.Errorf("failed to generate TOTP secret: %w", err)
	}

	// Encode the secret with Base32.
	return strings.ToUpper(base32.StdEncoding.EncodeToString(secret)), nil
}

// GenerateTOTPQRCode builds an otpauth URL for authenticator apps.
func GenerateTOTPQRCode(secret, username, issuer string) (string, error) {
	if secret == "" {
		return "", fmt.Errorf("secret cannot be empty")
	}
	if username == "" {
		return "", fmt.Errorf("username cannot be empty")
	}

	// Generate a Google Authenticator compatible otpauth URL.
	url := fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
		issuer, username, secret, issuer)

	return url, nil
}

// ValidateTOTPCode validates a TOTP code.
func ValidateTOTPCode(secret, code string) bool {
	if secret == "" || code == "" {
		return false
	}

	// The code must be a 6-digit number.
	if len(code) != 6 {
		return false
	}

	// Ensure every character is numeric.
	for _, char := range code {
		if char < '0' || char > '9' {
			return false
		}
	}

	// Decode the Base32 secret.
	key, err := base32.StdEncoding.DecodeString(strings.ToUpper(secret))
	if err != nil {
		return false
	}

	// Allow a small drift window on both sides of the current time step.
	now := time.Now().Unix() / 30
	expectedCodes := make(map[string]bool)
	for i := -1; i <= 1; i++ {
		totpCode := generateTOTP(key, now+int64(i))
		expectedCodes[totpCode] = true
	}

	return expectedCodes[code]
}

// generateTOTP generates a TOTP code.
func generateTOTP(key []byte, timeStep int64) string {
	// HMAC-SHA1
	hash := hmacSHA1(key, timeStep)

	// Apply dynamic truncation.
	offset := int(hash[len(hash)-1]) & 0x0F
	binary := ((int(hash[offset]) & 0x7f) << 24) |
		((int(hash[offset+1]) & 0x7f) << 16) |
		((int(hash[offset+2]) & 0x7f) << 8) |
		(int(hash[offset+3]) & 0x7f)

	// Build the 6-digit code.
	otp := binary % 1000000

	return fmt.Sprintf("%06d", otp)
}

// hmacSHA1 computes HMAC-SHA1.
func hmacSHA1(key []byte, data int64) []byte {
	// Convert the counter to 8 bytes in big-endian order.
	bytes := make([]byte, 8)
	for i := 7; i >= 0; i-- {
		bytes[i] = byte(data >> uint(i*8))
	}

	// Compute the HMAC-SHA1 value.
	mac := hmac.New(sha1.New, key)
	mac.Write(bytes)
	return mac.Sum(nil)
}

// GenerateBackupCodes generates backup codes.
func GenerateBackupCodes(count int) ([]string, error) {
	if count <= 0 || count > 10 {
		return nil, fmt.Errorf("backup code count must be between 1 and 10")
	}

	codes := make([]string, count)
	for i := 0; i < count; i++ {
		code := generateRandomCode(8) // 8-character random code.
		codes[i] = code
	}

	return codes, nil
}

// generateRandomCode generates a random verification code.
func generateRandomCode(length int) string {
	const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	code := make([]byte, length)

	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			// Fall back to a timestamp-based value.
			code[i] = charset[time.Now().UnixNano()%int64(len(charset))]
		} else {
			code[i] = charset[n.Int64()]
		}
	}

	return string(code)
}

// BackupCode represents one backup code.
type BackupCode struct {
	Code      string
	Used      bool
	UsedAt    int64
	ExpiresAt int64
}

// ParseBackupCodes parses serialized backup codes.
func ParseBackupCodes(codesStr string) ([]BackupCode, error) {
	if codesStr == "" {
		return []BackupCode{}, nil
	}

	parts := strings.Split(codesStr, ",")
	if len(parts) == 0 {
		return nil, fmt.Errorf("invalid backup codes format")
	}

	codes := make([]BackupCode, len(parts))
	expiresAt := time.Now().Add(365 * 24 * time.Hour).Unix() // Expires in one year.

	for i, entry := range parts {
		fields := strings.Split(entry, "|")
		code := fields[0]
		if len(code) != 8 {
			return nil, fmt.Errorf("invalid backup code format: %s", entry)
		}

		codes[i] = BackupCode{
			Code:      code,
			Used:      false,
			UsedAt:    0,
			ExpiresAt: expiresAt,
		}

		if len(fields) >= 4 {
			codes[i].Used = fields[1] == "1" || strings.EqualFold(fields[1], "true")
			if usedAt, err := strconv.ParseInt(fields[2], 10, 64); err == nil {
				codes[i].UsedAt = usedAt
			}
			if expireTs, err := strconv.ParseInt(fields[3], 10, 64); err == nil && expireTs > 0 {
				codes[i].ExpiresAt = expireTs
			}
		}
	}

	return codes, nil
}

// SerializeBackupCodes serializes backup codes.
func SerializeBackupCodes(codes []BackupCode) string {
	if len(codes) == 0 {
		return ""
	}

	codeStrings := make([]string, len(codes))
	for i, code := range codes {
		codeStrings[i] = fmt.Sprintf("%s|%t|%d|%d", code.Code, code.Used, code.UsedAt, code.ExpiresAt)
	}

	return strings.Join(codeStrings, ",")
}

// UseBackupCode consumes one backup code when it is valid.
func UseBackupCode(codes []BackupCode, codeToUse string) (bool, []BackupCode) {
	for i, code := range codes {
		if !code.Used && code.Code == codeToUse && time.Now().Unix() < code.ExpiresAt {
			codes[i].Used = true
			codes[i].UsedAt = time.Now().Unix()
			return true, codes
		}
	}

	return false, codes
}

// GetRemainingBackupCodes counts remaining valid backup codes.
func GetRemainingBackupCodes(codes []BackupCode) int {
	count := 0
	for _, code := range codes {
		if !code.Used && time.Now().Unix() < code.ExpiresAt {
			count++
		}
	}
	return count
}
