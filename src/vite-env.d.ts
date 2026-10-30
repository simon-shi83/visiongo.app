/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** MIIT ICP filing number shown in the footer; set only by the China edition build. */
  readonly VITE_ICP_RECORD?: string;
}
