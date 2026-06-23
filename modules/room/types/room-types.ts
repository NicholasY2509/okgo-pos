import { Room, Branch } from "@/lib/generated/prisma";

export type RoomWithBranch = Room & {
  branch: Pick<Branch, "id" | "name">;
};
