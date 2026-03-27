package user

import (
	"regexp"
	"strings"
	"unicode"
)

// isValidPhone validates a phone number
func isValidPhone(phone string) bool {
	// Remove spaces, dashes, and plus sign
	cleaned := strings.Map(func(r rune) rune {
		if r == ' ' || r == '-' || r == '+' {
			return -1
		}
		return r
	}, phone)

	// Check if all remaining characters are digits
	if len(cleaned) == 0 {
		return false
	}

	for _, r := range cleaned {
		if !unicode.IsDigit(r) {
			return false
		}
	}

	// Check length (typically 11 digits for Chinese mobile numbers)
	// Handle country codes (e.g., +86)
	if len(cleaned) == 13 && strings.HasPrefix(cleaned, "86") {
		// Remove country code and validate the remaining 11 digits
		cleaned = cleaned[2:]
	}

	if len(cleaned) != 11 {
		return false
	}

	// Check if it starts with a valid mobile prefix
	validPrefixes := []string{"13", "14", "15", "16", "17", "18", "19"}
	for _, prefix := range validPrefixes {
		if strings.HasPrefix(cleaned, prefix) {
			return true
		}
	}

	return false
}

// isValidUsername validates a username
func isValidUsername(username string) bool {
	if len(username) < 3 || len(username) > 50 {
		return false
	}

	// Check for valid characters (letters, numbers, dots, dashes, underscores)
	validChars := regexp.MustCompile(`^[a-zA-Z0-9._\-]+$`)
	if !validChars.MatchString(username) {
		return false
	}

	return true
}

// isValidRealName validates a real name
func isValidRealName(name string) bool {
	// Count characters (runes), not bytes
	charCount := 0
	for range name {
		charCount++
	}

	if charCount < 2 || charCount > 50 {
		return false
	}

	// Allow Chinese characters, English letters, spaces, and dots
	for _, r := range name {
		if !(unicode.Is(unicode.Han, r) || unicode.IsLetter(r) || r == ' ' || r == '.') {
			return false
		}
	}

	return true
}

// PasswordScore represents the result of password strength calculation
type PasswordScore struct {
	Score   int
	Reasons []string
}

// calculatePasswordScore calculates the strength of a password
func calculatePasswordScore(password string) PasswordScore {
	score := 0
	reasons := []string{}

	if len(password) == 0 {
		return PasswordScore{Score: 0, Reasons: []string{"empty password"}}
	}

	// Character variety checks
	hasLower := false
	hasUpper := false
	hasDigit := false
	hasSpecial := false
	hasUnicode := false

	for _, r := range password {
		switch {
		case unicode.IsLower(r):
			hasLower = true
		case unicode.IsUpper(r):
			hasUpper = true
		case unicode.IsDigit(r):
			hasDigit = true
		case unicode.Is(unicode.Symbol, r) || unicode.Is(unicode.Punct, r):
			hasSpecial = true
		default:
			// Unicode characters (e.g., Chinese characters)
			hasUnicode = true
		}
	}

	// Calculate variety count
	varietyCount := 0
	if hasLower {
		varietyCount++
	}
	if hasUpper {
		varietyCount++
	}
	if hasDigit {
		varietyCount++
	}
	if hasSpecial {
		varietyCount++
	}
	if hasUnicode {
		varietyCount++
	}

	// Add variety score based on character types
	switch varietyCount {
	case 1:
		// Single character type: give higher score if it's special or mixed
		if hasSpecial {
			score = 40
			reasons = append(reasons, "special characters only")
		} else if hasLower || hasUpper {
			score = 25
			reasons = append(reasons, "letters only")
		} else if hasDigit {
			score = 25
			reasons = append(reasons, "digits only")
		} else if hasUnicode {
			score = 45
			reasons = append(reasons, "unicode characters only")
		}
	case 2:
		// Two character types
		if (hasLower || hasUpper) && hasDigit {
			score = 35
			reasons = append(reasons, "letters and digits")
		} else if (hasLower || hasUpper) && hasSpecial {
			score = 40
			reasons = append(reasons, "letters and special chars")
		} else if hasDigit && hasSpecial {
			score = 35
			reasons = append(reasons, "digits and special chars")
		} else if (hasLower || hasUpper) && hasUnicode {
			score = 45
			reasons = append(reasons, "letters and unicode")
		} else {
			score = 30
			reasons = append(reasons, "two character types")
		}
	case 3:
		// Three character types
		if hasLower && hasUpper && hasDigit {
			score = 20
			reasons = append(reasons, "mixed case letters and digits")
		} else if (hasLower || hasUpper) && hasDigit && hasSpecial {
			score = 50
			reasons = append(reasons, "letters, digits, special")
		} else {
			score = 45
			reasons = append(reasons, "three character types")
		}
	case 4:
		// Four character types
		score = 60
		reasons = append(reasons, "four character types")
	case 5:
		// All character types
		score = 70
		reasons = append(reasons, "all character types")
	}

	// Length bonus (up to 30 points)
	if len(password) >= 12 {
		score += 30
		reasons = append(reasons, "long password")
	} else if len(password) >= 8 {
		score += 20
		reasons = append(reasons, "good length")
	} else if len(password) >= 6 {
		score += 10
		reasons = append(reasons, "acceptable length")
	} else {
		// Too short penalty
		score = int(float64(score) * 0.5)
		reasons = append(reasons, "too short")
	}

	// Common password penalty (set score to 10)
	commonPasswords := []string{"password", "123456", "qwerty", "abc123", "admin", "welcome"}
	for _, common := range commonPasswords {
		if strings.ToLower(password) == common {
			score = 10
			reasons = []string{"common password"}
			return PasswordScore{Score: score, Reasons: reasons}
		}
	}

	// Strong password bonus (add extra points for very strong passwords)
	if hasLower && hasUpper && hasDigit && hasSpecial && len(password) >= 12 {
		score = 100
		reasons = append(reasons, "very strong password")
	} else if score > 100 {
		score = 100
	}

	return PasswordScore{Score: score, Reasons: reasons}
}

// isValidUserRoleAssignment validates user role assignment
func isValidUserRoleAssignment(roleIDs []string) bool {
	if roleIDs == nil || len(roleIDs) == 0 {
		return false
	}

	// Check for duplicate role IDs
	roleIDMap := make(map[string]bool)
	for _, roleID := range roleIDs {
		if roleID == "" {
			return false
		}
		if roleIDMap[roleID] {
			return false // Duplicate
		}
		roleIDMap[roleID] = true
	}

	return true
}

// isValidStatusTransition validates user status transitions
func isValidStatusTransition(currentStatus, newStatus string) bool {
	// Define valid transitions
	validTransitions := map[string][]string{
		"active":   {"inactive", "locked"},
		"inactive": {"active", "locked"},
		"locked":   {"inactive"},
	}

	// If current status is not in the map, don't allow any transition
	allowed, exists := validTransitions[currentStatus]
	if !exists {
		return false
	}

	// Check if the new status is in the allowed list
	for _, status := range allowed {
		if status == newStatus {
			return true
		}
	}

	return false
}
