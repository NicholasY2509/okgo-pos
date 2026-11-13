import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth-service";
import { AuthRepository } from "../repositories/auth-repository";
import bcrypt from "bcryptjs";

vi.mock("../repositories/auth-repository", () => ({
  AuthRepository: {
    getUserByEmail: vi.fn(),
    getBranchBySubdomain: vi.fn(),
    getBranchStaffAssignment: vi.fn(),
    getAdminAssignment: vi.fn(),
    getPrimaryAssignment: vi.fn(),
    getGlobalRole: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe("AuthService.verifyCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error if email or password is missing", async () => {
    await expect(AuthService.verifyCredentials("", "pass")).rejects.toThrow(
      "Email dan kata sandi wajib diisi."
    );
    await expect(AuthService.verifyCredentials("test@okgo.com", "")).rejects.toThrow(
      "Email dan kata sandi wajib diisi."
    );
  });

  it("should throw error if email is not registered", async () => {
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue(null);

    await expect(
      AuthService.verifyCredentials("notfound@okgo.com", "secret")
    ).rejects.toThrow("Email tidak terdaftar.");
  });

  it("should throw error if user account has no password set", async () => {
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u1",
      email: "nopass@okgo.com",
      password: null,
      name: "No Pass User",
      roleId: null,
      image: null,
      emailVerified: null,
    });

    await expect(
      AuthService.verifyCredentials("nopass@okgo.com", "secret")
    ).rejects.toThrow("Akun ini belum memiliki kata sandi.");
  });

  it("should throw error if password is incorrect", async () => {
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u1",
      email: "user@okgo.com",
      password: "hashedpassword",
      name: "User",
      roleId: null,
      image: null,
      emailVerified: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      AuthService.verifyCredentials("user@okgo.com", "wrongpassword")
    ).rejects.toThrow("Kata sandi yang Anda masukkan salah.");
  });

  it("should throw error if branch subdomain does not exist", async () => {
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u1",
      email: "user@okgo.com",
      password: "hashedpassword",
      name: "User",
      roleId: null,
      image: null,
      emailVerified: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(AuthRepository.getGlobalRole).mockResolvedValue(null as never);
    vi.mocked(AuthRepository.getBranchBySubdomain).mockResolvedValue(null);

    await expect(
      AuthService.verifyCredentials("user@okgo.com", "password", "invalid-branch")
    ).rejects.toThrow("Cabang tidak ditemukan atau tidak aktif.");
  });

  it("should throw error if user is not assigned to the branch", async () => {
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u1",
      email: "user@okgo.com",
      password: "hashedpassword",
      name: "User",
      roleId: null,
      image: null,
      emailVerified: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(AuthRepository.getGlobalRole).mockResolvedValue(null as never);
    vi.mocked(AuthRepository.getBranchBySubdomain).mockResolvedValue({
      id: "branch-1",
      name: "Branch 1",
      subdomain: "branch-1",
    } as never);
    vi.mocked(AuthRepository.getBranchStaffAssignment).mockResolvedValue(null);

    await expect(
      AuthService.verifyCredentials("user@okgo.com", "password", "branch-1")
    ).rejects.toThrow("Anda tidak mempunyai akses ke cabang ini.");
  });

  it("should throw error if user has no admin access when accessing admin portal", async () => {
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u1",
      email: "user@okgo.com",
      password: "hashedpassword",
      name: "User",
      roleId: null,
      image: null,
      emailVerified: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(AuthRepository.getGlobalRole).mockResolvedValue({
      id: "r1",
      name: "Cashier",
    } as never);
    vi.mocked(AuthRepository.getAdminAssignment).mockResolvedValue(null);

    await expect(
      AuthService.verifyCredentials("user@okgo.com", "password", "admin")
    ).rejects.toThrow("Anda tidak mempunyai akses ke portal admin.");
  });

  it("should succeed and return user with role when valid credentials and branch assignment", async () => {
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u1",
      email: "staff@okgo.com",
      password: "hashedpassword",
      name: "Staff Member",
      roleId: null,
      image: null,
      emailVerified: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(AuthRepository.getGlobalRole).mockResolvedValue(null as never);
    vi.mocked(AuthRepository.getBranchBySubdomain).mockResolvedValue({
      id: "branch-1",
      name: "Branch 1",
      subdomain: "branch-1",
    } as never);
    vi.mocked(AuthRepository.getBranchStaffAssignment).mockResolvedValue({
      id: "bs-1",
      branchId: "branch-1",
      staffId: "s1",
      roleId: "r1",
      role: { name: "Cashier" },
    } as never);

    const result = await AuthService.verifyCredentials("staff@okgo.com", "password", "branch-1");

    expect(result).toEqual({
      id: "u1",
      name: "Staff Member",
      email: "staff@okgo.com",
      role: { name: "Cashier" },
      branch: {
        id: "branch-1",
        name: "Branch 1",
        subdomain: "branch-1",
      },
    });
  });

  it("should resolve primary branch assignment when no subdomain is provided", async () => {
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue({
      id: "u2",
      email: "portal@okgo.com",
      password: "hashedpassword",
      name: "Portal Staff",
      roleId: null,
      image: null,
      emailVerified: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(AuthRepository.getGlobalRole).mockResolvedValue(null as never);
    vi.mocked(AuthRepository.getPrimaryAssignment).mockResolvedValue({
      id: "bs-2",
      branchId: "branch-juanda",
      staffId: "s2",
      roleId: "r2",
      role: { name: "Manager" },
      branch: {
        id: "branch-juanda",
        name: "Nyenyak Juanda",
        subdomain: "juanda",
      },
    } as never);

    const result = await AuthService.verifyCredentials("portal@okgo.com", "password");

    expect(result).toEqual({
      id: "u2",
      name: "Portal Staff",
      email: "portal@okgo.com",
      role: { name: "Manager" },
      branch: {
        id: "branch-juanda",
        name: "Nyenyak Juanda",
        subdomain: "juanda",
      },
    });
  });
});
