import { useEffect, useState } from 'react'
import { Search, CreditCard } from 'lucide-react'
import { paymentsApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import Badge from '../components/Badge'

export default function Payments() {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    paymentsApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r =>
    (r.invoiceNumber||'').toLowerCase().includes(search.toLowerCase()) ||
    (r.reference||'').toLowerCase().includes(search.toLowerCase())
  )

  const fmt = n => `$${Number(n).toLocaleString('en-US',{minimumFractionDigits:2})}`

  if (loading) return <div className="loading"><div className="spinner"/>{t('loading')}</div>

  return (
    <div className="page-enter">
      <div className="stat-grid" style={{marginBottom:20}}>
        <div className="stat-card">
          <div className="stat-label">{t('totalPayments')}</div>
          <div className="stat-value">{rows.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('totalCollected')}</div>
          <div className="stat-value" style={{color:'var(--accent)'}}>{fmt(rows.reduce((s,r)=>s+r.amount,0))}</div>
        </div>
      </div>
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">{t('paymentHistory')} <span style={{color:'var(--text3)',fontWeight:400}}>({filtered.length})</span></span>
          <div className="search-wrap"><Search/><input className="search-input" type="text" placeholder={t('invoiceOrRef')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('invoiceNumber')}</th><th>{t('paymentDate')}</th><th>{t('amount')}</th><th>{t('method')}</th><th>{t('reference')}</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={5}><div className="empty-state"><CreditCard/><p>{t('noPayments')}</p></div></td></tr>
                : filtered.map(r => (
                  <tr key={r.id}>
                    <td className="td-mono td-primary">{r.invoiceNumber}</td>
                    <td className="td-mono">{r.paymentDate}</td>
                    <td className="td-mono" style={{color:'var(--green)'}}>{fmt(r.amount)}</td>
                    <td><Badge status={r.method}/></td>
                    <td className="td-mono" style={{color:'var(--text3)'}}>{r.reference||'—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
