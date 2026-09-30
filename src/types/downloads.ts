/**
 * Frontend types for software releases and downloads.
 */

export type DownloadableProduct = 'visionstudio' | 'visionruntime' | 'visionedge';

export type PlatformType = 'windows' | 'linux' | 'macos' | 'generic';
export type ArchitectureType = 'x64' | 'arm64' | 'universal' | 'unknown';

export interface ReleaseAsset {
  id: string;
  name: string;
  size: number;
  contentType: string;
  platform: PlatformType;
  arch: ArchitectureType;
  downloadUrl: string;
}

export interface ProductRelease {
  product: DownloadableProduct;
  version: string;
  name: string;
  publishedAt: string;
  description: string;
  prerelease: boolean;
  assets: ReleaseAsset[];
}

export interface ReleasesApiResponse {
  success: boolean;
  releases: Record<DownloadableProduct, ProductRelease[]>;
  updatedAt: string;
}
