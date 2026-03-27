package main

import (
	app "pantheon-platform/backend/internal/app"
)

// @title Pantheon Platform API
// @version 1.0
// @description Enterprise multi-tenant RBAC platform API.
// @termsOfService http://swagger.io/terms/
//
// @contact.name API Support
// @contact.url http://www.pantheon-platform.com/support
// @contact.email support@pantheon-platform.com
//
// @license.name MIT
// @license.url https://opensource.org/licenses/MIT
//
// @host localhost:8080
// @BasePath /api/v1
//
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
// @description Bearer token authentication
func main() {
	app.Start()
}
