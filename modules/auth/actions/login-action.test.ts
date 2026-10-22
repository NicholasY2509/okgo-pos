import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthError, CredentialsSignin } from "next-auth";
import { loginAction } from "./login-action";
import { signIn, CustomAuthError } from "@/modules/auth/auth";

vi.mock("next-auth", () => {
  class AuthError extends Error {
    type?: string;
  }
  class CredentialsSignin extends AuthError {
    code?: string;
  }
  return {
    AuthError,
    CredentialsSignin,
  };
});

vi.mock("@/modules/auth/auth", () => {
  class CustomAuthError extends Error {
    code: string;
    constructor(message: string) {
      super(message);
      this.code = message;
    }
  }
  return {
    signIn: vi.fn(),
    CustomAuthError,
  };
});

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return validation error if email is invalid", async () => {
    const result = await loginAction({
      email: "invalid-email",
      password: "password123",
    });

    expect(result).toBe("Harap masukkan alamat email yang valid.");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("should return validation error if password is empty", async () => {
    const result = await loginAction({
      email: "valid@okgo.com",
      password: "",
    });

    expect(result).toBe("Kata sandi wajib diisi.");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("should return custom error message when CustomAuthError is thrown", async () => {
    vi.mocked(signIn).mockRejectedValue(new CustomAuthError("Email tidak terdaftar."));

    const result = await loginAction({
      email: "valid@okgo.com",
      password: "password123",
    });

    expect(result).toBe("Email tidak terdaftar.");
  });

  it("should return specific message when CredentialsSignin with custom code is thrown", async () => {
    const error = new CredentialsSignin();
    error.code = "Kata sandi yang Anda masukkan salah.";
    vi.mocked(signIn).mockRejectedValue(error);

    const result = await loginAction({
      email: "valid@okgo.com",
      password: "password123",
    });

    expect(result).toBe("Kata sandi yang Anda masukkan salah.");
  });

  it("should return fallback message when default CredentialsSignin is thrown", async () => {
    const error = new CredentialsSignin();
    error.code = "credentials";
    vi.mocked(signIn).mockRejectedValue(error);

    const result = await loginAction({
      email: "valid@okgo.com",
      password: "password123",
    });

    expect(result).toBe("Email atau kata sandi tidak valid.");
  });

  it("should return access denied message when AccessDenied error is thrown", async () => {
    const error = new AuthError("Access denied");
    error.type = "AccessDenied";
    vi.mocked(signIn).mockRejectedValue(error);

    const result = await loginAction({
      email: "valid@okgo.com",
      password: "password123",
    });

    expect(result).toBe("Akses ditolak.");
  });

  it("should re-throw non-AuthError exceptions (such as NEXT_REDIRECT)", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    (redirectError as any).digest = "NEXT_REDIRECT;replace;/pos";
    vi.mocked(signIn).mockRejectedValue(redirectError);

    await expect(
      loginAction({
        email: "valid@okgo.com",
        password: "password123",
      })
    ).rejects.toThrow("NEXT_REDIRECT");
  });

  it("should complete with undefined on successful sign in without throwing error", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined as never);

    const result = await loginAction({
      email: "valid@okgo.com",
      password: "password123",
    });

    expect(result).toBeUndefined();
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "valid@okgo.com",
      password: "password123",
      subdomain: undefined,
      redirectTo: "/pos",
    });
  });
});
