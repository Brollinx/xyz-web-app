/// <reference types="vite/client" />

interface ImportMetaEnv {
    // VITE_MAPBOX_TOKEN is now hardcoded in src/config.ts, so no longer needed here.
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }