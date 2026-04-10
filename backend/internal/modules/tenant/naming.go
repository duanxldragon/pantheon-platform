package tenant

import (
	"errors"
	"regexp"
	"strings"
)

const (
	tenantCodeMinLength = 3
	tenantCodeMaxLength = 32
)

var (
	ErrInvalidTenantCode       = errors.New("invalid tenant code")
	ErrTenantCodeAlreadyExists = errors.New("tenant code already exists")
	tenantCodePattern          = regexp.MustCompile(`^[a-z][a-z0-9_]{2,31}$`)
)

func normalizeTenantCode(input string) string {
	replacer := strings.NewReplacer(" ", "_", "-", "_")
	normalized := strings.ToLower(strings.TrimSpace(input))
	normalized = replacer.Replace(normalized)

	var builder strings.Builder
	builder.Grow(len(normalized))
	previousUnderscore := false

	for _, r := range normalized {
		switch {
		case r >= 'a' && r <= 'z':
			builder.WriteRune(r)
			previousUnderscore = false
		case r >= '0' && r <= '9':
			builder.WriteRune(r)
			previousUnderscore = false
		case r == '_':
			if builder.Len() == 0 || previousUnderscore {
				continue
			}
			builder.WriteRune(r)
			previousUnderscore = true
		}
	}

	result := strings.Trim(builder.String(), "_")
	if result == "" {
		return ""
	}
	if result[0] >= '0' && result[0] <= '9' {
		result = "t_" + result
	}
	if len(result) > tenantCodeMaxLength {
		result = result[:tenantCodeMaxLength]
	}
	return strings.Trim(result, "_")
}

func validateTenantCode(value string) error {
	if !tenantCodePattern.MatchString(value) {
		return ErrInvalidTenantCode
	}
	return nil
}
