import bcrypt from "bcryptjs";
import { AuthRepository } from "../repositories/auth-repository";

export interface AuthenticatedBranch {
  id: string;
  name: string;
  subdomain: string;
}

export interface VerifiedCredentialsResult {
  id: string;
  name: string | null;
  email: string | null;
  role: { name: string };
  branch?: AuthenticatedBranch | null;
}

export class AuthService {
  /**
   * Verifies the email and password against the database.
   * Returns the user object with their role and bound branch if valid,
   * otherwise throws an error with the specific reason.
   */
  static async verifyCredentials(
    email?: string,
    password?: string,
    subdomain?: string
  ): Promise<VerifiedCredentialsResult> {
    if (!email || !password) {
      throw new Error("Email dan kata sandi wajib diisi.");
    }

    const user = await AuthRepository.getUserByEmail(email);

    if (!user) {
      throw new Error("Email tidak terdaftar.");
    }

    if (!user.password) {
      throw new Error("Akun ini belum memiliki kata sandi.");
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error("Kata sandi yang Anda masukkan salah.");
    }

    let userRole = "Guest";
    let resolvedBranch: AuthenticatedBranch | null = null;
    const globalRole = await AuthRepository.getGlobalRole(user.id);

    // If subdomain is provided, we must check if the user has access to it
    if (subdomain && subdomain !== "admin") {
      const branch = await AuthRepository.getBranchBySubdomain(subdomain);

      if (!branch) {
        throw new Error("Cabang tidak ditemukan atau tidak aktif.");
      }

      resolvedBranch = {
        id: branch.id,
        name: branch.name,
        subdomain: branch.subdomain,
      };

      if (globalRole && (globalRole.name === "Super Admin" || globalRole.name === "Admin Pusat")) {
        userRole = globalRole.name;
      } else {
        // Check if user is assigned to this branch
        const assignment = await AuthRepository.getBranchStaffAssignment(user.id, branch.id);

        if (!assignment) {
          throw new Error("Anda tidak mempunyai akses ke cabang ini.");
        }

        userRole = assignment.role.name;
      }
    } else if (subdomain === "admin") {
      // For admin portal, they must have the "Admin Pusat" or "Super Admin" role
      if (globalRole && (globalRole.name === "Admin Pusat" || globalRole.name === "Super Admin")) {
        userRole = globalRole.name;
      } else {
        const adminAssignment = await AuthRepository.getAdminAssignment(user.id);

        if (!adminAssignment) {
          throw new Error("Anda tidak mempunyai akses ke portal admin.");
        }

        userRole = "Admin Pusat";
        if (adminAssignment.branch) {
          resolvedBranch = {
            id: adminAssignment.branch.id,
            name: adminAssignment.branch.name,
            subdomain: adminAssignment.branch.subdomain,
          };
        }
      }
    } else {
      // No subdomain provided (e.g. Nyenyak Portal login or main site):
      // Resolve the user's primary branch assignment and role
      const primaryAssignment = await AuthRepository.getPrimaryAssignment(user.id);

      if (primaryAssignment?.branch) {
        resolvedBranch = {
          id: primaryAssignment.branch.id,
          name: primaryAssignment.branch.name,
          subdomain: primaryAssignment.branch.subdomain,
        };
      }

      if (globalRole) {
        userRole = globalRole.name;
      } else if (primaryAssignment?.role) {
        userRole = primaryAssignment.role.name;
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: { name: userRole },
      branch: resolvedBranch,
    };
  }
}
