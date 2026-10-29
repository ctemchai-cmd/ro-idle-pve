import { actorAction, attachmentFrame, type ActorParts, type NativeAsset, type NativeFrame } from './native.mjs';

/** Frame-independent fitting: changing a pose never changes the preview's camera. */
export function actorPreviewLayout(parts:ActorParts,state:string,left:boolean) {
  let minX=0,maxX=0,minY=0,maxY=0;
  const include=(asset:NativeAsset,frame:NativeFrame,offset:readonly number[])=>{
    for(const layer of frame.layers){
      const rect=asset.meta.sprite_sheet?.frames[layer[2]!]!;if(!rect)continue;
      const angle=(layer[10]??0)*Math.PI/180,sx=(layer[8]??1)*(layer[3]?-1:1),sy=layer[9]??1;
      for(const x of[-rect[2]!/2,rect[2]!/2])for(const y of[-rect[3]!/2,rect[3]!/2]){
        const px=layer[0]!+offset[0]!+Math.cos(angle)*x*sx-Math.sin(angle)*y*sy,py=layer[1]!+offset[1]!+Math.sin(angle)*x*sx+Math.cos(angle)*y*sy;
        minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);
      }
    }
  };
  for(const pose of[state,'idle']){
    const action=actorAction(parts,pose);if(!action)continue;
    for(const[index,frame]of action.frames.entries()){
      include(parts.body,frame,[0,0]);
      for(const[asset,anchored]of [[parts.head,true],[parts.headgear,true],[parts.weapon,false],[parts.garment,false],[parts.shield,false]] as const){
        if(!asset)continue;const selected=attachmentFrame(asset,action,frame,index,pose);if(selected)include(asset,selected.frame,anchored?selected.offset:[0,0]);
      }
    }
  }
  const scale=Math.min(2.8,300/(maxX-minX+32),350/(maxY-minY+24));
  return{scale,xOffset:-(minX+maxX)/2*scale*(left?-1:1),y:450-maxY*scale};
}
