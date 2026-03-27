# Auth Backend Implementation

> This document provides an English entry point for the backend auth module implementation.  
> It focuses on implementation entry points, request flow, runtime session control, and collaboration with middleware and authorization.

For the current detailed implementation reference in Chinese, see:

- `backend/docs/auth/AUTH_BACKEND.md`

For business-level rules, see:

- `docs/auth/AUTH_SECURITY.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/tenant/TENANT_INITIALIZATION.md`

---

## Core Backend Entry Points

- Service entry: `backend/internal/modules/auth/service.go`
- Auth service split: `backend/internal/modules/auth/auth_service.go`
- Session service: `backend/internal/modules/auth/session_service.go`
- API key service: `backend/internal/modules/auth/api_key_service.go`
- Login attempt service: `backend/internal/modules/auth/login_attempt_service.go`
- Two-factor service: `backend/internal/modules/auth/two_factor_service.go`
- HTTP handler: `backend/internal/modules/auth/handler.go`
- Route registration: `backend/internal/modules/auth/router.go`
- DAO: `backend/internal/modules/auth/dao.go`
- Request/response DTOs: `backend/internal/modules/auth/dto.go`
- Two-factor support: `backend/internal/modules/auth/two_factor_auth.go`
- Error translation: `backend/internal/modules/auth/error_translator.go`
- Password validation: `backend/internal/modules/auth/password_validator.go`
- API key middleware: `backend/internal/modules/auth/api_key_middleware.go`

## Related Shared Components

- Auth middleware: `backend/internal/shared/middleware/auth_middleware.go`
- Authorization and session invalidation linkage: `backend/internal/shared/authorization/casbin_service.go`

---

## Normalization Notes

The auth module now follows the unified backend pattern of fixed layered files plus focused supplementary files:

- primary layered files: `dao.go`, `dto.go`, `handler.go`, `model.go`, `router.go`, `service.go`
- supplementary service files: `auth_service.go`, `session_service.go`, `api_key_service.go`, `login_attempt_service.go`, `two_factor_service.go`
- support files: `two_factor_auth.go`, `password_validator.go`, `error_translator.go`, `api_key_middleware.go`

This keeps the main auth flow stable while splitting login, session, API key, login security, and 2FA logic into clearer file boundaries.

See also:

- `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`

---

## Route Groups

### Public routes

The public auth endpoints mainly cover:

- `GET /api/v1/auth/config`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/2fa/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/unlock`
- `GET /api/v1/auth/attempts`
- `POST /api/v1/auth/validate-password`

### Protected routes

The authenticated auth endpoints mainly cover:

- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/2fa/status`
- `POST /api/v1/auth/2fa/enable`
- `POST /api/v1/auth/2fa/verify`
- `POST /api/v1/auth/2fa/disable`
- `POST /api/v1/auth/2fa/backup-codes`
- `POST /api/v1/auth/2fa/verify-code`
- `GET/POST/PUT/DELETE /api/v1/api-keys`

This separation keeps identity establishment, post-login security operations, and API key management clearly scoped.

---

## Main Backend Flow

### 1. Login

`AuthService.Login()` is the main login path. It is responsible for:

- validating the user, password, and account status
- validating the tenant context
- handling default admin fallback login
- deciding whether 2FA is required
- issuing `access_token + refresh_token`
- creating the Redis-backed session state
- recording the login log

If the user has 2FA enabled, the login flow does not immediately create the final session. It first issues a temporary `temp_token` and waits for `/auth/2fa/login` to complete verification.

### 2. Completing 2FA login

`AuthService.VerifyLogin2FA()` bridges the first half of login and the final session establishment:

- restore user and tenant context from `temp_token`
- validate OTP or backup code
- issue the final token pair
- record the successful login result

The pending login state is stored in Redis under `auth:2fa:pending:{tempToken}`.

### 3. Refresh and logout

`AuthService.RefreshToken()` is responsible for:

- validating the refresh token
- checking whether the Redis refresh session is still valid
- performing refresh-token rotation
- issuing a new access/refresh pair

`AuthService.Logout()` is responsible for:

- recording the logout log
- revoking the current session
- writing the user-level revoked-after timestamp so old tokens stop working

---

## Runtime Session Validation

The key backend value is not only issuing JWTs, but also keeping them controllable at runtime.

### JWT claims

The claims in `auth_middleware.go` include at least:

- `user_id`
- `username`
- `tenant_id`
- `auth_version`
- standard JWT registered claims

### Middleware validation chain

The `Auth()` middleware processes requests in this order:

1. parse the Bearer token
2. validate JWT signature and expiry
3. check Redis key `auth:session:{userID}:{jti}`
4. check Redis key `auth:revoked_after:{userID}`
5. check Redis key `auth:version:{userID}`
6. inject `user_id`, `tenant_id`, and `jti` into Gin context

In practice:

- `auth:revoked_after:*` supports hard invalidation
- `auth:version:*` supports soft refresh / permission refresh
- any failure returns `401`

### Collaboration with the authorization service

The system module is responsible for bumping auth version or writing revoked-after timestamps after user, role, permission, or menu changes. The auth module is responsible for enforcing those checks at request entry.

---

## 2FA and API Keys

### Two-factor authentication

`two_factor_auth.go` together with the auth service handles:

- TOTP secret generation
- QR code URL generation
- backup code generation and parsing
- OTP / backup code verification
- enable, verify-enable, disable, and backup-code reset flows

### API key management

The auth service already supports:

- creating API keys
- listing current-user API keys
- updating key name and permissions
- deleting API keys

This capability is intended for automation and integrations, but still stays within the current user and permission boundary.

---

## Collaboration With Other Modules

### With `system/`

- user disable, delete, and password change trigger hard invalidation
- role, permission, and menu changes trigger auth-version refresh
- personal-center password, 2FA, and API key operations reuse auth services

### With `tenant/`

- login and refresh always carry tenant context
- tenant disable and delete revoke tenant user sessions
- unfinished tenant initialization can redirect users into the setup flow instead of the main business UI

---

## Recommended Reading Order

1. `backend/BACKEND_GUIDE.en.md`
2. `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`
3. `backend/docs/auth/AUTH_BACKEND.en.md`
4. `backend/docs/auth/AUTH_BACKEND.md` for the full current implementation detail
