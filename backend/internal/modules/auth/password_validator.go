package auth

import (
	"errors"
	"strings"
	"unicode"
)

// PasswordStrength represents password strength level
type PasswordStrength int

const (
	PasswordWeak       PasswordStrength = iota // 0
	PasswordMedium                             // 1
	PasswordStrong                             // 2
	PasswordVeryStrong                         // 3
)

// PasswordPolicy represents password policy requirements
type PasswordPolicy struct {
	MinLength        int  `json:"min_length"`        // 最小长度
	MaxLength        int  `json:"max_length"`        // 最大长度
	RequireUppercase bool `json:"require_uppercase"` // 要求大写字母
	RequireLowercase bool `json:"require_lowercase"` // 要求小写字母
	RequireDigit     bool `json:"require_digit"`     // 要求数字
	RequireSpecial   bool `json:"require_special"`   // 要求特殊字符
	ForbidCommon     bool `json:"forbid_common"`     // 禁止常见密码
	ForbidUsername   bool `json:"forbid_username"`   // 禁止包含用户名
	ForbidEmail      bool `json:"forbid_email"`      // 禁止包含邮箱
}

// PasswordValidationResult represents the result of password validation
type PasswordValidationResult struct {
	Valid    bool             `json:"valid"`
	Strength PasswordStrength `json:"strength"`
	Score    int              `json:"score"`
	Errors   []string         `json:"errors"`
}

// DefaultPasswordPolicy returns the default password policy
func DefaultPasswordPolicy() PasswordPolicy {
	return PasswordPolicy{
		MinLength:        8,
		MaxLength:        128,
		RequireUppercase: true,
		RequireLowercase: true,
		RequireDigit:     true,
		RequireSpecial:   true,
		ForbidCommon:     true,
		ForbidUsername:   true,
		ForbidEmail:      true,
	}
}

// ValidatePassword validates a password against the policy
func ValidatePassword(password, username, email string, policy PasswordPolicy) *PasswordValidationResult {
	result := &PasswordValidationResult{
		Valid:    true,
		Errors:   []string{},
		Score:    0,
		Strength: PasswordWeak,
	}

	// Check length
	if len(password) < policy.MinLength {
		result.Valid = false
		result.Errors = append(result.Errors, "auth.error.password_too_short")
	}
	if len(password) > policy.MaxLength {
		result.Valid = false
		result.Errors = append(result.Errors, "auth.error.password_too_long")
	}

	// Check character requirements
	var hasUppercase, hasLowercase, hasDigit, hasSpecial bool
	for _, char := range password {
		if unicode.IsUpper(char) {
			hasUppercase = true
		}
		if unicode.IsLower(char) {
			hasLowercase = true
		}
		if unicode.IsDigit(char) {
			hasDigit = true
		}
		if !unicode.IsLetter(char) && !unicode.IsDigit(char) {
			hasSpecial = true
		}
	}

	if policy.RequireUppercase && !hasUppercase {
		result.Valid = false
		result.Errors = append(result.Errors, "auth.error.password_require_uppercase")
	}
	if policy.RequireLowercase && !hasLowercase {
		result.Valid = false
		result.Errors = append(result.Errors, "auth.error.password_require_lowercase")
	}
	if policy.RequireDigit && !hasDigit {
		result.Valid = false
		result.Errors = append(result.Errors, "auth.error.password_require_digit")
	}
	if policy.RequireSpecial && !hasSpecial {
		result.Valid = false
		result.Errors = append(result.Errors, "auth.error.password_require_special")
	}

	// Check common passwords
	if policy.ForbidCommon && isCommonPassword(password) {
		result.Valid = false
		result.Errors = append(result.Errors, "auth.error.password_too_common")
	}

	// Check if password contains username
	if policy.ForbidUsername && username != "" && strings.Contains(strings.ToLower(password), strings.ToLower(username)) {
		result.Valid = false
		result.Errors = append(result.Errors, "auth.error.password_contains_username")
	}

	// Check if password contains email
	if policy.ForbidEmail && email != "" {
		emailParts := strings.Split(strings.ToLower(email), "@")
		if len(emailParts) >= 2 {
			emailUsername := emailParts[0]
			if strings.Contains(strings.ToLower(password), emailUsername) {
				result.Valid = false
				result.Errors = append(result.Errors, "auth.error.password_contains_email")
			}
		}
	}

	// Calculate strength score
	result.Score = calculatePasswordScore(password, hasUppercase, hasLowercase, hasDigit, hasSpecial)
	result.Strength = calculateStrength(result.Score)

	return result
}

// calculatePasswordScore calculates a password strength score (0-100)
func calculatePasswordScore(password string, hasUppercase, hasLowercase, hasDigit, hasSpecial bool) int {
	score := 0

	// Length bonus (up to 40 points)
	length := len(password)
	if length >= 8 {
		score += 20
	}
	if length >= 12 {
		score += 10
	}
	if length >= 16 {
		score += 10
	}

	// Character variety bonus (up to 30 points)
	if hasUppercase {
		score += 7
	}
	if hasLowercase {
		score += 7
	}
	if hasDigit {
		score += 8
	}
	if hasSpecial {
		score += 8
	}

	// Complexity bonus (up to 30 points)
	varTypeCount := 0
	for _, char := range password {
		if unicode.IsUpper(char) {
			varTypeCount |= 1
		} else if unicode.IsLower(char) {
			varTypeCount |= 2
		} else if unicode.IsDigit(char) {
			varTypeCount |= 4
		} else {
			varTypeCount |= 8
		}
	}

	switch varTypeCount {
	case 15: // all 4 types
		score += 30
	case 14: // 3 types
		score += 20
	case 7: // 2 types
		score += 10
	case 1: // 1 type
		score += 0
	}

	// Cap at 100
	if score > 100 {
		score = 100
	}

	return score
}

// calculateStrength converts score to PasswordStrength
func calculateStrength(score int) PasswordStrength {
	if score >= 80 {
		return PasswordVeryStrong
	}
	if score >= 60 {
		return PasswordStrong
	}
	if score >= 40 {
		return PasswordMedium
	}
	return PasswordWeak
}

// isCommonPassword checks if the password is in a list of common passwords
func isCommonPassword(password string) bool {
	commonPasswords := []string{
		"password", "123456", "12345678", "qwerty", "abc123",
		"monkey", "dragon", "111111", "baseball", "iloveyou",
		"master", "sunshine", "ashley", "bailey", "shadow",
		"1234567890", "mustang", "1234", "admin", "welcome",
		"login", "letmein", "superman", "batman", "password123",
		"qwerty123", "hello", "football", "jordan", "michael",
		"charlie", "andrew", "password1", "password12", "password123",
		"admin123", "root", "test", "guest", "user",
	}

	lowerPassword := strings.ToLower(password)
	for _, common := range commonPasswords {
		if lowerPassword == common {
			return true
		}
	}

	return false
}

// ValidatePasswordFormat checks password format requirements without username/email context
func ValidatePasswordFormat(password string) (*PasswordValidationResult, error) {
	if password == "" {
		return nil, errors.New("auth.error.password_empty")
	}

	policy := DefaultPasswordPolicy()
	return ValidatePassword(password, "", "", policy), nil
}

// CheckPasswordStrength checks password strength without full validation
func CheckPasswordStrength(password string) PasswordStrength {
	result, err := ValidatePasswordFormat(password)
	if err != nil {
		return PasswordWeak
	}
	return result.Strength
}

// containsUppercase checks if password contains uppercase letters
func containsUppercase(s string) bool {
	for _, char := range s {
		if unicode.IsUpper(char) {
			return true
		}
	}
	return false
}

// containsLowercase checks if password contains lowercase letters
func containsLowercase(s string) bool {
	for _, char := range s {
		if unicode.IsLower(char) {
			return true
		}
	}
	return false
}

// containsDigit checks if password contains digits
func containsDigit(s string) bool {
	for _, char := range s {
		if unicode.IsDigit(char) {
			return true
		}
	}
	return false
}

// containsSpecial checks if password contains special characters
func containsSpecial(s string) bool {
	for _, char := range s {
		if !unicode.IsLetter(char) && !unicode.IsDigit(char) {
			return true
		}
	}
	return false
}
