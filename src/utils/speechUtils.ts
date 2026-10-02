/**
 * Web Speech Synthesis utility for Taiwan elderly friendly voice announcements
 */

export function speakTaiwaneseMandarin(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.88; // Slightly slower pacing for senior listeners
    utterance.pitch = 1.0;

    // Try to find a zh-TW voice if available
    const voices = window.speechSynthesis.getVoices();
    const twVoice = voices.find((v) => v.lang === 'zh-TW' || v.lang === 'zh_TW' || v.name.includes('Taiwan'));
    if (twVoice) {
      utterance.voice = twVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Speech synthesis error:', err);
    return false;
  }
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
