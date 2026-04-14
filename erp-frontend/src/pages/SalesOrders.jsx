import { useEffect, useState } from 'react'
import { Plus, Search, Eye, Trash2, ShoppingCart } from 'lucide-react'
import { salesOrdersApi, customersApi, productsApi, employeesApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import Modal from '../components/Modal'
import Badge from '../components/Badge'

const STATUSES = ['DRAFT','CONFIRMED','IN_PRODUCTION','SHIPPED','DELIVERED','CANCELLED']
const EMPTY_ITEM = { productId: '', quantity: 1, unitPrice: '' }

export default function SalesOrders() {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ customerId:'', status:'DRAFT', orderDate:'', deliveryDate:'', notes:'', createdById:'', items:[{...EMPTY_ITEM}] })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => Promise.all([salesOrdersApi.getAll(), customersApi.getAll(), productsApi.getAll(), employeesApi.getAll()])
    .then(([o,c,p,e]) => { setRows(o.data); setCustomers(c.data); setProducts(p.data); setEmployees(e.data) })
    .finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = rows.filter(r => r.customerName.toLowerCase().includes(search.toLowerCase()) && (!statusFilter || r.status === statusFilter))
  const today = () => new Date().toISOString().split('T')[0]

  const openAdd = () => {
    setForm({ customerId:'', status:'DRAFT', orderDate: today(), deliveryDate:'', notes:'', createdById:'', items:[{...EMPTY_ITEM}] })
    setError(''); setModal('form')
  }
  const openView = (row) => { setSelected(row); setModal('view') }
  const closeModal = () => setModal(null)

  const setItem = (i, k, v) => setForm(p => {
    const items = [...p.items]; items[i] = {...items[i], [k]: v}
    if (k === 'productId') { const prod = products.find(p => String(p.id) === String(v)); if (prod) items[i].unitPrice = prod.unitPrice }
    return {...p, items}
  })
  const addItem    = () => setForm(p => ({...p, items: [...p.items, {...EMPTY_ITEM}]}))
  const removeItem = (i) => setForm(p => ({...p, items: p.items.filter((_,idx)=>idx!==i)}))
  const total = form.items.reduce((s,i) => s + (Number(i.quantity)||0) * (Number(i.unitPrice)||0), 0)
  const fmt = n => `$${Number(n).toLocaleString('en-US',{minimumFractionDigits:2})}`

  const save = async () => {
    setSaving(true); setError('')
    try {
      await salesOrdersApi.create({
        customerId: Number(form.customerId), status: form.status,
        orderDate: form.orderDate || today(), deliveryDate: form.deliveryDate || null,
        notes: form.notes, createdById: form.createdById ? Number(form.createdById) : null,
        items: form.items.map(i => ({ productId: Number(i.productId), quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) }))
      })
      await load(); closeModal()
    } catch(e) { setError(e.response?.data?.message || 'Error') } finally { setSaving(false) }
  }

  const del = async (id) => { if (!confirm(t('deleteOrder'))) return; await salesOrdersApi.delete(id); load() }
  const updateStatus = async (id, status) => { await salesOrdersApi.updateStatus(id, status); load() }

  if (loading) return <div className="loading"><div className="spinner"/>{t('loading')}</div>

  return (
    <div className="page-enter">
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">{t('salesOrders')} <span style={{color:'var(--text3)',fontWeight:400}}>({filtered.length})</span></span>
          <div className="search-wrap"><Search/><input className="search-input" type="text" placeholder={t('customerName')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select style={{width:170}} value={statusFilter} onChange={e=>setStatus(e.target.value)}>
            <option value="">{t('allStatuses')}</option>
            {STATUSES.map(s=><option key={s} value={s}>{t(s)}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}><Plus/>{t('newOrder')}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('orderNumber')}</th><th>{t('customers')}</th><th>{t('orderDate')}</th><th>{t('deliveryDate')}</th><th>{t('total')}</th><th>{t('status')}</th><th>{t('createdBy')}</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8}><div className="empty-state"><ShoppingCart/><p>{t('noOrders')}</p></div></td></tr>
                : filtered.map(r => (
                  <tr key={r.id}>
                    <td className="td-mono td-primary">SO-{String(r.id).padStart(4,'0')}</td>
                    <td>{r.customerName}</td>
                    <td className="td-mono">{r.orderDate}</td>
                    <td className="td-mono">{r.deliveryDate||'—'}</td>
                    <td className="td-mono">{fmt(r.totalAmount)}</td>
                    <td>
                      <select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)}
                        style={{background:'transparent',border:'none',color:'inherit',cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:11}}>
                        {STATUSES.map(s=><option key={s} value={s} style={{background:'var(--bg3)'}}>{t(s)}</option>)}
                      </select>
                    </td>
                    <td>{r.createdBy||'—'}</td>
                    <td><div className="flex gap-8">
                      <button className="btn btn-ghost btn-sm" onClick={()=>openView(r)}><Eye/></button>
                      <button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}><Trash2/></button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={t('newOrder')} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?t('creating'):t('createOrder')}</button></>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-grid" style={{marginBottom:16}}>
            <div className="form-field span2"><label className="form-label">{t('customers')} *</label>
              <select value={form.customerId} onChange={e=>setForm(p=>({...p,customerId:e.target.value}))}>
                <option value="">{t('selectCustomer')}</option>
                {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field"><label className="form-label">{t('orderDate')}</label><input type="date" value={form.orderDate} onChange={e=>setForm(p=>({...p,orderDate:e.target.value}))}/></div>
            <div className="form-field"><label className="form-label">{t('deliveryDate')}</label><input type="date" value={form.deliveryDate} onChange={e=>setForm(p=>({...p,deliveryDate:e.target.value}))}/></div>
            <div className="form-field"><label className="form-label">{t('status')}</label>
              <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                {STATUSES.map(s=><option key={s} value={s}>{t(s)}</option>)}
              </select>
            </div>
            <div className="form-field"><label className="form-label">{t('createdBy')}</label>
              <select value={form.createdById} onChange={e=>setForm(p=>({...p,createdById:e.target.value}))}>
                <option value="">— None —</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:8,fontSize:11,fontFamily:'var(--font-mono)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{t('lineItems')}</div>
          {form.items.map((item, i) => (
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 80px 100px 32px',gap:8,marginBottom:8,alignItems:'end'}}>
              <div className="form-field">
                {i === 0 && <label className="form-label">{t('product')}</label>}
                <select value={item.productId} onChange={e=>setItem(i,'productId',e.target.value)}>
                  <option value="">{t('selectProduct')}</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                {i === 0 && <label className="form-label">{t('quantity')}</label>}
                <input type="number" min="1" value={item.quantity} onChange={e=>setItem(i,'quantity',e.target.value)}/>
              </div>
              <div className="form-field">
                {i === 0 && <label className="form-label">{t('unitPrice')}</label>}
                <input type="number" step="0.01" value={item.unitPrice} onChange={e=>setItem(i,'unitPrice',e.target.value)}/>
              </div>
              <button className="btn btn-danger btn-sm" onClick={()=>removeItem(i)} style={{alignSelf:'flex-end'}} disabled={form.items.length===1}>×</button>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
            <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={12}/> {t('addItem')}</button>
            <span style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--accent)'}}>{t('total')}: {fmt(total)}</span>
          </div>
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title={`Order SO-${String(selected.id).padStart(4,'0')}`} onClose={closeModal}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
            {[[t('customers'),selected.customerName],[t('status'),<Badge status={selected.status}/>],
              [t('orderDate'),selected.orderDate],[t('deliveryDate'),selected.deliveryDate||'—'],
              [t('total'),fmt(selected.totalAmount)],[t('createdBy'),selected.createdBy||'—']
            ].map(([l,v])=>(
              <div key={l}>
                <div style={{fontSize:10,fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text3)',marginBottom:3}}>{l}</div>
                <div style={{fontSize:13,color:'var(--text)'}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{t('lineItems')}</div>
          <table>
            <thead><tr><th>{t('product')}</th><th>{t('sku')}</th><th>{t('quantity')}</th><th>{t('unitPrice')}</th><th>{t('lineTotal')}</th></tr></thead>
            <tbody>{(selected.items||[]).map(i=>(
              <tr key={i.id}>
                <td className="td-primary">{i.productName}</td><td className="td-mono">{i.sku}</td>
                <td className="td-mono">{i.quantity}</td><td className="td-mono">{fmt(i.unitPrice)}</td>
                <td className="td-mono">{fmt(i.lineTotal)}</td>
              </tr>
            ))}</tbody>
          </table>
        </Modal>
      )}
    </div>
  )
}
