import type { LucideIcon } from 'lucide-react';
import { Check, ChevronDown, ChevronUp, Copy, Download, FileJson, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '../../../components/ui/button';
import { cn } from '../../../components/ui/utils';

interface DetailCodeBlockProps {
  title: string;
  value?: string | null;
  icon?: LucideIcon;
  className?: string;
  codeClassName?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  maxCollapsedHeight?: string;
  copyText?: string;
  copiedText?: string;
  expandText?: string;
  collapseText?: string;
  downloadable?: boolean;
  downloadFileName?: string;
  downloadText?: string;
  formatJson?: boolean;
  formatText?: string;
  formatSuccessText?: string;
  formatFailedText?: string;
}

export function DetailCodeBlock({
  title,
  value,
  icon: Icon = FileJson,
  className,
  codeClassName,
  collapsible = false,
  defaultExpanded = true,
  maxCollapsedHeight = 'max-h-40',
  copyText = 'Copy',
  copiedText = 'Copied',
  expandText = 'Expand',
  collapseText = 'Collapse',
  downloadable = false,
  downloadFileName = 'detail.txt',
  downloadText = 'Download',
  formatJson = false,
  formatText = 'Format',
  formatSuccessText = 'Formatted',
  formatFailedText = 'Format failed',
}: DetailCodeBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  if (!displayValue) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(displayValue);
      setCopied(true);
      toast.success(copiedText);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(copyText);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([displayValue], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(displayValue);
      setDisplayValue(JSON.stringify(parsed, null, 2));
      toast.success(formatSuccessText);
    } catch {
      toast.error(formatFailedText);
    }
  };

  return (
    <section className={cn('space-y-3 rounded-[28px] bg-slate-900 p-5 shadow-inner', className)}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <Icon className="h-3 w-3" /> {title}
        </h4>
        <div className="flex items-center gap-2">
          {formatJson ? (
            <Button
              type="button"
              variant="mono"
              size="icon-sm"
              onClick={handleFormatJson}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              aria-label={formatText}
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          ) : null}
          {collapsible ? (
            <Button
              type="button"
              variant="mono"
              size="icon-sm"
              onClick={() => setExpanded((current) => !current)}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              aria-label={expanded ? collapseText : expandText}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          ) : null}
          {downloadable ? (
            <Button
              type="button"
              variant="mono"
              size="icon-sm"
              onClick={handleDownload}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              aria-label={downloadText}
            >
              <Download className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="mono"
            size="icon-sm"
            onClick={() => void handleCopy()}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
            aria-label={copyText}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          'overflow-auto rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4',
          collapsible && !expanded ? maxCollapsedHeight : undefined,
        )}
      >
        <pre
          className={cn(
            'whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-emerald-400',
            codeClassName,
          )}
        >
          {displayValue}
        </pre>
      </div>
    </section>
  );
}
