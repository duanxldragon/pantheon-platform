# OpenTelemetry Integration

Comprehensive OpenTelemetry integration for distributed tracing, metrics collection, and observability in the Pantheon Platform.

## Features

- **Distributed Tracing**: End-to-end request tracing across service boundaries
- **Metrics Collection**: Application and infrastructure metrics
- **Multi-Exporter Support**: Jaeger, console, and custom exporters
- **Context Propagation**: Automatic trace context propagation
- **Performance Profiling**: Built-in performance analysis tools
- **Tenant-Aware Tracing**: Automatic tenant context injection
- **Error Tracking**: Structured error recording and analysis

## Quick Start

### Basic Setup

```go
import "pantheon-platform/backend/internal/shared/observability"

// Create telemetry manager with default configuration
manager, err := observability.NewTelemetryManager(nil)
if err != nil {
    log.Fatalf("Failed to initialize telemetry: %v", err)
}
defer manager.Shutdown(context.Background())

// Start a span
ctx, span := manager.StartSpan(context.Background(), "my-operation")
defer span.End()

// Your code here
fmt.Println("Executing operation...")
```

### Production Setup

```go
// Production configuration
config := &observability.ObservabilityConfig{
    ServiceName:     "pantheon-platform",
    ServiceVersion:  "1.0.0",
    Environment:     "production",
    JaegerEndpoint:  "http://jaeger:14268/api/traces",
    SampleRatio:     0.1, // Sample 10% of traces
    EnableMetrics:   true,
    MetricReader:    "prometheus",
}

manager, err := observability.NewTelemetryManager(config)
if err != nil {
    log.Fatalf("Failed to initialize telemetry: %v", err)
}
defer manager.Shutdown(context.Background())
```

### Development Setup

```go
// Development configuration with console output
config := &observability.ObservabilityConfig{
    ServiceName:     "pantheon-platform-dev",
    ServiceVersion:  "1.0.0-dev",
    Environment:     "development",
    EnableConsole:   true,
    SampleRatio:     1.0, // Sample 100% in development
    EnableMetrics:   true,
}

manager, err := observability.NewTelemetryManager(config)
```

## Tracing Patterns

### Function Tracing

```go
// Simple function tracing
func (s *UserService) GetUser(ctx context.Context, userID string) (*User, error) {
    ctx, span := s.telemetry.StartSpan(ctx, "UserService.GetUser")
    defer span.End()

    // Add attributes
    s.telemetry.AddAttributes(span,
        attribute.String("user.id", userID),
    )

    // Your code
    user, err := s.userRepo.FindByID(ctx, userID)
    if err != nil {
        s.telemetry.RecordError(span, err)
        return nil, err
    }

    return user, nil
}
```

### Database Query Tracing

```go
func (r *UserRepository) FindByID(ctx context.Context, userID string) (*User, error) {
    // Start database span
    ctx, span := observability.TraceDatabaseQuery(ctx, r.telemetry, "select", "users")
    defer span.End()

    // Add query details
    r.telemetry.AddAttributes(span,
        attribute.String("db.statement", "SELECT * FROM users WHERE id = ?"),
        attribute.String("db.user_id", userID),
    )

    // Execute query
    var user User
    err := r.db.WithContext(ctx).Where("id = ?", userID).First(&user).Error
    if err != nil {
        r.telemetry.RecordError(span, err)
        return nil, err
    }

    return &user, nil
}
```

### HTTP Request Tracing

```go
func (c *APIClient) CallExternalAPI(ctx context.Context, endpoint string) (*Response, error) {
    // Start external API span
    ctx, span := observability.TraceExternalAPICall(ctx, c.telemetry, "payment-service", endpoint)
    defer span.End()

    // Make HTTP request
    req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
    if err != nil {
        c.telemetry.RecordError(span, err)
        return nil, err
    }

    // Inject trace context into request headers
    otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

    resp, err := c.httpClient.Do(req)
    if err != nil {
        c.telemetry.RecordError(span, err)
        return nil, err
    }
    defer resp.Body.Close()

    // Add response attributes
    c.telemetry.AddAttributes(span,
        attribute.Int("http.status_code", resp.StatusCode),
        attribute.String("http.status_text", resp.Status),
    )

    return c.parseResponse(resp)
}
```

### Tenant-Aware Tracing

```go
func (s *TenantService) ProcessTenantRequest(ctx context.Context, tenantID string, req Request) error {
    // Add tenant context to all spans
    observability.AddTenantContext(ctx, tenantID, "acme-corp")

    ctx, span := s.telemetry.StartSpan(ctx, "TenantService.ProcessRequest")
    defer span.End()

    // Your tenant-specific processing
    return s.processRequest(ctx, tenantID, req)
}
```

### User Context Tracing

```go
func (s *AuthService) Login(ctx context.Context, username, password string) error {
    ctx, span := s.telemetry.StartSpan(ctx, "AuthService.Login")
    defer span.End()

    // Add user context
    observability.AddUserContext(ctx, "user-123", username)

    // Add login attempt attributes
    s.telemetry.AddAttributes(span,
        attribute.String("auth.username", username),
        attribute.String("auth.login_method", "password"),
    )

    // Your authentication logic
    return s.authenticateUser(ctx, username, password)
}
```

## Advanced Usage

### Custom Metrics

```go
func (s *OrderService) CreateOrder(ctx context.Context, order Order) error {
    startTime := time.Now()

    ctx, span := s.telemetry.StartSpan(ctx, "OrderService.CreateOrder")
    defer span.End()

    err := s.createOrder(ctx, order)
    if err != nil {
        s.telemetry.RecordError(span, err)
        return err
    }

    // Record custom metrics
    duration := time.Since(startTime)
    observability.RecordDuration(ctx, s.telemetry, "order.create.duration", duration,
        attribute.String("order.type", order.Type),
        attribute.Float64("order.value", order.Value),
    )

    observability.RecordCount(ctx, s.telemetry, "order.create.count", 1,
        attribute.String("order.status", "created"),
    )

    return nil
}
```

### Error Handling with Tracing

```go
func (s *PaymentService) ProcessPayment(ctx context.Context, payment Payment) error {
    ctx, span := s.telemetry.StartSpan(ctx, "PaymentService.ProcessPayment")
    defer span.End()

    err := s.processPayment(ctx, payment)
    if err != nil {
        // Record detailed error information
        s.telemetry.RecordError(span, err,
            attribute.String("payment.id", payment.ID),
            attribute.String("payment.amount", payment.Amount.String()),
            attribute.String("payment.method", payment.Method),
            attribute.String("error.category", "payment_processing"),
        )

        // Add error event
        s.telemetry.AddEvent(ctx, "payment.failed",
            attribute.String("error.message", err.Error()),
            attribute.String("payment.retryable", "true"),
        )

        return err
    }

    // Add success event
    s.telemetry.AddEvent(ctx, "payment.completed",
        attribute.String("payment.id", payment.ID),
        attribute.String("payment.amount", payment.Amount.String()),
    )

    return nil
}
```

### Distributed Context Propagation

```go
func (s *OrderService) CreateOrderWithNotifications(ctx context.Context, order Order) error {
    ctx, span := s.telemetry.StartSpan(ctx, "OrderService.CreateOrderWithNotifications")
    defer span.End()

    // Create order
    if err := s.createOrder(ctx, order); err != nil {
        return err
    }

    // Call notification service - trace context is automatically propagated
    if err := s.notificationService.SendOrderConfirmation(ctx, order); err != nil {
        s.telemetry.RecordError(span, err)
        return err
    }

    // Call inventory service - same trace context continues
    if err := s.inventoryService.UpdateInventory(ctx, order); err != nil {
        s.telemetry.RecordError(span, err)
        return err
    }

    return nil
}
```

### Performance Profiling

```go
func (s *QueryService) ComplexQuery(ctx context.Context, params QueryParams) (*Result, error) {
    result, duration, err := observability.MeasureFunction(ctx, s.telemetry, "ComplexQuery", func(ctx context.Context) (*Result, error) {
        // Your complex query logic
        return s.executeComplexQuery(ctx, params)
    })

    // Log performance metrics
    log.Printf("Query executed in %v", duration)

    return result, err
}

// Or use the performance profiler
profiler := observability.NewPerformanceProfiler(telemetryManager)

err := profiler.ProfileOperation(ctx, "database.migration", func(ctx context.Context) error {
    return s.runMigration(ctx)
})

stats := profiler.GetOperationStats("database.migration")
log.Printf("Migration stats: %+v", stats)
```

## Integration Examples

### Complete Service Integration

```go
type UserService struct {
    telemetry *observability.TelemetryManager
    repo      *UserRepository
    cache     *CacheClient
}

func NewUserService(telemetry *observability.TelemetryManager, repo *UserRepository, cache *CacheClient) *UserService {
    return &UserService{
        telemetry: telemetry,
        repo:      repo,
        cache:     cache,
    }
}

func (s *UserService) GetUser(ctx context.Context, userID string) (*User, error) {
    ctx, span := s.telemetry.StartSpan(ctx, "UserService.GetUser")
    defer span.End()

    s.telemetry.AddAttributes(span, attribute.String("user.id", userID))

    // Try cache first
    ctx, cacheSpan := observability.TraceExternalAPICall(ctx, s.telemetry, "redis", "get")
    user, err := s.cache.Get(ctx, userID)
    cacheSpan.End()

    if err == nil && user != nil {
        s.telemetry.AddEvent(ctx, "cache.hit",
            attribute.String("cache.key", userID),
        )
        return user, nil
    }

    // Cache miss - get from database
    s.telemetry.AddEvent(ctx, "cache.miss",
        attribute.String("cache.key", userID),
    )

    user, err = s.repo.FindByID(ctx, userID)
    if err != nil {
        s.telemetry.RecordError(span, err)
        return nil, err
    }

    // Update cache
    s.cache.Set(ctx, userID, user)

    return user, nil
}
```

### HTTP Middleware Integration

```go
func TracingMiddleware(telemetry *observability.TelemetryManager) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Start span
        ctx, span := observability.TraceHTTPRequest(
            c.Request.Context(),
            telemetry,
            c.Request.Method,
            c.Request.URL.Path,
        )
        defer span.End()

        // Update request context
        c.Request = c.Request.WithContext(ctx)

        // Add HTTP attributes
        telemetry.AddAttributes(span,
            attribute.String("http.host", c.Request.Host),
            attribute.String("http.scheme", c.Request.URL.Scheme),
            attribute.String("http.user_agent", c.Request.UserAgent()),
            attribute.String("http.remote_addr", c.Request.RemoteAddr),
        )

        // Process request
        c.Next()

        // Add response attributes
        telemetry.AddAttributes(span,
            attribute.Int("http.status_code", c.Writer.Status()),
            attribute.Int("http.response_size", c.Writer.Size()),
        )

        // Record error if status code indicates error
        if c.Writer.Status() >= 400 {
            telemetry.RecordError(span, fmt.Errorf("HTTP %d", c.Writer.Status()))
        }
    }
}
```

### Database Integration

```go
func TracedDatabaseMiddleware(telemetry *observability.TelemetryManager) gorm.Plugin {
    return &tracedDatabase{telemetry: telemetry}
}

type tracedDatabase struct {
    telemetry *observability.TelemetryManager
}

func (t *tracedDatabase) Name() string {
    return "traced-database"
}

func (t *tracedDatabase) Initialize(db *gorm.DB) error {
    // Wrap callbacks with tracing
    db.Callback().Query().Before("gorm:query").Register("tracing:start", func(db *gorm.DB) {
        ctx := db.Statement.Context
        if ctx == nil {
            ctx = context.Background()
        }

        table := db.Statement.Table
        operation := "query"

        ctx, span := observability.TraceDatabaseQuery(ctx, t.telemetry, operation, table)
        db.Statement.Context = ctx

        // Store span in db instance to end in callback
        db.InstanceSet("tracing:span", span)
    })

    db.Callback().Query().After("gorm:query").Register("tracing:end", func(db *gorm.DB) {
        if span, ok := db.InstanceGet("tracing:span"); ok {
            if s, ok := span.(trace.Span); ok {
                // Add query result info
                t.telemetry.AddAttributes(s,
                    attribute.Int("db.rows_affected", db.RowsAffected),
                )
                s.End()
            }
        }
    })

    return nil
}
```

## Configuration Options

### Environment Variables

```bash
# Service configuration
OTEL_SERVICE_NAME=pantheon-platform
OTEL_SERVICE_VERSION=1.0.0
OTEL_ENVIRONMENT=production

# Exporter configuration
OTEL_EXPORTER_JAEGER_ENDPOINT=http://jaeger:14268/api/traces
OTEL_EXPORTER_CONSOLE_ENABLED=false

# Sampling configuration
OTEL_TRACE_SAMPLER=ratio
OTEL_TRACE_SAMPLER_ARG=0.1

# Metrics configuration
OTEL_METRICS_ENABLED=true
OTEL_METRICS_READER=prometheus
```

### Code Configuration

```go
config := &observability.ObservabilityConfig{
    ServiceName:     "pantheon-platform",
    ServiceVersion:  "1.0.0",
    Environment:     "production",
    JaegerEndpoint:  "http://jaeger:14268/api/traces",
    SampleRatio:     0.1,
    EnableMetrics:   true,
    MetricReader:    "prometheus",
}

manager, err := observability.NewTelemetryManager(config)
```

## Performance Considerations

### Sampling Strategies

```go
// Development: 100% sampling
devConfig := observability.DefaultObservabilityConfig()

// Production: Adaptive sampling
prodConfig := observability.ProductionObservabilityConfig()
prodConfig.SampleRatio = 0.1 // 10% sampling

// High-traffic: Low sampling
highTrafficConfig := observability.ProductionObservabilityConfig()
highTrafficConfig.SampleRatio = 0.01 // 1% sampling
```

### Exporter Selection

```go
// Jaeger for production
config.JaegerEndpoint = "http://jaeger:14268/api/traces"

// Console for development
config.EnableConsole = true

// Custom exporter for specific needs
customExporter := NewCustomExporter()
```

## Troubleshooting

### Common Issues

**1. No traces appearing**
- Check Jaeger endpoint configuration
- Verify sampling ratio is not too low
- Ensure spans are properly ended

**2. Missing trace context**
- Verify context propagation is enabled
- Check that middleware is properly configured
- Ensure context is passed through call chain

**3. Performance impact**
- Reduce sampling ratio
- Use asynchronous exporters
- Implement span batching

## Best Practices

1. **Always end spans**: Use `defer span.End()` to ensure spans are closed
2. **Add meaningful attributes**: Include operation IDs, user IDs, tenant IDs
3. **Record errors properly**: Use `RecordError` for structured error tracking
4. **Use context propagation**: Ensure trace context flows through async operations
5. **Sample appropriately**: Balance observability with performance impact
6. **Add events for significant steps**: Use events to mark important moments
7. **Keep span names consistent**: Use naming conventions for better filtering

## Integration with Other Systems

### Alerting Integration

```go
// Connect trace information to alerts
func (s *MonitoringService) CheckSystemHealth(ctx context.Context) {
    traceID := observability.GetTraceID(ctx)

    if err := s.healthCheck(ctx); err != nil {
        s.alertManager.TriggerAlert(&alerting.Alert{
            Title:       "System Health Check Failed",
            Severity:    alerting.SeverityError,
            Description: err.Error(),
            Annotations: map[string]interface{}{
                "trace_id": traceID,
            },
        })
    }
}
```

### Logging Integration

```go
// Add trace IDs to logs
func (s *Service) logWithContext(ctx context.Context, message string) {
    traceID := observability.GetTraceID(ctx)
    spanID := observability.GetSpanID(ctx)

    log.Printf("[%s:%s] %s", traceID, spanID, message)
}
```

## Future Enhancements

- Prometheus metrics exporter
- OTLP protocol support
- Custom span processors
- Real-time performance dashboards
- Automated performance anomaly detection
- Integration with APM tools (New Relic, Datadog)