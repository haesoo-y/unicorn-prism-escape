import assert from 'node:assert/strict';
import {InputState} from '../src/input';
import {InputSystem} from '../src/systems/input-system';
import {RenderSystem} from '../src/systems/render-system';
import {World} from '../src/ecs/world';
import {createGameState} from '../src/state';
(globalThis as any).Image=class {complete=false;src=''};
for(let pass=1;pass<=2;pass++){
  let checks=0;
  for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){
    const levels=[a,b,c],mask=levels.reduce((n,l,r)=>n|((1<<l)-1)<<(r*3),0),available=levels.flatMap((l,r)=>l<3?[r*3+l]:[]);
    for(const selected of available)for(const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyS','KeyA','KeyD']){
      const state=createGameState(7),input=new InputState();Object.assign(state,{phase:'upgrade',abilities:mask,selectedAbility:selected});input.pressed.add(key);new InputSystem(input).update(new World(),state);
      assert(available.includes(state.selectedAbility));assert.equal(state.abilities,mask);assert.equal(state.phase,'upgrade');
      if(available.length>1)assert.notEqual(state.selectedAbility,selected);else assert.equal(state.audioEvents,0);
      if(['ArrowUp','ArrowDown','KeyW','KeyS'].includes(key)){
        const sign=['ArrowUp','KeyW'].includes(key)?-1:1;
        const rows=[1,2,3].map(n=>(Math.floor(selected/3)+sign*n+9)%3);const row=rows.find(r=>levels[r]!<3)!;
        assert.equal(Math.floor(state.selectedAbility/3),row);
      }
      checks++;
    }
  }
  for(const key of ['ArrowDown','KeyS']){const state=createGameState(7),input=new InputState();Object.assign(state,{phase:'upgrade',abilities:1,selectedAbility:1});input.pressed.add(key);new InputSystem(input).update(new World(),state);assert.equal(state.selectedAbility,3)}
  const state=createGameState(7),input=new InputState(),sys=new InputSystem(input);state.phase='upgrade';input.choose(3);sys.update(new World(),state);assert.equal(state.phase,'upgrade');input.endFrame();input.choose(3);sys.update(new World(),state);assert.equal(state.phase,'advance');assert.equal(state.abilities,8);
  let layouts=0;
  for(const width of [320,360,390,599,600,844,960])for(const gate of [false,true]){
    const texts:any[]=[];const context:any={textAlign:'left',font:'',fillText(text:string,x:number,y:number){const w=text.length*10.8;const left=this.textAlign==='center'?x-w/2:this.textAlign==='right'?x-w:x;texts.push({text,left,right:left+w,y})},save(){},restore(){},translate(){},rotate(){},fillRect(){},strokeRect(){}};
    const render:any=new RenderSystem(context,new InputState());render.screenWidth=width;render.screenHeight=568;
    const world=new World();if(gate)world.gates.add(1 as any);const s=createGameState(7);s.stage=9;s.elapsed=179.999;render.drawHud(world,s);render.drawTime(s);
    for(const t of texts){assert(t.left>=0&&t.right<=width,`clipped ${width}: ${t.text}`);for(const other of texts)if(t!==other&&t.y===other.y)assert(t.right<=other.left||other.right<=t.left,`overlap ${width}`)}
    layouts++;
  }
  console.log(JSON.stringify({pass,navigationChecks:checks,pointerConfirm:'passed',hudLayouts:layouts,measurement:'monospace 18px logical text bounds'}));
}
