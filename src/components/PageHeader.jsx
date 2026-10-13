export default function PageHeader({ title, description, children }) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children ? <div className="page-header__actions">{children}</div> : null}
    </header>
  )
}
