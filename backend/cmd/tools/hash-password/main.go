package main

import (
	"fmt"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := ""
	if len(os.Args) > 1 {
		password = os.Args[1]
	}
	if password == "" {
		password = os.Getenv("PANTHEON_TOOL_PASSWORD")
	}

	password = strings.TrimSpace(password)
	if password == "" {
		fmt.Fprintln(os.Stderr, "usage: go run ./cmd/tools/hash-password <password>")
		os.Exit(1)
	}
	if len(password) < 12 {
		fmt.Fprintln(os.Stderr, "password must be at least 12 characters")
		os.Exit(1)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to hash password: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(string(hash))
}
