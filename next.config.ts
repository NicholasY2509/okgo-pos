import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
})

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.76"],
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'http://127.0.0.1:3001/socket.io/:path*',
      },
    ]
  },
} as any

export default withSerwist(nextConfig)
