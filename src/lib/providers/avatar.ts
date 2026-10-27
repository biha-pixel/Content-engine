/**
 * Avatar Provider Interface
 * Abstracts avatar/talking head generation
 */

export interface AvatarProvider {
  /**
   * Generate an avatar video from audio
   */
  generate(audioURL: string, options?: AvatarOptions): Promise<string>;

  /**
   * Check if the provider is available/configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider name for logging/debugging
   */
  getName(): string;
}

export interface AvatarOptions {
  avatarId?: string;
  resolution?: string;
}

/**
 * Placeholder Avatar Provider
 * To be implemented with specific avatar service
 */
export class PlaceholderAvatarProvider implements AvatarProvider {
  async generate(audioURL: string, options?: AvatarOptions): Promise<string> {
    // TODO: Implement avatar generation
    throw new Error("PlaceholderAvatarProvider.generate() not yet implemented");
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }

  getName(): string {
    return "Placeholder Avatar";
  }
}
