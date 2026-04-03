import { useEffect, useRef, useState } from 'react';
import { Camera, Save, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../components/ui/avatar';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { systemNotification } from '../../../../../shared/utils/notification';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useThemeStore } from '../../../../../stores/themeStore';
import { authApi } from '../../../api/authApi';
import { useProfilePreferenceSettings } from '../../hooks/useProfilePreferenceSettings';
import { useAuthStore } from '../../../store/authStore';

export function PersonalInfo() {
  const { user, updateUser } = useAuthStore();
  const { theme } = useThemeStore();
  const { language, t } = useLanguageStore();
  const { compactMode } = useProfilePreferenceSettings();
  const zh = language === 'zh';
  const copy = {
    updateFailed: zh ? '更新失败' : 'Update failed',
    imageOnly: zh ? '请选择图片文件' : 'Please select an image file',
    imageTooLarge: zh ? '图片大小不能超过 2MB' : 'Image size cannot exceed 2MB',
    avatarUpdated: zh ? '头像已更新' : 'Avatar updated',
    avatarUploadFailed: zh ? '头像上传失败' : 'Avatar upload failed',
    uploading: zh ? '上传中...' : 'Uploading...',
    changeAvatar: zh ? '更换头像' : 'Change Avatar',
    lastLoginTime: zh ? '最后登录时间' : 'Last Login Time',
    lastLoginIp: zh ? '最后登录 IP' : 'Last Login IP',
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    realName: user?.realName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });

  useEffect(() => {
    if (editing) {
      return;
    }

    setFormData({
      realName: user?.realName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    });
  }, [editing, user?.realName, user?.email, user?.phone]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        real_name: formData.realName,
        email: formData.email,
        phone: formData.phone,
      });
      updateUser(formData);
      systemNotification.success(t.profile.messages.updateProfileSuccess);
      setEditing(false);
    } catch (error) {
      systemNotification.error(error instanceof Error ? error.message : copy.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setFormData({
      realName: user?.realName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    });
    setEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      systemNotification.error(copy.imageOnly);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      systemNotification.error(copy.imageTooLarge);
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await authApi.uploadAvatar(file);
      const avatarUrl = res.data.url;
      await authApi.updateProfile({ avatar: avatarUrl });
      updateUser({ avatar: avatarUrl });
      systemNotification.success(copy.avatarUpdated);
    } catch (error) {
      systemNotification.error(error instanceof Error ? error.message : copy.avatarUploadFailed);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={compactMode ? 'space-y-4' : 'space-y-6'}>
      <div>
        <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>{t.profile.basicInfo}</h3>
        <p className="mt-1 text-sm" style={{ color: theme.colors.textSecondary }}>{t.profile.description}</p>
      </div>

      <div className={compactMode ? 'flex items-center gap-4 border-b pb-4' : 'flex items-center gap-5 border-b pb-6'} style={{ borderColor: theme.colors.border }}>
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
              {user?.realName?.charAt(0) ?? <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={uploadingAvatar}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition hover:opacity-100 disabled:cursor-not-allowed"
          >
            {uploadingAvatar ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>

        <div className="space-y-1">
          <div className="text-lg font-medium" style={{ color: theme.colors.text }}>{user?.realName || '-'}</div>
          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{user?.username || '-'}</div>
          <Button variant="outline" size="sm" onClick={triggerFileInput} disabled={uploadingAvatar}>
            <Camera className="mr-2 h-4 w-4" />
            {uploadingAvatar ? copy.uploading : copy.changeAvatar}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg" style={{ color: theme.colors.text }}>{t.profile.basicInfo}</h3>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>{t.common.edit}</Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t.user.username}</Label>
          <Input value={user?.username ?? ''} disabled />
        </div>
        <div className="space-y-2">
          <Label>{t.user.realName}</Label>
          <Input value={formData.realName} disabled={!editing} onChange={(event) => updateField('realName', event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t.user.email}</Label>
          <Input value={formData.email} disabled={!editing} onChange={(event) => updateField('email', event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t.user.phone}</Label>
          <Input value={formData.phone} disabled={!editing} onChange={(event) => updateField('phone', event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t.user.department}</Label>
          <Input value={user?.departmentName ?? '-'} disabled />
        </div>
        <div className="space-y-2">
          <Label>{t.user.role}</Label>
          <Input value={user?.roleNames?.join(', ') ?? '-'} disabled />
        </div>
      </div>

      {editing && (
        <div className="flex gap-3">
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? (zh ? '保存中...' : 'Saving...') : t.common.save}
          </Button>
          <Button variant="outline" onClick={reset} disabled={saving}>{t.common.cancel}</Button>
        </div>
      )}

      <div className={compactMode ? 'grid grid-cols-1 gap-3 border-t pt-4 md:grid-cols-2' : 'grid grid-cols-1 gap-4 border-t pt-6 md:grid-cols-2'} style={{ borderColor: theme.colors.border }}>
        <div className="space-y-2">
          <Label>{copy.lastLoginTime}</Label>
          <Input value={user?.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString(zh ? 'zh-CN' : 'en-US') : '-'} disabled />
        </div>
        <div className="space-y-2">
          <Label>{copy.lastLoginIp}</Label>
          <Input value={user?.lastLoginIp ?? '-'} disabled />
        </div>
      </div>
    </div>
  );
}
