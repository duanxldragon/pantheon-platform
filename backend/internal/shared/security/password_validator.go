package security

import (
	"errors"
	"unicode"
)

// PasswordStrength represents the strength level of a password
type PasswordStrength int

const (
	PasswordWeak   PasswordStrength = iota
	PasswordMedium PasswordStrength = iota
	PasswordStrong PasswordStrength = iota
)

// PasswordPolicy defines password requirements
type PasswordPolicy struct {
	MinLength           int  // Minimum password length
	RequireUppercase    bool // Require at least one uppercase letter
	RequireLowercase    bool // Require at least one lowercase letter
	RequireNumbers      bool // Require at least one number
	RequireSpecialChars bool // Require at least one special character
	ForbidCommonWords   bool // Forbid commonly used weak passwords
	ForbidUserInfo      bool // Forbid passwords containing username/email
}

// ValidationResult contains the results of password validation
type ValidationResult struct {
	Valid     bool
	Strength  PasswordStrength
	Errors    []string
	Warnings  []string
}

// DefaultPasswordPolicy returns the default password policy for the system
func DefaultPasswordPolicy() *PasswordPolicy {
	return &PasswordPolicy{
		MinLength:           12,
		RequireUppercase:    true,
		RequireLowercase:    true,
		RequireNumbers:      true,
		RequireSpecialChars: true,
		ForbidCommonWords:   true,
		ForbidUserInfo:      true,
	}
}

// AdminPasswordPolicy returns a stricter policy for administrators
func AdminPasswordPolicy() *PasswordPolicy {
	policy := DefaultPasswordPolicy()
	policy.MinLength = 16
	return policy
}

// Common weak passwords that should be forbidden
var commonPasswords = []string{
	"password", "123456", "12345678", "qwerty", "abc123",
	"monkey", "master", "dragon", "111111", "baseball",
	"iloveyou", "trustno1", "sunshine", "princess", "admin",
	"welcome", "shadow", "ashley", "football", "jesus",
	"michael", "ninja", "mustang", "password1", "password123",
}

// ValidatePassword validates a password against the given policy
func ValidatePassword(password string, policy *PasswordPolicy) *ValidationResult {
	result := &ValidationResult{
		Valid:    true,
		Strength: PasswordWeak,
		Errors:   make([]string, 0),
		Warnings: make([]string, 0),
	}

	if policy == nil {
		policy = DefaultPasswordPolicy()
	}

	// Check minimum length
	if len(password) < policy.MinLength {
		result.Valid = false
		result.Errors = append(result.Errors, "password_too_short")
	}

	// Check character requirements
	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if policy.RequireUppercase && !hasUpper {
		result.Valid = false
		result.Errors = append(result.Errors, "missing_uppercase")
	}

	if policy.RequireLowercase && !hasLower {
		result.Valid = false
		result.Errors = append(result.Errors, "missing_lowercase")
	}

	if policy.RequireNumbers && !hasNumber {
		result.Valid = false
		result.Errors = append(result.Errors, "missing_number")
	}

	if policy.RequireSpecialChars && !hasSpecial {
		result.Valid = false
		result.Errors = append(result.Errors, "missing_special_char")
	}

	// Check against common passwords
	if policy.ForbidCommonWords {
		passwordLower := toLowerSafe(password)
		for _, common := range commonPasswords {
			if toLowerSafe(common) == passwordLower {
				result.Valid = false
				result.Errors = append(result.Errors, "common_password")
				break
			}
		}
	}

	// Calculate password strength
	result.Strength = calculateStrength(password, hasUpper, hasLower, hasNumber, hasSpecial)

	// Add warnings for weak passwords that pass validation
	if result.Valid && result.Strength < PasswordStrong {
		result.Warnings = append(result.Warnings, "weak_password")
	}

	return result
}

// ValidatePasswordWithUserInfo validates password and checks if it contains user info
func ValidatePasswordWithUserInfo(password, username, email string, policy *PasswordPolicy) *ValidationResult {
	result := ValidatePassword(password, policy)

	if policy != nil && policy.ForbidUserInfo {
		passwordLower := toLowerSafe(password)
		usernameLower := toLowerSafe(username)
		emailLower := toLowerSafe(email)

		// Check if password contains username
		if usernameLower != "" && len(usernameLower) >= 4 &&
			containsSubstring(passwordLower, usernameLower) {
			result.Valid = false
			result.Errors = append(result.Errors, "contains_username")
		}

		// Check if password contains email parts
		if emailLower != "" {
			emailParts := extractEmailParts(emailLower)
			for _, part := range emailParts {
				if len(part) >= 4 && containsSubstring(passwordLower, part) {
					result.Valid = false
					result.Errors = append(result.Errors, "contains_email")
					break
				}
			}
		}
	}

	return result
}

// calculateStrength determines the strength of a password
func calculateStrength(password string, hasUpper, hasLower, hasNumber, hasSpecial bool) PasswordStrength {
	score := 0

	// Length score
	if len(password) >= 8 {
		score++
	}
	if len(password) >= 12 {
		score++
	}
	if len(password) >= 16 {
		score++
	}

	// Character variety score
	variety := 0
	if hasUpper {
		variety++
	}
	if hasLower {
		variety++
	}
	if hasNumber {
		variety++
	}
	if hasSpecial {
		variety++
	}

	score += variety - 1 // Subtract 1 because minimum variety is 1

	// Pattern checks (simplified)
	if hasRepeatingPattern(password) {
		score--
	}

	if hasSequentialPattern(password) {
		score--
	}

	// Determine strength
	if score >= 6 {
		return PasswordStrong
	} else if score >= 4 {
		return PasswordMedium
	}
	return PasswordWeak
}

// Helper functions
func toLowerSafe(s string) string {
	if s == "" {
		return ""
	}
	// Simple ASCII lower case conversion
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			result[i] = c + 32
		} else {
			result[i] = c
		}
	}
	return string(result)
}

func containsSubstring(password, substring string) bool {
	return len(password) >= len(substring) &&
		indexOfIgnoreCase(password, substring) >= 0
}

func indexOfIgnoreCase(str, substr string) int {
	if len(substr) > len(str) {
		return -1
	}

	strLower := toLowerSafe(str)
	substrLower := toLowerSafe(substr)

	for i := 0; i <= len(strLower)-len(substrLower); i++ {
		if strLower[i:i+len(substrLower)] == substrLower {
			return i
		}
	}
	return -1
}

func extractEmailParts(email string) []string {
	parts := make([]string, 0)

	// Split by @ and . to get meaningful parts
	atIndex := -1
	for i, c := range email {
		if c == '@' {
			atIndex = i
			break
		}
	}

	if atIndex > 0 {
		localPart := email[:atIndex]
		parts = append(parts, localPart)

		// Extract parts before dots in local part
		dotParts := splitByChar(localPart, '.')
		parts = append(parts, dotParts...)
	}

	return parts
}

func splitByChar(s string, char rune) []string {
	result := make([]string, 0)
	current := ""

	for _, c := range s {
		if c == char {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(c)
		}
	}

	if current != "" {
		result = append(result, current)
	}

	return result
}

func hasRepeatingPattern(password string) bool {
	if len(password) < 4 {
		return false
	}

	repeatCount := 1
	for i := 1; i < len(password); i++ {
		if password[i] == password[i-1] {
			repeatCount++
			if repeatCount >= 3 {
				return true
			}
		} else {
			repeatCount = 1
		}
	}

	return false
}

func hasSequentialPattern(password string) bool {
	if len(password) < 4 {
		return false
	}

	sequentialCount := 1
	for i := 1; i < len(password); i++ {
		if password[i] == password[i-1]+1 {
			sequentialCount++
			if sequentialCount >= 3 {
				return true
			}
		} else {
			sequentialCount = 1
		}
	}

	return false
}

// IsStrongPassword checks if a password meets the minimum strength requirement
func IsStrongPassword(password string) bool {
	result := ValidatePassword(password, DefaultPasswordPolicy())
	return result.Valid && result.Strength >= PasswordMedium
}

// ValidatePasswordRequirements is a simplified validation function for basic checks
func ValidatePasswordRequirements(password string) error {
	result := ValidatePassword(password, DefaultPasswordPolicy())

	if !result.Valid {
		if len(result.Errors) > 0 {
			return errors.New("password_does_not_meet_requirements")
		}
	}

	return nil
}
