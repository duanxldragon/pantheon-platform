-- ========================================
-- Pantheon Platform - Auth Module i18n Translations
-- ========================================
-- Module: auth
-- Languages: zh (Chinese), en (English), ja (Japanese), ko (Korean)
-- ========================================

-- ========================================
-- 1. Authentication Errors
-- ========================================

-- invalid credentials
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.invalid_credentials', 'zh', '用户名或密码错误'),
('auth', 'error.invalid_credentials', 'en', 'Invalid username or password'),
('auth', 'error.invalid_credentials', 'ja', 'ユーザー名またはパスワードが間違っています'),
('auth', 'error.invalid_credentials', 'ko', '사용자명 또는 비밀번호가 잘못되었습니다');

-- invalid token
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.invalid_token', 'zh', '无效的令牌'),
('auth', 'error.invalid_token', 'en', 'Invalid token'),
('auth', 'error.invalid_token', 'ja', '無効なトークン'),
('auth', 'error.invalid_token', 'ko', '유효하지 않은 토큰');

-- user is inactive or locked
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.user_inactive', 'zh', '用户已被禁用或锁定'),
('auth', 'error.user_inactive', 'en', 'User is inactive or locked'),
('auth', 'error.user_inactive', 'ja', 'ユーザーは無効化またはロックされています'),
('auth', 'error.user_inactive', 'ko', '사용자가 비활성화 또는 잠금되었습니다');

-- tenant is inactive
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.tenant_inactive', 'zh', '租户已被禁用'),
('auth', 'error.tenant_inactive', 'en', 'Tenant is inactive'),
('auth', 'error.tenant_inactive', 'ja', 'テナントは無効化されています'),
('auth', 'error.tenant_inactive', 'ko', '테넌트가 비활성화되었습니다');

-- tenant database not configured
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.tenant_db_not_configured', 'zh', '租户数据库未配置'),
('auth', 'error.tenant_db_not_configured', 'en', 'Tenant database not configured'),
('auth', 'error.tenant_db_not_configured', 'ja', 'テナントデータベースが設定されていません'),
('auth', 'error.tenant_db_not_configured', 'ko', '테넌트 데이터베이스가 구성되지 않았습니다');

-- account locked due to too many failed login attempts
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.account_locked', 'zh', '账户因多次登录失败已被锁定，请30分钟后再试或联系管理员'),
('auth', 'error.account_locked', 'en', 'Account locked due to too many failed login attempts. Please try again in 30 minutes or contact administrator'),
('auth', 'error.account_locked', 'ja', 'ログイン失敗回数が多すぎるためアカウントがロックされました。30分後に再試行するか、管理者にお問い合わせください'),
('auth', 'error.account_locked', 'ko', '로그인 실패 횟수가 너무 많아 계정이 잠겼습니다. 30분 후에 다시 시도하거나 관리자에게 문의하세요');

-- api key not found
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.api_key_not_found', 'zh', 'API 密钥不存在'),
('auth', 'error.api_key_not_found', 'en', 'API key not found'),
('auth', 'error.api_key_not_found', 'ja', 'APIキーが見つかりません'),
('auth', 'error.api_key_not_found', 'ko', 'API 키를 찾을 수 없습니다');

-- api key repository not initialized
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.api_key_repo_not_initialized', 'zh', 'API 密钥仓库未初始化'),
('auth', 'error.api_key_repo_not_initialized', 'en', 'API key repository not initialized'),
('auth', 'error.api_key_repo_not_initialized', 'ja', 'APIキーリポジトリが初期化されていません'),
('auth', 'error.api_key_repo_not_initialized', 'ko', 'API 키 리포지토리가 초기화되지 않았습니다');

-- ========================================
-- 2. Password Validation
-- ========================================

-- password cannot be empty
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_empty', 'zh', '密码不能为空'),
('auth', 'error.password_empty', 'en', 'Password cannot be empty'),
('auth', 'error.password_empty', 'ja', 'パスワードは空にできません'),
('auth', 'error.password_empty', 'ko', '비밀번호는 비어있을 수 없습니다');

-- password too short
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_too_short', 'zh', '密码长度不能少于{min_length}位'),
('auth', 'error.password_too_short', 'en', 'Password must be at least {min_length} characters'),
('auth', 'error.password_too_short', 'ja', 'パスワードは{min_length}文字以上である必要があります'),
('auth', 'error.password_too_short', 'ko', '비밀번호는 {min_length}자 이상이어야 합니다');

-- password too long
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_too_long', 'zh', '密码长度不能超过{max_length}位'),
('auth', 'error.password_too_long', 'en', 'Password must not exceed {max_length} characters'),
('auth', 'error.password_too_long', 'ja', 'パスワードは{max_length}文字以下である必要があります'),
('auth', 'error.password_too_long', 'ko', '비밀번호는 {max_length}자 이하여야 합니다');

-- password must contain uppercase
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_require_uppercase', 'zh', '密码必须包含大写字母'),
('auth', 'error.password_require_uppercase', 'en', 'Password must contain uppercase letters'),
('auth', 'error.password_require_uppercase', 'ja', 'パスワードには大文字を含める必要があります'),
('auth', 'error.password_require_uppercase', 'ko', '비밀번호에는 대문자가 포함되어야 합니다');

-- password must contain lowercase
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_require_lowercase', 'zh', '密码必须包含小写字母'),
('auth', 'error.password_require_lowercase', 'en', 'Password must contain lowercase letters'),
('auth', 'error.password_require_lowercase', 'ja', 'パスワードには小文字を含める必要があります'),
('auth', 'error.password_require_lowercase', 'ko', '비밀번호에는 소문자가 포함되어야 합니다');

-- password must contain digit
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_require_digit', 'zh', '密码必须包含数字'),
('auth', 'error.password_require_digit', 'en', 'Password must contain digits'),
('auth', 'error.password_require_digit', 'ja', 'パスワードには数字を含める必要があります'),
('auth', 'error.password_require_digit', 'ko', '비밀번호에는 숫자가 포함되어야 합니다');

-- password must contain special character
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_require_special', 'zh', '密码必须包含特殊字符'),
('auth', 'error.password_require_special', 'en', 'Password must contain special characters'),
('auth', 'error.password_require_special', 'ja', 'パスワードには特殊文字を含める必要があります'),
('auth', 'error.password_require_special', 'ko', '비밀번호에는 특수문자가 포함되어야 합니다');

-- password too common
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_too_common', 'zh', '密码过于简单，请使用更复杂的密码'),
('auth', 'error.password_too_common', 'en', 'Password is too common, please use a more complex password'),
('auth', 'error.password_too_common', 'ja', 'パスワードが一般的すぎます。より複雑なパスワードを使用してください'),
('auth', 'error.password_too_common', 'ko', '비밀번호가 너무 일반적입니다. 더 복잡한 비밀번호를 사용하세요');

-- password contains username
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_contains_username', 'zh', '密码不能包含用户名'),
('auth', 'error.password_contains_username', 'en', 'Password cannot contain username'),
('auth', 'error.password_contains_username', 'ja', 'パスワードにユーザー名を含めることはできません'),
('auth', 'error.password_contains_username', 'ko', '비밀번호에는 사용자명을 포함할 수 없습니다');

-- password contains email prefix
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.password_contains_email', 'zh', '密码不能包含邮箱前缀'),
('auth', 'error.password_contains_email', 'en', 'Password cannot contain email prefix'),
('auth', 'error.password_contains_email', 'ja', 'パスワードにメールアドレスのプレフィックスを含めることはできません'),
('auth', 'error.password_contains_email', 'ko', '비밀번호에는 이메일 접두사를 포함할 수 없습니다');

-- ========================================
-- 3. Password Strength
-- ========================================

-- strength levels
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'password.strength.weak', 'zh', '弱'),
('auth', 'password.strength.weak', 'en', 'Weak'),
('auth', 'password.strength.weak', 'ja', '弱い'),
('auth', 'password.strength.weak', 'ko', '약함'),
('auth', 'password.strength.medium', 'zh', '中等'),
('auth', 'password.strength.medium', 'en', 'Medium'),
('auth', 'password.strength.medium', 'ja', '中程度'),
('auth', 'password.strength.medium', 'ko', '보통'),
('auth', 'password.strength.strong', 'zh', '强'),
('auth', 'password.strength.strong', 'en', 'Strong'),
('auth', 'password.strength.strong', 'ja', '強い'),
('auth', 'password.strength.strong', 'ko', '강함'),
('auth', 'password.strength.very_strong', 'zh', '非常强'),
('auth', 'password.strength.very_strong', 'en', 'Very Strong'),
('auth', 'password.strength.very_strong', 'ja', '非常に強い'),
('auth', 'password.strength.very_strong', 'ko', '매우 강함');

-- ========================================
-- 4. Login Attempt Messages
-- ========================================

-- account unlocked successfully
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'message.account_unlocked', 'zh', '账户解锁成功'),
('auth', 'message.account_unlocked', 'en', 'Account unlocked successfully'),
('auth', 'message.account_unlocked', 'ja', 'アカウントのロックが解除されました'),
('auth', 'message.account_unlocked', 'ko', '계정 잠금이 해제되었습니다');

-- login attempt statistics
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'message.failed_attempts', 'zh', '失败尝试次数'),
('auth', 'message.failed_attempts', 'en', 'Failed attempts'),
('auth', 'message.failed_attempts', 'ja', '失敗した試行回数'),
('auth', 'message.failed_attempts', 'ko', '실패한 시도 횟수'),
('auth', 'message.last_attempt_at', 'zh', '最后一次尝试时间'),
('auth', 'message.last_attempt_at', 'en', 'Last attempt at'),
('auth', 'message.last_attempt_at', 'ja', '最後の試行日時'),
('auth', 'message.last_attempt_at', 'ko', '마지막 시도 시간'),
('auth', 'message.is_locked', 'zh', '是否锁定'),
('auth', 'message.is_locked', 'en', 'Is locked'),
('auth', 'message.is_locked', 'ja', 'ロックされているか'),
('auth', 'message.is_locked', 'ko', '잠금 여부');

-- ========================================
-- 5. Two-Factor Authentication Messages
-- ========================================

-- 2FA not enabled
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.2fa_not_enabled', 'zh', '双因子认证未启用'),
('auth', 'error.2fa_not_enabled', 'en', 'Two-factor authentication is not enabled'),
('auth', 'error.2fa_not_enabled', 'ja', '二要素認証が有効化されていません'),
('auth', 'error.2fa_not_enabled', 'ko', '2단계 인증이 활성화되지 않았습니다');

-- Invalid 2FA code
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.invalid_2fa_code', 'zh', '无效的双因子认证验证码'),
('auth', 'error.invalid_2fa_code', 'en', 'Invalid two-factor authentication code'),
('auth', 'error.invalid_2fa_code', 'ja', '無効な二要素認証コードです'),
('auth', 'error.invalid_2fa_code', 'ko', '유효하지 않은 2단계 인증 코드입니다');

-- 2FA already enabled
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.2fa_already_enabled', 'zh', '双因子认证已启用'),
('auth', 'error.2fa_already_enabled', 'en', 'Two-factor authentication is already enabled'),
('auth', 'error.2fa_already_enabled', 'ja', '二要素認証は既に有効化されています'),
('auth', 'error.2fa_already_enabled', 'ko', '2단계 인증이 이미 활성화되어 있습니다');

-- 2FA enabled successfully
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'message.2fa_enabled', 'zh', '双因子认证已启用'),
('auth', 'message.2fa_enabled', 'en', 'Two-factor authentication enabled successfully'),
('auth', 'message.2fa_enabled', 'ja', '二要素認証が有効化されました'),
('auth', 'message.2fa_enabled', 'ko', '2단계 인증이 활성화되었습니다');

-- 2FA disabled successfully
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'message.2fa_disabled', 'zh', '双因子认证已禁用'),
('auth', 'message.2fa_disabled', 'en', 'Two-factor authentication disabled successfully'),
('auth', 'message.2fa_disabled', 'ja', '二要素認証が無効化されました'),
('auth', 'message.2fa_disabled', 'ko', '2단계 인증이 비활성화되었습니다');

-- 2FA code valid
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'message.2fa_code_valid', 'zh', '验证码有效'),
('auth', 'message.2fa_code_valid', 'en', 'Verification code is valid'),
('auth', 'message.2fa_code_valid', 'ja', '検証コードは有効です'),
('auth', 'message.2fa_code_valid', 'ko', '확인 코드가 유효합니다');

-- Backup code used
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'message.2fa_backup_code_used', 'zh', '备份验证码已使用'),
('auth', 'message.2fa_backup_code_used', 'en', 'Backup code has been used'),
('auth', 'message.2fa_backup_code_used', 'ja', 'バックアップコードが使用されました'),
('auth', 'message.2fa_backup_code_used', 'ko', '백업 코드가 사용되었습니다');

-- ========================================
-- 6. CSRF Messages
-- ========================================

-- CSRF token validation failed
INSERT INTO i18n_translations (module, key, language, value) VALUES
('auth', 'error.invalid_csrf_token', 'zh', 'CSRF Token 无效，请刷新页面重试'),
('auth', 'error.invalid_csrf_token', 'en', 'Invalid CSRF token, please refresh the page and try again'),
('auth', 'error.invalid_csrf_token', 'ja', '無効なCSRFトークンです。ページを更新して再試行してください'),
('auth', 'error.invalid_csrf_token', 'ko', '유효하지 않은 CSRF 토큰입니다. 페이지를 새로고침 후 다시 시도하세요');

-- ========================================
-- Initialization Complete
-- ========================================
