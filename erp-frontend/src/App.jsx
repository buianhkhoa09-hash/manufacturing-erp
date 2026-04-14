import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import Sidebar      from './components/Sidebar'
import Dashboard    from './pages/Dashboard'
import Customers    from './pages/Customers'
import Employees    from './pages/Employees'
import Departments  from './pages/Departments'
import Products     from './pages/Products'
import Suppliers    from './pages/Suppliers'
import SalesOrders  from './pages/SalesOrders'
import Invoices     from './pages/Invoices'
import Payments     from './pages/Payments'

const titleKeys = {
  '/':             'dashboard',
  '/customers':    'customers',
  '/employees':    'employees',
  '/departments':  'departments',
  '/products':     'products',
  '/suppliers':    'suppliers',
  '/sales-orders': 'salesOrders',
  '/invoices':     'invoices',
  '/payments':     'payments',
}

function LangSwitcher() {
  const { lang, switchLang } = useLanguage()
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={() => switchLang('en')} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border2)', background: lang === 'en' ? 'var(--accent)' : 'transparent', color: lang === 'en' ? '#000' : 'var(--text2)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500, transition: 'all 0.15s' }}>
        🇬🇧 EN
      </button>
      <button onClick={() => switchLang('de')} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border2)', background: lang === 'de' ? 'var(--accent)' : 'transparent', color: lang === 'de' ? '#000' : 'var(--text2)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500, transition: 'all 0.15s' }}>
        🇩🇪 DE
      </button>
    </div>
  )
}

function Layout() {
  const loc = useLocation()
  const { t } = useLanguage()
  const titleKey = titleKeys[loc.pathname] || 'dashboard'

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{t(titleKey)}</span>
          <LangSwitcher />
        </div>
        <div className="page-body">
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/customers"    element={<Customers />} />
            <Route path="/employees"    element={<Employees />} />
            <Route path="/departments"  element={<Departments />} />
            <Route path="/products"     element={<Products />} />
            <Route path="/suppliers"    element={<Suppliers />} />
            <Route path="/sales-orders" element={<SalesOrders />} />
            <Route path="/invoices"     element={<Invoices />} />
            <Route path="/payments"     element={<Payments />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </LanguageProvider>
  )
}
