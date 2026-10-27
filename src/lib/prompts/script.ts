/**
 * Script Generation Prompt
 * Combines research and script generation into one step for MVP
 */

export function buildScriptPrompt(topic: string, targetDurationSeconds: number): string {
  const wordCount = Math.round(targetDurationSeconds * 2.5);
  const paragraphCount = Math.max(3, Math.round(targetDurationSeconds / 15));

  return `You are a professional short-form video scriptwriter.

Task: Write a narration script for a ${targetDurationSeconds}-second social media video about the following topic.

Topic: ${topic}

Instructions:
1. First, identify 3-5 key points about this topic that would be most engaging for a social media audience.
2. Write a narration script that covers these points naturally.
3. The script should be conversational, engaging, and suitable for voice-over narration.
4. Target approximately ${wordCount} words (about 2.5 words per second of video).
5. Break the script into ${paragraphCount} distinct paragraphs, each covering one key point.
6. Each paragraph should be 2-4 sentences.
7. Use simple language that's easy to understand.
8. Make it engaging and hook the viewer in the first 3 seconds.

Output ONLY the narration script text, with paragraphs separated by blank lines. Do not include any headings, labels, stage directions, or formatting — just the spoken words.`;
}
