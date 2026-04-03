# Code Audit Report (2026-04-03)

## Scope

- Backend: auth, middleware, authorization
- Frontend: auth/session storage and API client

## Key Findings

### Security design gaps

1. `GET /api/v1/auth/attempts` and `POST /api/v1/auth/unlock` are publicly exposed without auth middleware.
2. CSRF middleware exists but is not mounted globally; frontend uses a local sessionStorage token that is not server-issued.
3. Access and refresh tokens are persisted in browser `localStorage` via Zustand persist, increasing XSS blast radius.

### Functional gaps

1. Dynamic module loading interfaces exist but Go/JavaScript loaders and reflection instantiation remain unimplemented placeholders.
2. Login-attempt and unlock APIs are currently open, which can conflict with intended admin governance flow.

### Performance risks

1. In-memory rate limiter is not wired into request pipeline; even if enabled, it uses per-request timestamp slices with O(n) per call and process-local state.
2. Department subtree resolution uses recursive DB queries (`N+1` pattern), which can degrade with deep/wide org trees.

## Validation approach

- Reviewed auth route registration, middleware wiring, auth store persistence, API client refresh flow, and authorization data-scope logic.
- Focused on exploitable path exposure, session/token handling, and algorithmic hot paths.
