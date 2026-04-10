package observability

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"sync"
	"time"
)

type contextKey string

const spanContextKey contextKey = "observability_span"

type KeyValue struct {
	Key   string
	Value any
}

func String(key, value string) KeyValue { return KeyValue{Key: key, Value: value} }
func Int64(key string, value int64) KeyValue {
	return KeyValue{Key: key, Value: value}
}
func Bool(key string, value bool) KeyValue { return KeyValue{Key: key, Value: value} }

type SpanStartOption interface{}
type EventOption interface{}

type SpanIdentifier string

func (s SpanIdentifier) String() string { return string(s) }

type SpanContext struct {
	traceID SpanIdentifier
	spanID  SpanIdentifier
}

func (s SpanContext) IsValid() bool          { return s.traceID != "" && s.spanID != "" }
func (s SpanContext) TraceID() SpanIdentifier { return s.traceID }
func (s SpanContext) SpanID() SpanIdentifier  { return s.spanID }

type Event struct {
	Name       string
	Time       time.Time
	Attributes []KeyValue
}

type Span struct {
	name       string
	context    SpanContext
	parent     SpanContext
	start      time.Time
	end        time.Time
	statusCode string
	statusDesc string
	attrs      []KeyValue
	events     []Event
	recording  bool
}

func (s *Span) End() {
	if s == nil || !s.recording {
		return
	}
	s.end = time.Now()
	s.recording = false
}

func (s *Span) IsRecording() bool {
	return s != nil && s.recording
}

func (s *Span) SetAttributes(attrs ...KeyValue) {
	if s == nil {
		return
	}
	s.attrs = append(s.attrs, attrs...)
}

func (s *Span) RecordError(err error) {
	if s == nil || err == nil {
		return
	}
	s.events = append(s.events, Event{
		Name: "error",
		Time: time.Now(),
		Attributes: []KeyValue{
			String("error.message", err.Error()),
		},
	})
}

func (s *Span) SetStatus(code, description string) {
	if s == nil {
		return
	}
	s.statusCode = code
	s.statusDesc = description
}

func (s *Span) AddEvent(name string, _ ...EventOption) {
	if s == nil {
		return
	}
	s.events = append(s.events, Event{Name: name, Time: time.Now()})
}

func (s *Span) SpanContext() SpanContext {
	if s == nil {
		return SpanContext{}
	}
	return s.context
}

func SpanFromContext(ctx context.Context) *Span {
	span, _ := ctx.Value(spanContextKey).(*Span)
	return span
}

type ObservabilityConfig struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	JaegerEndpoint string
	EnableConsole  bool
	SampleRatio    float64
	EnableMetrics  bool
	MetricReader   string
}

type TelemetryManager struct {
	config *ObservabilityConfig
}

func NewTelemetryManager(config *ObservabilityConfig) (*TelemetryManager, error) {
	if config == nil {
		config = DefaultObservabilityConfig()
	}
	log.Printf("Observability: stub initialized for service %s", config.ServiceName)
	return &TelemetryManager{config: config}, nil
}

func (m *TelemetryManager) Tracer() any { return nil }
func (m *TelemetryManager) Meter() any  { return nil }
func (m *TelemetryManager) Shutdown(ctx context.Context) error {
	_ = ctx
	return nil
}

func (m *TelemetryManager) StartSpan(ctx context.Context, name string, _ ...SpanStartOption) (context.Context, *Span) {
	parent := SpanContext{}
	if current := SpanFromContext(ctx); current != nil {
		parent = current.SpanContext()
	}
	span := &Span{
		name: name,
		context: SpanContext{
			traceID: chooseTraceID(parent),
			spanID:  SpanIdentifier(randomID()),
		},
		parent:    parent,
		start:     time.Now(),
		recording: true,
	}
	return context.WithValue(ctx, spanContextKey, span), span
}

func (m *TelemetryManager) RecordError(span *Span, err error, attrs ...KeyValue) {
	if span == nil || err == nil {
		return
	}
	allAttrs := append([]KeyValue{
		String("error.type", fmt.Sprintf("%T", err)),
		String("error.message", err.Error()),
	}, attrs...)
	span.SetAttributes(allAttrs...)
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())
}

func (m *TelemetryManager) AddAttributes(span *Span, attrs ...KeyValue) {
	if span != nil {
		span.SetAttributes(attrs...)
	}
}

func (m *TelemetryManager) AddEvent(ctx context.Context, name string, attrs ...KeyValue) {
	span := SpanFromContext(ctx)
	if span == nil || !span.IsRecording() {
		return
	}
	span.events = append(span.events, Event{Name: name, Time: time.Now(), Attributes: attrs})
}

func DefaultObservabilityConfig() *ObservabilityConfig {
	return &ObservabilityConfig{
		ServiceName:    "pantheon-platform",
		ServiceVersion: "1.0.0",
		Environment:    "development",
		EnableConsole:  true,
		SampleRatio:    1.0,
		EnableMetrics:  true,
		MetricReader:   "stdout",
	}
}

func ProductionObservabilityConfig() *ObservabilityConfig {
	return &ObservabilityConfig{
		ServiceName:    "pantheon-platform",
		ServiceVersion: "1.0.0",
		Environment:    "production",
		SampleRatio:    0.1,
		EnableMetrics:  true,
		MetricReader:   "prometheus",
	}
}

func WithServiceName(name string) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) { c.ServiceName = name }
}
func WithServiceVersion(version string) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) { c.ServiceVersion = version }
}
func WithEnvironment(env string) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) { c.Environment = env }
}
func WithJaegerEndpoint(endpoint string) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) { c.JaegerEndpoint = endpoint }
}
func WithSampleRatio(ratio float64) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) { c.SampleRatio = ratio }
}
func WithConsoleExport(enabled bool) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) { c.EnableConsole = enabled }
}
func WithMetrics(enabled bool) func(*ObservabilityConfig) {
	return func(c *ObservabilityConfig) { c.EnableMetrics = enabled }
}

func TraceFunction[T any](ctx context.Context, manager *TelemetryManager, functionName string, fn func(context.Context) (T, error)) (T, error) {
	ctx, span := manager.StartSpan(ctx, functionName)
	defer span.End()
	result, err := fn(ctx)
	if err != nil {
		manager.RecordError(span, err)
	}
	return result, err
}

func TraceHTTPRequest(ctx context.Context, manager *TelemetryManager, method, path string) (context.Context, *Span) {
	return manager.StartSpan(ctx, fmt.Sprintf("%s %s", method, path))
}

func TraceDatabaseQuery(ctx context.Context, manager *TelemetryManager, queryType, table string) (context.Context, *Span) {
	return manager.StartSpan(ctx, fmt.Sprintf("db.%s.%s", queryType, table))
}

func TraceExternalAPICall(ctx context.Context, manager *TelemetryManager, service, endpoint string) (context.Context, *Span) {
	return manager.StartSpan(ctx, fmt.Sprintf("external.%s.%s", service, endpoint))
}

func TraceTenantOperation(ctx context.Context, manager *TelemetryManager, tenantID, operation string) (context.Context, *Span) {
	_ = tenantID
	return manager.StartSpan(ctx, fmt.Sprintf("tenant.%s", operation))
}

func GetTraceID(ctx context.Context) string {
	span := SpanFromContext(ctx)
	if span == nil || !span.SpanContext().IsValid() {
		return ""
	}
	return span.SpanContext().TraceID().String()
}

func GetSpanID(ctx context.Context) string {
	span := SpanFromContext(ctx)
	if span == nil || !span.SpanContext().IsValid() {
		return ""
	}
	return span.SpanContext().SpanID().String()
}

func AddTenantContext(ctx context.Context, tenantID, tenantCode string) {
	span := SpanFromContext(ctx)
	if span != nil && span.IsRecording() {
		span.SetAttributes(String("tenant.id", tenantID), String("tenant.code", tenantCode))
	}
}

func AddUserContext(ctx context.Context, userID, username string) {
	span := SpanFromContext(ctx)
	if span != nil && span.IsRecording() {
		span.SetAttributes(String("user.id", userID), String("user.name", username))
	}
}

func RecordDuration(ctx context.Context, manager *TelemetryManager, name string, duration time.Duration, attrs ...KeyValue) {
	_ = ctx
	_ = manager
	_ = attrs
	log.Printf("Observability: Duration metric %s = %v", name, duration)
}

func RecordCount(ctx context.Context, manager *TelemetryManager, name string, count int64, attrs ...KeyValue) {
	_ = ctx
	_ = manager
	_ = attrs
	log.Printf("Observability: Count metric %s = %d", name, count)
}

var codes = struct {
	Error string
}{
	Error: "ERROR",
}

type ConsoleExporter struct {
	mu         sync.Mutex
	enableJSON bool
	logger     *log.Logger
}

func NewConsoleExporter() *ConsoleExporter {
	return &ConsoleExporter{logger: log.Default()}
}

func NewJSONConsoleExporter() *ConsoleExporter {
	return &ConsoleExporter{enableJSON: true, logger: log.Default()}
}

func (e *ConsoleExporter) ExportSpans(ctx context.Context, spans []*Span) error {
	_ = ctx
	e.mu.Lock()
	defer e.mu.Unlock()
	for _, span := range spans {
		if span == nil {
			continue
		}
		e.logger.Printf("Span: %s TraceID=%s SpanID=%s", span.name, span.context.traceID, span.context.spanID)
	}
	return nil
}

func (e *ConsoleExporter) Shutdown(ctx context.Context) error {
	_ = ctx
	return nil
}

type TracingMiddleware struct {
	manager *TelemetryManager
}

func NewTracingMiddleware(manager *TelemetryManager) *TracingMiddleware {
	return &TracingMiddleware{manager: manager}
}

func (m *TracingMiddleware) Middleware(serviceName string) func(ctx context.Context, req interface{}) (context.Context, error) {
	return func(ctx context.Context, req interface{}) (context.Context, error) {
		_ = req
		ctx, span := m.manager.StartSpan(ctx, fmt.Sprintf("%s.request", serviceName))
		span.SetAttributes(String("service.name", serviceName))
		return ctx, nil
	}
}

type TraceRecorder struct {
	mu       sync.RWMutex
	spans    map[string]*RecordedSpan
	maxSpans int
}

type RecordedSpan struct {
	TraceID    string
	SpanID     string
	ParentID   string
	Name       string
	StartTime  time.Time
	EndTime    time.Time
	Duration   time.Duration
	Attributes map[string]interface{}
	Events     []RecordedEvent
	Status     string
}

type RecordedEvent struct {
	Name       string
	Timestamp  time.Time
	Attributes map[string]interface{}
}

func NewTraceRecorder(maxSpans int) *TraceRecorder {
	return &TraceRecorder{spans: make(map[string]*RecordedSpan), maxSpans: maxSpans}
}

func (r *TraceRecorder) RecordSpan(span *Span) {
	if span == nil {
		return
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if len(r.spans) >= r.maxSpans && r.maxSpans > 0 {
		for key := range r.spans {
			delete(r.spans, key)
			break
		}
	}
	recorded := &RecordedSpan{
		TraceID:    span.context.traceID.String(),
		SpanID:     span.context.spanID.String(),
		ParentID:   span.parent.spanID.String(),
		Name:       span.name,
		StartTime:  span.start,
		EndTime:    span.end,
		Duration:   span.end.Sub(span.start),
		Attributes: make(map[string]interface{}),
		Events:     make([]RecordedEvent, 0, len(span.events)),
		Status:     span.statusCode,
	}
	for _, attr := range span.attrs {
		recorded.Attributes[attr.Key] = attr.Value
	}
	for _, event := range span.events {
		eventAttrs := make(map[string]interface{})
		for _, attr := range event.Attributes {
			eventAttrs[attr.Key] = attr.Value
		}
		recorded.Events = append(recorded.Events, RecordedEvent{
			Name:       event.Name,
			Timestamp:  event.Time,
			Attributes: eventAttrs,
		})
	}
	r.spans[recorded.SpanID] = recorded
}

func (r *TraceRecorder) GetSpan(spanID string) (*RecordedSpan, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	span, exists := r.spans[spanID]
	return span, exists
}

func (r *TraceRecorder) GetTrace(traceID string) []*RecordedSpan {
	r.mu.RLock()
	defer r.mu.RUnlock()
	traceSpans := make([]*RecordedSpan, 0)
	for _, span := range r.spans {
		if span.TraceID == traceID {
			traceSpans = append(traceSpans, span)
		}
	}
	return traceSpans
}

func (r *TraceRecorder) GetAllSpans() []*RecordedSpan {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]*RecordedSpan, 0, len(r.spans))
	for _, span := range r.spans {
		out = append(out, span)
	}
	return out
}

func (r *TraceRecorder) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.spans = make(map[string]*RecordedSpan)
}

func (r *TraceRecorder) GetStats() map[string]interface{} {
	r.mu.RLock()
	defer r.mu.RUnlock()
	totalDuration := time.Duration(0)
	for _, span := range r.spans {
		totalDuration += span.Duration
	}
	avgDuration := time.Duration(0)
	if len(r.spans) > 0 {
		avgDuration = totalDuration / time.Duration(len(r.spans))
	}
	return map[string]interface{}{
		"total_spans":    len(r.spans),
		"total_duration": totalDuration.String(),
		"avg_duration":   avgDuration.String(),
		"max_capacity":   r.maxSpans,
	}
}

type PerformanceProfiler struct {
	manager   *TelemetryManager
	recorders map[string]*TraceRecorder
	mu        sync.RWMutex
}

func NewPerformanceProfiler(manager *TelemetryManager) *PerformanceProfiler {
	return &PerformanceProfiler{manager: manager, recorders: make(map[string]*TraceRecorder)}
}

func (p *PerformanceProfiler) ProfileOperation(ctx context.Context, operationName string, fn func(context.Context) error) error {
	startTime := time.Now()
	ctx, span := p.manager.StartSpan(ctx, fmt.Sprintf("profile.%s", operationName))
	defer span.End()
	err := fn(ctx)
	duration := time.Since(startTime)
	p.manager.AddAttributes(span,
		String("profile.operation", operationName),
		Int64("profile.duration_ms", duration.Milliseconds()),
		Bool("profile.success", err == nil),
	)
	if err != nil {
		p.manager.RecordError(span, err)
	}
	p.mu.Lock()
	recorder := p.ensureRecorderLocked(operationName)
	p.mu.Unlock()
	recorder.RecordSpan(span)
	return err
}

func (p *PerformanceProfiler) GetOperationStats(operationName string) map[string]interface{} {
	p.mu.RLock()
	recorder, exists := p.recorders[operationName]
	p.mu.RUnlock()
	if !exists {
		return map[string]interface{}{"operation": operationName, "count": 0}
	}
	spans := recorder.GetAllSpans()
	if len(spans) == 0 {
		return map[string]interface{}{"operation": operationName, "count": 0}
	}
	totalDuration := time.Duration(0)
	successCount := 0
	for _, span := range spans {
		totalDuration += span.Duration
		if span.Status != codes.Error {
			successCount++
		}
	}
	avgDuration := totalDuration / time.Duration(len(spans))
	successRate := float64(successCount) / float64(len(spans)) * 100
	return map[string]interface{}{
		"operation":      operationName,
		"count":          len(spans),
		"total_duration": totalDuration.String(),
		"avg_duration":   avgDuration.String(),
		"success_rate":   successRate,
		"success_count":  successCount,
		"error_count":    len(spans) - successCount,
	}
}

func MeasureFunction[T any](ctx context.Context, manager *TelemetryManager, functionName string, fn func(context.Context) (T, error)) (T, time.Duration, error) {
	startTime := time.Now()
	ctx, span := manager.StartSpan(ctx, functionName)
	defer span.End()
	result, err := fn(ctx)
	duration := time.Since(startTime)
	if err != nil {
		manager.RecordError(span, err)
	}
	manager.AddAttributes(span,
		String("function.name", functionName),
		Int64("function.duration_ms", duration.Milliseconds()),
		Bool("function.success", err == nil),
	)
	return result, duration, err
}

func MeasureGoroutine(ctx context.Context, manager *TelemetryManager, operationName string, fn func() error) error {
	_, _, err := MeasureFunction(ctx, manager, operationName, func(ctx context.Context) (struct{}, error) {
		_ = ctx
		return struct{}{}, fn()
	})
	return err
}

func (p *PerformanceProfiler) ensureRecorderLocked(operationName string) *TraceRecorder {
	recorder, exists := p.recorders[operationName]
	if !exists {
		recorder = NewTraceRecorder(1000)
		p.recorders[operationName] = recorder
	}
	return recorder
}

func chooseTraceID(parent SpanContext) SpanIdentifier {
	if parent.IsValid() {
		return parent.TraceID()
	}
	return SpanIdentifier(randomID())
}

func randomID() string {
	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buf)
}
