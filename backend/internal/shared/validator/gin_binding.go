package validator

import (
	"reflect"
	"regexp"
	"strings"
	"sync"

	"github.com/gin-gonic/gin/binding"
	playground "github.com/go-playground/validator/v10"
)

var (
	codeIdentifierRegex = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_]*$`)
	registerOnce        sync.Once
)

func init() {
	RegisterGinValidators()
}

func RegisterGinValidators() {
	registerOnce.Do(func() {
		engine, ok := binding.Validator.Engine().(*playground.Validate)
		if !ok || engine == nil {
			return
		}

		_ = engine.RegisterValidation("codefmt", func(fl playground.FieldLevel) bool {
			return validateCodeIdentifier(fl.Field())
		})
	})
}

func validateCodeIdentifier(field reflect.Value) bool {
	if !field.IsValid() {
		return false
	}

	if field.Kind() == reflect.Ptr {
		if field.IsNil() {
			return true
		}
		field = field.Elem()
	}

	if field.Kind() != reflect.String {
		return false
	}

	value := strings.TrimSpace(field.String())
	if value == "" {
		return true
	}

	if strings.HasPrefix(value, "_") || strings.HasSuffix(value, "_") {
		return false
	}

	return codeIdentifierRegex.MatchString(value)
}
