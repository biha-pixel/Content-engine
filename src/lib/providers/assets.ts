/**
 * Asset Provider Interface
 * Abstracts B-roll and stock media retrieval
 */

export interface AssetProvider {
  /**
   * Search for media assets (video/images) based on query
   */
  search(query: string, options?: SearchOptions): Promise<Asset[]>;

  /**
   * Download an asset and return local path or URL
   */
  download(asset: Asset): Promise<string>;

  /**
   * Check if the provider is available/configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider name for logging/debugging
   */
  getName(): string;
}

export interface SearchOptions {
  type?: "video" | "image";
  orientation?: "landscape" | "portrait" | "square";
  minDuration?: number;
  maxResults?: number;
}

export interface Asset {
  id: string;
  url: string;
  thumbnailUrl: string;
  type: "video" | "image";
  duration?: number;
  width: number;
  height: number;
  license: {
    type: string;
    attribution?: string;
    url?: string;
  };
  source: string;
}

/**
 * Pexels Asset Provider
 * Free stock videos and images with portrait/vertical orientation support
 */
export class PexelsAssetProvider implements AssetProvider {
  private apiKey: string;

  constructor(apiKey: string = "") {
    this.apiKey = apiKey;
  }

  async search(query: string, options?: SearchOptions): Promise<Asset[]> {
    if (!this.apiKey) {
      console.warn("PEXELS_API_KEY is not configured; returning empty search results");
      return [];
    }

    try {
      const orientation = options?.orientation || "portrait";
      const perPage = options?.maxResults || 5;
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(
        query
      )}&orientation=${orientation}&per_page=${perPage}`;

      const response = await fetch(url, {
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const videos: any[] = data.videos || [];

      return videos.map((v) => {
        // Find suitable HD/portrait video file
        const videoFiles = v.video_files || [];
        const portraitFile =
          videoFiles.find((f: any) => f.width && f.height && f.height > f.width) ||
          videoFiles.find((f: any) => f.quality === "hd") ||
          videoFiles[0];

        return {
          id: String(v.id),
          url: portraitFile?.link || v.url,
          thumbnailUrl: v.image,
          type: "video",
          duration: v.duration,
          width: portraitFile?.width || v.width,
          height: portraitFile?.height || v.height,
          license: {
            type: "Pexels License (Free to use)",
            attribution: `Video by ${v.user?.name || "Pexels Creator"} on Pexels`,
            url: v.url,
          },
          source: "Pexels",
        };
      });
    } catch (error) {
      console.error("Pexels search error:", error);
      return [];
    }
  }

  async download(asset: Asset): Promise<string> {
    const fs = await import("fs");
    const path = await import("path");
    const { pipeline } = await import("stream/promises");

    const tmpDir = path.join(process.cwd(), "tmp", "assets");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const localFileName = `pexels-${asset.id}-${Date.now()}.mp4`;
    const localPath = path.join(tmpDir, localFileName);

    const response = await fetch(asset.url);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to download asset from ${asset.url}`);
    }

    const fileStream = fs.createWriteStream(localPath);
    // @ts-ignore
    await pipeline(response.body, fileStream);

    return localPath;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getName(): string {
    return "Pexels";
  }
}

/**
 * Pixabay Asset Provider
 * Free stock videos and images
 */
export class PixabayAssetProvider implements AssetProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options?: SearchOptions): Promise<Asset[]> {
    // TODO: Implement Pixabay API call
    throw new Error("PixabayAssetProvider.search() not yet implemented");
  }

  async download(asset: Asset): Promise<string> {
    // TODO: Implement download logic
    throw new Error("PixabayAssetProvider.download() not yet implemented");
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getName(): string {
    return "Pixabay";
  }
}
