import { WhatsappPairingService } from "@/modules/whatsapp/services/whatsapp-pairing-service";
import { WhatsappPairingManager } from "@/modules/whatsapp/components/whatsapp-pairing-manager";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Integrasi WhatsApp | Admin",
  description: "Kelola sambungan dan penautan akun WhatsApp API Gateway.",
};

export default async function WhatsappSettingsPage() {
  const initialDashboardData = await WhatsappPairingService.listAllInstancesWithBranches().catch(() => undefined);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Integrasi WhatsApp Cabang"
        description="Kelola penautan nomor WhatsApp dan multi-instance cabang Nyenyak untuk pengiriman struk digital otomatis."
      />

      <WhatsappPairingManager initialDashboardData={initialDashboardData} />
    </div>
  );
}

