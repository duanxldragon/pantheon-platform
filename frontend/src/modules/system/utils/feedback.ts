interface EntityFeedbackOptions {
  zh: string;
  en: string;
  enPlural?: string;
}

export function createEntityFeedback(zh: boolean, options: EntityFeedbackOptions) {
  const entityEn = options.en.toLowerCase();
  const entityPluralEn = (options.enPlural ?? `${entityEn}s`).toLowerCase();

  return {
    loadFailed: zh ? `加载${options.zh}失败，请重试` : `Failed to load ${entityEn}`,
    createSuccess: zh ? `${options.zh}创建成功` : `${options.en} created successfully`,
    createFailed: zh ? `${options.zh}创建失败，请重试` : `Failed to create ${entityEn}`,
    updateSuccess: zh ? `${options.zh}更新成功` : `${options.en} updated successfully`,
    updateFailed: zh ? `${options.zh}更新失败，请重试` : `Failed to update ${entityEn}`,
    saveFailed: zh ? `${options.zh}保存失败，请重试` : `Failed to save ${entityEn}`,
    deleteSuccess: zh ? `${options.zh}删除成功` : `${options.en} deleted successfully`,
    deleteFailed: zh ? `${options.zh}删除失败，请重试` : `Failed to delete ${entityEn}`,
    importSuccess: zh ? `${options.zh}导入成功` : `${options.en} import successful`,
    importFailed: zh ? `${options.zh}导入失败，请重试` : `Failed to import ${entityEn}`,
    exportSuccess: zh ? `${options.zh}导出成功` : `${options.en} exported successfully`,
    exportFailed: zh ? `${options.zh}导出失败，请重试` : `Failed to export ${entityEn}`,
    statusUpdateFailed: zh
      ? `${options.zh}状态更新失败，请重试`
      : `Failed to update ${entityEn} status`,
    batchStatusUpdateFailed: zh
      ? `${options.zh}批量状态更新失败，请重试`
      : `Failed to batch update ${entityEn} status`,
    batchDeleteSuccess: (count: number) =>
      zh ? `已批量删除 ${count} 个${options.zh}` : `${count} ${entityPluralEn} deleted`,
    batchDeleteFailed: zh
      ? `${options.zh}批量删除失败，请重试`
      : `Failed to batch delete ${entityPluralEn}`,
    addMembersFailed: zh
      ? `${options.zh}成员添加失败，请重试`
      : `Failed to add ${entityEn} members`,
    assignMembersFailed: zh
      ? `${options.zh}成员分配失败，请重试`
      : `Failed to assign ${entityEn} members`,
    removeMemberFailed: zh
      ? `${options.zh}成员移除失败，请重试`
      : `Failed to remove ${entityEn} member`,
  };
}

export function createResetPasswordMessages(zh: boolean) {
  return {
    success: zh ? '密码重置成功' : 'Password reset successfully',
    failed: zh ? '密码重置失败，请重试' : 'Failed to reset password',
  };
}
