//go:build otel

package observability

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/metric/global"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

// ObservabilityConfig contains OpenTelemetry configuration
type ObservabilityConfig struct {
	// Service configuration
	ServiceName    string
	ServiceVersion string
	Environment    string

	// Exporter configuration
	JaegerEndpoint string
	EnableConsole   bool

	// Sampling configuration
	SampleRatio float64 // 0.0 to 1.0

	// Metrics configuration
	EnableMetrics bool
	MetricReader  string // "prometheus" or "stdout"
}

// TelemetryManager manages OpenTelemetry integration
type TelemetryManager struct {
	config           *ObservabilityConfig
	tracerProvider   *sdktrace.TracerProvider
	meterProvider    metric.MeterProvider
	shutdownFuncs    []func() error
	tracer           trace.Tracer
	meter            metric.Meter
}

// NewTelemetryManager creates a new telemetry manager
func NewTelemetryManager(config *ObservabilityConfig) (*TelemetryManager, error) {
	if config == nil {
		config = DefaultObservabilityConfig()
	}

	manager := &TelemetryManager{
		config:        config,
		shutdownFuncs: make([]func() error, 0),
	}

	// Initialize trace provider
	if err := manager.initTracing(); err != nil {
		return nil, fmt.Errorf("failed to initialize tracing: %w", err)
	}

	// Initialize metrics
	if config.EnableMetrics {
		if err := manager.initMetrics(); err != nil {
			log.Printf("Warning: failed to initialize metrics: %v", err)
		}
	}

	// Set global propagator
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	log.Printf("Observability: Initialized OpenTelemetry for service %s", config.ServiceName)

	return manager, nil
}

// initTracing initializes distributed tracing
func (m *TelemetryManager) initTracing() error {
	var opts []sdktrace.TracerProviderOption

	// Configure sampling
	if m.config.SampleRatio > 0 {
		opts = append(opts, sdktrace.WithSampler(sdktrace.TraceIDRatioBased(m.config.SampleRatio)))
	} else {
		opts = append(opts, sdktrace.WithSampler(sdktrace.AlwaysSample()))
	}

	// Configure exporters
	var exporters []sdktrace.SpanExporter

	// Jaeger exporter
	if m.config.JaegerEndpoint != "" {
		jaegerExp, err := jaeger.New(jaeger.WithCollectorEndpoint(
			jaeger.WithEndpoint(m.config.JaegerEndpoint),
		))
		if err != nil {
			return fmt.Errorf("failed to create Jaeger exporter: %w", err)
		}
		exporters = append(exporters, jaegerExp)
		m.shutdownFuncs = append(m.shutdownFuncs, jaegerExp.Shutdown)
	}

	// Console exporter (for development)
	if m.config.EnableConsole {
		consoleExp := NewConsoleExporter()
		exporters = append(exporters, consoleExp)
	}

	if len(exporters) == 0 {
		log.Printf("Observability: No trace exporters configured, using console exporter")
		consoleExp := NewConsoleExporter()
		exporters = append(exporters, consoleExp)
	}

	// Create batch span processor
	opts = append(opts, sdktrace.WithBatcher(exporters...))

	// Create tracer provider
	m.tracerProvider = sdktrace.NewTracerProvider(opts...)
	otel.SetTracerProvider(m.tracerProvider)

	// Create tracer
	m.tracer = m.tracerProvider.Tracer(
		m.config.ServiceName,
		trace.WithInstrumentationVersion(m.config.ServiceVersion),
	)

	// Add shutdown function
	m.shutdownFuncs = append(m.shutdownFuncs, m.tracerProvider.Shutdown)

	return nil
}

// initMetrics initializes metrics collection
func (m *TelemetryManager) initMetrics() error {
	// Initialize meter provider
	// Note: This is a simplified implementation
	// In production, you'd use Prometheus or OTLP exporters

	m.meterProvider = metric.NewMeterProvider()
	global.SetMeterProvider(m.meterProvider)

	m.meter = m.meterProvider.Meter(
		m.config.ServiceName,
		metric.WithInstrumentationVersion(m.config.ServiceVersion),
	)

	return nil
}

// Tracer returns the OpenTelemetry tracer
func (m *TelemetryManager) Tracer() trace.Tracer {
	return m.tracer
}

// Meter returns the OpenTelemetry meter
func (m *TelemetryManager) Meter() metric.Meter {
	return m.meter
}

// Shutdown gracefully shuts down the telemetry manager
func (m *TelemetryManager) Shutdown(ctx context.Context) error {
	log.Printf("Observability: Shutting down telemetry manager")

	var lastErr error
	for _, shutdown := range m.shutdownFuncs {
		if err := shutdown(); err != nil {
			log.Printf("Observability: Shutdown error: %v", err)
			lastErr = err
		}
	}

	return lastErr
}

// StartSpan starts a new span with the given name
func (m *TelemetryManager) StartSpan(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
	return m.tracer.Start(ctx, name, opts...)
}

// RecordError records an error in the current span
func (m *TelemetryManager) RecordError(span trace.Span, err error, attrs ...attribute.KeyValue) {
	if span == nil || err == nil {
		return
	}

	allAttrs := append([]attribute.KeyValue{
		attribute.String("error.type", fmt.Sprintf("%T", err)),
		attribute.String("error.message", err.Error()),
	}, attrs...)

	span.SetAttributes(allAttrs...)
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())
}

// AddAttributes adds attributes to the current span
func (m *TelemetryManager) AddAttributes(span trace.Span, attrs ...attribute.KeyValue) {
	if span == nil {
		return
	}
	span.SetAttributes(attrs...)
}

// AddEvent adds an event to the current span
func (m *TelemetryManager) AddEvent(ctx context.Context, name string, attrs ...attribute.KeyValue) {
	span := trace.SpanFromContext(ctx)
	if span.IsRecording() {
		span.AddEvent(name, trace.WithAttributes(attrs...))
	}
}

// DefaultObservabilityConfig returns default configuration
func DefaultObservabilityConfig() *ObservabilityConfig {
	return &ObservabilityConfig{
		ServiceName:     "pantheon-platform",
		ServiceVersion:  "1.0.0",
		Environment:     "development",
		EnableConsole:   true,
		SampleRatio:     1.0, // Sample 100% in development
		EnableMetrics:   true,
		MetricReader:    "stdout",
	}
}

// ProductionObservabilityConfig returns production configuration
func ProductionObservabilityConfig() *ObservabilityConfig {
	return &ObservabilityConfig{
		ServiceName:     "pantheon-platform",
		ServiceVersion:  "1.0.0",
		Environment:     "production",
		SampleRatio:     0.1, // Sample 10% in production
		EnableMetrics:   true,
		MetricReader:    "prometheus",
	}
}

// WithServiceName sets the service name
func WithServiceName(name string) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) {
		c.ServiceName = name
	}
}

// WithServiceVersion sets the service version
func WithServiceVersion(version string) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) {
		c.ServiceVersion = version
	}
}

// WithEnvironment sets the environment
func WithEnvironment(env string) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) {
		c.Environment = env
	}
}

// WithJaegerEndpoint sets the Jaeger endpoint
func WithJaegerEndpoint(endpoint string) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) {
		c.JaegerEndpoint = endpoint
	}
}

// WithSampleRatio sets the sampling ratio
func WithSampleRatio(ratio float64) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) {
		c.SampleRatio = ratio
	}
}

// WithConsoleExport enables console export
func WithConsoleExport(enabled bool) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) {
		c.EnableConsole = enabled
	}
}

// WithMetrics enables metrics collection
func WithMetrics(enabled bool) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) {
		c.EnableMetrics = enabled
	}
}

// Helper functions for common tracing patterns

// TraceFunction wraps a function call with tracing
func TraceFunction[T any](ctx context.Context, manager *TelemetryManager, functionName string, fn func(context.Context) (T, error)) (T, error) {
	ctx, span := manager.StartSpan(ctx, functionName)
	defer span.End()

	result, err := fn(ctx)
	if err != nil {
		manager.RecordError(span, err)
	}

	return result, err
}

// TraceHTTPRequest traces an HTTP request
func TraceHTTPRequest(ctx context.Context, manager *TelemetryManager, method, path string) (context.Context, trace.Span) {
	attrs := []attribute.KeyValue{
		attribute.String("http.method", method),
		attribute.String("http.path", path),
	}

	return manager.StartSpan(ctx, fmt.Sprintf("%s %s", method, path), trace.WithAttributes(attrs...))
}

// TraceDatabaseQuery traces a database query
func TraceDatabaseQuery(ctx context.Context, manager *TelemetryManager, queryType, table string) (context.Context, trace.Span) {
	attrs := []attribute.KeyValue{
		attribute.String("db.type", queryType),
		attribute.String("db.table", table),
	}

	return manager.StartSpan(ctx, fmt.Sprintf("db.%s.%s", queryType, table), trace.WithAttributes(attrs...))
}

// TraceExternalAPICall traces an external API call
func TraceExternalAPICall(ctx context.Context, manager *TelemetryManager, service, endpoint string) (context.Context, trace.Span) {
	attrs := []attribute.KeyValue{
		attribute.String("http.service", service),
		attribute.String("http.endpoint", endpoint),
	}

	return manager.StartSpan(ctx, fmt.Sprintf("external.%s", service), trace.WithAttributes(attrs...))
}

// TraceTenantOperation traces a tenant-specific operation
func TraceTenantOperation(ctx context.Context, manager *TelemetryManager, tenantID, operation string) (context.Context, trace.Span) {
	attrs := []attribute.KeyValue{
		attribute.String("tenant.id", tenantID),
		attribute.String("tenant.operation", operation),
	}

	return manager.StartSpan(ctx, fmt.Sprintf("tenant.%s", operation), trace.WithAttributes(attrs...))
}

// GetTraceID extracts the trace ID from context
func GetTraceID(ctx context.Context) string {
	span := trace.SpanFromContext(ctx)
	if span.SpanContext().IsValid() {
		return span.SpanContext().TraceID().String()
	}
	return ""
}

// GetSpanID extracts the span ID from context
func GetSpanID(ctx context.Context) string {
	span := trace.SpanFromContext(ctx)
	if span.SpanContext().IsValid() {
		return span.SpanContext().SpanID().String()
	}
	return ""
}

// AddTenantContext adds tenant information to the current span
func AddTenantContext(ctx context.Context, tenantID, tenantCode string) {
	span := trace.SpanFromContext(ctx)
	if span.IsRecording() {
		attrs := []attribute.KeyValue{
			attribute.String("tenant.id", tenantID),
			attribute.String("tenant.code", tenantCode),
		}
		span.SetAttributes(attrs...)
	}
}

// AddUserContext adds user information to the current span
func AddUserContext(ctx context.Context, userID, username string) {
	span := trace.SpanFromContext(ctx)
	if span.IsRecording() {
		attrs := []attribute.KeyValue{
			attribute.String("user.id", userID),
			attribute.String("user.name", username),
		}
		span.SetAttributes(attrs...)
	}
}

// RecordDuration records a duration metric
func RecordDuration(ctx context.Context, manager *TelemetryManager, name string, duration time.Duration, attrs ...attribute.KeyValue) {
	if manager.meter == nil {
		return
	}

	// Record duration histogram
	// Note: This is a simplified implementation
	// In production, you'd use proper metric instruments
	log.Printf("Observability: Duration metric %s = %v", name, duration)
}

// RecordCount records a count metric
func RecordCount(ctx context.Context, manager *TelemetryManager, name string, count int64, attrs ...attribute.KeyValue) {
	if manager.meter == nil {
		return
	}

	// Record count
	// Note: This is a simplified implementation
	log.Printf("Observability: Count metric %s = %d", name, count)
}

// codes is a minimal implementation of status codes for the error recording
var codes = struct {
	Error string
}{
	Error: "ERROR",
}
