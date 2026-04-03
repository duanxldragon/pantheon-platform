package auth

import (
	"context"
	"testing"
)

func TestIssueSessionTokensShareOneSessionID(t *testing.T) {
	service := &authService{
		jwtSecret: []byte("unit-test-secret"),
		expiresIn: 3600,
	}

	accessToken, refreshToken, sessionID, err := service.issueSessionTokens("user-1", "alice", "tenant-1")
	if err != nil {
		t.Fatalf("issue session tokens: %v", err)
	}
	if sessionID == "" {
		t.Fatal("expected non-empty session id")
	}

	accessClaims, err := service.parseTokenClaims(accessToken)
	if err != nil {
		t.Fatalf("parse access token: %v", err)
	}
	refreshClaims, err := service.parseTokenClaims(refreshToken)
	if err != nil {
		t.Fatalf("parse refresh token: %v", err)
	}

	if accessClaims.ID != sessionID {
		t.Fatalf("expected access jti %s, got %s", sessionID, accessClaims.ID)
	}
	if refreshClaims.ID != sessionID {
		t.Fatalf("expected refresh jti %s, got %s", sessionID, refreshClaims.ID)
	}
}

func TestRefreshTokenPreservesSessionID(t *testing.T) {
	service := &authService{
		jwtSecret: []byte("unit-test-secret"),
		expiresIn: 3600,
	}

	_, refreshToken, sessionID, err := service.issueSessionTokens("user-1", "alice", "tenant-1")
	if err != nil {
		t.Fatalf("issue session tokens: %v", err)
	}

	resp, err := service.RefreshToken(context.Background(), refreshToken)
	if err != nil {
		t.Fatalf("refresh token: %v", err)
	}

	accessClaims, err := service.parseTokenClaims(resp.AccessToken)
	if err != nil {
		t.Fatalf("parse refreshed access token: %v", err)
	}
	refreshClaims, err := service.parseTokenClaims(resp.RefreshToken)
	if err != nil {
		t.Fatalf("parse refreshed refresh token: %v", err)
	}

	if accessClaims.ID == sessionID {
		t.Fatalf("expected refreshed access jti to rotate away from %s", sessionID)
	}
	if refreshClaims.ID == sessionID {
		t.Fatalf("expected refreshed refresh jti to rotate away from %s", sessionID)
	}
	if accessClaims.ID != refreshClaims.ID {
		t.Fatalf("expected refreshed access/refresh to share one new session id, got %s and %s", accessClaims.ID, refreshClaims.ID)
	}
}
