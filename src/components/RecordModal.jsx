import { Fragment, useId, useState } from 'react'
import Modal from './Modal.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useToast } from './Toast.jsx'
import { FORMS } from '../config/forms.js'
import { SCHEMA, capitalize } from '../config/schema.js'
import { fromDateTimeInput, toDateTimeInput } from '../utils/format.js'

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function toFormValue(field, raw) {
  if (raw === null || raw === undefined) return ''
  if (field.type === 'datetime') return toDateTimeInput(raw)
  return String(raw)
}

function validate(fields, values) {
  const errors = {}
  for (const field of fields) {
    const value = String(values[field.name] ?? '').trim()

    if (field.required && !value) {
      errors[field.name] = field.type === 'select' ? 'Choose an option' : 'This field is required'
      continue
    }
    if (!value) continue

    if (field.maxLength && value.length > field.maxLength) {
      errors[field.name] = `Keep this under ${field.maxLength} characters`
    } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.name] = 'Enter a valid email address, like name@company.com'
    } else if (field.type === 'number') {
      const number = Number(value)
      if (Number.isNaN(number)) errors[field.name] = 'Enter a number'
      else if (number < 0) errors[field.name] = 'Enter zero or a positive number'
      else if (field.max && number > field.max) errors[field.name] = 'This number is too large'
    }
  }
  return errors
}

function toPayload(fields, values) {
  const payload = {}
  for (const field of fields) {
    const raw = String(values[field.name] ?? '').trim()
    if (field.type === 'number') {
      payload[field.name] = raw === '' ? (field.emptyAs ?? null) : Number(raw)
    } else if (field.type === 'select') {
      payload[field.name] = raw === '' ? null : field.numeric ? Number(raw) : raw
    } else if (field.type === 'datetime') {
      payload[field.name] = fromDateTimeInput(raw)
    } else {
      payload[field.name] = raw === '' ? null : raw
    }
  }
  return payload
}

// ---------------------------------------------------------------------------
// one form control
// ---------------------------------------------------------------------------
function FormField({ field, value, error, onChange, autoFocus }) {
  const reactId = useId()
  const id = `${reactId}-${field.name}`
  const errorId = `${id}-error`
  const common = {
    id,
    name: field.name,
    value,
    disabled: field.disabled,
    autoFocus,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': error ? errorId : undefined,
    onChange: (event) => onChange(field.name, event.target.value),
  }

  let control
  if (field.type === 'select') {
    control = (
      <select className="select" {...common}>
        {!field.required || value === '' ? <option value="">{field.placeholder ?? 'None'}</option> : null}
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  } else if (field.type === 'textarea') {
    control = <textarea className="textarea" rows={3} {...common} />
  } else {
    const inputType = field.type === 'datetime' ? 'datetime-local' : field.type
    control = (
      <input
        className="input"
        type={inputType}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        min={field.type === 'number' ? field.min : undefined}
        step={field.type === 'number' ? '0.01' : undefined}
        {...common}
      />
    )
  }

  return (
    <div className={`field${field.full ? ' field--full' : ''}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required ? <span className="field__req" aria-hidden="true"> *</span> : null}
      </label>
      {control}
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// the modal
// ---------------------------------------------------------------------------
export default function RecordModal({ table, record, defaults, onClose }) {
  const { data, currentUser, add, update } = useCrm()
  const toast = useToast()
  const formId = useId()

  const definition = FORMS[table]
  const schema = SCHEMA[table]
  const isEdit = Boolean(record)

  const [values, setValues] = useState(() => {
    const source = isEdit ? record : { ...definition.defaults({ currentUser }), ...defaults }
    const initial = {}
    for (const field of definition.fields(data, {})) {
      initial[field.name] = toFormValue(field, source[field.name])
    }
    return initial
  })
  const [errors, setErrors] = useState({})

  const fields = definition.fields(data, values)

  function handleChange(name, value) {
    setValues((current) => {
      const next = { ...current, [name]: value }
      return definition.onChange ? definition.onChange(next, name, data) : next
    })
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const found = { ...validate(fields, values), ...(definition.validate ? definition.validate(values, data, record) : {}) }
    if (Object.values(found).some(Boolean)) {
      setErrors(found)
      return
    }

    const payload = toPayload(fields, values)
    if (isEdit) {
      update(table, record[schema.pk], payload)
      toast('Changes saved')
    } else {
      add(table, payload)
      toast(`${capitalize(schema.singular)} added`)
    }
    onClose()
  }

  return (
    <Modal
      title={`${isEdit ? 'Edit' : 'Add'} ${schema.singular}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn--primary">
            {isEdit ? 'Save changes' : `Add ${schema.singular}`}
          </button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
        {fields.map((field, index) => (
          <Fragment key={field.name}>
            {field.group ? <h3 className="form-group">{field.group}</h3> : null}
            <FormField
              field={field}
              value={values[field.name] ?? ''}
              error={errors[field.name]}
              onChange={handleChange}
              autoFocus={index === 0}
            />
          </Fragment>
        ))}
      </form>
    </Modal>
  )
}
