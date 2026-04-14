import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'
import { productsApi, suppliersApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import Modal from '../components/Modal'
import Badge from '../components/Badge'

const EMPTY = { name:'', sku:'', category:'', description:'', unitPrice:'', costPrice:'', stockQty:0, reorderLevel:10, unit:'pcs', supplierId:'', status:'ACTIVE' }

export default function Products() {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLow, setFilterLow] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => Promise.all([productsApi.getAll(), suppliersApi.getAll()])
    .then(([p, s]) => { setRows(p.data); setSuppliers(s.data) }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = rows.filter(r => {
    const match = r.name.toLowerCase().includes(search.toLowerCase()) || r.sku.toLowerCase().includes(search.toLowerCase())
    return match && (!filterLow || r.lowStock)
  })

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setModal('form') }
  const openEdit = (row) => { setForm({...row, supplierId: row.supplierId||''}); setEditing(row.id); setError(''); setModal('form') }
  const closeModal = () => setModal(null)

  const save = async () => {
    setSaving(true); setError('')
    try {
      const payload = {...form, supplierId: form.supplierId || null}
      if (editing) await productsApi.update(editing, payload)
      else         await productsApi.create(payload)
      await load(); closeModal()
    } catch(e) { setError(e.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const del = async (id) => { if (!confirm(t('deleteProduct'))) return; await productsApi.delete(id); load() }
  const f = (k) => (e) => setForm(p => ({...p, [k]: e.target.value}))
  const fmt = n => `$${Number(n).toLocaleString('en-US', {minimumFractionDigits:2})}`
  const lowCount = rows.filter(r => r.lowStock).length

  if (loading) return <div className="loading"><div className="spinner"/>{t('loading')}</div>

  return (
    <div className="page-enter">
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">{t('products')} <span style={{color:'var(--text3)',fontWeight:400}}>({filtered.length})</span></span>
          <div className="search-wrap"><Search/><input className="search-input" placeholder={t('nameOrSku')} value={search} onChange={e=>setSearch(e.target.value)} type="text"/></div>
          {lowCount > 0 && <button className={`btn btn-sm ${filterLow ? 'btn-primary' : 'btn-ghost'}`} onClick={()=>setFilterLow(p=>!p)}><AlertTriangle size={13}/>{lowCount} {t('lowStockFilter')}</button>}
          <button className="btn btn-primary" onClick={openAdd}><Plus/>{t('addProduct')}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('name')}</th><th>{t('sku')}</th><th>{t('category')}</th><th>{t('unitPrice')}</th><th>{t('costPrice')}</th><th>{t('stockQty')}</th><th>{t('status')}</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8}><div className="empty-state"><Package/><p>{t('noProducts')}</p></div></td></tr>
                : filtered.map(r => (
                  <tr key={r.id}>
                    <td className="td-primary">{r.name}{r.lowStock && <span className="low-stock-badge" style={{marginLeft:8}}><AlertTriangle size={10}/> {t('lowStock')}</span>}</td>
                    <td className="td-mono">{r.sku}</td><td>{r.category}</td>
                    <td className="td-mono">{fmt(r.unitPrice)}</td>
                    <td className="td-mono" style={{color:'var(--text3)'}}>{fmt(r.costPrice)}</td>
                    <td className="td-mono" style={{color: r.lowStock ? 'var(--red)' : 'var(--green)'}}>{r.stockQty} {r.unit}</td>
                    <td><Badge status={r.status}/></td>
                    <td><div className="flex gap-8">
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(r)}><Pencil/></button>
                      <button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}><Trash2/></button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal === 'form' && (
        <Modal title={editing ? t('editProduct') : t('newProduct')} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?t('saving'):t('save')}</button></>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-grid">
            <div className="form-field span2"><label className="form-label">{t('name')} *</label><input type="text" value={form.name} onChange={f('name')}/></div>
            <div className="form-field"><label className="form-label">{t('sku')} *</label><input type="text" value={form.sku} onChange={f('sku')}/></div>
            <div className="form-field"><label className="form-label">{t('category')}</label><input type="text" value={form.category||''} onChange={f('category')}/></div>
            <div className="form-field"><label className="form-label">{t('unitPrice')} *</label><input type="number" step="0.01" value={form.unitPrice} onChange={f('unitPrice')}/></div>
            <div className="form-field"><label className="form-label">{t('costPrice')} *</label><input type="number" step="0.01" value={form.costPrice} onChange={f('costPrice')}/></div>
            <div className="form-field"><label className="form-label">{t('stockQty')}</label><input type="number" value={form.stockQty} onChange={f('stockQty')}/></div>
            <div className="form-field"><label className="form-label">{t('reorderLevel')}</label><input type="number" value={form.reorderLevel} onChange={f('reorderLevel')}/></div>
            <div className="form-field"><label className="form-label">{t('unit')}</label><input type="text" value={form.unit} onChange={f('unit')}/></div>
            <div className="form-field"><label className="form-label">{t('status')}</label><select value={form.status} onChange={f('status')}><option value="ACTIVE">{t('ACTIVE')}</option><option value="DISCONTINUED">{t('DISCONTINUED')}</option></select></div>
            <div className="form-field span2"><label className="form-label">{t('supplier')}</label><select value={form.supplierId||''} onChange={f('supplierId')}><option value="">— None —</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
