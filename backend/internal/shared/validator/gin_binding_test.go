package validator

import (
	"reflect"
	"testing"
)

func TestValidateCodeIdentifier(t *testing.T) {
	tests := []struct {
		name  string
		value string
		want  bool
	}{
		{name: "snake case", value: "system_user", want: true},
		{name: "letters and digits", value: "role2_admin", want: true},
		{name: "leading underscore", value: "_system", want: false},
		{name: "trailing underscore", value: "system_", want: false},
		{name: "space", value: "system user", want: false},
		{name: "dash", value: "system-user", want: false},
		{name: "leading digit", value: "1system", want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := validateCodeIdentifier(reflect.ValueOf(tt.value))
			if got != tt.want {
				t.Fatalf("validateCodeIdentifier(%q)=%v want %v", tt.value, got, tt.want)
			}
		})
	}
}
