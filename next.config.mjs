/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",

  // Phones on LAN hit http://192.168.x.x:3000 — without this, Next blocks
  // /_next/* chunks and the 3D keyboard never loads on real devices.
  allowedDevOrigins: [
    "192.168.1.8",
    "192.168.20.43",
    "127.0.0.1",
    "localhost",
  ],

  async headers() {
    // HSTS on plain HTTP LAN IPs breaks mobile browsers in development.
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
