package storage

import (
	"context"
	"fmt"
	"io"
)

// S3StorageProvider 预留 S3 实现
// 实际使用时需要引入 github.com/aws/aws-sdk-go-v2
type S3StorageProvider struct {
	Bucket string
	Region string
	// client *s3.Client
}

func (p *S3StorageProvider) Upload(ctx context.Context, filename string, reader io.Reader, size int64) (string, error) {
	// TODO: 实现 AWS S3 / 阿里云 OSS 上传逻辑
	return "", fmt.Errorf("s3 storage provider not implemented yet")
}

func (p *S3StorageProvider) Delete(ctx context.Context, fileURL string) error {
	return fmt.Errorf("s3 storage provider not implemented yet")
}

func (p *S3StorageProvider) GetType() string {
	return "s3"
}
