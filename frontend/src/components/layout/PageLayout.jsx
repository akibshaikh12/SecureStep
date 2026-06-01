import PageHeader from './PageHeader';

export default function PageLayout({ title, subtitle, backTo = '/', showBack = true, children }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} backTo={backTo} showBack={showBack} />
      <div className="animate-slide-up px-4 py-4">{children}</div>
    </>
  );
}
