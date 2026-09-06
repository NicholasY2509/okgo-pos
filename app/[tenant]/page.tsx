import { permanentRedirect } from 'next/navigation'

export default async function DashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = await params;
    permanentRedirect(`/pos`)
}