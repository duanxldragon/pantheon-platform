type PermissionTuple = { obj: string; act: string };

function splitPermission(permission: string): PermissionTuple {
  const raw = String(permission || '').trim();
  const idx = raw.lastIndexOf(':');
  if (idx <= 0 || idx === raw.length - 1) {
    return { obj: raw, act: '' };
  }
  return { obj: raw.slice(0, idx), act: raw.slice(idx + 1) };
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchPath(pattern: string, path: string): boolean {
  const normalizedPattern = String(pattern || '').trim();
  const normalizedPath = String(path || '').trim();
  if (!normalizedPattern) return false;
  if (normalizedPattern === '*' || normalizedPattern === '/*') return true;

  const segments = normalizedPattern.split('/').map((segment) => {
    if (!segment) return '';
    if (segment === '*') return '.*';
    if (segment.startsWith(':')) return '[^/]+';
    return escapeRegExp(segment).replace(/\\\*/g, '.*');
  });

  const matcher = new RegExp(`^${segments.join('/')}$`);
  return matcher.test(normalizedPath);
}

export function matchPermissionPattern(userPerm: string, requiredPerm: string): boolean {
  if (!userPerm || !requiredPerm) return false;
  if (
    userPerm === '*:*:*' ||
    requiredPerm === '*:*:*' ||
    userPerm === '/api/v1/*:*' ||
    userPerm === '/api/v1/*'
  ) {
    return true;
  }

  const userTuple = splitPermission(userPerm);
  const requiredTuple = splitPermission(requiredPerm);
  const userAction = (userTuple.act || '').toLowerCase();
  const requiredAction = (requiredTuple.act || '').toLowerCase();

  if (!matchPath(userTuple.obj, requiredTuple.obj)) return false;
  if (userAction === '*' || requiredAction === '*') return true;
  if (!userAction || !requiredAction) return userPerm === requiredPerm;

  return userAction === requiredAction;
}
