package docs

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// @title Pantheon Platform API
// @version 1.0
// @description Enterprise multi-tenant authorization platform API documentation.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.pantheon-platform.com/support
// @contact.email support@pantheon-platform.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
// @description Bearer token authentication

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name X-API-Key
// @description API key authentication

// APIInfo describes the generated Swagger document root.
type APIInfo struct {
	Title               string                 `json:"title"`
	Description         string                 `json:"description"`
	Version             string                 `json:"version"`
	TermsOfService      string                 `json:"termsOfService,omitempty"`
	Contact             *Contact               `json:"contact,omitempty"`
	License             *License               `json:"license,omitempty"`
	Host                string                 `json:"host,omitempty"`
	BasePath            string                 `json:"basePath,omitempty"`
	Schemes             []string               `json:"schemes,omitempty"`
	Consumes            []string               `json:"consumes,omitempty"`
	Produces            []string               `json:"produces,omitempty"`
	Paths               map[string]interface{} `json:"paths"`
	Definitions         map[string]interface{} `json:"definitions"`
	SecurityDefinitions map[string]interface{} `json:"securityDefinitions,omitempty"`
}

// Contact describes API support contact details.
type Contact struct {
	Name  string `json:"name"`
	URL   string `json:"url"`
	Email string `json:"email"`
}

// License describes the API license metadata.
type License struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

// DocGenerator builds a lightweight Swagger document from Gin routes.
type DocGenerator struct {
	info         APIInfo
	routes       []gin.RouteInfo
	securityDefs map[string]interface{}
	definitions  map[string]interface{}
}

// NewDocGenerator creates a documentation generator.
func NewDocGenerator() *DocGenerator {
	return &DocGenerator{
		info: APIInfo{
			Title:          "Pantheon Platform API",
			Description:    "Enterprise multi-tenant authorization platform API documentation.",
			Version:        "1.0",
			TermsOfService: "http://swagger.io/terms/",
			Contact: &Contact{
				Name:  "API Support",
				URL:   "http://www.pantheon-platform.com/support",
				Email: "support@pantheon-platform.com",
			},
			License: &License{
				Name: "MIT",
				URL:  "https://opensource.org/licenses/MIT",
			},
			Host:        "localhost:8080",
			BasePath:    "/api/v1",
			Schemes:     []string{"http", "https"},
			Consumes:    []string{"application/json"},
			Produces:    []string{"application/json"},
			Paths:       make(map[string]interface{}),
			Definitions: make(map[string]interface{}),
		},
		securityDefs: map[string]interface{}{
			"BearerAuth": map[string]interface{}{
				"type":        "apiKey",
				"name":        "Authorization",
				"in":          "header",
				"description": "Bearer token authentication",
			},
			"ApiKeyAuth": map[string]interface{}{
				"type":        "apiKey",
				"name":        "X-API-Key",
				"in":          "header",
				"description": "API key authentication",
			},
		},
		definitions: make(map[string]interface{}),
	}
}

// AddRoutes stores Gin routes for later document generation.
func (dg *DocGenerator) AddRoutes(routes []gin.RouteInfo) {
	dg.routes = routes
}

// AddDefinition registers a schema definition.
func (dg *DocGenerator) AddDefinition(name string, definition interface{}) {
	dg.definitions[name] = definition
}

// Generate builds the Swagger document.
func (dg *DocGenerator) Generate() APIInfo {
	dg.info.Paths = dg.generatePaths()
	dg.info.Definitions = dg.definitions
	dg.info.SecurityDefinitions = dg.securityDefs
	return dg.info
}

// generatePaths builds the Swagger path map from Gin routes.
func (dg *DocGenerator) generatePaths() map[string]interface{} {
	paths := make(map[string]interface{})

	for _, route := range dg.routes {
		if strings.HasPrefix(route.Path, "/swagger") {
			continue
		}

		path, exists := paths[route.Path]
		if !exists {
			path = make(map[string]interface{})
		}

		pathMap := path.(map[string]interface{})
		methodInfo := dg.generateMethodInfo(route)
		pathMap[strings.ToLower(route.Method)] = methodInfo
		paths[route.Path] = path
	}

	return paths
}

// generateMethodInfo builds a minimal operation definition for one route.
func (dg *DocGenerator) generateMethodInfo(route gin.RouteInfo) map[string]interface{} {
	info := map[string]interface{}{
		"summary":     dg.getMethodSummary(route.Path, route.Method),
		"description": dg.getMethodDescription(route.Path, route.Method),
		"responses":   dg.generateDefaultResponses(),
		"tags":        dg.getMethodTags(route.Path),
	}

	if route.Method == "GET" || route.Method == "DELETE" {
		info["parameters"] = dg.generateQueryParams()
	} else {
		info["parameters"] = dg.generateBodyParams()
	}

	return info
}

// getMethodSummary returns a human-friendly operation summary.
func (dg *DocGenerator) getMethodSummary(path, method string) string {
	if strings.Contains(path, "users") {
		switch method {
		case "GET":
			return "List users"
		case "POST":
			return "Create user"
		case "PUT":
			return "Update user"
		case "DELETE":
			return "Delete user"
		}
	}
	return method + " " + path
}

// getMethodDescription returns the method description.
func (dg *DocGenerator) getMethodDescription(path, method string) string {
	return dg.getMethodSummary(path, method)
}

// getMethodTags returns a coarse tag group for one route.
func (dg *DocGenerator) getMethodTags(path string) []string {
	if strings.Contains(path, "users") {
		return []string{"User Management"}
	}
	if strings.Contains(path, "roles") {
		return []string{"Role Management"}
	}
	if strings.Contains(path, "permissions") {
		return []string{"Permission Management"}
	}
	if strings.Contains(path, "auth") {
		return []string{"Authentication"}
	}
	return []string{"System"}
}

// generateDefaultResponses returns a shared response template set.
func (dg *DocGenerator) generateDefaultResponses() map[string]interface{} {
	return map[string]interface{}{
		"200": map[string]interface{}{
			"description": "Success",
			"schema": map[string]interface{}{
				"$ref": "#/definitions/Response",
			},
		},
		"400": map[string]interface{}{
			"description": "Invalid request parameters",
			"schema": map[string]interface{}{
				"$ref": "#/definitions/ErrorDetail",
			},
		},
		"401": map[string]interface{}{
			"description": "Unauthorized",
			"schema": map[string]interface{}{
				"$ref": "#/definitions/ErrorDetail",
			},
		},
		"403": map[string]interface{}{
			"description": "Forbidden",
			"schema": map[string]interface{}{
				"$ref": "#/definitions/ErrorDetail",
			},
		},
		"404": map[string]interface{}{
			"description": "Resource not found",
			"schema": map[string]interface{}{
				"$ref": "#/definitions/ErrorDetail",
			},
		},
		"500": map[string]interface{}{
			"description": "Internal server error",
			"schema": map[string]interface{}{
				"$ref": "#/definitions/ErrorDetail",
			},
		},
	}
}

// generateQueryParams returns a common query parameter template.
func (dg *DocGenerator) generateQueryParams() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"name":        "page",
			"in":          "query",
			"type":        "integer",
			"default":     1,
			"description": "Page number",
		},
		{
			"name":        "page_size",
			"in":          "query",
			"type":        "integer",
			"default":     20,
			"description": "Page size",
		},
		{
			"name":        "search",
			"in":          "query",
			"type":        "string",
			"description": "Search keyword",
		},
	}
}

// generateBodyParams returns a common request-body parameter template.
func (dg *DocGenerator) generateBodyParams() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"name":        "body",
			"in":          "body",
			"required":    true,
			"description": "Request body",
			"schema": map[string]interface{}{
				"type": "object",
			},
		},
	}
}

// SetupSwagger registers Swagger JSON and static UI routes.
func SetupSwagger(router *gin.Engine, docGen *DocGenerator) {
	routes := router.Routes()
	docGen.AddRoutes(routes)

	docGen.addCommonDefinitions()

	swaggerDoc := docGen.Generate()

	router.GET("/swagger/doc.json", func(c *gin.Context) {
		c.JSON(http.StatusOK, swaggerDoc)
	})

	router.Static("/swagger", "./swagger-ui")
	router.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})
}

// addCommonDefinitions registers shared response schemas.
func (dg *DocGenerator) addCommonDefinitions() {
	dg.AddDefinition("Response", map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"code": map[string]interface{}{
				"type":        "integer",
				"description": "Response code",
			},
			"message": map[string]interface{}{
				"type":        "string",
				"description": "Response message",
			},
			"data": map[string]interface{}{
				"description": "Response payload",
			},
		},
	})

	dg.AddDefinition("ErrorDetail", map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"code": map[string]interface{}{
				"type":        "string",
				"description": "Error code",
			},
			"message": map[string]interface{}{
				"type":        "string",
				"description": "Error message",
			},
			"details": map[string]interface{}{
				"type":        "string",
				"description": "Error details",
			},
		},
	})

	dg.AddDefinition("PageResponse", map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"items": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "object",
				},
			},
			"total": map[string]interface{}{
				"type":        "integer",
				"description": "Total count",
			},
			"page": map[string]interface{}{
				"type":        "integer",
				"description": "Current page",
			},
			"page_size": map[string]interface{}{
				"type":        "integer",
				"description": "Page size",
			},
			"total_pages": map[string]interface{}{
				"type":        "integer",
				"description": "Total pages",
			},
		},
	})
}
