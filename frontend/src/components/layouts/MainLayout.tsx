import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        {children}
      </div>
    </main>
  );
}
