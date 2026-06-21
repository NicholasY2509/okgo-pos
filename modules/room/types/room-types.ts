import { Room, Branch } from "@prisma/client";

export type RoomWithBranch = Room & {
  branch: Pick<Branch, "id" | "name">;
};
