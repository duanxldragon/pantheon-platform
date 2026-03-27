# Backend Docs Index

> `backend/docs/` contains manually maintained backend implementation documents.  
> It answers how the backend is organized, how request and startup flows work, and how modules collaborate.

## Entry Documents

- [Project Entry](../../README.md)
- [Backend Directory Entry](../README.en.md)
- [Platform Docs Index](../../docs/DOCS_INDEX.md)
- [Backend Guide](../BACKEND_GUIDE.en.md)
- [Backend Naming Conventions](BACKEND_NAMING_CONVENTIONS.en.md)
- [Backend Normalization Execution Plan](BACKEND_NORMALIZATION_PLAN.en.md)
- [Chinese Backend Docs Index](BACKEND_DOCS_INDEX.md)

Notes:

- `backend/BACKEND_GUIDE.en.md` now includes a backend normalization summary
- `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md` is the single baseline for backend naming and file organization rules
- `backend/docs/BACKEND_NORMALIZATION_PLAN.en.md` is the batch execution checklist for future normalization passes

## Topic Documents

- [System Backend Implementation](system/SYSTEM_BACKEND.en.md)
- [Auth Backend Implementation](auth/AUTH_BACKEND.en.md)
- [Tenant Backend Implementation](tenant/TENANT_BACKEND.en.md)
- [Chinese System Backend Implementation](system/SYSTEM_BACKEND.md)
- [Chinese Auth Backend Implementation](auth/AUTH_BACKEND.md)
- [Chinese Tenant Backend Implementation](tenant/TENANT_BACKEND.md)

## Tooling and Generated Output

- [Developer Tools](../cmd/tools/README.md)
- `backend/api/swagger/`

## Recommended Reading Order

1. Start with `README.md`
2. Continue with `backend/README.en.md`
3. Continue with `docs/DOCS_INDEX.md`
4. Read `backend/BACKEND_GUIDE.en.md` for backend architecture and startup flow
5. Read `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md` for naming and file organization rules
6. Read `backend/docs/BACKEND_NORMALIZATION_PLAN.en.md` for the batch execution workflow
7. Continue with the English topic docs under `system/`, `auth/`, and `tenant/`
8. Use the Chinese topic docs when you need the full current implementation detail
9. Read `backend/cmd/tools/README.md` when working with backend tools
10. Check `backend/api/swagger/` for generated API output

## Documentation Boundaries

- `backend/BACKEND_GUIDE.en.md`: English backend engineering overview
- `backend/docs/BACKEND_NAMING_CONVENTIONS.en.md`: English backend naming rules
- `backend/docs/BACKEND_NORMALIZATION_PLAN.en.md`: English batch normalization checklist
- `backend/BACKEND_GUIDE.md`: Chinese backend engineering overview
- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`: Chinese backend naming rules
- `backend/docs/BACKEND_NORMALIZATION_PLAN.md`: Chinese batch normalization checklist
- `backend/docs/`: backend topic implementation details
- `backend/cmd/tools/README.md`: developer tool usage
- `backend/api/swagger/`: generated Swagger output
