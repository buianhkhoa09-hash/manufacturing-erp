import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, UserCircle, Package, Truck, ShoppingCart, FileText, CreditCard, Building2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function Sidebar() {
  const { t } = useLanguage()

  const sections = [
    { label: t('overview'), items: [{ to: '/', icon: LayoutDashboard, key: 'dashboard' }] },
    { label: t('operations'), items: [
      { to: '/sales-orders', icon: ShoppingCart, key: 'salesOrders' },
      { to: '/customers',    icon: UserCircle,   key: 'customers' },
      { to: '/invoices',     icon: FileText,     key: 'invoices' },
      { to: '/payments',     icon: CreditCard,   key: 'payments' },
    ]},
    { label: t('inventory'), items: [
      { to: '/products',  icon: Package, key: 'products' },
      { to: '/suppliers', icon: Truck,   key: 'suppliers' },
    ]},
    { label: t('hr'), items: [
      { to: '/employees',   icon: Users,     key: 'employees' },
      { to: '/departments', icon: Building2, key: 'departments' },
    ]},
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="brand">Manu<span>ERP</span></div>
        <div className="tagline">Manufacturing Suite</div>
      </div>
      {sections.map(sec => (
        <div className="sidebar-section" key={sec.label}>
          <div className="sidebar-section-label">{sec.label}</div>
          {sec.items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <item.icon />{t(item.key)}
            </NavLink>
          ))}
        </div>
      ))}
      <div className="sidebar-footer">
        <span className="status-dot" />
        <span className="status-label">API connected · :8080</span>
      </div>
    </aside>
  )
}
