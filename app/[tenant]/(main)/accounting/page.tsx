export default async function AccountingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Akuntansi & Keuangan</h2>
      <p className="text-gray-600 mb-8">Cabang: <span className="capitalize font-semibold">{tenant}</span></p>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 font-semibold text-gray-600">Tanggal</th>
              <th className="py-3 font-semibold text-gray-600">Deskripsi</th>
              <th className="py-3 font-semibold text-gray-600">Akun</th>
              <th className="py-3 font-semibold text-gray-600 text-right">Debit</th>
              <th className="py-3 font-semibold text-gray-600 text-right">Kredit</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-sm">12-06-2026</td>
              <td className="py-3 text-sm">Daily Sales Aggregation</td>
              <td className="py-3 text-sm text-blue-600">Cash in Bank</td>
              <td className="py-3 text-sm text-right">Rp 2.500.000</td>
              <td className="py-3 text-sm text-right">-</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-sm">12-06-2026</td>
              <td className="py-3 text-sm">Daily Sales Aggregation</td>
              <td className="py-3 text-sm text-blue-600">Sales Revenue</td>
              <td className="py-3 text-sm text-right">-</td>
              <td className="py-3 text-sm text-right">Rp 2.500.000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
