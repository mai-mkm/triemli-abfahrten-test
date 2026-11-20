import {activityState,IDLE_MS} from '../domain/activity-policy.js';
export class ActivityController {
  constructor({onStart,onStop,now=()=>Date.now(),doc=document,win=window}){
    Object.assign(this,{onStart,onStop,now,doc,win});
    this.lastInteraction=now();this.active=false;this.timer=null;
    this.interact=()=>{this.lastInteraction=this.now();this.evaluate()};
    this.visibility=()=>this.evaluate();
  }
  evaluate(){
    const active=activityState({visible:!this.doc.hidden,lastInteraction:this.lastInteraction,now:this.now()})==='active';
    if(active!==this.active){this.active=active;if(active)this.onStart();else this.onStop()}
    clearTimeout(this.timer);
    if(active)this.timer=setTimeout(()=>this.evaluate(),Math.max(1,IDLE_MS-(this.now()-this.lastInteraction)));
  }
  start(){
    for(const event of ['pointerdown','touchstart','keydown','scroll'])this.doc.addEventListener(event,this.interact,{passive:true,capture:true});
    this.doc.addEventListener('visibilitychange',this.visibility);
    this.win.addEventListener('focus',this.visibility);
    this.evaluate();
  }
  stop(){
    clearTimeout(this.timer);
    for(const event of ['pointerdown','touchstart','keydown','scroll'])this.doc.removeEventListener(event,this.interact,true);
    this.doc.removeEventListener('visibilitychange',this.visibility);
    this.win.removeEventListener('focus',this.visibility);
    if(this.active){this.active=false;this.onStop()}
  }
}
