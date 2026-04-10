import { ReactNode } from 'react';
import { ThemedPageLayout, ThemedCard, ThemedButton } from '../components/ui';
import { Save, X } from 'lucide-react';

interface FormPageTemplateProps {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  children: ReactNode;
  onSubmit: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
}

/**
 * 表单页通用模板
 * 包含：标题、表单区域、提交/取消按钮
 */
export function FormPageTemplate({
  title,
  description,
  breadcrumb,
  children,
  onSubmit,
  onCancel,
  submitText = '保存',
  cancelText = '取消',
  isSubmitting = false,
}: FormPageTemplateProps) {
  return (
    <ThemedPageLayout
      title={title}
      description={description}
      breadcrumb={breadcrumb}
    >
      <ThemedCard className="p-6 max-w-4xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-6">
            {children}

            <div className="flex gap-3 pt-6 border-t">
              <ThemedButton
                type="submit"
                disabled={isSubmitting}
                icon={<Save className="w-4 h-4" />}
              >
                {isSubmitting ? '保存中...' : submitText}
              </ThemedButton>
              {onCancel && (
                <ThemedButton
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  icon={<X className="w-4 h-4" />}
                >
                  {cancelText}
                </ThemedButton>
              )}
            </div>
          </div>
        </form>
      </ThemedCard>
    </ThemedPageLayout>
  );
}


