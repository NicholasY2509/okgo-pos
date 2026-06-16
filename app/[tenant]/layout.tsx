export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Nyenyak <span className="text-blue-600 capitalize">{tenant}</span></h1>
        </div>
        <nav className="flex gap-4">
          <a href="/pos" className="text-gray-600 hover:text-gray-900 font-medium">POS</a>
          <a href="/hris" className="text-gray-600 hover:text-gray-900 font-medium">HRIS</a>
          <a href="/accounting" className="text-gray-600 hover:text-gray-900 font-medium">Accounting</a>
        </nav>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
