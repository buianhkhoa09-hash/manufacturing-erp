import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import { employeesApi, departmentsApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'
import Modal from '../components/Modal'
import Badge from '../components/Badge'

const EMPTY = { firstName:'', lastName:'', email:'', phone:'', role:'', departmentId:'', hireDate:'', salary:'', status:'ACTIVE' }

export default function Employees() {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [departments, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => Promise.all([employeesApi.getAll(), departmentsApi.getAll()])
    .then(([e, d]) => { setRows(e.data); setDepts(d.data) }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = rows.filter(r => {
    const name = `${r.firstName} ${r.lastName}`.toLowerCase()
    return (name.includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase())) &&
           (!deptFilter || String(r.departmentId) === deptFilter)
  })

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setModal('form') }
  const openEdit = (row) => { setForm({...row, departmentId: String(row.departmentId)}); setEditing(row.id); setError(''); setModal('form') }
  const closeModal = () => setModal(null)

  const save = async () => {
    setSaving(true); setError('')
    try {
      const payload = {...form, departmentId: Number(form.departmentId), salary: Number(form.salary)}
      if (editing) await employeesApi.update(editing, payload)
      else         await employeesApi.create(payload)
      await load(); closeModal()
    } catch(e) { setError(e.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const del = async (id) => { if (!confirm(t('deleteEmployee'))) return; await employeesApi.delete(id); load() }
  const f = (k) => (e) => setForm(p => ({...p, [k]: e.target.value}))
  const fmt = n => `$${Number(n).toLocaleString()}`

  if (loading) return <div className="loading"><div className="spinner"/>{t('loading')}</div>

  return (
    <div className="page-enter">
      <div className="table-card">
        <div className="table-header">
          <span className="table-header-title">{t('employees')} <span style={{color:'var(--text3)',fontWeight:400}}>({filtered.length})</span></span>
          <div className="search-wrap"><Search/><input className="search-input" placeholder={t('nameOrRole')} value={search} onChange={e=>setSearch(e.target.value)} type="text"/></div>
          <select style={{width:160}} value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
            <option value="">{t('allDepartments')}</option>
            {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openAdd}><Plus/>{t('addEmployee')}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('name')}</th><th>{t('role')}</th><th>{t('department')}</th><th>{t('email')}</th><th>{t('salary')}</th><th>{t('hireDate')}</th><th>{t('status')}</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8}><div className="empty-state"><Users/><p>{t('noEmployees')}</p></div></td></tr>
                : filtered.map(r => (
                  <tr key={r.id}>
                    <td className="td-primary">{r.firstName} {r.lastName}</td>
                    <td>{r.role}</td><td>{r.departmentName}</td><td>{r.email}</td>
                    <td className="td-mono">{fmt(r.salary)}</td>
                    <td className="td-mono">{r.hireDate}</td>
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
        <Modal title={editing ? t('editEmployee') : t('newEmployee')} onClose={closeModal}
          footer={<><button className="btn btn-ghost" onClick={closeModal}>{t('cancel')}</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?t('saving'):t('save')}</button></>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-grid">
            <div className="form-field"><label className="form-label">{t('firstName')} *</label><input type="text" value={form.firstName} onChange={f('firstName')}/></div>
            <div className="form-field"><label className="form-label">{t('lastName')} *</label><input type="text" value={form.lastName} onChange={f('lastName')}/></div>
            <div className="form-field span2"><label className="form-label">{t('email')} *</label><input type="email" value={form.email} onChange={f('email')}/></div>
            <div className="form-field"><label className="form-label">{t('phone')}</label><input type="text" value={form.phone||''} onChange={f('phone')}/></div>
            <div className="form-field"><label className="form-label">{t('role')} *</label><input type="text" value={form.role} onChange={f('role')}/></div>
            <div className="form-field"><label className="form-label">{t('department')} *</label><select value={form.departmentId} onChange={f('departmentId')}><option value="">Select...</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="form-field"><label className="form-label">{t('hireDate')} *</label><input type="date" value={form.hireDate} onChange={f('hireDate')}/></div>
            <div className="form-field"><label className="form-label">{t('salary')} *</label><input type="number" value={form.salary} onChange={f('salary')}/></div>
            <div className="form-field"><label className="form-label">{t('status')}</label><select value={form.status} onChange={f('status')}><option value="ACTIVE">{t('ACTIVE')}</option><option value="INACTIVE">{t('INACTIVE')}</option><option value="ON_LEAVE">{t('ON_LEAVE')}</option></select></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
