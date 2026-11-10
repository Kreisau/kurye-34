"""Turn Gemini/Lyria MP3s into seamless game loops.
For each track: find beats, pick a bar-aligned loop [s, e) that ends before the fade-out,
bake a one-bar equal-power crossfade of the continuation (e..e+X) into the loop head,
pad 0.5 s on both sides (copies of the loop) so decoder offsets cannot break the seam,
normalize loudness, encode MP3 96 kbps. Prints loop points for js/audio.js.
Usage: python3 tools/make_loops.py SRC_DIR OUT_DIR"""
import sys, json, subprocess, numpy as np, librosa, soundfile as sf

SRC, OUT = sys.argv[1], sys.argv[2]
CAPS = {'menu': 70, 'ride': 96, 'ride-tense': 48}   # max loop seconds (keeps decoded memory low on phones)
SR, PAD, TARGET_RMS_DB = 44100, .5, -19.0
meta = {}
for name, cap in CAPS.items():
    y, _ = librosa.load(f'{SRC}/{name}.mp3', sr=SR, mono=False)
    mono = librosa.to_mono(y)
    _, beats = librosa.beat.beat_track(y=mono, sr=SR, units='samples')
    rms = librosa.feature.rms(y=mono, frame_length=2048, hop_length=512)[0]
    db = 20 * np.log10(rms + 1e-9)
    last_loud = librosa.frames_to_samples(np.where(db > db.max() - 14)[0][-1], hop_length=512)
    s = int(beats[0]); bar = 4
    xfade = int(beats[bar] - beats[0])                       # one bar
    best = None
    for i in range(bar * 2, len(beats), bar):
        e = int(beats[i])
        if e + xfade > last_loud - SR * .5 or (e - s) / SR > cap: break
        best = e
    e = best
    L = y[:, s:e].copy()
    t = np.linspace(0, 1, xfade)
    fin, fout = np.sin(t * np.pi / 2), np.cos(t * np.pi / 2)
    L[:, :xfade] = y[:, s:s + xfade] * fin + y[:, e:e + xfade] * fout
    pad = int(PAD * SR)
    F = np.concatenate([L[:, -pad:], L, L[:, :pad]], axis=1)
    gain = 10 ** ((TARGET_RMS_DB - 20 * np.log10(np.sqrt(np.mean(F ** 2)) + 1e-9)) / 20)
    F = F * gain
    peak = np.abs(F).max()
    if peak > .97: F *= .97 / peak
    sf.write(f'/tmp/{name}.wav', F.T, SR)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'/tmp/{name}.wav', '-codec:a', 'libmp3lame', '-b:a', '96k', f'{OUT}/{name}.mp3'], check=True)
    meta[name] = {'ls': round(pad / SR, 4), 'le': round((pad + L.shape[1]) / SR, 4)}
    print(f'{name}: loop {(e - s) / SR:.2f}s from {s / SR:.2f}s, bars {(len(range(0, 0))) or round((e - s) / xfade)}, gain {20*np.log10(gain):+.1f} dB')
print(json.dumps(meta))
