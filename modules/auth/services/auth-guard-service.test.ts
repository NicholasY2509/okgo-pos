import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthGuardService } from "./auth-guard-service";
import * as authModule from "../auth";

vi.mock("../auth", () => ({
  auth: vi.fn(),
}));

describe("AuthGuardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when no user session exists", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);

    const result = await AuthGuardService.requireAuth();

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("should succeed when user is authenticated with no role requirements", async () => {
    vi.mocked(authModule.auth).mockResolvedValue({
      user: {
        id: "usr-123",
        name: "Test Staff",
        role: { name: "CASHIER" },
      },
    } as never);

    const result = await AuthGuardService.requireAuth();

    expect(result.success).toBe(true);
    expect(result.session?.user.id).toBe("usr-123");
    expect(result.session?.user.role).toBe("CASHIER");
  });

  it("should return forbidden when user does not have the required role", async () => {
    vi.mocked(authModule.auth).mockResolvedValue({
      user: {
        id: "usr-123",
        name: "Test Staff",
        role: { name: "CASHIER" },
      },
    } as never);

    const result = await AuthGuardService.requireAuth(["ADMIN"]);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Forbidden");
  });

  it("should succeed when user has one of the allowed roles", async () => {
    vi.mocked(authModule.auth).mockResolvedValue({
      user: {
        id: "usr-admin",
        name: "Super Admin",
        role: { name: "ADMIN" },
      },
    } as never);

    const result = await AuthGuardService.requireAuth(["ADMIN", "MANAGER"]);

    expect(result.success).toBe(true);
    expect(result.session?.user.id).toBe("usr-admin");
    expect(result.session?.user.role).toBe("ADMIN");
  });
});
