import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { departmentsApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import Modal from '../components/Modal'

const EMPTY = { name:'', description:'' }

export default function Departments() {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => departmentsApi.getAll().then(r => setRows(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setModal('form') }
  const openEdit = (row) => { setForm({name:row.name, description:row.description||''}); setEditing(row.id); setError(''); setModal('form') }
  const closeModal = () => setModal(null)

  const save = async () => {
    setSaving(true); setError('')
    try {
      if (editing) await departmentsApi.update(editing, form)
      else         await departmentsApi.create(form)
      await load(); closeModal()
    } catch(e) { setError(e.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const del = async (id) => { if (!confirm(t('deleteDepartment'))) return; await departmentsApi.delete(id); load() }
  const f = (k) => (e) => setForm(p => ({...p, [k]: e.target.value}))

  if (loading) return <div className="loading"><div className="spinner"/>{t('loading')}</div>

  return (
    <div className="page-enter">
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">{t('departments')}</span>
          <button className="btn btn-primary ml-auto" onClick={openAdd}><Plus/>{t('addDepartment')}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>{t('name')}</th><th>{t('description')}</th><th>{t('employeeCount')}</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan={5}><div className="empty-state"><Building2/><p>{t('noDepartments')}</p></div></td></tr>
                : rows.map(r => (
                  <tr key={r.id}>
                    <td className="td-mono">{r.id}</td>
                    <td className="td-primary">{r.name}</td>
                    <td style={{color:'var(--text3)'}}>{r.description}</td>
                    <td className="td-mono">{r.employeeCount}</td>
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
        <Modal title={editing ? t('editDepartment') : t('newDepartment')} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?t('saving'):t('save')}</button></>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-grid">
            <div className="form-field span2"><label className="form-label">{t('name')} *</label><input type="text" value={form.name} onChange={f('name')}/></div>
            <div className="form-field span2"><label className="form-label">{t('description')}</label><input type="text" value={form.description} onChange={f('description')}/></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
