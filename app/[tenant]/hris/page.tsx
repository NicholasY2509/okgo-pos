export default async function HRISPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Human Resources & Payroll</h2>
      <p className="text-gray-600 mb-8">Branch: <span className="capitalize font-semibold">{tenant}</span></p>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded p-4">
          <h3 className="font-bold mb-2">Today's Attendance</h3>
          <p className="text-sm text-gray-500 mb-4">4 of 5 employees clocked in</p>
          <button className="bg-gray-100 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200">View Log</button>
        </div>
        <div className="border border-gray-200 rounded p-4">
          <h3 className="font-bold mb-2">Payroll Run</h3>
          <p className="text-sm text-gray-500 mb-4">Next payday: 25th of the month</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">Calculate Payroll</button>
        </div>
      </div>
    </div>
  );
}
