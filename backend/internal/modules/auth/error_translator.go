package auth

// ErrorToTranslationKey converts auth errors to translation keys
func ErrorToTranslationKey(err error) string {
	if err == nil {
		return ""
	}

	switch err {
	case ErrInvalidCredentials:
		return "auth.error.invalid_credentials"
	case ErrInvalidToken:
		return "auth.error.invalid_token"
	case ErrUserInactive:
		return "auth.error.user_inactive"
	case ErrTenantInactive:
		return "auth.error.tenant_inactive"
	case ErrTenantDBNotConfigured:
		return "auth.error.tenant_db_not_configured"
	case ErrAccountLocked:
		return "auth.error.account_locked"
	case ErrApiKeyNotFound:
		return "auth.error.api_key_not_found"
	default:
		// Return the error message as-is for other errors
		return err.Error()
	}
}
