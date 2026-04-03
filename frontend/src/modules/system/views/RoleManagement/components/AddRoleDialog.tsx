import { useEffect, useState } from 'react';

import { Button } from '../../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../../components/ui/dialog';
import { getDialogClassName, getDialogStyle } from '../../../../../shared/constants/dialogSizes';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Menu, Role, RoleFormData } from '../../../types';
import { getRoleManagementCopy } from '../roleManagementCopy';
import { RoleForm } from './RoleForm';

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoleFormData) => void;
  menus: Menu[];
  initialData?: Partial<Role>;
}

export function AddRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  menus,
  initialData,
}: AddRoleDialogProps) {
  const { language } = useLanguageStore();
  const copy = getRoleManagementCopy(language).dialog;
  const [formData, setFormData] = useState<Partial<RoleFormData>>({
    name: '',
    code: '',
    menuIds: [],
    status: 'active',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        menuIds: initialData.menuIds || [],
        status: initialData.status || 'active',
        description: initialData.description || '',
      });
      return;
    }

    setFormData({
      name: '',
      code: '',
      menuIds: [],
      status: 'active',
      description: '',
    });
  }, [initialData, open]);

  const isEdit = Boolean(initialData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={getDialogClassName('3xl', 'flex min-h-0 flex-col p-0')}
        style={{ ...getDialogStyle('3xl'), height: '92vh', maxHeight: '860px' }}
      >
        <DialogHeader className="shrink-0 border-b border-slate-100/90 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
            {isEdit ? copy.editTitle : copy.addTitle}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">
            {isEdit ? copy.editDescription : copy.addDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <RoleForm data={formData} menus={menus} onChange={setFormData} isEdit={isEdit} />
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-100/90 bg-slate-50/90 px-6 py-4 sm:justify-between">
          <div className="text-xs text-slate-400">
            {isEdit ? copy.editDescription : copy.addDescription}
          </div>
          <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-2xl border-slate-200 bg-white px-4 hover:bg-slate-50">
            {copy.cancel}
          </Button>
          <Button onClick={() => onSubmit(formData as RoleFormData)} className="rounded-2xl bg-primary px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md">
            {copy.confirm}
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
