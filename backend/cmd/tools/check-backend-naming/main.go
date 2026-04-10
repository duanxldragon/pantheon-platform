package main

import (
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

var (
	snakeCaseFilePattern = regexp.MustCompile(`^[a-z0-9]+(_[a-z0-9]+)*\.(go|sql|py|sh|bat)$`)
	kebabCaseDirPattern  = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

	primaryLayerFiles = []string{
		"dao",
		"dto",
		"handler",
		"model",
		"router",
		"service",
	}

	forbiddenFileNames = map[string]string{
		"repository.go": "use <module>_dao.go",
		"controller.go": "use <module>_handler.go or <module>_router.go",
		"entity.go":     "use <module>_model.go",
		"common.go":     "use a concrete <subject>_<kind>.go name",
		"util.go":       "use a concrete capability-based name",
		"helpers.go":    "use a concrete capability-based name",
	}

	moduleExceptions = map[string]struct{}{
		"internal/modules/system":           {},
		"internal/modules/system/container": {},
		"internal/modules/system/model":     {},
	}

	moduleRequiredFiles = map[string][]string{
		"internal/modules/system/monitor": {"monitor_handler.go", "monitor_router.go", "monitor_service.go"},
		"internal/modules/tenant/monitor": {"tenant_monitor.go"},
		"internal/modules/ops/alerting":   {"alert_manager.go"},
	}

	allowedRepositoryContentFiles = map[string]struct{}{
		"internal/shared/modules/module_registry.go": {},
	}

	allowedModuleSingleTokenFiles = map[string]map[string]struct{}{
		"internal/modules/auth": {
			"swagger.go": {},
		},
		"internal/modules/notification": {
			"swagger.go": {},
		},
		"internal/modules/system/dept": {
			"swagger.go": {},
		},
		"internal/modules/system/dict": {
			"migration.go": {},
			"swagger.go":   {},
		},
		"internal/modules/system/log": {
			"swagger.go": {},
		},
		"internal/modules/system/menu": {
			"swagger.go": {},
		},
		"internal/modules/system/monitor": {
			"swagger.go": {},
		},
		"internal/modules/system/permission": {
			"swagger.go": {},
		},
		"internal/modules/system/position": {
			"swagger.go": {},
		},
		"internal/modules/system/role": {
			"migration.go": {},
			"swagger.go":   {},
		},
		"internal/modules/system/setting": {
			"swagger.go": {},
		},
		"internal/modules/system/user": {
			"swagger.go": {},
		},
		"internal/modules/tenant": {
			"naming.go":  {},
			"swagger.go": {},
		},
		"internal/modules/tenant/monitor": {
			"collectors.go": {},
			"evaluators.go": {},
		},
		"internal/modules/ops/alerting": {
			"notifiers.go": {},
			"rules.go":     {},
		},
	}
)

func main() {
	rootFlag := flag.String("root", ".", "path inside backend or the backend root")
	flag.Parse()

	backendRoot, err := findBackendRoot(*rootFlag)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to locate backend root: %v\n", err)
		os.Exit(1)
	}

	issues, err := runChecks(backendRoot)
	if err != nil {
		fmt.Fprintf(os.Stderr, "check failed: %v\n", err)
		os.Exit(1)
	}

	if len(issues) > 0 {
		sort.Strings(issues)
		fmt.Fprintln(os.Stderr, "backend naming check failed:")
		for _, issue := range issues {
			fmt.Fprintf(os.Stderr, "- %s\n", issue)
		}
		os.Exit(1)
	}

	fmt.Printf("backend naming check passed: %s\n", filepath.ToSlash(backendRoot))
}

func findBackendRoot(start string) (string, error) {
	current, err := filepath.Abs(start)
	if err != nil {
		return "", err
	}

	for {
		goModPath := filepath.Join(current, "go.mod")
		internalPath := filepath.Join(current, "internal")
		if isFile(goModPath) && isDir(internalPath) {
			return current, nil
		}

		parent := filepath.Dir(current)
		if parent == current {
			return "", fmt.Errorf("no backend root found from %s", start)
		}
		current = parent
	}
}

func runChecks(root string) ([]string, error) {
	var issues []string

	fileIssues, err := checkFileNames(root)
	if err != nil {
		return nil, err
	}
	issues = append(issues, fileIssues...)

	cmdToolIssues, err := checkToolDirectories(root)
	if err != nil {
		return nil, err
	}
	issues = append(issues, cmdToolIssues...)

	moduleIssues, err := checkModuleDirectories(root)
	if err != nil {
		return nil, err
	}
	issues = append(issues, moduleIssues...)

	contentIssues, err := checkRepositoryNamingContent(root)
	if err != nil {
		return nil, err
	}
	issues = append(issues, contentIssues...)

	return issues, nil
}

func checkFileNames(root string) ([]string, error) {
	var issues []string

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		relPath, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		relPath = filepath.ToSlash(relPath)

		if shouldSkipPath(relPath, d) {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		if d.IsDir() {
			return nil
		}

		baseName := filepath.Base(path)
		if fix, exists := forbiddenFileNames[baseName]; exists {
			issues = append(issues, fmt.Sprintf("%s uses forbidden file name %q, %s", relPath, baseName, fix))
		}

		if !shouldCheckFileName(relPath) {
			return nil
		}

		if baseName == "main.go" {
			return nil
		}
		if strings.HasSuffix(baseName, "_test.go") {
			return nil
		}
		if !snakeCaseFilePattern.MatchString(baseName) {
			issues = append(issues, fmt.Sprintf("%s is not snake_case", relPath))
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return issues, nil
}

func checkToolDirectories(root string) ([]string, error) {
	toolsRoot := filepath.Join(root, "cmd", "tools")
	entries, err := os.ReadDir(toolsRoot)
	if err != nil {
		return nil, err
	}

	var issues []string
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		if entry.Name() == "internal" {
			continue
		}
		if !kebabCaseDirPattern.MatchString(entry.Name()) {
			issues = append(issues, fmt.Sprintf("cmd/tools/%s is not kebab-case", entry.Name()))
		}
	}
	return issues, nil
}

func checkModuleDirectories(root string) ([]string, error) {
	modulesRoot := filepath.Join(root, "internal", "modules")
	var issues []string

	err := filepath.WalkDir(modulesRoot, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if !d.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		relPath = filepath.ToSlash(relPath)

		if relPath == "internal/modules" {
			return nil
		}

		if _, exists := moduleExceptions[relPath]; exists {
			return nil
		}

		files, err := goFilesInDir(path)
		if err != nil {
			return err
		}
		if len(files) == 0 {
			return nil
		}

		requiredFiles := moduleRequiredFiles[relPath]
		if len(requiredFiles) == 0 {
			requiredFiles = prefixedPrimaryLayerFiles(moduleBaseName(relPath))
		}

		for _, requiredFile := range requiredFiles {
			if !contains(files, requiredFile) {
				issues = append(issues, fmt.Sprintf("%s is missing required layered file %s", relPath, requiredFile))
			}
		}

		for _, fileName := range files {
			if isPrimaryLayerFile(fileName) || strings.HasSuffix(fileName, "_test.go") {
				continue
			}
			if isAllowedSingleTokenModuleFile(relPath, fileName) {
				continue
			}
			if !strings.Contains(fileName, "_") {
				issues = append(issues, fmt.Sprintf("%s/%s should follow <subject>_<kind>.go", relPath, fileName))
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return issues, nil
}

func checkRepositoryNamingContent(root string) ([]string, error) {
	var issues []string

	err := filepath.WalkDir(filepath.Join(root, "internal"), func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() || filepath.Ext(path) != ".go" {
			return nil
		}

		relPath, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		relPath = filepath.ToSlash(relPath)

		contentBytes, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		content := string(contentBytes)

		if _, allowed := allowedRepositoryContentFiles[relPath]; !allowed {
			if strings.Contains(content, "initRepositories") {
				issues = append(issues, fmt.Sprintf("%s still uses initRepositories", relPath))
			}
			if strings.Contains(content, "Repository") {
				issues = append(issues, fmt.Sprintf("%s still contains Repository naming", relPath))
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return issues, nil
}

func goFilesInDir(path string) ([]string, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var files []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if filepath.Ext(entry.Name()) == ".go" {
			files = append(files, entry.Name())
		}
	}
	sort.Strings(files)
	return files, nil
}

func shouldCheckFileName(relPath string) bool {
	if strings.HasPrefix(relPath, "internal/") {
		return filepath.Ext(relPath) == ".go"
	}
	if strings.HasPrefix(relPath, "cmd/") {
		return filepath.Ext(relPath) == ".go"
	}
	if strings.HasPrefix(relPath, "scripts/") {
		ext := filepath.Ext(relPath)
		return ext == ".sql" || ext == ".py" || ext == ".sh" || ext == ".bat"
	}
	return false
}

func shouldSkipPath(relPath string, d fs.DirEntry) bool {
	if relPath == ".gocache" || strings.HasPrefix(relPath, ".gocache/") {
		return true
	}
	if d.IsDir() && (relPath == ".git" || strings.HasPrefix(relPath, ".git/")) {
		return true
	}
	return false
}

func isPrimaryLayerFile(name string) bool {
	trimmed := strings.TrimSuffix(name, ".go")
	for _, file := range primaryLayerFiles {
		if trimmed == file || strings.HasSuffix(trimmed, "_"+file) {
			return true
		}
	}
	return false
}

func prefixedPrimaryLayerFiles(moduleName string) []string {
	files := make([]string, 0, len(primaryLayerFiles))
	for _, file := range primaryLayerFiles {
		files = append(files, moduleName+"_"+file+".go")
	}
	return files
}

func moduleBaseName(relPath string) string {
	parts := strings.Split(relPath, "/")
	return parts[len(parts)-1]
}

func isAllowedSingleTokenModuleFile(relPath, fileName string) bool {
	allowed, ok := allowedModuleSingleTokenFiles[relPath]
	if !ok {
		return false
	}
	_, exists := allowed[fileName]
	return exists
}

func contains(items []string, target string) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}

func isDir(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func isFile(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}
