export const PERMISSION_MODULES = [
  { id: 'sales', label: 'Salg & Tilbud' },
  { id: 'customers', label: 'Kunder' },
  { id: 'projects', label: 'Projekter' },
  { id: 'finance', label: 'Økonomi' },
  { id: 'planning', label: 'Planlægning' },
  { id: 'tasks', label: 'Opgaver' },
  { id: 'materials', label: 'Materialer & Lager' },
  { id: 'equipment', label: 'Materiel & Udstyr' },
  { id: 'employees', label: 'Medarbejdere' },
  { id: 'suppliers', label: 'Leverandører' },
  { id: 'quality', label: 'Kvalitet & Sikkerhed' },
  { id: 'environment', label: 'Miljø & Affald' },
  { id: 'service', label: 'Service & Abonnementer' },
  { id: 'documents', label: 'Dokumenter & Viden' },
  { id: 'company', label: 'Firma' },
  { id: 'screens', label: 'Skærme' },
];

export const ALWAYS_ALLOWED_PATHS = new Set([
  '/dashboard',
  '/admin',
  '/admin-portal',
  '/brugerprofil',
  '/app',
  '/app/tid',
  '/app/opgaver',
  '/app/beskeder',
  '/app/bilag',
  '/app/profil',
]);

export function normalizePermissions(permissions) {
  if (Array.isArray(permissions)) return permissions.filter(Boolean);
  if (typeof permissions === 'string' && permissions.trim()) {
    try {
      const parsed = JSON.parse(permissions);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function hasModuleAccess(user, moduleId) {
  if (!moduleId) return true;
  if (user?.role === 'admin') return true;
  if (user?.role === 'customer') return false;
  if (user?.permissions == null) return true;
  const permissions = normalizePermissions(user?.permissions);
  return permissions.includes(moduleId);
}

export function pathToPermission(pathname, groups = []) {
  if (ALWAYS_ALLOWED_PATHS.has(pathname)) return null;
  const group = groups.find((entry) => entry.items?.some((item) => item.to === pathname));
  return group?.permission || null;
}
