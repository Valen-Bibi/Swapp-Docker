export const playShutterSound = () => {
	try {
		const AudioContext =
			window.AudioContext || (window as any).webkitAudioContext;
		if (!AudioContext) return;
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.type = "sine";
		osc.frequency.setValueAtTime(1200, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
		gain.gain.setValueAtTime(0.3, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
		osc.start();
		osc.stop(ctx.currentTime + 0.1);
	} catch (e) {
		console.error("Audio no soportado");
	}
};