import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { useLanguageStore } from '../../../stores/languageStore';
import { toast } from 'sonner';
import { getDialogClassName } from '../../constants/dialogSizes';

interface DataImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'import' | 'export';
  resourceName: string; // e.g., "User", "Role"
  templateHeaders?: string[]; // Headers for the template
  onImport?: (file: File) => void | Promise<void>;
  onExport?: (options: ExportOptions) => void | Promise<void>;
}

export interface ExportOptions {
  format: 'xlsx' | 'csv';
  scope: 'all' | 'selected' | 'current';
}

const Upload = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
)

const FileSpreadsheet = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M8 13h2" />
    <path d="M14 13h2" />
    <path d="M8 17h2" />
    <path d="M14 17h2" />
    <path d="M4 9h16" />
  </svg>
)

const FileText = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
)

const CheckCircle2 = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export function DataImportExportDialog({
  open,
  onOpenChange,
  mode,
  resourceName,
  templateHeaders,
  onImport,
  onExport,
}: DataImportExportDialogProps) {
  const { t } = useLanguageStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/csv', // .csv
      'application/vnd.ms-excel' // .xls
    ];
    
    // Simple validation
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error(t.systemManage.importExport.error);
      return;
    }
    
    setFile(file);
  };

  const handleImportSubmit = async () => {
    if (!file || !onImport) return;
    
    setIsProcessing(true);
    try {
      await onImport(file);
      onOpenChange(false);
      setFile(null);
    } catch (error) {
      console.error(error);
      // Toast is handled by caller or global error handler usually, but here for safety
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportSubmit = async () => {
    if (!onExport) return;
    
    setIsProcessing(true);
    try {
      await onExport({ format: exportFormat, scope: exportScope });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    if (templateHeaders) {
      // Generate CSV content
      const csvContent = templateHeaders.join(',') + '\n';
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${resourceName}_template.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${resourceName} ${t.systemManage.importExport.downloadTemplate} ${t.common.success}`);
    } else {
      // Generate a generic template with common columns
      const genericHeaders = ['Name', 'Code', 'Description', 'Status'];
      const csvContent = genericHeaders.join(',') + '\n';
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${resourceName}_template.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${resourceName} ${t.systemManage.importExport.downloadTemplate} ${t.common.success}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[448px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'import' 
              ? `${t.systemManage.importExport.importTitle} - ${resourceName}`
              : `${t.systemManage.importExport.exportTitle} - ${resourceName}`
            }
          </DialogTitle>
          <DialogDescription>
            {mode === 'import'
              ? t.systemManage.importExport.supportFiles
              : t.systemManage.importExport.exportFormat}
          </DialogDescription>
        </DialogHeader>

        {mode === 'import' ? (
          <div className="space-y-4 py-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${file ? 'bg-green-50 border-green-500' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleChange}
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-8 h-8" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm opacity-80">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Upload className="w-8 h-8" />
                  <p className="font-medium">{t.systemManage.importExport.clickToUpload}</p>
                  <p className="text-sm">{t.systemManage.importExport.dragAndDrop}</p>
                  <p className="text-xs text-gray-400 mt-2">{t.systemManage.importExport.maxSize}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={downloadTemplate} type="button">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {t.systemManage.importExport.downloadTemplate}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
             <div className="space-y-3">
              <Label>{t.systemManage.importExport.exportFormat}</Label>
              <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as any)} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="xlsx" id="xlsx" className="peer sr-only" />
                  <Label
                    htmlFor="xlsx"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <FileSpreadsheet className="mb-3 h-6 w-6" />
                    XLSX
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
                  <Label
                    htmlFor="csv"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <FileText className="mb-3 h-6 w-6" />
                    CSV
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>{t.actions.filter}</Label>
              <RadioGroup value={exportScope} onValueChange={(v) => setExportScope(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">{t.systemManage.importExport.exportAll}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected">{t.systemManage.importExport.exportSelected}</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            {t.common.cancel}
          </Button>
          <Button 
            onClick={mode === 'import' ? handleImportSubmit : handleExportSubmit} 
            disabled={isProcessing || (mode === 'import' && !file)}
          >
            {isProcessing ? t.systemManage.importExport.processing : t.common.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
