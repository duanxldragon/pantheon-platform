package validator

import (
	"fmt"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"

	"pantheon-platform/backend/internal/shared/response"
)

// Rule validates a single value.
type Rule interface {
	Validate(value interface{}) error
}

type RequiredRule struct {
	Message string
}

func (r RequiredRule) Validate(value interface{}) error {
	if value == nil {
		return fmt.Errorf(r.Message)
	}
	if s, ok := value.(string); ok && strings.TrimSpace(s) == "" {
		return fmt.Errorf(r.Message)
	}
	return nil
}

func Required(message ...string) Rule {
	msg := "required"
	if len(message) > 0 && strings.TrimSpace(message[0]) != "" {
		msg = message[0]
	}
	return RequiredRule{Message: msg}
}

type MinLengthRule struct {
	Min     int
	Message string
}

func (r MinLengthRule) Validate(value interface{}) error {
	s, ok := value.(string)
	if !ok {
		return nil
	}
	if len(s) < r.Min {
		return fmt.Errorf(r.Message)
	}
	return nil
}

func MinLength(min int, message ...string) Rule {
	msg := fmt.Sprintf("minimum length is %d", min)
	if len(message) > 0 && strings.TrimSpace(message[0]) != "" {
		msg = message[0]
	}
	return MinLengthRule{Min: min, Message: msg}
}

type MaxLengthRule struct {
	Max     int
	Message string
}

func (r MaxLengthRule) Validate(value interface{}) error {
	s, ok := value.(string)
	if !ok {
		return nil
	}
	if len(s) > r.Max {
		return fmt.Errorf(r.Message)
	}
	return nil
}

func MaxLength(max int, message ...string) Rule {
	msg := fmt.Sprintf("maximum length is %d", max)
	if len(message) > 0 && strings.TrimSpace(message[0]) != "" {
		msg = message[0]
	}
	return MaxLengthRule{Max: max, Message: msg}
}

type EmailRule struct {
	Message string
}

func (r EmailRule) Validate(value interface{}) error {
	s, ok := value.(string)
	if !ok || strings.TrimSpace(s) == "" {
		return nil
	}
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(s) {
		return fmt.Errorf(r.Message)
	}
	return nil
}

func Email(message ...string) Rule {
	msg := "invalid email address"
	if len(message) > 0 && strings.TrimSpace(message[0]) != "" {
		msg = message[0]
	}
	return EmailRule{Message: msg}
}

type PhoneRule struct {
	Message string
}

func (r PhoneRule) Validate(value interface{}) error {
	s, ok := value.(string)
	if !ok || strings.TrimSpace(s) == "" {
		return nil
	}
	phoneRegex := regexp.MustCompile(`^1[3-9]\d{9}$`)
	if !phoneRegex.MatchString(s) {
		return fmt.Errorf(r.Message)
	}
	return nil
}

func Phone(message ...string) Rule {
	msg := "invalid phone number"
	if len(message) > 0 && strings.TrimSpace(message[0]) != "" {
		msg = message[0]
	}
	return PhoneRule{Message: msg}
}

type InRule struct {
	Values  []interface{}
	Message string
}

func (r InRule) Validate(value interface{}) error {
	for _, v := range r.Values {
		if v == value {
			return nil
		}
	}
	return fmt.Errorf(r.Message)
}

func In(values []interface{}, message ...string) Rule {
	msg := "value is not allowed"
	if len(message) > 0 && strings.TrimSpace(message[0]) != "" {
		msg = message[0]
	}
	return InRule{Values: values, Message: msg}
}

type NumericRule struct {
	Message string
}

func (r NumericRule) Validate(value interface{}) error {
	switch v := value.(type) {
	case int, int32, int64, float32, float64:
		return nil
	case string:
		if strings.TrimSpace(v) == "" {
			return nil
		}
		if _, err := strconv.ParseFloat(v, 64); err != nil {
			return fmt.Errorf(r.Message)
		}
		return nil
	default:
		return nil
	}
}

func Numeric(message ...string) Rule {
	msg := "must be numeric"
	if len(message) > 0 && strings.TrimSpace(message[0]) != "" {
		msg = message[0]
	}
	return NumericRule{Message: msg}
}

// Validator accumulates field validation errors.
type Validator struct {
	errors map[string][]string
}

func NewValidator() *Validator {
	return &Validator{errors: make(map[string][]string)}
}

func (v *Validator) Validate(field string, value interface{}, rules ...Rule) *Validator {
	for _, rule := range rules {
		if err := rule.Validate(value); err != nil {
			v.errors[field] = append(v.errors[field], err.Error())
		}
	}
	return v
}

func (v *Validator) ValidateStruct(obj interface{}) *Validator {
	val := reflect.ValueOf(obj)
	typ := reflect.TypeOf(obj)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
		typ = typ.Elem()
	}
	if val.Kind() != reflect.Struct {
		return v
	}

	for i := 0; i < val.NumField(); i++ {
		fieldVal := val.Field(i)
		fieldType := typ.Field(i)

		tag := fieldType.Tag.Get("validate")
		if tag == "" {
			continue
		}

		fieldName := fieldType.Name
		if jsonTag := fieldType.Tag.Get("json"); jsonTag != "" {
			if idx := strings.Index(jsonTag, ","); idx != -1 {
				fieldName = jsonTag[:idx]
			} else {
				fieldName = jsonTag
			}
		}

		rules := v.parseValidationRules(tag)
		var raw interface{}
		if fieldVal.IsValid() && fieldVal.CanInterface() {
			raw = fieldVal.Interface()
		}
		v.Validate(fieldName, raw, rules...)
	}

	return v
}

func (v *Validator) parseValidationRules(tag string) []Rule {
	var rules []Rule

	parts := strings.Split(tag, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)

		switch {
		case part == "required":
			rules = append(rules, Required())
		case strings.HasPrefix(part, "minlength:"):
			min, _ := strconv.Atoi(strings.TrimPrefix(part, "minlength:"))
			rules = append(rules, MinLength(min))
		case strings.HasPrefix(part, "maxlength:"):
			max, _ := strconv.Atoi(strings.TrimPrefix(part, "maxlength:"))
			rules = append(rules, MaxLength(max))
		case part == "email":
			rules = append(rules, Email())
		case part == "phone":
			rules = append(rules, Phone())
		case strings.HasPrefix(part, "in:"):
			values := strings.Split(strings.TrimPrefix(part, "in:"), "|")
			ifaceValues := make([]interface{}, 0, len(values))
			for _, val := range values {
				ifaceValues = append(ifaceValues, val)
			}
			rules = append(rules, In(ifaceValues))
		case part == "numeric":
			rules = append(rules, Numeric())
		}
	}

	return rules
}

func (v *Validator) HasErrors() bool { return len(v.errors) > 0 }
func (v *Validator) GetErrors() map[string][]string {
	return v.errors
}

func (v *Validator) GetFieldErrors(field string) []string { return v.errors[field] }

func (v *Validator) ToFieldErrors() []response.FieldError {
	fieldErrors := make([]response.FieldError, 0)
	for field, errs := range v.errors {
		for _, err := range errs {
			fieldErrors = append(fieldErrors, response.FieldError{
				Field:   field,
				Code:    "VALIDATION_ERROR",
				Message: err,
			})
		}
	}
	return fieldErrors
}

// ValidateRequest binds request data into a new instance and validates it based on struct tags.
// It stores the validated data into gin context as "validated_data".
func ValidateRequest(obj interface{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		typ := reflect.TypeOf(obj)
		if typ == nil {
			response.BadRequest(c, "VALIDATION_ERROR", "invalid validator type")
			c.Abort()
			return
		}
		if typ.Kind() == reflect.Ptr {
			typ = typ.Elem()
		}
		newObj := reflect.New(typ).Interface()

		if err := c.ShouldBind(newObj); err != nil {
			response.BadRequest(c, "VALIDATION_ERROR", err.Error())
			c.Abort()
			return
		}

		validator := NewValidator()
		validator.ValidateStruct(newObj)

		if validator.HasErrors() {
			response.BadRequestWithFields(c, "VALIDATION_ERROR", "validation failed", validator.ToFieldErrors())
			c.Abort()
			return
		}

		c.Set("validated_data", newObj)
		c.Next()
	}
}

func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasDigit = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper || !hasLower || !hasDigit || !hasSpecial {
		return fmt.Errorf("password must include upper, lower, digit, and special character")
	}
	return nil
}

func ValidateUsername(username string) error {
	if len(username) < 3 || len(username) > 20 {
		return fmt.Errorf("username length must be between 3 and 20")
	}
	usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	if !usernameRegex.MatchString(username) {
		return fmt.Errorf("username can only contain letters, digits and underscore")
	}
	if strings.HasPrefix(username, "_") || strings.HasSuffix(username, "_") {
		return fmt.Errorf("username cannot start or end with underscore")
	}
	return nil
}

func ValidateIDCard(idCard string) error {
	if len(idCard) != 18 {
		return fmt.Errorf("id card must be 18 characters")
	}
	if _, err := strconv.ParseInt(idCard[:17], 10, 64); err != nil {
		return fmt.Errorf("invalid id card")
	}
	last := strings.ToUpper(idCard[17:])
	if (last < "0" || last > "9") && last != "X" {
		return fmt.Errorf("invalid id card")
	}
	return nil
}

func ValidateDate(dateStr, layout string) error {
	if _, err := time.Parse(layout, dateStr); err != nil {
		return fmt.Errorf("invalid date")
	}
	return nil
}

func ValidateAge(birthDate time.Time, minAge, maxAge int) error {
	now := time.Now()
	age := now.Year() - birthDate.Year()
	if now.Month() < birthDate.Month() || (now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
		age--
	}
	if age < minAge {
		return fmt.Errorf("age must be at least %d", minAge)
	}
	if age > maxAge {
		return fmt.Errorf("age must be at most %d", maxAge)
	}
	return nil
}

func ValidateURL(u string) error {
	urlRegex := regexp.MustCompile(`^https?://[^\s/$.?#].[^\s]*$`)
	if !urlRegex.MatchString(u) {
		return fmt.Errorf("invalid URL")
	}
	return nil
}

func ValidateIP(ip string) error {
	ipRegex := regexp.MustCompile(`^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$`)
	if !ipRegex.MatchString(ip) {
		return fmt.Errorf("invalid IP")
	}
	return nil
}

func ValidateRange(value interface{}, min, max float64) error {
	var num float64
	switch v := value.(type) {
	case int:
		num = float64(v)
	case int32:
		num = float64(v)
	case int64:
		num = float64(v)
	case float32:
		num = float64(v)
	case float64:
		num = v
	case string:
		parsed, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return fmt.Errorf("invalid number")
		}
		num = parsed
	default:
		return fmt.Errorf("unsupported type")
	}

	if num < min || num > max {
		return fmt.Errorf("value must be between %.2f and %.2f", min, max)
	}
	return nil
}

func ValidateRegex(value interface{}, pattern, message string) error {
	str, ok := value.(string)
	if !ok {
		return nil
	}

	regex, err := regexp.Compile(pattern)
	if err != nil {
		return fmt.Errorf("invalid pattern")
	}
	if !regex.MatchString(str) {
		return fmt.Errorf(message)
	}
	return nil
}

