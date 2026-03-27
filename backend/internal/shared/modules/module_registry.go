package modules

import (
	"context"
	"reflect"

	"gorm.io/gorm"
)

// ModuleStatus represents runtime status of a module.
type ModuleStatus string

const (
	ModuleStatusDisabled ModuleStatus = "disabled"
	ModuleStatusEnabled  ModuleStatus = "enabled"
	ModuleStatusError    ModuleStatus = "error"
)

// ModuleType classifies modules.
type ModuleType string

const (
	ModuleTypeSystem    ModuleType = "system"
	ModuleTypeBusiness  ModuleType = "business"
	ModuleTypePlugin    ModuleType = "plugin"
	ModuleTypeExtension ModuleType = "extension"
)

// Module defines the module lifecycle and metadata contract.
type Module interface {
	GetInfo() *ModuleInfo
	Init(ctx context.Context, dependencies []Module) error
	Start(ctx context.Context) error
	Stop(ctx context.Context) error
	GetRoutes() []Route
	GetPermissions() []Permission
	GetDependencies() []string
	CheckHealth(ctx context.Context) error
}

// ModuleInfo describes a module.
type ModuleInfo struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Version     string       `json:"version"`
	Description string       `json:"description"`
	Author      string       `json:"author"`
	Status      ModuleStatus `json:"status"`
	Type        ModuleType   `json:"type"`
	Config      interface{}  `json:"config"`
	Icon        string       `json:"icon"`
	Homepage    string       `json:"homepage"`
	Repository  string       `json:"repository"`
	Tags        []string     `json:"tags"`
}

// Route declares an HTTP endpoint provided by a module.
type Route struct {
	Method     string            `json:"method"`
	Path       string            `json:"path"`
	Handler    interface{}       `json:"handler"`
	Middleware []interface{}     `json:"middleware"`
	Permission string            `json:"permission"`
	Meta       map[string]string `json:"meta"`
}

// Permission declares an RBAC permission provided by a module.
type Permission struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Module      string `json:"module"`
}

// BaseModule provides default implementations for Module methods.
type BaseModule struct {
	info         ModuleInfo
	db           *gorm.DB
	dependencies []Module
}

func NewBaseModule(info ModuleInfo) *BaseModule {
	return &BaseModule{info: info}
}

func (m *BaseModule) GetInfo() *ModuleInfo { return &m.info }
func (m *BaseModule) GetDependencies() []string {
	return []string{}
}
func (m *BaseModule) SetDatabase(db *gorm.DB) { m.db = db }
func (m *BaseModule) GetDatabase() *gorm.DB   { return m.db }
func (m *BaseModule) SetStatus(status ModuleStatus) {
	m.info.Status = status
}
func (m *BaseModule) GetStatus() ModuleStatus { return m.info.Status }
func (m *BaseModule) CheckHealth(ctx context.Context) error {
	return nil
}
func (m *BaseModule) GetRoutes() []Route {
	return []Route{}
}
func (m *BaseModule) GetPermissions() []Permission {
	return []Permission{}
}
func (m *BaseModule) Init(ctx context.Context, dependencies []Module) error {
	m.dependencies = dependencies
	return nil
}
func (m *BaseModule) Start(ctx context.Context) error {
	m.info.Status = ModuleStatusEnabled
	return nil
}
func (m *BaseModule) Stop(ctx context.Context) error {
	m.info.Status = ModuleStatusDisabled
	return nil
}

// ModuleRegistry stores loaded modules and their routes.
type ModuleRegistry struct {
	modules map[string]Module
	routes  map[string][]Route
}

func NewModuleRegistry() *ModuleRegistry {
	return &ModuleRegistry{
		modules: make(map[string]Module),
		routes:  make(map[string][]Route),
	}
}

func (r *ModuleRegistry) Register(module Module) error {
	info := module.GetInfo()
	if _, exists := r.modules[info.ID]; exists {
		return ErrModuleAlreadyRegistered
	}
	r.modules[info.ID] = module
	r.routes[info.ID] = module.GetRoutes()
	return nil
}

func (r *ModuleRegistry) Unregister(moduleID string) error {
	if _, exists := r.modules[moduleID]; !exists {
		return ErrModuleNotFound
	}
	delete(r.modules, moduleID)
	delete(r.routes, moduleID)
	return nil
}

func (r *ModuleRegistry) GetModule(moduleID string) (Module, error) {
	m, exists := r.modules[moduleID]
	if !exists {
		return nil, ErrModuleNotFound
	}
	return m, nil
}

func (r *ModuleRegistry) GetAllModules() []Module {
	modules := make([]Module, 0, len(r.modules))
	for _, m := range r.modules {
		modules = append(modules, m)
	}
	return modules
}

func (r *ModuleRegistry) GetModulesByType(moduleType ModuleType) []Module {
	modules := make([]Module, 0)
	for _, m := range r.modules {
		if m.GetInfo().Type == moduleType {
			modules = append(modules, m)
		}
	}
	return modules
}

func (r *ModuleRegistry) GetModulesByStatus(status ModuleStatus) []Module {
	modules := make([]Module, 0)
	for _, m := range r.modules {
		if m.GetInfo().Status == status {
			modules = append(modules, m)
		}
	}
	return modules
}

func (r *ModuleRegistry) GetRoutes() map[string][]Route {
	return r.routes
}

func (r *ModuleRegistry) GetPermissions() []Permission {
	perms := make([]Permission, 0)
	for _, m := range r.modules {
		perms = append(perms, m.GetPermissions()...)
	}
	return perms
}

// ModuleManager is a thin facade around the registry and lifecycle operations.
type ModuleManager struct {
	registry *ModuleRegistry
	db       *gorm.DB
}

func NewModuleManager(db *gorm.DB) *ModuleManager {
	return &ModuleManager{
		registry: NewModuleRegistry(),
		db:       db,
	}
}

func (m *ModuleManager) LoadModule(module Module) error {
	deps := module.GetDependencies()
	for _, depID := range deps {
		if _, err := m.registry.GetModule(depID); err != nil {
			return ErrDependencyNotSatisfied
		}
	}

	if err := module.Init(context.Background(), []Module{}); err != nil {
		return err
	}
	if err := m.registry.Register(module); err != nil {
		return err
	}
	return module.Start(context.Background())
}

func (m *ModuleManager) UnloadModule(moduleID string) error {
	mod, err := m.registry.GetModule(moduleID)
	if err != nil {
		return err
	}
	if err := mod.Stop(context.Background()); err != nil {
		return err
	}
	return m.registry.Unregister(moduleID)
}

func (m *ModuleManager) EnableModule(moduleID string) error {
	mod, err := m.registry.GetModule(moduleID)
	if err != nil {
		return err
	}
	return mod.Start(context.Background())
}

func (m *ModuleManager) DisableModule(moduleID string) error {
	mod, err := m.registry.GetModule(moduleID)
	if err != nil {
		return err
	}
	return mod.Stop(context.Background())
}

func (m *ModuleManager) GetRegistry() *ModuleRegistry { return m.registry }

func (m *ModuleManager) CheckModuleDependencies(moduleID string) error {
	mod, err := m.registry.GetModule(moduleID)
	if err != nil {
		return err
	}
	for _, depID := range mod.GetDependencies() {
		if _, err := m.registry.GetModule(depID); err != nil {
			return ErrDependencyNotSatisfied
		}
	}
	return nil
}

func (m *ModuleManager) GetDependencyGraph() map[string][]string {
	graph := make(map[string][]string)
	for _, mod := range m.registry.GetAllModules() {
		graph[mod.GetInfo().ID] = mod.GetDependencies()
	}
	return graph
}

// ModuleLoader is a placeholder interface for dynamic module loading.
type ModuleLoader interface {
	LoadFromPath(ctx context.Context, path string) (Module, error)
	LoadFromBytes(ctx context.Context, data []byte) (Module, error)
	GetSupportedExtensions() []string
}

type GoModuleLoader struct{}

func NewGoModuleLoader() *GoModuleLoader { return &GoModuleLoader{} }
func (l *GoModuleLoader) LoadFromPath(ctx context.Context, path string) (Module, error) {
	// TODO: Implement Go plugin loading using plugin package
	// Requires building plugins with -buildmode=plugin and loading with plugin.Open()
	return nil, NewError("Go module loading from path is not yet implemented. This feature requires Go plugins built with -buildmode=plugin")
}
func (l *GoModuleLoader) LoadFromBytes(ctx context.Context, data []byte) (Module, error) {
	// TODO: Implement loading Go modules from memory (byte array)
	return nil, NewError("Go module loading from bytes is not yet implemented. This is a complex feature requiring memory-mapped plugin loading")
}
func (l *GoModuleLoader) GetSupportedExtensions() []string { return []string{".so", ".dll", ".dylib"} }

type JavaScriptModuleLoader struct{}

func NewJavaScriptModuleLoader() *JavaScriptModuleLoader { return &JavaScriptModuleLoader{} }
func (l *JavaScriptModuleLoader) LoadFromPath(ctx context.Context, path string) (Module, error) {
	// TODO: Implement JavaScript module loading using a JS runtime like otto or goja
	return nil, NewError("JavaScript module loading from path is not yet implemented. This feature requires embedding a JS runtime engine")
}
func (l *JavaScriptModuleLoader) LoadFromBytes(ctx context.Context, data []byte) (Module, error) {
	// TODO: Implement JavaScript module loading from memory (byte array)
	return nil, NewError("JavaScript module loading from bytes is not yet implemented. This feature requires embedding a JS runtime engine")
}
func (l *JavaScriptModuleLoader) GetSupportedExtensions() []string { return []string{".js", ".mjs"} }

// ReflectionUtils provides small reflection helpers for future extensions.
type ReflectionUtils struct{}

func NewReflectionUtils() *ReflectionUtils { return &ReflectionUtils{} }

func (u *ReflectionUtils) CreateInstance(typeName string) (interface{}, error) {
	// TODO: Implement reflection-based instance creation
	// This requires maintaining a type registry or using reflection with type information
	return nil, NewError("reflection-based instance creation is not yet implemented. Type '" + typeName + "' cannot be instantiated dynamically")
}

func (u *ReflectionUtils) CallMethod(instance interface{}, methodName string, args ...interface{}) (interface{}, error) {
	v := reflect.ValueOf(instance)
	method := v.MethodByName(methodName)
	if !method.IsValid() {
		return nil, ErrMethodNotFound
	}

	in := make([]reflect.Value, len(args))
	for i, arg := range args {
		in[i] = reflect.ValueOf(arg)
	}

	out := method.Call(in)
	if len(out) == 0 {
		return nil, nil
	}
	if len(out) == 1 {
		return out[0].Interface(), nil
	}
	results := make([]interface{}, len(out))
	for i, r := range out {
		results[i] = r.Interface()
	}
	return results, nil
}

var (
	ErrModuleAlreadyRegistered = NewError("module already registered")
	ErrModuleNotFound          = NewError("module not found")
	ErrDependencyNotSatisfied  = NewError("dependency not satisfied")
	ErrNotImplemented          = NewError("not implemented")
	ErrMethodNotFound          = NewError("method not found")
)

type Error struct {
	message string
}

func NewError(message string) *Error {
	return &Error{message: message}
}

func (e *Error) Error() string { return e.message }
