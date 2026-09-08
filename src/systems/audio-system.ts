import type {GameState} from '../state';

export class AudioSystem {
  private audio?: AudioContext;
  private master?: GainNode;
  private next = 0;
  private step = 0;

  constructor() {
    if (DEBUG) globalThis.__audioState = {contexts:0,notes:0,beats:0,events:0,state:'locked'};
    const unlock = (event?: KeyboardEvent) => {
      try {
        if (!this.audio) {
          const audio = this.audio = new AudioContext(), master = this.master = audio.createGain();
          master.gain.value = 1.12; master.connect(audio.destination); this.next = audio.currentTime;
          if (DEBUG && globalThis.__audioState) globalThis.__audioState.contexts++;
        }
        this.audio.resume();
        if (event?.code === 'KeyM' && !event.repeat && this.master) this.master.gain.value = this.master.gain.value ? 0 : 1.12;
      } catch {}
    };
    addEventListener('pointerdown', () => unlock(), {passive: true});
    addEventListener('keydown', unlock);
  }

  update(state: GameState): void {
    if (state.phase === 'title') return;
    const audio = this.audio;
    if (!audio || audio.state !== 'running') return;
    const now = audio.currentTime;
    if (DEBUG && globalThis.__audioState) {globalThis.__audioState.state=audio.state;globalThis.__audioState.events|=state.audioEvents}
    if (this.next < now) this.next = now;
    if (this.next < now + .08) {this.music(state.stage, this.step++, this.next); this.next += .25}
    const event = state.audioEvents;
    if (event & 1) {this.tone(190,.14,.16,'sawtooth',now,85); this.tone(380,.08,.08,'square',now,170)}
    if (event & 2) {this.tone(95,.24,.22,'sawtooth',now,42); this.tone(55,.3,.18,'triangle',now,32)}
    if (event & 4) {this.tone(520,.18,.17,'sawtooth',now,110); this.tone(760,.12,.1,'triangle',now,250)}
    if (event & 8) {this.tone(620,.12,.13,'square',now,330); this.tone(930,.09,.08,'sine',now,520)}
    if (event & 16) for (let i=0;i<3;i++) this.tone([440,554,659][i]??440,.18,.13,'sine',now+i*.06);
    if (event & 32) for (let i=0;i<3;i++) this.tone([660,880,1100][i]??660,.14,.1,'sine',now+i*.045);
    if (event & 64) this.tone(330,.07,.08,'triangle',now,440);
  }

  private music(stage: number, step: number, at: number): void {
    if (DEBUG && globalThis.__audioState) globalThis.__audioState.beats++;
    const phase = stage < 2 ? 0 : stage < 5 ? 1 : stage < 8 ? 2 : 3, beat = step & 15, alternate = step >> 4 & 1;
    const scale = [1,1.125,1.25,1.333,1.5,1.667,1.875], melody = [4,-1,5,4,2,-1,1,-1,4,5,6,-1,5,2,1,-1], root = 220;
    if ([0,3,6,8,11,14].includes(beat)) this.tone(beat === 6 || beat === 14 ? 165 : 110,.16,beat%8? .055:.08,'triangle',at);
    if (beat & 1) this.tone(70,.045,.025,'square',at,38);
    if (!(beat & 3)) {
      const chord = [0,3,4,0][beat >> 2]??0;
      this.tone(root*(scale[chord]??1),.34,.032,phase < 2 ? 'triangle':'sine',at);
      this.tone(root*(scale[(chord+2)%7]??1),.3,.024,phase === 3 ? 'sine':'triangle',at+.02);
      this.tone(root*(scale[(chord+4)%7]??1),.24,.018,'sine',at+.04);
    }
    let note = melody[beat]??-1; if (alternate && beat === 10) note--; if (phase === 3 && beat === 14) note = 4;
    if (note >= 0) this.tone(root*(scale[note]??1),beat%4===3?.1:.2,.045,phase === 0 ? 'sine':'triangle',at);
    if (beat === 5 || beat === 13) this.tone(root*(scale[phase+1]??1)*2,.16,.03,'sine',at);
    if (beat === 2 || beat === 10) this.tone(1760,.035,.018,'square',at,1100);
    if (beat === 7 || beat === 15) this.tone((phase === 2 ? 740 : phase === 3 ? 660 : 880)*(alternate?.75:1),.12,.025,'square',at);
  }

  private tone(frequency: number, duration: number, volume: number, type: OscillatorType, at: number, end = frequency): void {
    const audio = this.audio, master = this.master; if (!audio || !master) return;
    if (DEBUG && globalThis.__audioState) globalThis.__audioState.notes++;
    const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at); if (end !== frequency) oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
    gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(volume, at + .01); gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain).connect(master); oscillator.start(at); oscillator.stop(at + duration + .02);
  }
}
