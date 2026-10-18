import { auth } from "../auth";

export interface AuthenticatedUser {
  id: string;
  role?: string;
  name?: string | null;
  email?: string | null;
}

export type AuthGuardResult =
  | { success: true; session: { user: AuthenticatedUser }; error?: never }
  | { success: false; error: string; session?: never };

export class AuthGuardService {
  /**
   * Ensures the caller is authenticated and optionally matches one of the required roles.
   */
  static async requireAuth(allowedRoles?: string[]): Promise<AuthGuardResult> {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized: Silakan login terlebih dahulu.",
      };
    }

    const rawRole = (session.user as { role?: unknown }).role;
    const roleName = typeof rawRole === "string" ? rawRole : (rawRole as { name?: string })?.name;

    const user: AuthenticatedUser = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: roleName,
    };

    if (allowedRoles && allowedRoles.length > 0) {
      if (!roleName || !allowedRoles.includes(roleName)) {
        return {
          success: false,
          error: "Forbidden: Anda tidak memiliki akses untuk tindakan ini.",
        };
      }
    }

    return {
      success: true,
      session: {
        user,
      },
    };
  }
}
