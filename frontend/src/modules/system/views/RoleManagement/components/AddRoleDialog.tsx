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
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Menu, Role, RoleFormData } from '../../../types';
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
  const { t } = useLanguageStore();
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
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t.actions.edit : t.actions.add} {t.user.role}
          </DialogTitle>
          <DialogDescription>{isEdit ? t.common.editDescription : t.common.addDescription}</DialogDescription>
        </DialogHeader>

        <RoleForm data={formData} menus={menus} onChange={setFormData} isEdit={isEdit} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={() => onSubmit(formData as RoleFormData)}>{t.common.confirm}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
