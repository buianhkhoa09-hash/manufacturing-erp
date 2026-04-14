import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Truck } from 'lucide-react'
import { suppliersApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import Modal from '../components/Modal'
import Badge from '../components/Badge'

const EMPTY = { name:'', contactName:'', email:'', phone:'', address:'', country:'', status:'ACTIVE' }

export default function Suppliers() {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => suppliersApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setModal('form') }
  const openEdit = (row) => { setForm({...row}); setEditing(row.id); setError(''); setModal('form') }
  const closeModal = () => setModal(null)

  const save = async () => {
    setSaving(true); setError('')
    try {
      if (editing) await suppliersApi.update(editing, form)
      else         await suppliersApi.create(form)
      await load(); closeModal()
    } catch(e) { setError(e.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const del = async (id) => { if (!confirm(t('deleteSupplier'))) return; await suppliersApi.delete(id); load() }
  const f = (k) => (e) => setForm(p => ({...p, [k]: e.target.value}))

  if (loading) return <div className="loading"><div className="spinner"/>{t('loading')}</div>

  return (
    <div className="page-enter">
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">{t('suppliers')} <span style={{color:'var(--text3)',fontWeight:400}}>({filtered.length})</span></span>
          <div className="search-wrap"><Search/><input className="search-input" type="text" placeholder={t('search')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button className="btn btn-primary" onClick={openAdd}><Plus/>{t('addSupplier')}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('name')}</th><th>{t('contactName')}</th><th>{t('email')}</th><th>{t('phone')}</th><th>{t('country')}</th><th>{t('status')}</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7}><div className="empty-state"><Truck/><p>{t('noSuppliers')}</p></div></td></tr>
                : filtered.map(r => (
                  <tr key={r.id}>
                    <td className="td-primary">{r.name}</td><td>{r.contactName}</td><td>{r.email}</td>
                    <td className="td-mono">{r.phone}</td><td>{r.country}</td>
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
        <Modal title={editing ? t('editSupplier') : t('newSupplier')} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?t('saving'):t('save')}</button></>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-grid">
            <div className="form-field span2"><label className="form-label">{t('companyName')} *</label><input type="text" value={form.name} onChange={f('name')}/></div>
            <div className="form-field"><label className="form-label">{t('contactName')}</label><input type="text" value={form.contactName||''} onChange={f('contactName')}/></div>
            <div className="form-field"><label className="form-label">{t('email')} *</label><input type="email" value={form.email} onChange={f('email')}/></div>
            <div className="form-field"><label className="form-label">{t('phone')}</label><input type="text" value={form.phone||''} onChange={f('phone')}/></div>
            <div className="form-field"><label className="form-label">{t('country')}</label><input type="text" value={form.country||''} onChange={f('country')}/></div>
            <div className="form-field span2"><label className="form-label">{t('address')}</label><input type="text" value={form.address||''} onChange={f('address')}/></div>
            <div className="form-field"><label className="form-label">{t('status')}</label><select value={form.status} onChange={f('status')}><option value="ACTIVE">{t('ACTIVE')}</option><option value="INACTIVE">{t('INACTIVE')}</option></select></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
