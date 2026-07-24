import { RoomService } from "@/modules/room/services/room-service";
import { RoomTable } from "@/modules/room/components/room-table";
import { RoomDialog } from "@/modules/room/components/room-dialog";
import { BranchService } from "@/modules/branch/services/branch-service";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Ruang",
};

export default async function RoomsPage() {
  const rooms = await RoomService.getAll();
  const branches = await BranchService.getAllBranches();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ruang"
        description="Kelola fasilitas ruangan untuk setiap cabang."
      >
        <RoomDialog branches={branches} />
      </PageHeader>
      <div className="w-full">
        <RoomTable data={rooms} branches={branches} />
      </div>
    </div>
  );
}
