package storage

import (
	"context"
	"io"
)

// StorageProvider 定义了文件存储的统一接口
type StorageProvider interface {
	// Upload 上传文件，返回访问 URL 或路径
	Upload(ctx context.Context, filename string, reader io.Reader, size int64) (string, error)
	// Delete 删除文件
	Delete(ctx context.Context, fileURL string) error
	// GetType 返回提供者类型 (local, s3, etc.)
	GetType() string
}
