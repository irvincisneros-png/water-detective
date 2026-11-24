// Read-aloud via the Web Speech API (prefers en-AU). Everything degrades to "hidden" when unsupported.
export const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => v.lang === 'en-AU') || vs.find(v => /^en[-_]AU/i.test(v.lang)) || vs.find(v => v.lang?.startsWith('en-GB')) || vs.find(v => v.lang?.startsWith('en')) || null;
}
if (supported()) { try { pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); } catch { /* ignore */ } }
let current = null;
export function speak(text, onEnd) {
  if (!supported()) return false;
  stop();
  const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' ').trim());
  if (!voice) pickVoice();
  if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-AU';
  u.rate = 0.95;
  u.onend = u.onerror = () => { if (current === u) current = null; onEnd?.(); };
  current = u;
  speechSynthesis.speak(u);
  return true;
}
export function stop() { if (!supported()) return; try { speechSynthesis.cancel(); } catch { /* ignore */ } current = null; }
export const speaking = () => !!current;
