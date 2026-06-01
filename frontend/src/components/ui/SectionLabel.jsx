export default function SectionLabel({ children, className = '' }) {
  return <h2 className={`section-label ${className}`}>{children}</h2>;
}
