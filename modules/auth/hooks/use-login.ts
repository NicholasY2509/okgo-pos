import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { loginAction } from "../actions/login-action"
import { loginSchema, type LoginInput } from "../schemas/login"

export function useLogin() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Extract subdomain on the client side
  const getSubdomain = () => {
    if (typeof window === "undefined") return ""
    const hostname = window.location.hostname
    if (hostname.includes("localhost")) {
      const parts = hostname.split(".")
      return (parts.length > 1 && parts[0] !== "localhost") ? parts[0] : ""
    }
    const parts = hostname.split(".")
    return (parts.length > 2 && parts[0] !== "www" && parts[0] !== "admin") ? parts[0] : ""
  }

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      subdomain: getSubdomain(),
    },
  })

  async function onSubmit(values: LoginInput) {
    setErrorMessage(null)

    const result = await loginAction(values)

    if (result) {
      setErrorMessage(result)
      toast.error(result)
    } else {
      toast.success("Berhasil masuk!")
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    errorMessage,
  }
}
