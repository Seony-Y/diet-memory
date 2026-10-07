import {
  BetterAuthVanillaAdapter,
  createClient,
  defaultDeriveNeonUrls,
} from "@neondatabase/neon-js";

const neonDatabaseUrl = import.meta.env.VITE_NEON_DATABASE_URL;
const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;
const neonDataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL;

export const isNeonConfigured = Boolean(neonDatabaseUrl);

const neonUrls = isNeonConfigured
  ? defaultDeriveNeonUrls(neonDatabaseUrl)
  : null;

export const neon = neonUrls
  ? createClient({
      auth: {
        adapter: BetterAuthVanillaAdapter(),
        url: neonAuthUrl || neonUrls.auth,
      },
      dataApi: { url: neonDataApiUrl || neonUrls.dataApi },
    })
  : null;
