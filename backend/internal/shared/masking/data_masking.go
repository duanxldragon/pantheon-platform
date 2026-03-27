package masking

import "strings"

// MaskEmail masks an email address, for example a***b@example.com.
func MaskEmail(email string) string {
	if email == "" {
		return ""
	}
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return email
	}
	name := parts[0]
	domain := parts[1]
	if len(name) <= 2 {
		return name + "***@" + domain
	}
	return name[0:1] + "***" + name[len(name)-1:] + "@" + domain
}

// MaskPhone masks a phone number, for example 138****1234.
func MaskPhone(phone string) string {
	if len(phone) < 7 {
		return phone
	}
	return phone[0:3] + "****" + phone[len(phone)-4:]
}

// MaskRealName masks a personal name, for example 张*三 or 李*.
func MaskRealName(name string) string {
	runes := []rune(name)
	if len(runes) <= 1 {
		return name
	}
	if len(runes) == 2 {
		return string(runes[0]) + "*"
	}
	return string(runes[0]) + "*" + string(runes[len(runes)-1])
}
