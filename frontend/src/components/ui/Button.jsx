export function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseClass = 'button'
  const variantClass = variant === 'secondary' ? 'button button--secondary' : 'button'

  return (
    <button className={`${baseClass} ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
