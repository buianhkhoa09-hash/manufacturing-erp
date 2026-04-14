import { useEffect, useState } from 'react'
import { Plus, Search, FileText, CreditCard } from 'lucide-react'
import { invoicesApi, salesOrdersApi, paymentsApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import Modal from '../components/Modal'
import Badge from '../components/Badge'

export default function Invoices() {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [form, setForm] = useState({ salesOrderId:'', dueDate:'', notes:'' })
  const [payForm, setPayForm] = useState({ invoiceId:'', amount:'', paymentDate:'', method:'BANK_TRANSFER', reference:'' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => Promise.all([invoicesApi.getAll(), salesOrdersApi.getAll()])
    .then(([inv, ord]) => { setRows(inv.data); setOrders(ord.data) }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const uninvoicedOrders = orders.filter(o => !rows.find(r => r.salesOrderId === o.id))
  const filtered = rows.filter(r => {
    const match = (r.invoiceNumber||'').toLowerCase().includes(search.toLowerCase()) || (r.customerName||'').toLowerCase().includes(search.toLowerCase())
    return match && (!statusFilter || r.status === statusFilter)
  })

  const openAdd = () => { setForm({salesOrderId:'', dueDate:'', notes:''}); setError(''); setModal('form') }
  const openPay = (inv) => { setPayForm({ invoiceId: inv.id, amount: inv.balance, paymentDate: today(), method:'BANK_TRANSFER', reference:'' }); setError(''); setPayModal(inv) }
  const closeModal = () => { setModal(null); setPayModal(null) }
  const today = () => new Date().toISOString().split('T')[0]
  const fmt = n => `$${Number(n).toLocaleString('en-US',{minimumFractionDigits:2})}`

  const save = async () => {
    setSaving(true); setError('')
    try { await invoicesApi.create({...form, salesOrderId: Number(form.salesOrderId)}); await load(); closeModal() }
    catch(e) { setError(e.response?.data?.message || 'Error') } finally { setSaving(false) }
  }

  const savePay = async () => {
    setSaving(true); setError('')
    try { await paymentsApi.create({...payForm, invoiceId: Number(payForm.invoiceId), amount: Number(payForm.amount)}); await load(); closeModal() }
    catch(e) { setError(e.response?.data?.message || 'Error') } finally { setSaving(false) }
  }

  const f  = (k) => (e) => setForm(p=>({...p,[k]:e.target.value}))
  const fp = (k) => (e) => setPayForm(p=>({...p,[k]:e.target.value}))

  if (loading) return <div className="loading"><div className="spinner"/>{t('loading')}</div>

  return (
    <div className="page-enter">
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">{t('invoices')} <span style={{color:'var(--text3)',fontWeight:400}}>({filtered.length})</span></span>
          <div className="search-wrap"><Search/><input className="search-input" type="text" placeholder={t('search')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select style={{width:180}} value={statusFilter} onChange={e=>setStatus(e.target.value)}>
            <option value="">{t('allStatuses')}</option>
            {['UNPAID','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED'].map(s=><option key={s} value={s}>{t(s)}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd} disabled={uninvoicedOrders.length===0}><Plus/>{t('newInvoice')}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('invoiceNumber')}</th><th>{t('customers')}</th><th>{t('issuedDate')}</th><th>{t('dueDate')}</th><th>{t('total')}</th><th>{t('paid')}</th><th>{t('balance')}</th><th>{t('status')}</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9}><div className="empty-state"><FileText/><p>{t('noInvoices')}</p></div></td></tr>
                : filtered.map(r => (
                  <tr key={r.id}>
                    <td className="td-mono td-primary">{r.invoiceNumber}</td>
                    <td>{r.customerName}</td>
                    <td className="td-mono">{r.issuedDate}</td><td className="td-mono">{r.dueDate}</td>
                    <td className="td-mono">{fmt(r.totalAmount)}</td>
                    <td className="td-mono" style={{color:'var(--green)'}}>{fmt(r.paidAmount)}</td>
                    <td className="td-mono" style={{color: r.balance > 0 ? 'var(--red)' : 'var(--text3)'}}>{fmt(r.balance)}</td>
                    <td><Badge status={r.status}/></td>
                    <td>{r.status !== 'PAID' && r.status !== 'CANCELLED' && (
                      <button className="btn btn-ghost btn-sm" onClick={()=>openPay(r)}><CreditCard size={13}/> {t('recordPayment')}</button>
                    )}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={t('newInvoice')} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?t('creating'):t('createInvoice')}</button></>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-grid">
            <div className="form-field span2"><label className="form-label">{t('salesOrder')} *</label>
              <select value={form.salesOrderId} onChange={f('salesOrderId')}>
                <option value="">{t('selectOrder')}</option>
                {uninvoicedOrders.map(o=><option key={o.id} value={o.id}>SO-{String(o.id).padStart(4,'0')} — {o.customerName} — ${o.totalAmount}</option>)}
              </select>
            </div>
            <div className="form-field span2"><label className="form-label">{t('dueDate')} *</label><input type="date" value={form.dueDate} onChange={f('dueDate')}/></div>
            <div className="form-field span2"><label className="form-label">{t('notes')}</label><input type="text" value={form.notes} onChange={f('notes')}/></div>
          </div>
        </Modal>
      )}

      {payModal && (
        <Modal title={`${t('recordPaymentFor')} — ${payModal.invoiceNumber}`} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button><button className="btn btn-primary" onClick={savePay} disabled={saving}>{saving?t('saving'):t('recordPaymentFor')}</button></>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{marginBottom:14,padding:'10px 14px',background:'var(--bg3)',borderRadius:6,fontFamily:'var(--font-mono)',fontSize:12}}>
            {t('balanceDue')}: <span style={{color:'var(--red)'}}>  ${Number(payModal.balance).toFixed(2)}</span>
          </div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">{t('amount')} *</label><input type="number" step="0.01" value={payForm.amount} onChange={fp('amount')}/></div>
            <div className="form-field"><label className="form-label">{t('paymentDate')}</label><input type="date" value={payForm.paymentDate} onChange={fp('paymentDate')}/></div>
            <div className="form-field"><label className="form-label">{t('method')}</label>
              <select value={payForm.method} onChange={fp('method')}>
                {['BANK_TRANSFER','CREDIT_CARD','CASH','CHECK','OTHER'].map(m=><option key={m} value={m}>{t(m)}</option>)}
              </select>
            </div>
            <div className="form-field"><label className="form-label">{t('reference')}</label><input type="text" value={payForm.reference} onChange={fp('reference')}/></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
