/**
 * 增强的批量操作对话框
 * @description 支持数据预览、进度显示、错误处理、回滚等功能
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { AlertCircle, CheckCircle2, XCircle, Loader2, FileText, Download } from 'lucide-react';
import type { ID } from '../../../modules/system/types';

/**
 * 批量操作步骤
 */
type BatchStep = 'preview' | 'confirm' | 'processing' | 'result';

/**
 * 批量操作项
 */
export interface BatchItem {
  id: ID;
  displayName: string;
  data: any;
  selected?: boolean;
  status?: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
  warning?: string;
}

/**
 * 批量操作结果
 */
export interface BatchResult {
  total: number;
  success: number;
  failed: number;
  items: Array<{
    id: ID;
    displayName: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

/**
 * 批量操作配置
 */
export interface BatchOperationConfig {
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  warningMessage?: string;
  confirmMessage?: string;
  batchSize?: number;
  allowPartial?: boolean;
  showPreview?: boolean;
}

/**
 * 组件属性
 */
interface EnhancedBatchOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: BatchOperationConfig;
  items: BatchItem[];
  onExecute: (selectedItems: BatchItem[]) => Promise<BatchResult>;
  renderPreviewColumns?: (item: BatchItem) => React.ReactNode;
}

/**
 * 增强的批量操作对话框组件
 */
export function EnhancedBatchOperationDialog({
  open,
  onOpenChange,
  config,
  items: initialItems,
  onExecute,
  renderPreviewColumns,
}: EnhancedBatchOperationDialogProps) {
  const [step, setStep] = useState<BatchStep>('preview');
  const [items, setItems] = useState<BatchItem[]>(initialItems);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // 选中的项
  const selectedItems = items.filter(item => item.selected !== false);
  const selectedCount = selectedItems.length;

  /**
   * 切换项选中状态
   */
  const toggleItem = useCallback((id: ID) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  /**
   * 全选/取消全选
   */
  const toggleAll = useCallback(() => {
    const allSelected = items.every(item => item.selected !== false);
    setItems(prev =>
      prev.map(item => ({ ...item, selected: !allSelected }))
    );
  }, [items]);

  /**
   * 执行批量操作
   */
  const executeBatchOperation = async () => {
    setIsExecuting(true);
    setStep('processing');
    setProgress(0);

    try {
      const batchSize = config.batchSize || 10;
      const batches: BatchItem[][] = [];

      // 分批处理
      for (let i = 0; i < selectedItems.length; i += batchSize) {
        batches.push(selectedItems.slice(i, i + batchSize));
      }

      let processedCount = 0;
      const allResults: BatchResult = {
        total: selectedItems.length,
        success: 0,
        failed: 0,
        items: [],
      };

      // 更新当前批次的状态
      const updateItemStatus = (id: ID, status: BatchItem['status'], error?: string) => {
        setItems(prev =>
          prev.map(item =>
            item.id === id ? { ...item, status, error } : item
          )
        );
      };

      // 逐批执行
      for (const batch of batches) {
        // 标记为处理中
        batch.forEach(item => updateItemStatus(item.id, 'processing'));

        try {
          const batchResult = await onExecute(batch);

          // 更新每个项的状态
          batchResult.items.forEach(resultItem => {
            updateItemStatus(
              resultItem.id,
              resultItem.status,
              resultItem.error
            );
          });

          // 合并结果
          allResults.success += batchResult.success;
          allResults.failed += batchResult.failed;
          allResults.items.push(...batchResult.items);
        } catch (error) {
          // 批次失败，标记所有项为失败
          batch.forEach(item => {
            updateItemStatus(item.id, 'failed', String(error));
            allResults.failed++;
            allResults.items.push({
              id: item.id,
              displayName: item.displayName,
              status: 'failed',
              error: String(error),
            });
          });
        }

        // 更新进度
        processedCount += batch.length;
        setProgress((processedCount / selectedItems.length) * 100);

        // Note: Removed artificial delay. In production, you may want to add
        // rate limiting or throttling based on backend capacity.
      }

      setResult(allResults);
      setStep('result');
    } catch (error) {
      console.error('Batch operation error:', error);
      setResult({
        total: selectedItems.length,
        success: 0,
        failed: selectedItems.length,
        items: selectedItems.map(item => ({
          id: item.id,
          displayName: item.displayName,
          status: 'failed',
          error: String(error),
        })),
      });
      setStep('result');
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * 导出结果
   */
  const exportResult = () => {
    if (!result) return;

    const csv = [
      ['ID', '名称', '状态', '错误信息'].join(','),
      ...result.items.map(item =>
        [
          item.id,
          item.displayName,
          item.status === 'success' ? '成功' : '失败',
          item.error || '',
        ]
          .map(cell => `"${cell}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `批量操作结果_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  /**
   * 重置对话框
   */
  const resetDialog = () => {
    setStep('preview');
    setProgress(0);
    setResult(null);
    setIsExecuting(false);
    setItems(initialItems);
  };

  /**
   * 关闭对话框
   */
  const handleClose = () => {
    if (!isExecuting) {
      resetDialog();
      onOpenChange(false);
    }
  };

  /**
   * 渲染预览步骤
   */
  const renderPreviewStep = () => (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{config.description}</AlertDescription>
      </Alert>

      {config.warningMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{config.warningMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={items.every(item => item.selected !== false)}
            onCheckedChange={toggleAll}
          />
          <span className="text-sm text-muted-foreground">
            已选择 {selectedCount} / {items.length} 项
          </span>
        </div>
      </div>

      <div className="border rounded-lg max-h-[400px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">选择</TableHead>
              <TableHead>名称</TableHead>
              {renderPreviewColumns && <TableHead>详情</TableHead>}
              <TableHead className="w-[100px]">状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={item.selected !== false}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                </TableCell>
                <TableCell>{item.displayName}</TableCell>
                {renderPreviewColumns && (
                  <TableCell>{renderPreviewColumns(item)}</TableCell>
                )}
                <TableCell>
                  {item.warning && (
                    <Badge variant="outline" className="text-yellow-600">
                      警告
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  /**
   * 渲染确认步骤
   */
  const renderConfirmStep = () => (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {config.confirmMessage ||
            `确认要${config.actionLabel} ${selectedCount} 项数据吗？此操作无法撤销！`}
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <div className="text-sm font-medium">即将操作的项目：</div>
        <div className="max-h-[200px] overflow-auto space-y-1">
          {selectedItems.map(item => (
            <div
              key={item.id}
              className="text-sm px-3 py-2 bg-muted rounded flex items-center gap-2"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              {item.displayName}
              {item.warning && (
                <Badge variant="outline" className="text-yellow-600 text-xs">
                  {item.warning}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * 渲染处理步骤
   */
  const renderProcessingStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>正在处理...</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
        <div className="text-xs text-muted-foreground text-center">
          请勿关闭此窗口
        </div>
      </div>

      <div className="max-h-[300px] overflow-auto space-y-1">
        {items.map(item => {
          if (!item.selected) return null;

          return (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded text-sm"
            >
              {item.status === 'processing' && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
              {item.status === 'success' && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              {item.status === 'failed' && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              {!item.status && (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}

              <span className="flex-1">{item.displayName}</span>

              {item.status === 'failed' && item.error && (
                <span className="text-xs text-red-600">{item.error}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /**
   * 渲染结果步骤
   */
  const renderResultStep = () => {
    if (!result) return null;

    const successRate = (result.success / result.total) * 100;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{result.total}</div>
            <div className="text-sm text-muted-foreground">总计</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{result.success}</div>
            <div className="text-sm text-green-600">成功</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{result.failed}</div>
            <div className="text-sm text-red-600">失败</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>成功率</span>
            <span className="font-medium">{Math.round(successRate)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        {result.failed > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-red-600">失败详情：</div>
            <div className="max-h-[200px] overflow-auto space-y-1">
              {result.items
                .filter(item => item.status === 'failed')
                .map(item => (
                  <div
                    key={item.id}
                    className="text-sm px-3 py-2 bg-red-50 rounded flex items-start gap-2"
                  >
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{item.displayName}</div>
                      {item.error && (
                        <div className="text-red-600 text-xs mt-1">{item.error}</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {step === 'preview' && '请选择要操作的项目'}
            {step === 'confirm' && '请确认操作'}
            {step === 'processing' && '正在执行操作...'}
            {step === 'result' && '操作完成'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'preview' && renderPreviewStep()}
          {step === 'confirm' && renderConfirmStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'result' && renderResultStep()}
        </div>

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={selectedCount === 0}
              >
                下一步 ({selectedCount})
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('preview')}>
                上一步
              </Button>
              <Button onClick={executeBatchOperation} variant="destructive">
                确认{config.actionLabel}
              </Button>
            </>
          )}

          {step === 'processing' && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              处理中...
            </Button>
          )}

          {step === 'result' && (
            <>
              <Button variant="outline" onClick={exportResult}>
                <Download className="mr-2 h-4 w-4" />
                导出结果
              </Button>
              <Button onClick={handleClose}>完成</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
