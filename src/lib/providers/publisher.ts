/**
 * Publisher Interface
 * Abstracts video publishing functionality
 */

export interface Publisher {
  /**
   * Publish a video to the platform
   */
  publish(videoPath: string, metadata: PublishMetadata): Promise<PublishResult>;

  /**
   * Check if the publisher is available/configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get publisher name for logging/debugging
   */
  getName(): string;
}

export interface PublishMetadata {
  title: string;
  description?: string;
  tags?: string[];
  visibility?: "public" | "unlisted" | "private";
}

export interface PublishResult {
  success: boolean;
  platformId?: string;
  url?: string;
  error?: string;
}

/**
 * Placeholder Publisher
 * MVP exports to local file; publishing is post-MVP
 */
export class LocalExportPublisher implements Publisher {
  private outputDir: string;

  constructor(outputDir: string = "./output") {
    this.outputDir = outputDir;
  }

  async publish(videoPath: string, metadata: PublishMetadata): Promise<PublishResult> {
    // TODO: Implement local file export with metadata
    throw new Error("LocalExportPublisher.publish() not yet implemented");
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getName(): string {
    return "Local Export";
  }
}
