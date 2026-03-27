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

// GenerateTOTPSecret generates a TOTP secret.
func GenerateTOTPSecret() (string, error) {
	secret := make([]byte, 20)
	_, err := rand.Read(secret)
	if err != nil {
		return "", fmt.Errorf("failed to generate TOTP secret: %w", err)
	}

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

	url := fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
		issuer, username, secret, issuer)

	return url, nil
}

// ValidateTOTPCode validates a TOTP code.
func ValidateTOTPCode(secret, code string) bool {
	if secret == "" || code == "" {
		return false
	}

	if len(code) != 6 {
		return false
	}

	for _, char := range code {
		if char < '0' || char > '9' {
			return false
		}
	}

	key, err := base32.StdEncoding.DecodeString(strings.ToUpper(secret))
	if err != nil {
		return false
	}

	now := time.Now().Unix() / 30
	expectedCodes := make(map[string]bool)
	for i := -1; i <= 1; i++ {
		totpCode := generateTOTP(key, now+int64(i))
		expectedCodes[totpCode] = true
	}

	return expectedCodes[code]
}

func generateTOTP(key []byte, timeStep int64) string {
	hash := hmacSHA1(key, timeStep)

	offset := int(hash[len(hash)-1]) & 0x0F
	binary := ((int(hash[offset]) & 0x7f) << 24) |
		((int(hash[offset+1]) & 0x7f) << 16) |
		((int(hash[offset+2]) & 0x7f) << 8) |
		(int(hash[offset+3]) & 0x7f)

	otp := binary % 1000000

	return fmt.Sprintf("%06d", otp)
}

func hmacSHA1(key []byte, data int64) []byte {
	bytes := make([]byte, 8)
	for i := 7; i >= 0; i-- {
		bytes[i] = byte(data >> uint(i*8))
	}

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
		codes[i] = generateRandomCode(8)
	}

	return codes, nil
}

func generateRandomCode(length int) string {
	const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	code := make([]byte, length)

	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
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
	expiresAt := time.Now().Add(365 * 24 * time.Hour).Unix()

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
