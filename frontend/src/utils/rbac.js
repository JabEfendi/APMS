export const SALES_ROLES = ['sales']
export const PURCHASING_ROLES = ['purchasing']
export const ADMIN_ROLES = ['admin']

export function normalizeRole(role) {
  if (SALES_ROLES.includes(role)) {
    return 'sales'
  }

  if (PURCHASING_ROLES.includes(role)) {
    return 'purchasing'
  }

  if (ADMIN_ROLES.includes(role)) {
    return 'admin'
  }

  return role || ''
}

export function isSalesRole(role) {
  return normalizeRole(role) === 'sales'
}

export function isPurchasingRole(role) {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === 'purchasing' || normalizedRole === 'admin'
}

export function isAdminRole(role) {
  return normalizeRole(role) === 'admin'
}

export function canAccessMasterItems(role) {
  return isPurchasingRole(role)
}

export function canManageMasterItems(role) {
  return isPurchasingRole(role)
}

export function canAccessInputInquiry(role) {
  return isSalesRole(role) || isPurchasingRole(role)
}

export function canEditInquiryData(role) {
  return isSalesRole(role) || isPurchasingRole(role)
}

export function canAccessDashboard(role) {
  return isPurchasingRole(role)
}

export function canViewSensitivePricing(role) {
  return isPurchasingRole(role)
}

export function canViewVendorInternal(role) {
  return isPurchasingRole(role)
}

export function canEditRequest(role) {
  return isSalesRole(role) || isPurchasingRole(role)
}

export function canEditPricing(role) {
  return isPurchasingRole(role)
}

export function canValidateRequest(role) {
  return isPurchasingRole(role)
}

export function canApproveRequest(role) {
  return isPurchasingRole(role)
}

export function canAccessRoute(role, path) {
  if (!path) {
    return true
  }

  if (path === '/') {
    return canAccessDashboard(role)
  }

  if (path.startsWith('/master-items')) {
    return canAccessMasterItems(role)
  }

  if (path === '/inquiries/new') {
    return canAccessInputInquiry(role)
  }

  if (path === '/requests/:id/edit') {
    return canEditInquiryData(role)
  }

  if (path === '/requests/new') {
    return canManageMasterItems(role)
  }

  return true
}

export function getDefaultRoute(role) {
  if (canAccessDashboard(role)) {
    return '/'
  }

  if (canAccessInputInquiry(role)) {
    return '/inquiries/new'
  }

  return '/requests'
}

export function getRoleLabel(role) {
  const normalizedRole = normalizeRole(role)

  const roleLabels = {
    sales: 'Sales',
    purchasing: 'Purchasing',
    admin: 'Admin'
  }

  return roleLabels[normalizedRole] || role || 'User'
}
