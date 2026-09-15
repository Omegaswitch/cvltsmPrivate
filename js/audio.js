/**
 * Ambient weather bed — rain and wind only.
 *
 * There is deliberately NO music here and no audio file of any kind: the
 * signal is filtered white noise synthesised in the browser. Nothing starts
 * without an explicit user gesture, and the toggle defaults to off.
 */
export function createAmbience() {
  let ctx = null;
  let master = null;
  let nodes = [];
  let on = false;

  function noiseBuffer(audio, seconds = 3) {
    const len = audio.sampleRate * seconds;
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      // slight brown-noise integration takes the harshness off the top end
      last = (last + 0.02 * white) / 1.02;
      data[i] = white * 0.7 + last * 3.2;
    }
    return buf;
  }

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const buf = noiseBuffer(ctx);

    /* ------------------------------------------------------------- rain */
    const rain = ctx.createBufferSource();
    rain.buffer = buf;
    rain.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 3200;
    rainFilter.Q.value = 0.45;
    const rainHi = ctx.createBiquadFilter();
    rainHi.type = 'highpass';
    rainHi.frequency.value = 900;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.16;
    rain.connect(rainFilter).connect(rainHi).connect(rainGain).connect(master);
    rain.start();

    /* ------------------------------------------------------------- wind */
    const wind = ctx.createBufferSource();
    wind.buffer = buf;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 420;
    windFilter.Q.value = 0.8;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.28;
    wind.connect(windFilter).connect(windGain).connect(master);
    wind.start();

    // slow gusts: an LFO breathing across the wind's cutoff and level
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.18;
    lfo.connect(lfoGain).connect(windGain.gain);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.031;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 180;
    lfo2.connect(lfo2Gain).connect(windFilter.frequency);
    lfo.start();
    lfo2.start();

    nodes = [rain, wind, lfo, lfo2];
    return true;
  }

  return {
    get enabled() {
      return on;
    },
    async toggle() {
      if (!ctx && !build()) return false;
      if (ctx.state === 'suspended') await ctx.resume();
      on = !on;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(on ? 0.5 : 0, now + (on ? 1.6 : 0.8));
      return on;
    },
    dispose() {
      if (!ctx) return;
      nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } });
      ctx.close();
      ctx = null;
      on = false;
    },
  };
}
