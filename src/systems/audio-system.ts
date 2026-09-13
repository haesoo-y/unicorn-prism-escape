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
    if (this.next < now + .08) {this.music(state.stage, this.step++, this.next); this.next += [60/132/2,60/144/2,60/156/2,60/168/2][state.stage<2?0:state.stage<5?1:state.stage<8?2:3]??.2}
    const event = state.audioEvents;
    if (event & 1) {this.tone(190,.14,.16,'sawtooth',now,85); this.tone(380,.08,.08,'square',now,170)}
    if (event & 2) {this.tone(95,.24,.22,'sawtooth',now,42); this.tone(55,.3,.18,'triangle',now,32)}
    if (event & 4) {this.tone(1200,.12,.12,'sawtooth',now,80); this.tone(150,.16,.2,'triangle',now+.04,40)}
    if (event & 8) for(let i=0;i<3;i++) this.tone(1800+i*400,.035,.1,'sawtooth',now+i*.035,180);
    if (event & 16) for (let i=0;i<3;i++) this.tone([440,554,659][i]??440,.18,.13,'sine',now+i*.06);
    if (event & 32 && state.abilities & 32) this.tone(660,.5,.13,'sine',now,55);
    if (event & 32) for (let i=0;i<3;i++) this.tone(660+i*220,.14,.1,'sine',now+i*.045);
    if (event & 64) this.tone(330,.07,.08,'triangle',now,440);
  }

  private music(stage: number, step: number, at: number): void {
    if (DEBUG && globalThis.__audioState) globalThis.__audioState.beats++;
    const phase = stage < 2 ? 0 : stage < 5 ? 1 : stage < 8 ? 2 : 3, beat = step & 15, alternate = step >> 4 & 1;
    const scale=[1,1.125,1.25,1.333,1.5,1.667,1.875],melody=[4,2,5,4,2,-1,1,2,4,5,6,4,5,2,1,-1],chord=[0,3,4,0][step>>4&3]??0,root=220;
    if(!(beat&3))this.tone(120,.12,.085,'sine',at,42);
    if(beat%4===2)this.tone(140,.06,.035,'square',at,48);
    this.tone(beat&1?1760:1320,.025,.012+phase*.002,'square',at,880);
    if(phase>1)this.tone(2200,.025,.012,'square',at+.09,1200);
    if(!(beat&1)||phase>1)this.tone(root/2*(scale[(chord+(beat%4===2?4:0))%7]??1),.16,.065,'triangle',at);
    if(!(beat&3))for(let i=0;i<3;i++)this.tone(root*(scale[(chord+i*2)%7]??1),.4,.025,'triangle',at+i*.012);
    let note=melody[beat]??-1;if(alternate&&beat===10)note--;if(phase===3&&note<0)note=4;
    if(note>=0){const f=root*2*(scale[note]??1);this.tone(f,beat%4===3?.1:.19,.052,'triangle',at);if(phase)this.tone(f/2,.15,.019,'sine',at+.025)}
    if(beat===7||beat===15)this.tone(root*(scale[phase+1]??1)*2,.12,.028,'sine',at);

  }

  private tone(frequency: number, duration: number, volume: number, type: OscillatorType, at: number, end = frequency): void {
    const audio = this.audio, master = this.master; if (!audio || !master) return;
    if (DEBUG && globalThis.__audioState) globalThis.__audioState.notes++;
    const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at); oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
    gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(volume, at + .01); gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
    oscillator.connect(gain).connect(master); oscillator.start(at); oscillator.stop(at + duration + .02);
  }
}
