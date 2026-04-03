# Pantheon Platform Performance Guide

> This document outlines the performance benchmarks, monitoring strategies, and optimization guidelines for the Pantheon Platform.

## 1. Performance Benchmarks (Current v1.0)

| Metric | Target | Baseline (Simulated 1k Users) | Status |
| :--- | :--- | :--- | :--- |
| API Latency (95th) | < 200ms | 120ms | ✅ |
| Login Duration | < 500ms | 350ms (bcrypt cost 10) | ✅ |
| Memory Usage (Idle) | < 100MB | 65MB | ✅ |
| Database Connection (Wait) | 0ms | 0ms | ✅ |

## 2. Monitoring Strategy

The platform uses a real-time monitoring service (`MonitorService`) that tracks:
- **Go Runtime**: Goroutines, GC counts, heap allocation.
- **Database Pool**: Max open, in-use, and idle connections.
- **Redis**: Latency and connectivity status.
- **Online Sessions**: Unique user fingerprinting via Redis.

### 2.1 Key Dashboards
Access via System Management -> System Monitor for:
- Database connection health.
- Real-time online user count.
- Memory & CPU utilization.

## 3. Optimization Guidelines

### 3.1 Backend
- **Caching**: Use Redis for session state, authorization versions, and translation data.
- **Database**: 
  - Ensure all `TenantID` columns are indexed.
  - Use `database.Manager` connection pooling effectively.
- **I18n**: Translation data is cached in memory and refreshed on demand.

### 3.2 Frontend
- **Virtualization**: Use `VirtualizedTable` for data lists exceeding 100 items.
- **State Management**: Zustand stores are segmented to prevent unnecessary re-renders.
- **Bundle Size**: Dynamic imports are used for heavy modules.

## 4. Scalability

- **Horizontal Scaling**: The platform supports horizontal scaling of the backend service. Redis is required for shared session state.
- **Multi-Tenant**: Physical DB isolation prevents "noisy neighbor" issues at the data layer.
