package utils

import (
	"strings"
)

// MaskEmail 脱敏邮箱 (例如: a***b@example.com)
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

// MaskPhone 脱敏手机号 (例如: 138****1234)
func MaskPhone(phone string) string {
	if len(phone) < 7 {
		return phone
	}
	return phone[0:3] + "****" + phone[len(phone)-4:]
}

// MaskRealName 脱敏真实姓名 (例如: 张*三 或 李*)
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
