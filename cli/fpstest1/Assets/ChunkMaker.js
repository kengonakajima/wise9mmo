
// chunkのポリゴン生成するprefabにつける

var material:Material;

var objmode:int; // 



var REDFLOWER:int=100;
var BLUEFLOWER:int=101;
var TORCH:int=102;


// atlasIndexから [startU, startV, endU, endV]もとめる
function calcUVs( i:int ) :float[]{
    var out :float[] = new float[4];
    
    // atlas中の座標求める
    var wi:int = ( 512/16 );
    var atlasCol:int = i % wi;
    var atlasRow:int = i / wi;
    var unit:float = 1.0 / wi;

    var ep:float = 0.001;
    out[0] = atlasCol*unit+ep;
    out[1] = 1.0 - atlasRow*unit - unit + ep;
    out[2] = out[0] + unit - ep-ep;
    out[3] = out[1] + unit - ep-ep;    
    
    return out;    
}

function lightIndexToNormal(i:int):float{
    if( i==0){
        return 0.05;
    } else {
        return 0.05 + ( ((i-1)*1.0) / 8.0 );
    }
}

// 花の形状をつくる
function makeFlowerObj( basepos : Vector3, vertices : Vector3[], uv : Vector2[], normals : Vector3[], vi : int, triangles : int[], ti : int, objType :int , light:int )
{
    // Z=0.5
    vertices[vi+0] = basepos+Vector3( 0,0,0.5 ); // z=0.5の面(裏表共用)
    vertices[vi+1] = basepos+Vector3( 1,0,0.5 );
    vertices[vi+2] = basepos+Vector3( 1,1,0.5 );
    vertices[vi+3] = basepos+Vector3( 0,1,0.5 );

    vertices[vi+4] = basepos+Vector3( 0.5,0,0 ); // x=0.5の面(裏表共用)
    vertices[vi+5] = basepos+Vector3( 0.5,0,1 );
    vertices[vi+6] = basepos+Vector3( 0.5,1,1 );
    vertices[vi+7] = basepos+Vector3( 0.5,1,0 );

    var uvs:float[];
    if(objType==REDFLOWER){
        uvs = calcUVs( 256 );
    } else if( objType==BLUEFLOWER){
        uvs = calcUVs( 257 );
    } else if( objType==TORCH){
        uvs = calcUVs( 258 );
    } else{
        throw "bug";
    }

    //    print( "u:"+uStart + " v:" + vStart + " col:"+atlasCol + " row:"+atlasRow );
    uv[vi+0] = Vector2(uvs[0],uvs[1]);
    uv[vi+1] = Vector2(uvs[2],uvs[1]);
    uv[vi+2] = Vector2(uvs[2],uvs[3]);
    uv[vi+3] = Vector2(uvs[0],uvs[3]);

    uv[vi+4] = uv[vi+0];
    uv[vi+5] = uv[vi+1];
    uv[vi+6] = uv[vi+2];
    uv[vi+7] = uv[vi+3];

    var l:float = lightIndexToNormal(light);
    normals[vi+0]=normals[vi+1]=normals[vi+2]=normals[vi+3]=normals[vi+4]=normals[vi+5]=normals[vi+6]=normals[vi+7]=Vector3(0,l,0);

    triangles[ti+0] = vi+0; // z=0.5 表
    triangles[ti+1] = vi+2;
    triangles[ti+2] = vi+1;
    triangles[ti+3] = vi+0;
    triangles[ti+4] = vi+3;
    triangles[ti+5] = vi+2;

    triangles[ti+6] = vi+0; // z=0.5 裏
    triangles[ti+7] = vi+1;
    triangles[ti+8] = vi+2;
    triangles[ti+9] = vi+0;
    triangles[ti+10] = vi+2;
    triangles[ti+11] = vi+3;

    triangles[ti+12] = vi+4; // x=0.5表(X+)
    triangles[ti+13] = vi+6;
    triangles[ti+14] = vi+5;
    triangles[ti+15] = vi+4;
    triangles[ti+16] = vi+7;
    triangles[ti+17] = vi+6;

    triangles[ti+18] = vi+4;
    triangles[ti+19] = vi+5;
    triangles[ti+20] = vi+6;    
    triangles[ti+21] = vi+4;
    triangles[ti+22] = vi+6;
    triangles[ti+23] = vi+7;        
    
}

var startvis:int[]=new int[6];
var starttis:int[]=new int[6];

// lights: z0z1x0x1y0y1の順で、各面を照らす明るさ
function makeCube( basepos : Vector3, vertices : Vector3[], uv : Vector2[], normals : Vector3[], vi : int, triangles : int[], ti : int, blockType :int , lights:int[], drawflags:int[], h:float, sz:float )
{
    var curvi:int = vi;
    var curti:int = ti;

    for(var i:int=0;i<6;i++){
        if( drawflags[i] ){
            startvis[i]=curvi;
            starttis[i]=curti;
            curvi += 4;
            curti += 2*3;
        }
    }
        
    // uvが24個必要なので
    if( drawflags[0] ){
        vi=startvis[0];
        vertices[vi+0] = basepos + Vector3( 0,0,0 ); // Z=0 (0,1,2,3)
        vertices[vi+1] = basepos + Vector3( sz,0,0 ); //
        vertices[vi+2] = basepos + Vector3( sz,h,0 ); //
        vertices[vi+3] = basepos + Vector3( 0,h,0 ); //
    }
    if( drawflags[1] ){
        vi=startvis[1];
        vertices[vi+0] = basepos + Vector3( 0,0,sz ); // Z=1  (4,5,6,7)
        vertices[vi+1] = basepos + Vector3( sz,0,sz ); //
        vertices[vi+2] = basepos + Vector3( sz,h,sz ); //
        vertices[vi+3] = basepos + Vector3( 0,h,sz ); //
    }
    if( drawflags[2] ){
        vi=startvis[2];
        vertices[vi+0] = basepos + Vector3( 0,0,0 ); // X=0 (0,4,7,3)
        vertices[vi+1] = basepos + Vector3( 0,0,sz ); //
        vertices[vi+2] = basepos + Vector3( 0,h,sz ); //
        vertices[vi+3] = basepos + Vector3( 0,h,0 ); //
    }
    if( drawflags[3] ){
        vi=startvis[3];
        vertices[vi+0] = basepos + Vector3( sz,0,0 ); // X=1 (1,5,6,2)
        vertices[vi+1] = basepos + Vector3( sz,0,sz ); //
        vertices[vi+2] = basepos + Vector3( sz,h,sz ); //
        vertices[vi+3] = basepos + Vector3( sz,h,0 ); //
    }
    if( drawflags[4] ){
        vi=startvis[4];
        vertices[vi+0] = basepos + Vector3( 0,0,0 ); // Y=0 (0,1,5,4)
        vertices[vi+1] = basepos + Vector3( sz,0,0 ); //
        vertices[vi+2] = basepos + Vector3( sz,0,sz ); //
        vertices[vi+3] = basepos + Vector3( 0,0,sz ); //
    }
    if( drawflags[5] ){
        vi=startvis[5];
        vertices[vi+0] = basepos + Vector3( 0,h,0 ); // Y=1 (3,2,6,7)
        vertices[vi+1] = basepos + Vector3( sz,h,0 ); //
        vertices[vi+2] = basepos + Vector3( sz,h,sz ); //
        vertices[vi+3] = basepos + Vector3( 0,h,sz ); //
    }
    

    // 画像の左下がuv=0, 右上がuv=1
    var su:float;
    var sv:float;
    var eu:float;
    var ev:float;

    // atlas中の座標求める
    var uvs:float[] = calcUVs( blockType + (512/16) );
    su = uvs[0];sv = uvs[1];eu = uvs[2];ev = uvs[3];

    if(drawflags[0]){
        vi=startvis[0];
        uv[vi+0] = Vector2(su,sv); // Z=0 横面
        uv[vi+1] = Vector2(eu,sv);
        uv[vi+2] = Vector2(eu,ev);
        uv[vi+3] = Vector2(su,ev);
    }
    if( drawflags[1]){
        vi=startvis[1];
        uv[vi+0] = Vector2(eu,sv); // Z=1 横面
        uv[vi+1] = Vector2(su,sv);
        uv[vi+2] = Vector2(su,ev);
        uv[vi+3] = Vector2(eu,ev);
    }
    if( drawflags[2]){
        vi=startvis[2];
        uv[vi+0] = Vector2(eu,sv); // X=0 横面
        uv[vi+1] = Vector2(su,sv);
        uv[vi+2] = Vector2(su,ev);
        uv[vi+3] = Vector2(eu,ev);
    }
    if( drawflags[3]){
        vi=startvis[3];
        uv[vi+0] = Vector2(su,sv); // X=1 横面
        uv[vi+1] = Vector2(eu,sv);
        uv[vi+2] = Vector2(eu,ev);
        uv[vi+3] = Vector2(su,ev);
    }

    if( drawflags[4]){
        uvs = calcUVs( blockType + (512/16 )*2 );
        su = uvs[0];sv = uvs[1];eu = uvs[2];ev = uvs[3];
        vi=startvis[4];
        uv[vi+0] = Vector2(su,ev); // Y=0　下面
        uv[vi+1] = Vector2(eu,ev);
        uv[vi+2] = Vector2(eu,sv);
        uv[vi+3] = Vector2(su,sv);
    }

    if( drawflags[5]){
        uvs = calcUVs( blockType );
        su = uvs[0];sv = uvs[1];eu = uvs[2];ev = uvs[3];
        vi=startvis[5];
        uv[vi+0] = Vector2(su,sv); // Y=1 上面
        uv[vi+1] = Vector2(eu,sv);
        uv[vi+2] = Vector2(eu,ev);
        uv[vi+3] = Vector2(su,ev);        
    }
    
    // 明るさを決めるための法線
    for(i=0;i<6;i++){
        if( drawflags[i] ){
            vi=startvis[i];
            for(var j=0;j<4;j++){
                normals[vi+j] = Vector3(0,lightIndexToNormal( lights[i*4+j] ),0);
            }
        }
    }

    if(drawflags[0]){
        ti=starttis[0];
        vi=startvis[0];
        triangles[ti+0] = vi+0; // z=0平面の２つの三角
        triangles[ti+1] = vi+2;
        triangles[ti+2] = vi+1;
        triangles[ti+3] = vi+0;
        triangles[ti+4] = vi+3;
        triangles[ti+5] = vi+2;
    }
    if(drawflags[1]){
        ti=starttis[1];
        vi=startvis[1];
        triangles[ti+0] = vi+0; // z=1平面の２つの三角
        triangles[ti+1] = vi+1;
        triangles[ti+2] = vi+2;
        triangles[ti+3] = vi+0;
        triangles[ti+4] = vi+2;
        triangles[ti+5] = vi+3;
    }
    if(drawflags[2]){
        ti=starttis[2];
        vi=startvis[2];
        triangles[ti+0] = vi+0; // x=0
        triangles[ti+1] = vi+1;
        triangles[ti+2] = vi+2;
        triangles[ti+3] = vi+0;
        triangles[ti+4] = vi+2;
        triangles[ti+5] = vi+3;
    }
    if(drawflags[3]){
        ti=starttis[3];
        vi=startvis[3];
        triangles[ti+0] = vi+0; // x=1
        triangles[ti+1] = vi+2;
        triangles[ti+2] = vi+1;
        triangles[ti+3] = vi+0;
        triangles[ti+4] = vi+3;
        triangles[ti+5] = vi+2;
    }
    if(drawflags[4]){
        ti=starttis[4];
        vi=startvis[4];
        triangles[ti+0] = vi+0; // y=0
        triangles[ti+1] = vi+1;
        triangles[ti+2] = vi+2;
        triangles[ti+3] = vi+0;
        triangles[ti+4] = vi+2;
        triangles[ti+5] = vi+3;
    }
    if(drawflags[5]){
        ti=starttis[5];
        vi=startvis[5];
        triangles[ti+0] = vi+0; // y=1
        triangles[ti+1] = vi+2;
        triangles[ti+2] = vi+1;
        triangles[ti+3] = vi+0;
        triangles[ti+4] = vi+3;
        triangles[ti+5] = vi+2;
    }        
}



function Start() {

	if (material)
		renderer.material = material;
	else
		renderer.material.color = Color.white;


    
}

var uvBase:float=0;
var lastUpdate:float;
function Update() {

    // 水を流す
    if( objmode==2 && maxvi>0){
        var now:float = Time.realtimeSinceStartup;
        var dt:float = now - lastUpdate;
        lastUpdate = now;
        
        // 5列目の左から2個目が水の中心
        var mesh : Mesh = GetComponent(MeshFilter).mesh;
        var uv:Vector2[] = new Vector2[ maxvi ];
        var waterUV:float[] = calcUVs( (512/16)*5 + 1 );
        var unit:float = 1.0/ (512/16);
        uvBase += unit * ( dt/ 5.0);
        if( uvBase >= unit ) uvBase=0;
        for(var i:int=0;i<maxvi/4;i++){
            var du:float=uvBase;
            var dv:float=0;
            uv[i*4]=Vector2(waterUV[0]+du,waterUV[1]+dv);
            uv[i*4+1]=Vector2(waterUV[2]+du,waterUV[1]+dv);
            uv[i*4+2]=Vector2(waterUV[2]+du,waterUV[3]+dv);
            uv[i*4+3]=Vector2(waterUV[0]+du,waterUV[3]+dv);
        }
        mesh.uv = uv;
    }

}

// 0~(sz+2)まで
function toLightIndex(x:int,y:int,z:int,sz:int) :int{
    return y*sz*sz+z*sz+x;
}
function toBlockIndex(x:int,y:int,z:int,sz:int) :int{
    return y*sz*sz+z*sz+x;
}
function isBlock(t:int) : System.Boolean {
    if(t==0)return false;
    if(t<100)return true;
    return false;
}

var maxvi:int;

// 地形データをセットする(xyzならび)
// blocks: AIRとかSTONEとか
// lights: あかるさ0~7 (sz+2)^3 のサイズが必要。



function SetField( blocks: int[], lights:int[], sz:int ) {
    if( blocks.length != (sz+2)*(sz+2)*(sz+2) ) throw "invalid block cnt:"+blocks.length.ToString() + " sz:"+sz;
    if( lights.length != (sz+2)*(sz+2)*(sz+2) ) throw "invalid light cnt:"+lights.length.ToString() + " sz:"+sz;
	var mesh : Mesh = GetComponent(MeshFilter).mesh;

    // 以下のnewを全部関数の外に出しても、チェン区1個    あたり1回しかやらないのであまりかン京ない
    var lts:int[] = new int[6*4]; // Z=0 Z=1 X=0 X=1 Y=0 Y=1 の順
    var drawflags:int[] = new int[6]; // 各面を描画するかどうかのフラグ
    var vertices : Vector3[] = new Vector3[ sz*sz*sz *24 ];
    var uv : Vector2[] = new Vector2[ sz*sz*sz *24 ];
    var triangles : int[] = new int[ sz*sz*sz * 36 ];
    var normals : Vector3[] = new Vector3[sz*sz*sz*24]; // 頂点数と同じだけ必要
    
    mesh.Clear();

    
    var vi:int=0;
    var ti:int=0;
    

    var makeNum:int=0;
    var skipNum:int=0;
    
    for( var y:int = 0; y < sz; y++ ){
        for( var z:int = 0; z < sz; z++ ){
            for( var x:int = 0; x < sz; x++ ){

                var i : int = blocks[(x+1)+(z+1)*(sz+2)+(y+1)*(sz+2)*(sz+2)] ;
                
                var lx=x+1; // light配列の中は１づつずれている
                var ly=y+1;
                var lz=z+1;                
                if( i > 0 && i <100 && (objmode==0||objmode==2) ){

                    if( objmode==0 ){
                        if( i == 4 ){
                            skipNum++;
                            continue;
                        }
                    } else if( objmode==2){
                        if( i != 4 ){
                            skipNum++;
                            continue;
                        } 
                    }

                    
                    // 周囲をみて完全に埋まってるのはキューブ作ること自体しない
                    if( lights[ toLightIndex(lx-1,ly,lz,sz+2)]==0
                        && lights[ toLightIndex(lx,ly-1,lz,sz+2)]==0
                        && lights[ toLightIndex(lx,ly,lz-1,sz+2)]==0
                        && lights[ toLightIndex(lx+1,ly,lz,sz+2)]==0
                        && lights[ toLightIndex(lx,ly+1,lz,sz+2)]==0
                        && lights[ toLightIndex(lx,ly,lz+1,sz+2)]==0 ){
                        skipNum++;
                        continue;
                    }
                    // 周囲が全部水の水は飛ばす
                    if( blocks[ toBlockIndex(lx,ly,lz,sz+2)]==4
                        && blocks[ toBlockIndex(lx-1,ly,lz,sz+2)]==4
                        && blocks[ toBlockIndex(lx,ly-1,lz,sz+2)]==4
                        && blocks[ toBlockIndex(lx,ly,lz-1,sz+2)]==4
                        && blocks[ toBlockIndex(lx+1,ly,lz,sz+2)]==4
                        && blocks[ toBlockIndex(lx,ly+1,lz,sz+2)]==4
                        && blocks[ toBlockIndex(lx,ly,lz+1,sz+2)]==4 ){
                        skipNum++;
                        continue;
                    }

                    makeNum++;  
                    // normalは２４個で、面あたり角で３個。
                    // 下にあればあるほど暗い
                    // light配列で-1ならその位置にブロックがあるということ 0以上１５以下なら空間で、光。

                    // z=0の面
                    lts[0]=lts[1]=lts[2]=lts[3]=lights[ toLightIndex(lx,ly,lz-1,sz+2) ];
                    if( lts[0]!=0 )drawflags[0]=1; else drawflags[0]=0;
                    if( objmode==2 && isBlock(blocks[toBlockIndex(lx,ly,lz-1,sz+2)]) ) drawflags[0]=0;                                         
                    // 0:z=0,0の角 
                    if( lights[toLightIndex(lx,ly-1,lz-1,sz+2)]==0 && lights[toLightIndex(lx-1,ly-1,lz-1,sz+2)]==0) lts[0]-=2;
                    if( lights[toLightIndex(lx-1,ly,lz-1,sz+2)]==0 && lights[toLightIndex(lx-1,ly-1,lz-1,sz+2)]==0) lts[0]-=2;
                    // z=0,1の角
                    if( lights[toLightIndex(lx,ly-1,lz-1,sz+2)]==0 && lights[toLightIndex(lx+1,ly-1,lz-1,sz+2)]==0) lts[1]-=2;
                    if( lights[toLightIndex(lx+1,ly,lz-1,sz+2)]==0 && lights[toLightIndex(lx+1,ly-1,lz-1,sz+2)]==0) lts[1]-=2;
                    // z=0,2の角
                    if( lights[toLightIndex(lx+1,ly,lz-1,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz-1,sz+2)]==0) lts[2]-=2;
                    if( lights[toLightIndex(lx,ly+1,lz-1,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz-1,sz+2)]==0) lts[2]-=2;
                    // z=0,3の角
                    if( lights[toLightIndex(lx-1,ly,lz-1,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz-1,sz+2)]==0) lts[3]-=2;
                    if( lights[toLightIndex(lx,ly+1,lz-1,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz-1,sz+2)]==0) lts[3]-=2;
                    
                    // z=1の面
                    lts[4]=lts[5]=lts[6]=lts[7]=lights[ toLightIndex(lx,ly,lz+1,sz+2) ];
                    if( lts[4]!=0 )drawflags[1]=1; else drawflags[1]=0;
                    if( objmode==2 && isBlock(blocks[toBlockIndex(lx,ly,lz+1,sz+2)]) ) drawflags[1]=0;                    
                    // z=1,4の角
                    if( lights[toLightIndex(lx-1,ly,lz+1,sz+2)]==0 && lights[toLightIndex(lx-1,ly-1,lz+1,sz+2)]==0) lts[4]-=2;
                    if( lights[toLightIndex(lx,ly-1,lz+1,sz+2)]==0 && lights[toLightIndex(lx-1,ly-1,lz+1,sz+2)]==0) lts[4]-=2;
                    // z=1,5の角
                    if( lights[toLightIndex(lx+1,ly,lz+1,sz+2)]==0 && lights[toLightIndex(lx+1,ly-1,lz+1,sz+2)]==0) lts[5]-=2;
                    if( lights[toLightIndex(lx,ly-1,lz+1,sz+2)]==0 && lights[toLightIndex(lx+1,ly-1,lz+1,sz+2)]==0) lts[5]-=2;
                    // z=1,6の角
                    if( lights[toLightIndex(lx+1,ly,lz+1,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz+1,sz+2)]==0) lts[6]-=2;
                    if( lights[toLightIndex(lx,ly+1,lz+1,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz+1,sz+2)]==0) lts[6]-=2;
                    // z=1,7の角
                    if( lights[toLightIndex(lx-1,ly,lz+1,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz+1,sz+2)]==0) lts[7]-=2;
                    if( lights[toLightIndex(lx,ly+1,lz+1,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz+1,sz+2)]==0) lts[7]-=2;

                    // x=0の面
                    lts[8]=lts[9]=lts[10]=lts[11]=lights[toLightIndex(lx-1,ly,lz,sz+2)];
                    if( lts[8]!=0 )drawflags[2]=1; else drawflags[2]=0;
                    if( objmode==2 && isBlock(blocks[toBlockIndex(lx-1,ly,lz,sz+2)]) ) drawflags[2]=0; 
                    // x=0,0の角
                    if( lights[toLightIndex(lx-1,ly-1,lz,sz+2)]==0 && lights[toLightIndex(lx-1,ly-1,lz-1,sz+2)]==0) lts[8]-=2;
                    if( lights[toLightIndex(lx-1,ly,lz-1,sz+2)]==0 && lights[toLightIndex(lx-1,ly-1,lz-1,sz+2)]==0) lts[8]-=2;
                    // x=0,4の角
                    if( lights[toLightIndex(lx-1,ly-1,lz,sz+2)]==0 && lights[toLightIndex(lx-1,ly-1,lz+1,sz+2)]==0) lts[9]-=2;
                    if( lights[toLightIndex(lx-1,ly,lz+1,sz+2)]==0 && lights[toLightIndex(lx-1,ly-1,lz+1,sz+2)]==0) lts[9]-=2;
                    // x=0,7の角
                    if( lights[toLightIndex(lx-1,ly+1,lz,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz+1,sz+2)]==0) lts[10]-=2;
                    if( lights[toLightIndex(lx-1,ly,lz+1,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz+1,sz+2)]==0) lts[10]-=2;
                    // x=0,3の角
                    if( lights[toLightIndex(lx-1,ly+1,lz,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz-1,sz+2)]==0) lts[11]-=2;
                    if( lights[toLightIndex(lx-1,ly,lz-1,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz-1,sz+2)]==0) lts[11]-=2;

                    // x=1の面
                    lts[12]=lts[13]=lts[14]=lts[15]=lights[toLightIndex(lx+1,ly,lz,sz+2)];
                    if( lts[12]!=0 )drawflags[3]=1; else drawflags[3]=0;
                    if( objmode==2 && isBlock(blocks[toBlockIndex(lx+1,ly,lz,sz+2)]) ) drawflags[3]=0;                    
                    // x=1,1の角
                    if( lights[toLightIndex(lx+1,ly-1,lz,sz+2)]==0 && lights[toLightIndex(lx+1,ly-1,lz-1,sz+2)]==0) lts[12]-=2;
                    if( lights[toLightIndex(lx+1,ly,lz-1,sz+2)]==0 && lights[toLightIndex(lx+1,ly-1,lz-1,sz+2)]==0) lts[12]-=2;
                    // x=1,5の角
                    if( lights[toLightIndex(lx+1,ly-1,lz,sz+2)]==0 && lights[toLightIndex(lx+1,ly-1,lz+1,sz+2)]==0) lts[13]-=2;
                    if( lights[toLightIndex(lx+1,ly,lz+1,sz+2)]==0 && lights[toLightIndex(lx+1,ly-1,lz+1,sz+2)]==0) lts[13]-=2;
                    // x=1,6の角
                    if( lights[toLightIndex(lx+1,ly+1,lz,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz+1,sz+2)]==0) lts[14]-=2;
                    if( lights[toLightIndex(lx+1,ly,lz+1,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz+1,sz+2)]==0) lts[14]-=2;
                    // x=1,2の角
                    if( lights[toLightIndex(lx+1,ly+1,lz,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz-1,sz+2)]==0) lts[15]-=2;
                    if( lights[toLightIndex(lx+1,ly,lz-1,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz-1,sz+2)]==0) lts[15]-=2;

                    // y=0の面
                    lts[16]=lts[17]=lts[18]=lts[19]=lights[toLightIndex(lx,ly-1,lz,sz+2)];
                    if( lts[16]!=0 )drawflags[4]=1; else drawflags[4]=0;
                    if( objmode==2 && isBlock(blocks[toBlockIndex(lx,ly-1,lz,sz+2)]) ) drawflags[4]=0;                     
                    // y=0,0の角
                    if( lights[toLightIndex(lx-1,ly-1,lz,sz+2)]==0) lts[16]-=2;
                    if( lights[toLightIndex(lx,ly-1,lz-1,sz+2)]==0) lts[16]-=2;
                    // y=0,1の角
                    if( lights[toLightIndex(lx+1,ly-1,lz,sz+2)]==0) lts[17]-=2;
                    if( lights[toLightIndex(lx,ly-1,lz-1,sz+2)]==0) lts[17]-=2;
                    // y=0,5の角
                    if( lights[toLightIndex(lx+1,ly-1,lz,sz+2)]==0) lts[18]-=2;
                    if( lights[toLightIndex(lx,ly-1,lz+1,sz+2)]==0) lts[18]-=2;
                    // y=0,4の角
                    if( lights[toLightIndex(lx,ly-1,lz+1,sz+2)]==0) lts[19]-=2;
                    if( lights[toLightIndex(lx-1,ly-1,lz,sz+2)]==0) lts[19]-=2;

                    // y=1の面
                    lts[20]=lts[21]=lts[22]=lts[23]=lights[toLightIndex(lx,ly+1,lz,sz+2)];
                    if( lts[20]!=0 )drawflags[5]=1; else drawflags[5]=0;
                    if( objmode==2 && isBlock(blocks[toBlockIndex(lx,ly+1,lz,sz+2)]) ) drawflags[5]=0;                     
                    // y=1,3の角
                    if( lights[toLightIndex(lx-1,ly+1,lz,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz-1,sz+2)]==0) lts[20]-=2;
                    if( lights[toLightIndex(lx,ly+1,lz-1,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz-1,sz+2)]==0) lts[20]-=2;
                    // y=1,2の角
                    if( lights[toLightIndex(lx,ly+1,lz-1,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz-1,sz+2)]==0) lts[21]-=2;
                    if( lights[toLightIndex(lx+1,ly+1,lz,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz-1,sz+2)]==0) lts[21]-=2;
                    // y=1,6の角
                    if( lights[toLightIndex(lx+1,ly+1,lz,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz+1,sz+2)]==0) lts[22]-=2;
                    if( lights[toLightIndex(lx,ly+1,lz+1,sz+2)]==0 && lights[toLightIndex(lx+1,ly+1,lz+1,sz+2)]==0) lts[22]-=2;
                    // y=1,7の角
                    if( lights[toLightIndex(lx,ly+1,lz+1,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz+1,sz+2)]==0) lts[23]-=2;
                    if( lights[toLightIndex(lx-1,ly+1,lz,sz+2)]==0 && lights[toLightIndex(lx-1,ly+1,lz+1,sz+2)]==0) lts[23]-=2;
                    
                    makeCube( Vector3(x,y,z),
                              vertices,
                              uv,
                              normals,
                              vi,
                              triangles,
                              ti,
                              i,
                              lts,
                              drawflags,
                              1,
                              1 );
                    /*                    
                    vi += 24; // ここが固定値でなくてもよい. drawflagsの個数の4倍
                    ti += 36; // の6倍
                    */

                    var drawcnt:int=0;
                    for(var ii:int=0;ii<6;ii++){
                        if(drawflags[ii]){
                            drawcnt++;
                        }
                    }
                    vi += drawcnt*4;
                    ti += drawcnt*6; // こっちのバージョンにしても軽くなるわけではないかも？

                } else if( (i==REDFLOWER||i==BLUEFLOWER ) && objmode==1 ){
                    // 花とか
                    makeFlowerObj( Vector3(x,y,z),
                                   vertices,
                                   uv,
                                   normals,
                                   vi,
                                   triangles,
                                   ti,
                                   i,
                                   lights[toLightIndex(lx,ly,lz,sz+2)] );
                    vi += 8;
                    ti += 24;
                } else if( i==TORCH && objmode==1){
                    makeFlowerObj( Vector3(x,y,z),
                                   vertices,
                                   uv,
                                   normals,
                                   vi,
                                   triangles,
                                   ti,
                                   i,
                                   lights[toLightIndex(lx,ly,lz,sz+2)] );
                    vi += 8;
                    ti += 24;
                    /*
                      for(i=0;i<lts.length;i++){
                        lts[i] = 7;
                    }
                    drawflags[0]=drawflags[1]=drawflags[2]=drawflags[3]=drawflags[4]=drawflags[5]=1;
                    makeCube( Vector3(x,y,z) + Vector3(0.4,0,0.4),
                              vertices,
                              uv,
                              normals,
                              vi,
                              triangles,
                              ti,
                              1,
                              lts,
                              drawflags,
                              0.6,
                              0.2 );
                    vi += 6 * 4;
                    ti += 6 * 6;
                    */       
                }
            }
        }
    }


    // 必要最低限の量だけコピって

    var verticesCopy : Vector3[] = new Vector3[ vi ];
    var uvCopy : Vector2[] = new Vector2[ vi];
    var trianglesCopy : int[] = new int[ ti ];
    var normalsCopy : Vector3[] = new Vector3[vi]; // 頂点数と同じだけ必要
    for(i=0;i<vi;i++){
        verticesCopy[i]=vertices[i];
        uvCopy[i]=uv[i];
        normalsCopy[i]=normals[i];
    }
    for(i=0;i<ti;i++){
        trianglesCopy[i]=triangles[i];
    }
    
    mesh.vertices = verticesCopy;
    mesh.uv = uvCopy;
    mesh.triangles = trianglesCopy;
    mesh.normals = normalsCopy;
    //    mesh.RecalculateNormals();
    if(vi==0)Destroy(gameObject); //計算の結果頂点がひとつもないなら死ぬよ
    maxvi=vi;

    
}

