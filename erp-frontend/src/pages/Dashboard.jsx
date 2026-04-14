import { useEffect, useState } from 'react'
import { Users, Package, ShoppingCart, FileText, AlertTriangle, TrendingUp } from 'lucide-react'
import { customersApi, productsApi, salesOrdersApi, invoicesApi, employeesApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import Badge from '../components/Badge'

export default function Dashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [outstandingInvoices, setOutstandingInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      customersApi.getAll(), productsApi.getAll(), salesOrdersApi.getAll(),
      invoicesApi.getAll(), employeesApi.getAll(), productsApi.getLowStock(),
    ]).then(([customers, products, orders, invoices, employees, lowStockRes]) => {
      setStats({
        customers: customers.data.length, products: products.data.length,
        orders: orders.data.length, employees: employees.data.length,
        revenue: invoices.data.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0),
        outstanding: invoices.data.filter(i => !['PAID','CANCELLED'].includes(i.status)).reduce((s, i) => s + i.balance, 0),
      })
      setLowStock(lowStockRes.data.slice(0, 6))
      setRecentOrders(orders.data.slice(-5).reverse())
      setOutstandingInvoices(invoices.data.filter(i => !['PAID','CANCELLED'].includes(i.status)).slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /> {t('loading')}</div>
  const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="page-enter">
      <div className="stat-grid">
        <StatCard label={t('totalCustomers')} value={stats.customers} icon={<Users />} />
        <StatCard label={t('totalProducts')} value={stats.products} icon={<Package />} />
        <StatCard label={t('totalOrders')} value={stats.orders} icon={<ShoppingCart />} />
        <StatCard label={t('totalEmployees')} value={stats.employees} icon={<Users />} />
        <StatCard label={t('revenueCollected')} value={fmt(stats.revenue)} icon={<TrendingUp />} accent />
        <StatCard label={t('outstandingBalance')} value={fmt(stats.outstanding)} icon={<FileText />} warn={stats.outstanding > 0} />
      </div>
      <div className="dash-grid">
        <div className="table-card">
          <div className="table-header"><span className="table-header-title">{t('recentOrders')}</span></div>
          <div className="table-wrap">
            <table><thead><tr><th>#</th><th>{t('customers')}</th><th>{t('status')}</th><th>{t('total')}</th></tr></thead>
              <tbody>{recentOrders.map(o => (
                <tr key={o.id}>
                  <td className="td-mono">SO-{String(o.id).padStart(4,'0')}</td>
                  <td className="td-primary">{o.customerName}</td>
                  <td><Badge status={o.status} /></td>
                  <td className="td-mono">{fmt(o.totalAmount)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div className="table-card">
          <div className="table-header">
            <span className="table-header-title">{t('lowStockAlerts')}</span>
            {lowStock.length > 0 && <span className="low-stock-badge"><AlertTriangle size={11} /> {lowStock.length} {t('items')}</span>}
          </div>
          <div className="table-wrap">
            <table><thead><tr><th>{t('products')}</th><th>{t('sku')}</th><th>{t('stockQty')}</th><th>{t('reorderLevel')}</th></tr></thead>
              <tbody>{lowStock.length === 0
                ? <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text3)'}}>{t('allStockOk')}</td></tr>
                : lowStock.map(p => (
                  <tr key={p.id}>
                    <td className="td-primary">{p.name}</td>
                    <td className="td-mono">{p.sku}</td>
                    <td><span style={{color:'var(--red)',fontFamily:'var(--font-mono)'}}>{p.stockQty}</span></td>
                    <td className="td-mono">{p.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="table-card" style={{gridColumn:'1/-1'}}>
          <div className="table-header"><span className="table-header-title">{t('outstandingInvoices')}</span></div>
          <div className="table-wrap">
            <table><thead><tr><th>{t('invoiceNumber')}</th><th>{t('customers')}</th><th>{t('dueDate')}</th><th>{t('total')}</th><th>{t('balance')}</th><th>{t('status')}</th></tr></thead>
              <tbody>{outstandingInvoices.length === 0
                ? <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text3)'}}>{t('noOutstanding')}</td></tr>
                : outstandingInvoices.map(i => (
                  <tr key={i.id}>
                    <td className="td-mono td-primary">{i.invoiceNumber}</td>
                    <td>{i.customerName}</td>
                    <td className="td-mono">{i.dueDate}</td>
                    <td className="td-mono">{fmt(i.totalAmount)}</td>
                    <td className="td-mono" style={{color:'var(--red)'}}>{fmt(i.balance)}</td>
                    <td><Badge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent, warn }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? {color:'var(--accent)'} : warn ? {color:'var(--red)'} : {}}>{value}</div>
      <div className="stat-icon">{icon}</div>
    </div>
  )
}
