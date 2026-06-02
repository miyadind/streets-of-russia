window.Assets=window.Assets||{};
Assets.backgrounds=Assets.backgrounds||{};
Assets.backgrounds.alternate=Assets.backgrounds.alternate||{};
Assets.backgrounds.alternate.street02='assets/backgrounds/street02-2.png';

setTimeout(function(){
if(typeof LevelScene==='undefined')return;
var u=LevelScene.prototype.update;
var d=LevelScene.prototype.draw;
var r={x:145,y:310,w:142,h:122};
LevelScene.prototype.isExitUnlocked=function(){return true};
LevelScene.prototype.drawPosterObjective=function(){};
LevelScene.prototype.getPosterActionZone=function(){return{x:0,y:0,w:0,h:0}};
LevelScene.prototype.getPosterHitbox=function(){return r};
LevelScene.prototype.didPlayerPunchPoster=function(){
if(this.getLevelKey()!=='street02')return false;
if(!this.encounterCleared||this.isPosterRemoved())return false;
if(!this.player||this.player.state!=='attack')return false;
return Combat.overlap(this.player.getHitbox(),r);
};
LevelScene.prototype.update=function(dt){
u.call(this,dt);
if(this.didPlayerPunchPoster())this.posterRemoved[this.getLevelKey()]=true;
};
LevelScene.prototype.draw=function(ctx){
var k=this.getLevelKey();
var a=k==='street02'&&this.isPosterRemoved();
var s=a?this.posterRemoved[k]:false;
if(a)this.posterRemoved[k]=false;
d.call(this,ctx);
if(a)this.posterRemoved[k]=s;
if(a&&this.altBackgrounds&&this.altBackgrounds[k])ctx.drawImage(this.altBackgrounds[k],0,0,GAME_CONFIG.width,GAME_CONFIG.height);
};
},0);
