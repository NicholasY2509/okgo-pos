---
trigger: always_on
---

# Okgo POS - Form & Action Architecture Blueprint

This document outlines the standard pattern for building forms, actions, and services in the Okgo POS application. Following this blueprint ensures that the codebase remains scalable, testable, and maintainable.

## The Pattern: Component ➡️ Hook ➡️ Action ➡️ Service ➡️ Repository

Every data submission flow in a module should be strictly separated into five distinct layers.

## Naming Conventions
- **Files & Directories**: Use strictly `kebab-case` for all files (e.g., `login-action.ts`, `use-login.ts`, `auth-service.ts`).
- **Index Files**: DO NOT use `index.ts` files anywhere. This prevents the "tab-hell" issue in code editors where multiple `index.ts` files are open, making navigation difficult. Use explicit filenames instead (e.g., `modules/auth/actions/login-action.ts`).

---

### 1. The Schema (`modules/[name]/schemas/[feature].ts`)
Defines the shape and validation rules for the data using Zod.

```typescript
import { z } from "zod"

export const featureSchema = z.object({
  title: z.string().min(1, "Title is required"),
  // ... other fields
})

export type FeatureInput = z.infer<typeof featureSchema>
```

---

### 2. The Repository (`modules/[name]/repositories/[feature]-repository.ts`)
The lowest level layer. It interacts directly with the database (Prisma) and handles all data access queries.
**Rules:** No Next.js imports. No business rules. Only takes inputs and returns database objects.

```typescript
import { prisma } from "@/lib/prisma"
import { FeatureInput } from "../schemas/[feature]"

export const FeatureRepository = {
  async create(data: FeatureInput) {
    return await prisma.feature.create({ data })
  }
}
```

---

### 3. The Service (`modules/[name]/services/[feature]-service.ts`)
The layer responsible for business logic. It orchestrates the process by calling the Repository.
**Rules:** No Next.js imports (`next/headers`, `next/navigation`). No HTTP logic. Does not call Prisma directly.

```typescript
import { FeatureRepository } from "../repositories/[feature]-repository"
import { FeatureInput } from "../schemas/[feature]"

export class FeatureService {
  static async create(data: FeatureInput) {
    // Business rules, calculations, or validations go here
    return await FeatureRepository.create(data)
  }
}
```

---

### 4. The Action (`modules/[name]/actions/[feature]-action.ts`)
The Server Action acts as a bridge (controller) between the client and the Service.
**Rules:** Must have `"use server"`. Must handle Zod validation securely. Must handle errors gracefully and return standardized responses (or throw for Next.js Error Boundaries).

```typescript
"use server"

import { featureSchema, type FeatureInput } from "../schemas/[feature]"
import { FeatureService } from "../services/[feature]-service"

export async function createFeatureAction(values: FeatureInput) {
  try {
    // 1. Validate Input (Never trust the client)
    const validatedFields = featureSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Invalid form data." }
    }

    // 2. Execute Service
    const result = await FeatureService.create(validatedFields.data)
    
    // 3. Return Success
    return { success: true, data: result }
  } catch (error) {
    return { error: "An unexpected error occurred." }
  }
}
```

---

### 5. The Hook (`modules/[name]/hooks/use-[feature].ts`)
Manages the client-side state of the form, handles submission, and triggers UI feedback (Toasts).
**Rules:** Wraps `react-hook-form` and `zodResolver`. Calls the Server Action.

```typescript
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createFeatureAction } from "../actions/[feature]-action"
import { featureSchema, type FeatureInput } from "../schemas/[feature]"

export function useFeatureForm() {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FeatureInput>({
    resolver: zodResolver(featureSchema),
    defaultValues: { title: "" }, // Define defaults
  })

  async function onSubmit(values: FeatureInput) {
    setError(null)
    const result = await createFeatureAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Successfully created!")
      form.reset() // Reset form on success
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  }
}
```

---

### 6. The Component (`modules/[name]/components/[feature]-form.tsx`)
The UI layer. It consumes the custom Hook and renders the HTML elements.
**Rules:** Must be `"use client"`. Should be as "dumb" as possible. No manual `fetch` calls.

```tsx
"use client"

import { useFeatureForm } from "../hooks/use-[feature]"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function FeatureForm() {
  const { form, onSubmit, isSubmitting, error } = useFeatureForm()

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label>Title</label>
        <Input {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </form>
  )
}
```
