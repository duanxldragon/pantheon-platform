//go:build otel

package observability

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"go.opentelemetry.io/otel/attribute"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

// ConsoleExporter exports spans to console for development/testing
type ConsoleExporter struct {
	mu       sync.Mutex
	enableJSON bool
	logger    *log.Logger
}

// NewConsoleExporter creates a new console exporter
func NewConsoleExporter() *ConsoleExporter {
	return &ConsoleExporter{
		enableJSON: false,
		logger:     log.Default(),
	}
}

// NewJSONConsoleExporter creates a new JSON console exporter
func NewJSONConsoleExporter() *ConsoleExporter {
	return &ConsoleExporter{
		enableJSON: true,
		logger:     log.Default(),
	}
}

// ExportSpans exports spans to console
func (e *ConsoleExporter) ExportSpans(ctx context.Context, spans []sdktrace.ReadOnlySpan) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	for _, span := range spans {
		if e.enableJSON {
			e.exportSpanJSON(span)
		} else {
			e.exportSpanText(span)
		}
	}

	return nil

// Shutdown shuts down the exporter
func (e *ConsoleExporter) Shutdown(ctx context.Context) error {
	e.logger.Println("ConsoleExporter: Shutting down")
	return nil
}

// exportSpanText exports a span in text format
func (e *ConsoleExporter) exportSpanText(span sdktrace.ReadOnlySpan) {
	e.logger.Printf("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	e.logger.Printf("Span: %s", span.Name())
	e.logger.Printf("TraceID: %s", span.SpanContext().TraceID())
	e.logger.Printf("SpanID: %s", span.SpanContext().SpanID())
	e.logger.Printf("ParentID: %s", span.Parent().SpanID())
	e.logger.Printf("Status: %s (%s)", span.Status().Code, span.Status().Description)
	e.logger.Printf("Start: %s", span.StartTime().Format(time.RFC3339Nano))
	e.logger.Printf("Duration: %v", span.EndTime().Sub(span.StartTime()))

	if len(span.Attributes()) > 0 {
		e.logger.Printf("Attributes:")
		for _, attr := range span.Attributes() {
			e.logger.Printf("  %s: %v", attr.Key, attr.Value)
		}
	}

	if len(span.Events()) > 0 {
		e.logger.Printf("Events:")
		for _, event := range span.Events() {
			e.logger.Printf("  %s at %s", event.Name, event.Time.Format(time.RFC3339Nano))
			for _, attr := range event.Attributes {
				e.logger.Printf("    %s: %v", attr.Key, attr.Value)
			}
		}
	}

	if len(span.Links()) > 0 {
		e.logger.Printf("Links:")
		for _, link := range span.Links() {
			e.logger.Printf("  TraceID: %s, SpanID: %s", link.TraceID, link.SpanID)
		}
	}
}

// exportSpanJSON exports a span in JSON format
func (e *ConsoleExporter) exportSpanJSON(span sdktrace.ReadOnlySpan) {
	data := map[string]interface{}{
		"name":       span.Name(),
		"trace_id":   span.SpanContext().TraceID().String(),
		"span_id":    span.SpanContext().SpanID().String(),
		"parent_id":  span.Parent().SpanID().String(),
		"status":     span.Status().Code.String(),
		"start_time": span.StartTime().Format(time.RFC3339Nano),
		"end_time":   span.EndTime().Format(time.RFC3339Nano),
		"duration":   span.EndTime().Sub(span.StartTime()).String(),
	}

	if len(span.Attributes()) > 0 {
		attrs := make(map[string]interface{})
		for _, attr := range span.Attributes() {
			attrs[string(attr.Key)] = attr.Value.AsInterface()
		}
		data["attributes"] = attrs
	}

	if len(span.Events()) > 0 {
		events := make([]map[string]interface{}, 0)
		for _, event := range span.Events() {
			eventData := map[string]interface{}{
				"name":      event.Name,
				"timestamp": event.Time.Format(time.RFC3339Nano),
			}
			if len(event.Attributes) > 0 {
				attrs := make(map[string]interface{})
				for _, attr := range event.Attributes {
					attrs[string(attr.Key)] = attr.Value.AsInterface()
				}
				eventData["attributes"] = attrs
			}
			events = append(events, eventData)
		}
		data["events"] = events
	}

	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		e.logger.Printf("Error marshaling span: %v", err)
		return
	}

	e.logger.Println(string(jsonData))
}

// TracingMiddleware provides middleware for HTTP tracing
type TracingMiddleware struct {
	manager *TelemetryManager
}

// NewTracingMiddleware creates a new tracing middleware
func NewTracingMiddleware(manager *TelemetryManager) *TracingMiddleware {
	return &TracingMiddleware{
		manager: manager,
	}
}

// Middleware returns a middleware function for HTTP tracing
func (m *TracingMiddleware) Middleware(serviceName string) func(ctx context.Context, req interface{}) (context.Context, error) {
	return func(ctx context.Context, req interface{}) (context.Context, error) {
		// Extract request info if available
		var method, path string

		// Try to extract from request (this would be implementation-specific)
		if reqMap, ok := req.(map[string]interface{}); ok {
			if v, exists := reqMap["method"]; exists {
				method = fmt.Sprintf("%v", v)
			}
			if v, exists := reqMap["path"]; exists {
				path = fmt.Sprintf("%v", v)
			}
		}

		// Start span
		spanName := fmt.Sprintf("%s.%s", serviceName, method)
		if method == "" {
			spanName = fmt.Sprintf("%s.request", serviceName)
		}

		ctx, span := m.manager.StartSpan(ctx, spanName)

		// Add common attributes
		attrs := []attribute.KeyValue{
			attribute.String("service.name", serviceName),
		}

		if method != "" {
			attrs = append(attrs, attribute.String("http.method", method))
		}
		if path != "" {
			attrs = append(attrs, attribute.String("http.path", path))
		}

		m.manager.AddAttributes(span, attrs...)

		return ctx, nil
	}
}

// TraceRecorder records trace information for debugging
type TraceRecorder struct {
	mu       sync.RWMutex
	spans    map[string]*RecordedSpan
	maxSpans int
}

// RecordedSpan contains recorded span information
type RecordedSpan struct {
	TraceID       string
	SpanID        string
	ParentID      string
	Name          string
	StartTime     time.Time
	EndTime       time.Time
	Duration      time.Duration
	Attributes    map[string]interface{}
	Events        []RecordedEvent
	Status        string
}

// RecordedEvent contains recorded event information
type RecordedEvent struct {
	Name       string
	Timestamp  time.Time
	Attributes map[string]interface{}
}

// NewTraceRecorder creates a new trace recorder
func NewTraceRecorder(maxSpans int) *TraceRecorder {
	return &TraceRecorder{
		spans:    make(map[string]*RecordedSpan),
		maxSpans: maxSpans,
	}
}

// RecordSpan records a span
func (r *TraceRecorder) RecordSpan(span sdktrace.ReadOnlySpan) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Implement LRU eviction if max spans reached
	if len(r.spans) >= r.maxSpans {
		// Remove oldest span (simple FIFO)
		for key := range r.spans {
			delete(r.spans, key)
			break
		}
	}

	recorded := &RecordedSpan{
		TraceID:    span.SpanContext().TraceID().String(),
		SpanID:     span.SpanContext().SpanID().String(),
		ParentID:   span.Parent().SpanID().String(),
		Name:       span.Name(),
		StartTime:  span.StartTime(),
		EndTime:    span.EndTime(),
		Duration:   span.EndTime().Sub(span.StartTime()),
		Attributes: make(map[string]interface{}),
		Events:     make([]RecordedEvent, 0),
		Status:     span.Status().Code.String(),
	}

	// Convert attributes
	for _, attr := range span.Attributes() {
		recorded.Attributes[string(attr.Key)] = attr.Value.AsInterface()
	}

	// Convert events
	for _, event := range span.Events() {
		recordedEvent := RecordedEvent{
			Name:       event.Name,
			Timestamp:  event.Time,
			Attributes: make(map[string]interface{}),
		}
		for _, attr := range event.Attributes {
			recordedEvent.Attributes[string(attr.Key)] = attr.Value.AsInterface()
		}
		recorded.Events = append(recorded.Events, recordedEvent)
	}

	r.spans[recorded.SpanID] = recorded
}

// GetSpan gets a recorded span by ID
func (r *TraceRecorder) GetSpan(spanID string) (*RecordedSpan, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	span, exists := r.spans[spanID]
	return span, exists
}

// GetTrace gets all spans in a trace
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

// GetAllSpans returns all recorded spans
func (r *TraceRecorder) GetAllSpans() []*RecordedSpan {
	r.mu.RLock()
	defer r.mu.RUnlock()

	spans := make([]*RecordedSpan, 0, len(r.spans))
	for _, span := range r.spans {
		spans = append(spans, span)
	}

	return spans
}

// Clear clears all recorded spans
func (r *TraceRecorder) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.spans = make(map[string]*RecordedSpan)
}

// GetStats returns statistics about recorded spans
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

// PerformanceProfiler profiles performance for operations
type PerformanceProfiler struct {
	manager   *TelemetryManager
	recorders map[string]*TraceRecorder
	mu        sync.RWMutex
}

// NewPerformanceProfiler creates a new performance profiler
func NewPerformanceProfiler(manager *TelemetryManager) *PerformanceProfiler {
	return &PerformanceProfiler{
		manager:   manager,
		recorders: make(map[string]*TraceRecorder),
	}
}

// ProfileOperation profiles an operation
func (p *PerformanceProfiler) ProfileOperation(ctx context.Context, operationName string, fn func(context.Context) error) error {
	startTime := time.Now()

	// Start span
	ctx, span := p.manager.StartSpan(ctx, fmt.Sprintf("profile.%s", operationName))
	defer span.End()

	// Execute operation
	err := fn(ctx)

	// Record profiling metrics
	duration := time.Since(startTime)
	p.manager.AddAttributes(span, []attribute.KeyValue{
		attribute.String("profile.operation", operationName),
		attribute.Int64("profile.duration_ms", duration.Milliseconds()),
		attribute.Bool("profile.success", err == nil),
	}...)

	return err
}

// GetOperationStats returns statistics for a specific operation
func (p *PerformanceProfiler) GetOperationStats(operationName string) map[string]interface{} {
	p.mu.RLock()
	defer p.mu.RUnlock()

	recorder, exists := p.recorders[operationName]
	if !exists {
		return map[string]interface{}{
			"operation": operationName,
			"count":     0,
		}
	}

	spans := recorder.GetAllSpans()
	if len(spans) == 0 {
		return map[string]interface{}{
			"operation": operationName,
			"count":     0,
		}
	}

	totalDuration := time.Duration(0)
	successCount := 0

	for _, span := range spans {
		totalDuration += span.Duration
		if span.Status == "OK" {
			successCount++
		}
	}

	avgDuration := totalDuration / time.Duration(len(spans))
	successRate := float64(successCount) / float64(len(spans)) * 100

	return map[string]interface{}{
		"operation":     operationName,
		"count":         len(spans),
		"total_duration": totalDuration.String(),
		"avg_duration":  avgDuration.String(),
		"success_rate":  successRate,
		"success_count": successCount,
		"error_count":   len(spans) - successCount,
	}
}

// Helper functions for common observability patterns

// MeasureFunction measures and traces a function execution
func MeasureFunction[T any](ctx context.Context, manager *TelemetryManager, functionName string, fn func(context.Context) (T, error)) (T, time.Duration, error) {
	startTime := time.Now()

	ctx, span := manager.StartSpan(ctx, functionName)
	defer span.End()

	result, err := fn(ctx)
	duration := time.Since(startTime)

	if err != nil {
		manager.RecordError(span, err)
	}

	manager.AddAttributes(span, []attribute.KeyValue{
		attribute.String("function.name", functionName),
		attribute.Int64("function.duration_ms", duration.Milliseconds()),
		attribute.Bool("function.success", err == nil),
	}...)

	return result, duration, err
}

// MeasureGoroutine measures goroutine execution time
func MeasureGoroutine(ctx context.Context, manager *TelemetryManager, operationName string, fn func() error) error {
	_, _, err := MeasureFunction(ctx, manager, operationName, func(ctx context.Context) (struct{}, error) {
		return struct{}{}, fn()
	})
	return err
}
