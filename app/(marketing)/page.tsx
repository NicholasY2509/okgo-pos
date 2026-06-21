export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Selamat datang di Nyenyak</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Sistem ERP all-in-one untuk kedai kopi Anda. Kelola Kasir, Sumber Daya Manusia, dan Akuntansi dengan mudah.
      </p>
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Mulai</button>
        <button className="px-6 py-2 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100">Pelajari Lebih Lanjut</button>
      </div>
    </div>
  );
}
