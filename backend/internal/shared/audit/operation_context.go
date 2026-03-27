package audit

import (
	"context"
	"sync"
)

type operationContextKey struct{}

// OperationFields describes operation-log fields that business services can enrich.
type OperationFields struct {
	Module       string
	Resource     string
	ResourceID   string
	ResourceName string
	Summary      string
	Detail       string
}

// OperationContext is a mutable collector shared across the request lifecycle.
type OperationContext struct {
	mu     sync.RWMutex
	fields OperationFields
}

func WithOperationContext(ctx context.Context) (context.Context, *OperationContext) {
	if collector := FromContext(ctx); collector != nil {
		return ctx, collector
	}

	collector := &OperationContext{}
	return context.WithValue(ctx, operationContextKey{}, collector), collector
}

func FromContext(ctx context.Context) *OperationContext {
	if ctx == nil {
		return nil
	}
	collector, _ := ctx.Value(operationContextKey{}).(*OperationContext)
	return collector
}

func (c *OperationContext) Set(fields OperationFields) {
	if c == nil {
		return
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	if fields.Module != "" {
		c.fields.Module = fields.Module
	}
	if fields.Resource != "" {
		c.fields.Resource = fields.Resource
	}
	if fields.ResourceID != "" {
		c.fields.ResourceID = fields.ResourceID
	}
	if fields.ResourceName != "" {
		c.fields.ResourceName = fields.ResourceName
	}
	if fields.Summary != "" {
		c.fields.Summary = fields.Summary
	}
	if fields.Detail != "" {
		c.fields.Detail = fields.Detail
	}
}

func (c *OperationContext) Fields() OperationFields {
	if c == nil {
		return OperationFields{}
	}

	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.fields
}
