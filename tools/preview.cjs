const fs=require('fs');
const {createCanvas, Image}=require('canvas');
const m=fs.readFileSync('/workspace/src/app/rendering/tile-art.ts','utf8');
const re=/export const (\w+) =\s*'data:image\/png;base64,([^']+)'/g;
let x; const imgs={};
while((x=re.exec(m))){
  if(x[1].startsWith('TILE_')||x[1]==='SPRITE_H') continue;
  const img=new Image(); img.src=Buffer.from(x[2],'base64'); imgs[x[1]]=img;
}
console.log(Object.keys(imgs));
const N=12, HW=20, HH=10;
const W=N*2*HW+80,Hh=N*2*HH+120;
const cv=createCanvas(W,Hh), ctx=cv.getContext('2d');
ctx.fillStyle='#243a63'; ctx.fillRect(0,0,W,Hh);
const PATH=new Set([[1,10],[1,9],[1,8],[1,7],[1,6],[1,5],[1,4],[1,3],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[9,6],[8,6],[7,6],[6,6],[9,8],[8,8],[7,8],[6,8],[5,8],[4,8],[3,8],[2,8],[2,10],[3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[8,9]].map(p=>p.join(',')));
const rot=Number(process.argv[2]||0);
const cx=(N-1)/2;
for(let sumv=0;sumv<2*N-1;sumv++)for(let gx=0;gx<N;gx++){
  const gy=sumv-gx; if(gy<0||gy>=N)continue;
  // rotate the DRAW ORDER too so painter's algorithm is right for rotated view
  let rx=gx-cx, ry=gy-cx;
  for(let r=0;r<rot;r++){ const t=rx; rx=-ry; ry=t; }
  rx+=cx; ry+=cx;
  const sx=(rx-ry)*HW+W/2, sy=(rx+ry)*HH+50;
  const key=(gx===5&&gy===8)?'SOIL':PATH.has(gx+','+gy)?(['STONE_A','STONE_B','STONE_C'][(gx+gy)%3]):(['GRASS_A','GRASS_B','GRASS_C'][(gx*2+gy)%3]);
  const im=imgs[key];
  ctx.drawImage(im, Math.round(sx-im.width/2), Math.round(sy-im.height/2));
}
// NOTE: proper order should iterate by rotated sum; quick check visual only
fs.writeFileSync(`/tmp/preview${rot}.png`, cv.toBuffer('image/png'));
console.log('ok');
