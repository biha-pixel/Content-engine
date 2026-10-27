/**
 * Storyboard Generation Prompt
 * Converts a script into structured JSON storyboard
 */

export function buildStoryboardPrompt(
  script: string,
  projectId: string,
  targetDurationSeconds: number,
  aspectRatio: "9:16" | "16:9" | "1:1" = "9:16"
): string {
  return `You are a video storyboard generator. Convert the following narration script into a structured storyboard JSON.

Script:
${script}

Requirements:
- Project ID: "${projectId}"
- Aspect ratio: "${aspectRatio}"
- Target total duration: ${targetDurationSeconds} seconds
- Split the script into individual scenes (one scene per paragraph or logical segment)
- Each scene's duration should sum to approximately ${targetDurationSeconds} seconds total
- Assign each scene a visual type:
  * "broll" for scenes describing visuals, actions, or concepts that need supporting footage
  * "text" for key statistics, quotes, or important facts that should be displayed as text
  * "avatar" for personal/direct address segments or conclusions
- Set transitions:
  * "fade" for the first scene
  * "cut" between quick scenes
  * "dissolve" for emotional transitions
- Generate a unique ID for the storyboard and each scene using format: "sb_" + 8 random chars for storyboard, "sc_" + 8 random chars for scenes
- The captionText should match the narrationText (closed captions)

Output ONLY valid JSON matching this exact structure (no markdown code fences, no explanation, no extra text):
{
  "id": "sb_abc12345",
  "projectId": "${projectId}",
  "scenes": [
    {
      "id": "sc_xyz67890",
      "order": 0,
      "duration": 5.5,
      "narrationText": "exact narration text for this scene",
      "visualType": "broll",
      "captionText": "exact narration text for this scene",
      "transition": "fade"
    }
  ],
  "metadata": {
    "aspectRatio": "${aspectRatio}",
    "targetDuration": ${targetDurationSeconds},
    "totalDuration": 30.5
  }
}`;
}
