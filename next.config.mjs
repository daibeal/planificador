/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/": ["./prisma/dev.db"],
      "/api/itinerarios": ["./prisma/dev.db"],
      "/api/itinerarios/[id]": ["./prisma/dev.db"],
      "/api/itinerarios/[id]/actividades": ["./prisma/dev.db"],
      "/api/itinerarios/[id]/actividades/[actividadId]": ["./prisma/dev.db"],
      "/api/itinerarios/[id]/duplicar": ["./prisma/dev.db"],
    },
  },
};

export default nextConfig;
