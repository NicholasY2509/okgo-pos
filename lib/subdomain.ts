/**
 * Extracts the tenant or admin subdomain from a request hostname.
 * Returns an empty string for root, www, or bare localhost domains.
 */
export function extractSubdomain(hostname: string): string {
  if (!hostname) {
    return ""
  }

  const parts = hostname.split(".")

  if (hostname.includes("localhost")) {
    if (parts.length > 1 && parts[0] !== "localhost") {
      return parts[0]
    }
    return ""
  }

  if (parts.length > 2 && parts[0] !== "www") {
    return parts[0]
  }

  return ""
}
