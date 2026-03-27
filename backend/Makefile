#!/usr/bin/env bash

# Makefile for backend development and testing

BACKEND_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
GO_CACHE_DIR := $(BACKEND_DIR)/.gocache

.PHONY: help build test lint format clean migrate naming verify

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the application
	@echo "Building application..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go build -v -o pantheon-server ./cmd/server

naming: ## Run backend naming checks
	@echo "Running backend naming checks..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go run ./cmd/tools/check-backend-naming

test: ## Run all tests
	@echo "Running tests..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go test -v -race -coverprofile=coverage.out ./...

test-coverage: ## Run tests with coverage report
	@echo "Running tests with coverage..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go test -v -coverprofile=coverage.out -covermode=atomic ./...
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: backend/coverage.html"

lint: ## Run linter
	@echo "Running linter..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) golangci-lint run --timeout 5m

verify: naming test ## Run naming checks and tests
	@echo "Backend verification completed."

format: ## Format code
	@echo "Formatting code..."
	@cd $(BACKEND_DIR) && gofmt -w .
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go vet ./...

migrate: ## Run database migrations
	@echo "Running migrations..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go run ./cmd/server

migrate-only: ## Run migrations only and exit
	@echo "Running migrations only..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go run ./cmd/server --migrate-only

run: ## Run the application
	@echo "Running application..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go run ./cmd/server

clean: ## Clean build artifacts
	@echo "Cleaning..."
	@cd $(BACKEND_DIR) && rm -f pantheon-server coverage.out coverage.html

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go mod download

deps-update: ## Update dependencies
	@echo "Updating dependencies..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) go mod tidy

swagger: ## Generate Swagger documentation
	@echo "Generating Swagger documentation..."
	@cd $(BACKEND_DIR) && GOCACHE=$(GO_CACHE_DIR) swag init -g cmd/server/main.go -o api/swagger

install-tools: ## Install development tools
	@echo "Installing development tools..."
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/swaggo/swag/cmd/swag@latest
