#!/usr/bin/env bash

# Makefile for backend development and testing

.PHONY: help build test lint format clean migrate

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the application
	@echo "Building application..."
	@cd backend && go build -v -o pantheon-server ./cmd/server

test: ## Run all tests
	@echo "Running tests..."
	@cd backend && go test -v -race -coverprofile=coverage.out ./...

test-coverage: ## Run tests with coverage report
	@echo "Running tests with coverage..."
	@cd backend && go test -v -coverprofile=coverage.out -covermode=atomic ./...
	@cd backend && go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: backend/coverage.html"

lint: ## Run linter
	@echo "Running linter..."
	@cd backend && golangci-lint run --timeout 5m

format: ## Format code
	@echo "Formatting code..."
	@cd backend && gofmt -w .
	@cd backend && go vet ./...

migrate: ## Run database migrations
	@echo "Running migrations..."
	@cd backend && go run ./cmd/server

migrate-only: ## Run migrations only and exit
	@echo "Running migrations only..."
	@cd backend && go run ./cmd/server --migrate-only

run: ## Run the application
	@echo "Running application..."
	@cd backend && go run ./cmd/server

clean: ## Clean build artifacts
	@echo "Cleaning..."
	@cd backend && rm -f pantheon-server coverage.out coverage.html

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	@cd backend && go mod download

deps-update: ## Update dependencies
	@echo "Updating dependencies..."
	@cd backend && go mod tidy

swagger: ## Generate Swagger documentation
	@echo "Generating Swagger documentation..."
	@cd backend && swag init -g cmd/server/main.go -o api/swagger

install-tools: ## Install development tools
	@echo "Installing development tools..."
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/swaggo/swag/cmd/swag@latest

