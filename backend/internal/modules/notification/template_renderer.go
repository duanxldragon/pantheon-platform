package notification

import (
	"bytes"
	"text/template"
)

// RenderGoTemplate renders a Go text/template with the provided variables.
// It returns the input template as-is when tmpl is empty.
func RenderGoTemplate(tmpl string, vars map[string]interface{}) (string, error) {
	if tmpl == "" {
		return "", nil
	}
	t, err := template.New("notification").Option("missingkey=zero").Parse(tmpl)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if vars == nil {
		vars = map[string]interface{}{}
	}
	if err := t.Execute(&buf, vars); err != nil {
		return "", err
	}
	return buf.String(), nil
}
