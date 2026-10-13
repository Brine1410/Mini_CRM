import { LuSearch } from 'react-icons/lu'

export function SearchInput({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="search">
      <LuSearch aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  )
}

/** options: [{ value, label }] - the "all" option is added for you. */
export function SelectFilter({ label, value, onChange, options, allLabel }) {
  return (
    <label className="select-filter">
      <span className="select-filter__label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">{allLabel ?? 'All'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Pill tabs with counts, e.g. status filters. tabs: [{ value, label, count }] */
export function FilterTabs({ tabs, value, onChange, label = 'Filter by status' }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={`tab${tab.value === value ? ' is-active' : ''}`}
          aria-pressed={tab.value === value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          <span className="tab__count">{tab.count}</span>
        </button>
      ))}
    </div>
  )
}
