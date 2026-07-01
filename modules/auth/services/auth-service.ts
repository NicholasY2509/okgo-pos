import bcrypt from "bcryptjs";
import { AuthRepository } from "../repositories/auth-repository";

export class AuthService {
  /**
   * Verifies the email and password against the database.
   * Returns the user object if valid, otherwise null.
   */
  static async verifyCredentials(email?: string, password?: string, subdomain?: string) {
    if (!email || !password) {
      return null;
    }

    const user = await AuthRepository.getUserByEmail(email);

    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return null;
    }

    let userRole = "Guest";

    // If subdomain is provided, we must check if the user has access to it
    if (subdomain && subdomain !== "admin") {
      const branch = await AuthRepository.getBranchBySubdomain(subdomain);

      if (!branch) {
        return null; // Branch doesn't exist
      }

      // Check if user is assigned to this branch
      const assignment = await AuthRepository.getBranchStaffAssignment(user.id, branch.id);

      if (!assignment) {
        return null; // User not authorized for this branch
      }

      userRole = assignment.role.name;
    } else if (subdomain === "admin") {
      // For admin portal, they must have the "Admin" role somewhere
      const adminAssignment = await AuthRepository.getAdminAssignment(user.id);

      if (!adminAssignment) {
        return null; // Not an admin
      }

      userRole = "Admin";
    } else {
      // Fallback if no subdomain (e.g. main marketing site), just get their primary role if they have one
      const primaryAssignment = await AuthRepository.getPrimaryAssignment(user.id);
      if (primaryAssignment) {
        userRole = primaryAssignment.role.name;
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: { name: userRole }
    };
  }
}
