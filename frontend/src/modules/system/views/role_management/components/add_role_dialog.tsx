import { useEffect, useState } from 'react';

import { FormDialogWrapper } from '../../../../../shared/components/ui';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { Menu, Role, RoleFormData } from '../../../types';
import { getRoleManagementCopy } from '../role_management_copy';
import { RoleForm } from './role_form';

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
    <FormDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? copy.editTitle : copy.addTitle}
      description={isEdit ? copy.editDescription : copy.addDescription}
      onSubmit={() => onSubmit(formData as RoleFormData)}
      size="3xl"
      submitText={copy.confirm}
      cancelText={copy.cancel}
    >
      <RoleForm data={formData} menus={menus} onChange={setFormData} isEdit={isEdit} />
    </FormDialogWrapper>
  );
}
