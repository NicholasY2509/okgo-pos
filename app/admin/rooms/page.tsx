import { RoomService } from "@/modules/room/services/room-service";
import { RoomList } from "@/modules/room/components/room-list";
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
      />
      <RoomList data={rooms} branches={branches} />
    </div>
  );
}
