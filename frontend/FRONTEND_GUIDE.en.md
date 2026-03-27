# Pantheon Platform Frontend

> **View-Driven Enterprise React 19+ Management Architecture**
> React 19, Vite, Zustand, Tailwind CSS, i18next

---

## 🏗️ Architecture Design

### 1. View-Driven Navigation (Alternative Routing)
Unlike traditional `react-router` setups, this project uses a **multi-tabbed view management mechanism**:

- **ViewManager**: The central dispatcher that renders components based on the active tab in `uiStore`. Supports lazy loading (Code Splitting).
- **TabManager**: Manages the lifecycle of top-level tabs (open, switch, close).
- **ViewsConfig**: Central configuration for View IDs, component paths, permission requirements, and i18n titles.

### 2. Modular Structure
- **src/modules/**: Core business domains (e.g., `auth`, `tenant`, `system`). Each module contains its own `views/`, `components/`, `store/`, and `api/`.
- **src/shared/**: Global infrastructure (Hooks, UI Components, Constants, Utils).

---

## Design Specs

### 1. Component & File Specs
- **Naming Convention**: PascalCase for components (e.g., `TenantSwitcher.tsx`).
- **File Matching**: File names must match the primary component name.
- **Exports**: Named exports are preferred over default exports.

### 2. State Management Specs
- **Zustand** is used for global states (e.g., `authStore`, `uiStore`).
- Business data fetching is defined in module-level `api/` and called directly by views.

### 3. Permission Control
Fine-grained control using the `usePermission` Hook:
```tsx
const { hasPermission, isSuperAdmin } = usePermission();

if (hasPermission('system:user:delete')) {
  // Render delete action
}
```

### 4. Internationalization (i18n)
- Locales are stored in `src/i18n/locales/`.
- Uses key-value pairs (e.g., `common.actions.save`).
- Translated using the `useTranslation()` Hook.

---

## 🛡️ Security Design

### 1. API Interceptors
- Automatically injects `Authorization: Bearer <token>` from `authStore`.
- Tenant Context Injection: Passes `X-Tenant-ID` or `tenant_code` to ensure requests route to the correct tenant database.

### 2. Permission Guards
- `ViewManager` automatically validates `permissions` and `roles` from `ViewsConfig` before rendering.

---

## 🚀 Development & Setup

### Requirements
- Node.js 18.0+
- npm 9.0+

### Commands
```bash
# Install Dependencies
npm install

# Start Dev Server (Includes vite-wrapper for Windows compatibility)
npm run dev

# Build for Production
npm run build
```

---
*Pantheon Frontend - Modern, Tab-driven, Enterprise Ready*
