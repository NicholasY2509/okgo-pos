import { z } from "zod";

export const staffOnboardingSchema = z.object({
  // Toggle for creating a user account
  createUserAccount: z.boolean(),

  // User/Account Info (Optional)
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),

  // Staff Profile Info (Required)
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  staffIdNumber: z.string().optional(),
  workPositionId: z.string().min(1, "Work position is required"),

  // Branch Assignment (Required)
  branchId: z.string().min(1, "Branch is required"),
  roleId: z.string().min(1, "Role is required"),
}).superRefine((data, ctx) => {
  if (data.createUserAccount) {
    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required when creating a user account",
        path: ["email"],
      });
    }
    if (!data.password || data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters",
        path: ["password"],
      });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });
    }
  }
});

export type StaffOnboardingInput = z.infer<typeof staffOnboardingSchema>;
