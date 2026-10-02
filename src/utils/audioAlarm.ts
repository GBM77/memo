import { RingtoneType } from '../types';

let audioCtx: AudioContext | null = null;
let activeLoopInterval: number | null = null;
let activeOscillators: OscillatorNode[] = [];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a single frequency tone with attack, sustain, decay
 */
function playTone(
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.8
) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0, startTime);
  // Attack
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
  // Decay
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);

  activeOscillators.push(osc);
  setTimeout(() => {
    activeOscillators = activeOscillators.filter((o) => o !== osc);
  }, (duration + 0.1) * 1000);
}

/**
 * Play selected ringtone once
 */
export function playRingtoneOnce(ringtone: RingtoneType, volume: number = 0.8) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const vol = Math.max(0.05, Math.min(1.0, volume));

    switch (ringtone) {
      case 'gentleChime': {
        // Soft marimba / chime arpeggio: C5 (523), E5 (659), G5 (784), C6 (1046)
        playTone(523.25, now + 0.0, 0.6, 'sine', vol * 0.7);
        playTone(659.25, now + 0.18, 0.6, 'sine', vol * 0.75);
        playTone(783.99, now + 0.36, 0.7, 'sine', vol * 0.8);
        playTone(1046.5, now + 0.54, 1.2, 'triangle', vol * 0.9);
        break;
      }

      case 'digitalAlarm': {
        // Classic digital dual beeps: 880Hz beep-beep ... beep-beep
        playTone(880, now + 0.0, 0.15, 'square', vol * 0.5);
        playTone(880, now + 0.22, 0.15, 'square', vol * 0.5);
        playTone(880, now + 0.5, 0.15, 'square', vol * 0.5);
        playTone(880, now + 0.72, 0.25, 'square', vol * 0.6);
        break;
      }

      case 'bellRinger': {
        // Church/school ringing bell: Ding-Dong-Ding
        playTone(784, now + 0.0, 0.5, 'triangle', vol * 0.8);
        playTone(659, now + 0.35, 0.5, 'triangle', vol * 0.8);
        playTone(523, now + 0.7, 0.9, 'sine', vol * 0.85);
        break;
      }

      case 'hospitalBeep': {
        // Medical clinic pulsed alert tone: 987Hz pulse
        playTone(987.77, now + 0.0, 0.2, 'sine', vol * 0.8);
        playTone(987.77, now + 0.3, 0.2, 'sine', vol * 0.8);
        playTone(1318.51, now + 0.6, 0.4, 'sine', vol * 0.9);
        break;
      }

      default:
        playTone(600, now, 0.5, 'sine', vol);
        break;
    }
  } catch (err) {
    console.error('Audio playback error:', err);
  }
}

/**
 * Start loop alarm until stopped
 */
export function startAlarmLoop(
  ringtone: RingtoneType,
  volume: number = 0.8,
  vibration: boolean = true
) {
  stopAlarmLoop();

  // Play immediately
  playRingtoneOnce(ringtone, volume);

  if (vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([400, 200, 400, 200, 600]);
    } catch (_) {}
  }

  // Repeat every 2.2 seconds
  activeLoopInterval = window.setInterval(() => {
    playRingtoneOnce(ringtone, volume);
    if (vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([400, 200, 400, 200, 600]);
      } catch (_) {}
    }
  }, 2200);
}

/**
 * Stop alarm loop
 */
export function stopAlarmLoop() {
  if (activeLoopInterval !== null) {
    clearInterval(activeLoopInterval);
    activeLoopInterval = null;
  }
  for (const osc of activeOscillators) {
    try {
      osc.stop();
    } catch (_) {}
  }
  activeOscillators = [];
}
