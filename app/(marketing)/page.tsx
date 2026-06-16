export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Nyenyak</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        The all-in-one ERP system for your coffee shop. Manage Point of Sale, Human Resources, and Accounting effortlessly.
      </p>
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Get Started</button>
        <button className="px-6 py-2 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100">Learn More</button>
      </div>
    </div>
  );
}
