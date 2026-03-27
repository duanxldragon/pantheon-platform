package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type LocalStorageProvider struct {
	UploadDir string // 存储根目录，如 "uploads"
	BaseURL   string // 访问前缀，如 "/uploads" 或 "http://localhost:8082/uploads"
}

func NewLocalStorageProvider(uploadDir, baseURL string) *LocalStorageProvider {
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		_ = os.MkdirAll(uploadDir, 0755)
	}
	return &LocalStorageProvider{
		UploadDir: uploadDir,
		BaseURL:   baseURL,
	}
}

func (p *LocalStorageProvider) Upload(ctx context.Context, filename string, reader io.Reader, size int64) (string, error) {
	// 确保子目录存在 (按日期分目录)
	// relativePath := time.Now().Format("2006/01/02")
	// fullDir := filepath.Join(p.UploadDir, relativePath)
	// _ = os.MkdirAll(fullDir, 0755)

	dstPath := filepath.Join(p.UploadDir, filename)
	out, err := os.Create(dstPath)
	if err != nil {
		return "", fmt.Errorf("failed to create local file: %w", err)
	}
	defer out.Close()

	if _, err := io.Copy(out, reader); err != nil {
		return "", fmt.Errorf("failed to save local file: %w", err)
	}

	// 返回访问路径。注意：在本地开发环境，我们通常返回相对路径 /uploads/xxx
	// 这样前端可以直接拼接后端基地址访问
	return fmt.Sprintf("%s/%s", strings.TrimRight(p.BaseURL, "/"), filename), nil
}

func (p *LocalStorageProvider) Delete(ctx context.Context, fileURL string) error {
	// 从 URL 中提取文件名
	filename := filepath.Base(fileURL)
	filePath := filepath.Join(p.UploadDir, filename)
	return os.Remove(filePath)
}

func (p *LocalStorageProvider) GetType() string {
	return "local"
}
