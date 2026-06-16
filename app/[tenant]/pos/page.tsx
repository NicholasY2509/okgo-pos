export default async function POSPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Point of Sale</h2>
        <p className="text-gray-600 mb-8">Branch: <span className="capitalize font-semibold">{tenant}</span></p>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Placeholder for POS products */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-gray-200 rounded p-4 text-center hover:bg-gray-50 cursor-pointer">
              <div className="bg-gray-100 h-24 mb-2 rounded"></div>
              <h4 className="font-medium">Coffee Menu {i}</h4>
              <p className="text-blue-600">Rp 25.000</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="w-96 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <h3 className="text-xl font-bold mb-4">Current Order</h3>
        <div className="flex-1 border-dashed border-2 border-gray-200 rounded-lg flex items-center justify-center text-gray-400 mb-4">
          Cart is empty
        </div>
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span>Rp 0</span>
          </div>
          <div className="flex justify-between mb-4 text-lg font-bold">
            <span>Total</span>
            <span>Rp 0</span>
          </div>
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">Charge</button>
        </div>
      </div>
    </div>
  );
}
