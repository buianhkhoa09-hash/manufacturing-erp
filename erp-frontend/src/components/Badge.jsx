import { useLanguage } from '../i18n/LanguageContext'

const colorMap = {
  ACTIVE: 'badge-green', INACTIVE: 'badge-gray', ON_LEAVE: 'badge-amber',
  DRAFT: 'badge-gray', CONFIRMED: 'badge-blue', IN_PRODUCTION: 'badge-purple',
  SHIPPED: 'badge-amber', DELIVERED: 'badge-green', CANCELLED: 'badge-red',
  PENDING: 'badge-amber', RECEIVED: 'badge-green',
  PAID: 'badge-green', UNPAID: 'badge-red', PARTIALLY_PAID: 'badge-amber',
  OVERDUE: 'badge-red', DISCONTINUED: 'badge-gray',
  BANK_TRANSFER: 'badge-blue', CREDIT_CARD: 'badge-purple',
  CASH: 'badge-green', CHECK: 'badge-gray', OTHER: 'badge-gray',
}

export default function Badge({ status }) {
  const { t } = useLanguage()
  const cls = colorMap[status] || 'badge-gray'
  return <span className={`badge ${cls}`}>{t(status) || status?.replace(/_/g, ' ')}</span>
}
