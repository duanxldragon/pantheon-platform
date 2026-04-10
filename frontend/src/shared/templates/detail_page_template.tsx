import { ReactNode } from 'react';
import { ThemedPageLayout, ThemedCard } from '../components/ui';
import { useThemeStore } from '../../stores/theme_store';

interface DetailSection {
  title: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface DetailPageTemplateProps {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  sections: DetailSection[];
  sidebar?: ReactNode;
}

/**
 * 详情页通用模板
 * 包含：标题、多个信息区块、侧边栏
 */
export function DetailPageTemplate({
  title,
  description,
  breadcrumb,
  actions,
  sections,
  sidebar,
}: DetailPageTemplateProps) {
  const { theme } = useThemeStore();

  return (
    <ThemedPageLayout
      title={title}
      description={description}
      breadcrumb={breadcrumb}
      action={actions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主内容区 */}
        <div className="lg:col-span-2 space-y-6">
          {sections.map((section, index) => (
            <ThemedCard key={index} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {section.icon}
                <h3 className="text-lg" style={{ color: theme.colors.text }}>
                  {section.title}
                </h3>
              </div>
              {section.content}
            </ThemedCard>
          ))}
        </div>

        {/* 侧边栏 */}
        {sidebar && (
          <div className="lg:col-span-1">
            {sidebar}
          </div>
        )}
      </div>
    </ThemedPageLayout>
  );
}



