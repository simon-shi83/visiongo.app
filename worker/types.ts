/**
 * Server-side types and provider interfaces for Cloudflare Worker.
 */

export type SupportedProduct = 'visionstudio' | 'visionruntime' | 'visionedge';

export const SUPPORTED_DOWNLOAD_PRODUCTS: readonly SupportedProduct[] = [
  'visionstudio',
  'visionruntime',
  'visionedge',
] as const;

export function isValidProduct(product: string): product is SupportedProduct {
  return (SUPPORTED_DOWNLOAD_PRODUCTS as readonly string[]).includes(product.toLowerCase());
}

export type PlatformType = 'windows' | 'linux' | 'macos' | 'generic';
export type ArchitectureType = 'x64' | 'arm64' | 'universal' | 'unknown';

export interface ReleaseAsset {
  id: string;
  name: string;
  size: number;
  contentType: string;
  platform: PlatformType;
  arch: ArchitectureType;
  downloadUrl: string; // Internal API download proxy URL
}

export interface ProductRelease {
  product: SupportedProduct;
  version: string; // e.g. "v1.2.0"
  name: string;
  publishedAt: string;
  description: string;
  prerelease: boolean;
  assets: ReleaseAsset[];
}

export interface ReleaseProvider {
  getProductReleases(product: SupportedProduct, includePrereleases?: boolean): Promise<ProductRelease[]>;
  getAllReleases(includePrereleases?: boolean): Promise<Record<SupportedProduct, ProductRelease[]>>;
}

export interface DownloadStreamResult {
  stream: ReadableStream;
  filename: string;
  contentType: string;
  size?: number;
  version?: string;
  platform?: PlatformType;
  arch?: ArchitectureType;
}

export interface DownloadProvider {
  getDownloadStream(product: SupportedProduct, assetId: string): Promise<DownloadStreamResult | null>;
}

export interface AnalyticsDataPoint {
  blobs?: string[];
  doubles?: number[];
  indexes?: string[];
}

export interface AnalyticsEngineDataset {
  writeDataPoint(point: AnalyticsDataPoint): void;
}

export interface User {
  id: string;
  tenantId: string;
  role: 'super_admin' | 'org_admin' | 'member';
  googleSub: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserDownloadRecord {
  id: string;
  userId: string;
  product: SupportedProduct;
  version: string;
  assetName: string;
  downloadedAt: string;
}

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  DB?: D1Database;
  DOWNLOADS_ANALYTICS?: AnalyticsEngineDataset;
  DOWNLOAD_ANALYTICS_SECRET?: string;
  GITHUB_RELEASE_TOKEN?: string;
  GITHUB_ORG?: string;
  VISIONSTUDIO_REPO?: string;
  VISIONRUNTIME_REPO?: string;
  VISIONEDGE_REPO?: string;
  CONTACT_EMAIL_KEY?: string;
  DOWNLOADS_CACHE_TTL_SEC?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
  DESKTOP_TOKEN_PRIVATE_KEY?: string;
  DESKTOP_TOKEN_KEY_ID?: string;
  DESKTOP_TOKEN_ISSUER?: string;
}
