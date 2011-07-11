
//
// 簡易プロファイラ
//

class Prof {
    var category:String;
    var times:float[]; //かかった時間
    var infos:int[]; //そのときの参考情報
    var num:int;
    function Prof(catname:String, n:int) {
        num=n;
        category=catname;
        times = new float[num];
        infos = new int[num];
        for(var i:int=0;i<num;i++){
            times[i]=0;
            infos[i]=0;
        }
    };
    function insert( t:float, inf:int ){
        var i:int;
        for(i=0;i<num;i++){
            if( t > times[i] ){
                for(var j:int=num-1;j>=i+1;j--){
                    times[j]=times[j-1];
                    infos[j]=infos[j-1];
                }
                times[i]=t;
                infos[i]=inf;
                return;
            }
        }
    }

    var st:float;
    function start() {
        st = Time.realtimeSinceStartup;
    }
    function end(inf:int) {
        insert( Time.realtimeSinceStartup - st, inf);
    }
    
    function to_s() {
        var s:String= category + ":";
        for(var i:int=0;i<num;i++){
            if(times[i]==0)break;
            s += "[" + times[i] + "," + infos[i] + "]";
        }
        return s;
    }
};


var AIR:int=0;
var STONE:int=1;
var SOIL:int=2;
var GRASS:int=3;
var WATER:int=4;
var LEAF:int=5;
var STEM:int=6;

var REDFLOWER:int=100;
var BLUEFLOWER:int=101;

function isSolidBlock(t:int) {
    if( t==AIR||t==WATER){
        return false;
    } else {
        return true;
    }
}


var protocol;
var rpcfunctions={};
var myClientID=0;



function addRPC(name,f){
    rpcfunctions[name]=f;
}

function escape(s:String){
    return s.Replace( '"', "\\\"" ).Replace( "'", "\\'" );
}

function toString(x) : String {
    var out;

    var s  = typeof(x).ToString();
    
    switch(s){
    case "System.String":
        out= "\"" + escape(x) + "\"";
        break;
    case "System.Int32":
        out= ""+x;
        break;
    case "System.Single":
        out= ""+x;
        break;
    case "System.Int32[]":
        out=arrayToJson(x);
        break;
    case "System.String[]":
        out=arrayToJson(x);
        break;
    case "System.Single[]":
        out=arrayToJson(x);
        break;
    case "Boo.Lang.Hash":
        out=hashToJson(x);
        break;
    case "System.Object[]":
        out=objaryToJson(x);
        break;
    case "System.Boolean":
        if(x) out= "1"; else out="0";
        break;
        
    default:
        throw "not implemented:"+typeof(x);        
    }
    return out;
}

function hashToJson(h) {
    var out = new Array();
    for( key in h.Keys ){
        out.push( "\""+key+"\":" + toString(h[key]) );
    }
    return "{"+out.Join(",")+"}";
}
function objaryToJson(oa) {
    var out = new Array();
    for( o in oa ) {
        out.push( toString(o));
    }
    return "["+out.Join(",")+"]";
}

function arrayToJson(ary) : String {
    var out = new Array();
    for(var i=0;i<ary.length;i++){
        out.push( toString(ary[i]) );
    }
    return "["+out.Join(",")+"]";
}

function send( meth ){ sendWithParams( meth, [] ); }
function send( meth, arg0 ){ sendWithParams( meth, [ arg0 ] ); }
function send( meth, arg0, arg1 ){ sendWithParams( meth, [ arg0, arg1 ] );}
function send( meth, arg0, arg1, arg2 ){ sendWithParams( meth, [ arg0, arg1, arg2 ] );}
function send( meth, arg0, arg1, arg2, arg3 ){ sendWithParams( meth, [ arg0, arg1, arg2, arg3 ] );}
function send( meth, arg0, arg1, arg2, arg3, arg4 ){ sendWithParams( meth, [ arg0, arg1, arg2, arg3, arg4 ] );}
function send( meth, arg0, arg1, arg2, arg3, arg4, arg5 ){ sendWithParams( meth, [ arg0, arg1, arg2, arg3, arg4, arg5 ] );}
function send( meth, arg0, arg1, arg2, arg3, arg4, arg5, arg6 ){ sendWithParams( meth, [ arg0, arg1, arg2, arg3, arg4, arg5, arg6 ] );}
function send( meth, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7 ){ sendWithParams( meth, [ arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7 ] );}
function send( meth, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8 ){ sendWithParams( meth, [ arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8 ] );}

function sendWithParams(meth, params ){
    var h={};
    h["method"]=meth;
    h["params"]=params;
    //    print( "htoj:"+hashToJson(h));
    protocol.writeSocket( hashToJson(h));
}

function searchActor( id:int ){
    return GameObject.Find(""+id);
}

var zombieTexture : Texture;
var pcTexture : Texture;

var prefabDebri : GameObject;
var prefabArrow : GameObject;

function makeDebriCube(a) {
    var mesh = a.GetComponent(MeshFilter).mesh;

    var cmaker = a.GetComponent("ChunkMaker");
    
    print("mesh:"+mesh);

    mesh.Clear();
        
    var vertices : Vector3[] = new Vector3[ 4*6 ]; // 立方体でuvを別々にするために各面４点必要
    var uv : Vector2[] = new Vector2[ 4*6 ];
    var triangles : int[] = new int[ 3 * 2 * 6 ];
    var normals : Vector3[] = new Vector3[4*6]; // 頂点数と同じだけ必要

    var lts:int[] = new int[6*4]; // Z=0 Z=1 X=0 X=1 Y=0 Y=1 の順
    var drawflags:int[] = new int[6]; // 各面を描画するかどうかのフラグ
    var i:int;
    for(i=0;i<6*4;i++){ lts[i]=5; }
    for(i=0;i<6;i++){ drawflags[i]=1; }
    
    cmaker.makeCube( Vector3(-0.5,0,-0.5),
                     vertices,
                     uv,
                     normals,
                     0,
                     triangles,
                     0,
                     STONE,
                     lts,
                     drawflags );
                     
    mesh.vertices = vertices;
    mesh.uv = uv;
    mesh.triangles = triangles;
    mesh.normals = normals;

    a.transform.localScale = Vector3(0.5,0.5,0.5);
}


function ensureActor( id:int, typeName:String, pos:Vector3 ){

    var a = searchActor(id);
    if(a!=null) return a;
    
    if( typeName == "pc" || typeName == "zombie" ){
        a = Instantiate( prefabGuest, pos,  Quaternion.identity );
        var hs = a.GetComponent( "HeroScript" );
        hs.clientID = id;
        hs.showName =  typeName + "_" + id;
        hs.isPC = true;
        if( id == myClientID ){
            a.transform.localScale = Vector3(0.2,0.2,0.2);
        } else {
            a.transform.localScale = Vector3(0.7,0.7,0.7);
        }
        if(typeName=="zombie"){
            hs.walkAnimName = "zwalk";
            hs.idleAnimName = "zidle";
            hs.setMaterial( zombieTexture );            
        } else {
            hs.walkAnimName = "walk";
            hs.idleAnimName = "idle";
            hs.setMaterial( pcTexture );            
        }        
    } else if( typeName == "STONE_debri" || typeName == "GRASS_debri" || typeName == "SOIL_debri" || typeName == "LEAF_debri" || typeName == "STEM_debri" ){
        a = Instantiate( prefabDebri, pos, Quaternion.identity );
        hs = a.GetComponent( "HeroScript");
        hs.clientID = id;
        hs.showName =  typeName + "_" + id;
        hs.isPC = false;

        makeDebriCube(a);
    } else if( typeName == "arrow" ) {
        a = Instantiate( prefabArrow, pos, Quaternion.identity );
        hs = a.GetComponent( "HeroScript");
        hs.clientID = id;
        hs.showName =  typeName + "_" + id;
        hs.isPC = false;

    }
    print("typeName:"+typeName);
    a.name = "" + id;
    return a;
}

function rpcEcho( any ) {
    //    print("echo:"+any);
}

// xyz:初期位置
function rpcLoginResult( cliID, x,y,z, speedps ) {
    AppendLog( "LoginResult: new cliID:" +cliID );
	myClientID = cliID;

    var hs = hero.GetComponent("HeroScript" );
    hs.clientID = myClientID;

    hs.SetMove( speedps, 0, 0, Vector3( x,y,z ), 0, 1, 1 );


}

function rpcMoveNotify( cliID, typeName, x,y,z, speed, pitch, yaw, dy, dt, ag ){
    if( typeName == "hidden"){
        print( "id:"+cliID+" tn:"+typeName+" dt:" +dt  + " xyz:"+x+","+y+","+z + " p:"+pitch + " yw:"+yaw + " dy:" +dy + " dt:" + dt + " sp:"+speed );
    }
    
    // idからpcを検索
    var pos:Vector3 = Vector3( x, y, z );
    var pc = ensureActor( cliID, typeName, pos );

    var hs = pc.GetComponent( "HeroScript");
    hs.SetMove( speed, pitch, yaw, pos, dy, dt, ag );

    // 遠すぎたら強制ワープ
    //    print( "distance:" + Vector3.Distance(  pos,  hero.transform.position ) );
    if( cliID == myClientID && Vector3.Distance(  pos,  hero.transform.position ) > 5 ){        
        hero.transform.position = pos;
    }
}
function rpcStatusChange( cliID, hp ) {
    print( "statusChange:" + cliID + " hp:" + hp );
    if( cliID == myClientID ){
        AppendLog( "Damage! new HP:" + hp );
        currentHP = hp;
    }
}
// mob等が消える
function rpcDisappear( cliID ) {

    print("recv disappear:"+cliID);    
    var pc = GameObject.Find( ""+cliID);
    if(pc!=null){
        Destroy(pc);
        var hs = pc.GetComponent("HeroScript");
        if(hs && hs.headObj ){
            Destroy(hs.headObj);
        }
        print("disappear: destroyed:"+cliID);
    }
}
function rpcChatNotify(cliID, txt){
    AppendLog( ""+cliID+": "+ txt);
}

var prefabMark : GameObject;

function rpcMarkNotify(x,y,z) {
    print("mark: xyz:"+x+","+y+","+z);
    var m = Instantiate( prefabMark, Vector3( x,y,z ), Quaternion.identity );
}


//変化のお知らせがあったので地形要求
function rpcChangeFieldNotify( x,y,z ) {
    print("rpcChangeFieldNotify:"+x+","+y+","+z + "sz:" + CHUNKSZ );
    var chx:int=Mathf.Floor(x/CHUNKSZ);
    var chy:int=Mathf.Floor(y/CHUNKSZ);
    var chz:int=Mathf.Floor(z/CHUNKSZ);

    print("main:"+chx+","+chy+","+chz);
    
    sendGetField(chx,chy,chz);
    print("edge");
    sendGetFieldEdges(chx,chy,chz);
}

function rpcJumpNotify( cliID, dy ) {
    var pc = searchActor(cliID);
    if(pc==null)return;
    var hs = pc.GetComponent( "HeroScript");
    hs.JumpByRemote(dy);
}

var cam : GameObject;
var hero : GameObject;

var bprof:Prof;
var wprof:Prof;
var iprof:Prof;
var eprof:Prof;

// 通信をするobj
function Start () {
    cam = GameObject.Find( "Main Camera" );
    hero = GameObject.Find( "HeroCube" );

    protocol = GetComponent( "ProtocolScript");
    addRPC( "loginResult", rpcLoginResult );
    addRPC( "moveNotify", rpcMoveNotify );
    addRPC( "getFieldResult", rpcGetFieldResult );
    addRPC( "changeFieldNotify", rpcChangeFieldNotify );
    addRPC( "jumpNotify", rpcJumpNotify );
    addRPC( "echo",rpcEcho);
    addRPC( "statusChange", rpcStatusChange );
    addRPC( "disappear", rpcDisappear );
    addRPC( "chatNotify", rpcChatNotify );
    addRPC( "markNotify", rpcMarkNotify );

    bprof = new Prof( "block", 20);
    wprof = new Prof( "water", 20);
    iprof = new Prof( "item", 20);
    eprof = new Prof( "ensure", 20);
}



function doProtocol() {

    // 受信
    try {
        var ary = protocol.readJSON();
    } catch(e){
        print( "readJSON exception! :"  + e );
    }

    if(ary!=null){
        for(var i=0;i<ary.Count; i++){
            doProtocolOne( ary[i] );
        }
    }

    // 送信

    if( protocol.isReady() && loginSent == false){
        loginSent = true;
        send( "login" );
    }

    
    // 現在の状態を送る
    var hs = hero.GetComponent("HeroScript" );
    var t = Time.realtimeSinceStartup;
    var thresSec = 0.2;
    if( hs.falling ) thresSec = 0.05;
    if(  t > ( protocolLastSent + thresSec ) || hs.needSend ){
        //        print("yaw:"+hs.yaw);
        send( "move",
              hero.transform.position.x,
              hero.transform.position.y,
              hero.transform.position.z,
              hs.speedPerSec,
              hs.pitch,
              hs.yaw,
              t - protocolLastSent
            );
        protocolLastSent = t;
		hs.needSend = false;
    }

    
}
function doProtocolOne( h ){
    if( h == null )return;

    
    //                                                     		print( "data from server:"+h )        ;
    var f = rpcfunctions[ h["method"].str ];
    //                print( "from server:'"+h["method"].str+"' , len:" + h["params"].list.Count );
    var args = h["params"].list;
    var ra = new Array();
    var ii:int;
    
    for( var i:int=0;i<args.Count;i++){
        if( args[i] == null ){continue;}

        switch( args[i].type ){
        case 0: //NULL
            ra[i] = null;
            break;
        case 1: // string
            ra[i] = args[i].str;
            break;
        case 2: // number
            ra[i] = args[i].n;
            break;
        case 3: // object
            ra[i] = null;
            print( "json objval: not implemented" );
            break;
        case 4: // array
                //               print( "array! num:"+args[i].list.Count );
            switch(args[i].list[0].type){
            case 1: // str
                var aas:String[] = new String[args[i].list.Count];
                for(ii=0;ii<args[i].list.Count;ii++) aas[ii]= args[i].list[ii].str;
                ra[i]=aas;
                break;
            case 2: // number(now int only)
                var aai:int[] = new int[args[i].list.Count];
                for(ii=0;ii<args[i].list.Count;ii++) aai[ii]= args[i].list[ii].n;
                ra[i]=aai;
                break;
            case 5: // bool
                var aab:System.Boolean[] = new System.Boolean[args[i].list.Count];
                for(ii=0;ii<args[i].list.Count;ii++) aab[ii]= args[i].list[ii].b;
                ra[i]=aab;
                break;
            default:
                ra[i] = null;
                break;
            }
            break;
        case 5: // bool
            ra[i] = args[i].b;
            break;
        default:
            ra[i] = null;
            print( "json unknownval: not implemented" );
            break;
        } 
    }

    switch( args.Count ){
    case 0:	f(); break;
    case 1: f( ra[0] ); break;
    case 2: f( ra[0], ra[1] ); break;
    case 3: f( ra[0], ra[1], ra[2] ); break;
    case 4: f( ra[0], ra[1], ra[2], ra[3] ); break;
    case 5: f( ra[0], ra[1], ra[2], ra[3], ra[4] ); break;
    case 6: f( ra[0], ra[1], ra[2], ra[3], ra[4], ra[5] ); break;
    case 7: f( ra[0], ra[1], ra[2], ra[3], ra[4], ra[5], ra[6] ); break;
    case 8: f( ra[0], ra[1], ra[2], ra[3], ra[4], ra[5], ra[6], ra[7] ); break;
    case 9: f( ra[0], ra[1], ra[2], ra[3], ra[4], ra[5], ra[6], ra[7], ra[8] ); break;
    case 10: f( ra[0], ra[1], ra[2], ra[3], ra[4], ra[5], ra[6], ra[7], ra[8], ra[9] ); break;
    case 11: f( ra[0], ra[1], ra[2], ra[3], ra[4], ra[5], ra[6], ra[7], ra[8], ra[9], ra[10] ); break;
    case 12: f( ra[0], ra[1], ra[2], ra[3], ra[4], ra[5], ra[6], ra[7], ra[8], ra[9], ra[10], ra[11] ); break;                        
    default: throw "too many args from server"; 
    }

}


var protocolLastSent=0.0;
var loginSent=false;

var tmpcounter0 = 0;
var tmpcounter1 = 0;
var tmpcounter2 = 0;

var statText : GUIText;


var prefabGuest : GameObject;

var prefabMultiCube : GameObject;
var prefabMultiObjCube : GameObject;
var prefabMultiWaterCube : GameObject;

var currentHP :int;

var logs = new Array();

function AppendLog( s:String ) {
    if( logs.length > 10 ){
        logs = new Array();
    }
    logs[ logs.length] = s;
}


function OnGUI() {
    // キャラクタステータス表示
    GUI.Label( Rect( 20,20,50,30 ), "HP:" + currentHP );    

    // ログ表示
    for( var i=0;i<logs.length;i++){
        if( logs[logs.length-1-i].Length > 0 ){
            GUI.Label( Rect( 0, 80+i*20, 300, 20 ), logs[i] );
        }
    }
}

function expandRunLength(rl,out) {
    var outi:int=0;
    for(var i:int=0;i<rl.length;i+=2){
        var v:int = rl[i];
        var l:int = rl[i+1];
        for(var ii:int=0;ii<l;ii++){
            out[outi]=v;
            outi++;
        }
    }
    return out;
}





//
// Chunk
// 地形の読み込み, chunkで持っておいてまだロードしてなかったら(nullだったら)
//

var CHUNKMAX = 32;  //32x32x32 chunkサイズは16x16x16
var CHUNKSZ = 16;
var chunks = new Array(CHUNKMAX*CHUNKMAX*CHUNKMAX);

function toChunkIndex(x:int,y:int,z:int) : int {
    var i = y * CHUNKMAX *CHUNKMAX + z * CHUNKMAX + x;
    //    print("i:"+i+"x:"+x+"y:"+y+"z:"+z+"chm:"+CHUNKMAX);
    return i;
}
 
function Field() {
    chunks = new Array( CHUNKMAX *CHUNKMAX*CHUNKMAX );
    for(var i:int=0;i<chunks.length;i++)chunks[i]=null;
}


// pos : キャラの座標
var VIEWRANGE = 64; // 見える範囲

var updatedSomeChunk=false; // どれか１個でも更新されてたらtrue

class Chunk {
    var blocks : int[];
    var lights : int[];
    var size:int;
    var loaded:System.Boolean;
    var needBlockUpdate:System.Boolean; // ブロックの再描画が必要.
    var needWaterUpdate:System.Boolean; // 水の再描画が必要.
    var needItemUpdate:System.Boolean;
    
    var chx:int;
    var chy:int;
    var chz:int;
    function Chunk( sz:int, _chx:int, _chy:int, _chz:int ){
        //        Debug.Log( "xyz:"+_chx+_chy+_chz);
        chx=_chx; chy=_chy; chz=_chz;
        size=sz;
        loaded=false;
        needBlockUpdate=false;
        needWaterUpdate=false;
        needItemUpdate=false;
        blocks = new int[(size+2)*(size+2)*(size+2)];
        lights = new int[(size+2)*(size+2)*(size+2)];
        for(var i:int=0;i<blocks.length;i++)blocks[i]=-1;
        for(i=0;i<lights.length;i++) lights[i]=0;
        
    }
    function toBlockIndex(x:int,y:int,z:int) : int{
        return y * (size+2) * (size+2) + z * (size+2) + x;
    }
    // chunk内座標限定
    function getBlock(x:int,y:int,z:int) :int {
        return blocks[ toBlockIndex(x%(size+2),y%(size+2),z%(size+2)) ];
    }
    function getLight(x:int,y:int,z:int) :int{
        return lights[ toLightIndex(x%(size+2),y%(size+2),z%(size+2)) ];
    }

    // 0 ~ (size+2) 
    function toLightIndex(x:int,y:int,z:int):int{
        return y * (size+2) * (size+2) + z * (size+2) + x;
    }

};

function dumpArray( a:int[] ):String{
    var s="";
    for(var i:int=0;i<a.length;i++){
        s+= a[i]+",";
    }
    return s;
}
function countBlocks(blocks:int[]) :int[]{

    var blockCnt:int=0;
    var itemCnt:int=0;
    var waterCnt:int=0;

    for(var i=0;i<blocks.length;i++){
        var t:int = blocks[i];
        if( t >= 100 ){
            itemCnt++;
        } else if( t == WATER ){
            waterCnt++;
        } else if( t >= AIR ){
            blockCnt++;
        }
    }
    var out: int[] = new int[3]; // block, item, water
    out[0]=blockCnt;
    out[1]=itemCnt;
    out[2]=waterCnt;
    return out;
}    



function isInViewFrustum( bx:int, by:int, bz:int ) : System.Boolean {
    var planes : Plane[];
    var c : Camera = Camera.main;
    planes = GeometryUtility.CalculateFrustumPlanes(c);
    var bounds : Bounds = Bounds( Vector3(bx,by,bz), Vector3(CHUNKSZ,CHUNKSZ,CHUNKSZ));
    if( GeometryUtility.TestPlanesAABB(planes,bounds)){
        return true;
    } else {
        return false;
    }
}

//bxyz: block座標
// sendしたらtrue
function ensureChunks( v:Vector3, range:int ) : System.Boolean {
    var bx:int = v.x;
    var by:int = v.y;
    var bz:int = v.z;
    var chx:int = bx / CHUNKSZ;
    var chy:int = by / CHUNKSZ;
    var chz:int = bz / CHUNKSZ;

    var sendx:int=-1;
    var sendy:int=-1;
    var sendz:int=-1;
    var minDistance:float=999999999999;
    
    for(var y:int= chy-range; y <= chy+range; y++){
        if(y<0||y>=CHUNKMAX)continue;
        for(var x:int= chx-range; x <= chx+range; x++){
            if(x<0||x>=CHUNKMAX)continue;            
            for(var z:int= chz-range; z <= chz+range; z++){
                if(z<0||z>=CHUNKMAX)continue;
                var ch = chunks[ toChunkIndex( x,y,z ) ];
                if( !isInViewFrustum( x*CHUNKSZ+(CHUNKSZ/2),y*CHUNKSZ+(CHUNKSZ/2),z*CHUNKSZ+(CHUNKSZ/2)) ) continue;
                if(ch==null){
                    var d:float = (x-chx)*(x-chx)+(y-chy)*(y-chy)+(z-chz)*(z-chz);
                    if( d<minDistance){
                        minDistance = d;
                        sendx = x;
                        sendy = y;
                        sendz = z;
                    }
                }
            }
        }
    }
    if( sendx==-1){
        return false;
    }

    // 一番近いのを1個送る
    chunks[ toChunkIndex(sendx,sendy,sendz) ] = new Chunk(CHUNKSZ,sendx,sendy,sendz);
    
    send( "getField",
          sendx*CHUNKSZ,sendy*CHUNKSZ,sendz*CHUNKSZ,
          (sendx+1)*CHUNKSZ,(sendy+1)*CHUNKSZ,(sendz+1)*CHUNKSZ );
    return true; 

}
function getChunk(chx:int,chy:int,chz:int):Chunk{
    if( chx<0||chy<0||chz<0||chx>=CHUNKMAX||chy>=CHUNKMAX||chz>=CHUNKMAX) return null;
    return chunks[ toChunkIndex( chx, chy, chz ) ];
}

function updateChunk( chx:int,chy:int,chz:int, blkary:int[],lgtary:int[] ) {
    try{
        var chk = getChunk(chx,chy,chz);
        if(chk==null) throw"invalid chcoord:"+chx.ToString()+chy.ToString()+chz.ToString();
        expandRunLength(blkary, chk.blocks);
        expandRunLength(lgtary, chk.lights);
        chk.loaded=true;

        var counts:int[] = countBlocks(chk.blocks);
        var blockCnt:int=counts[0];
        var itemCnt:int=counts[1];
        var waterCnt:int=counts[2];

        if( blockCnt > 0 ) chk.needBlockUpdate=true;
        if( waterCnt > 0 ) chk.needWaterUpdate=true;
        if( itemCnt > 0 ) chk.needItemUpdate=true;
            

    } catch(e){
        print("excep"+e);
    }
    updatedSomeChunk=true;
}
function chunkStat():String{
    var nl:int=0;
    var init:int=0;
    var loaded:int=0;
    var needup:int=0;
    for(var i:int=0;i<chunks.length;i++){
        if( chunks[i]==null){ nl++;  continue; }
        if( chunks[i].loaded==false) init++;
        if( chunks[i].loaded==true) loaded++;
        if( chunks[i].needUpdate==true) needup++;
    }
    return ""+nl+"/"+init+"/"+loaded+"/"+needup;
}

// ix,iy,iz:整数のブロック座標
function getBlock( ix:int,iy:int,iz:int ):int {
    if(ix<0||iy<0||iz<0)return 0;
    var chk:Chunk = getChunk( ix/CHUNKSZ, iy/CHUNKSZ, iz/CHUNKSZ);
    if(chk==null)return 0;
    return chk.getBlock( (ix%CHUNKSZ)+1,(iy%CHUNKSZ)+1,(iz%CHUNKSZ)+1);
}
function getLight( ix:int,iy:int,iz:int ) :int {
    if(ix<0||iy<0||iz<0)return 0;
    var chk:Chunk = getChunk( ix/CHUNKSZ, iy/CHUNKSZ, iz/CHUNKSZ);
    if(chk==null)return 0;
    return chk.getLight( (ix%CHUNKSZ)+1,(iy%CHUNKSZ)+1,(iz%CHUNKSZ)+1);
}



function findUpdatedChunk() :Chunk{
    if( updatedSomeChunk == false){
        return null;
    }
    for(var i:int=0;i<chunks.length;i++){
        if( chunks[i]!=null && chunks[i].loaded==true && ( chunks[i].needBlockUpdate==true || chunks[i].needWaterUpdate==true||chunks[i].needItemUpdate==true) ){
            return chunks[i];
        }
    }
    updatedSomeChunk=false;
    return null;       
}




// blkary, lgtaryは RunLength
function rpcGetFieldResult( x0,y0,z0,x1,y1,z1,blkary,lgtary) {
    // print( "field data. xyz:"+x0+y0+z0+x1+y1+z1+":"+blkary+" lgt:"+lgtary);
    if( x0<0||y0<0||z0<0||x0>=CHUNKMAX*CHUNKSZ||y0>=CHUNKMAX*CHUNKSZ||z0>=CHUNKMAX*CHUNKSZ||blkary== null || blkary[0] == null ||lgtary==null||lgtary[0]==null )return;
           
    updateChunk( x0/CHUNKSZ, y0/CHUNKSZ, z0/CHUNKSZ, blkary, lgtary );
}

var stonePrefab : GameObject;
var waterPrefab : GameObject;

var chs="";
var counter=0;


function Update() {
    
    send("echo",123); // 何故か送らないと受信できない
    doProtocol();


    counter++;
    //    if( (counter%30)==0){
        //        chs = chunkStat();
        //        print( "w:"+wprof.to_s() + " b:"+bprof.to_s() + " i:"+iprof.to_s() );
    //    }


    var ray = cam.camera.ScreenPointToRay( Vector3( Screen.width/2, Screen.height/2,0));
    
    var hs = hero.GetComponent("HeroScript" );
    
    nt = statText.GetComponent( "GUIText" );
    nt.text = "v:"+hero.transform.position+" dy:" + hs.dy + " chk:"+chs +  " ray:"+ray.direction + " ns:"+hs.nose + "f:" + hs.falling;

    // 自分のまわり優先
    eprof.start();
    ensureChunks( hero.transform.position, VIEWRANGE/CHUNKSZ );
    eprof.end(0);

    var upChk = findUpdatedChunk(); // 軽い
    
    if( upChk != null){
        var blockUpdated:System.Boolean = false;
        
        if( upChk.needBlockUpdate ){
            var p:GameObject = GameObject.Find( "chunk_"+upChk.chx + "_" + upChk.chy + "_" + upChk.chz );   
            if(p==null){
                p = Instantiate( prefabMultiCube,
                                 Vector3( upChk.chx*CHUNKSZ, upChk.chy*CHUNKSZ, upChk.chz*CHUNKSZ ),
                                 Quaternion.identity );
                p.name = "chunk_" +upChk.chx + "_" + upChk.chy + "_" + upChk.chz;
            }

            var maker = p.GetComponent( "ChunkMaker" );
            bprof.start();
            maker.SetField( upChk.blocks, upChk.lights, CHUNKSZ );
            bprof.end(0);
            maker.objmode=0;
            upChk.needBlockUpdate=false;
            blockUpdated = true;

        }
        
        if( upChk.needItemUpdate ){
            var po:GameObject = GameObject.Find( "obj_"+upChk.chx + "_" + upChk.chy + "_" + upChk.chz );            
            if(po==null){
                //                print("oCnt:"+itemCnt);                
                po = Instantiate( prefabMultiObjCube,
                                  Vector3( upChk.chx*CHUNKSZ, upChk.chy*CHUNKSZ, upChk.chz*CHUNKSZ ),
                                  Quaternion.identity );
                po.name = "obj_"+upChk.chx + "_" + upChk.chy + "_" + upChk.chz;
            }
            var omaker = po.GetComponent( "ChunkMaker" );
            omaker.SetField(upChk.blocks, upChk.lights, CHUNKSZ );
            omaker.objmode=1;
            upChk.needItemUpdate=false;                        
        }
        if( upChk.needWaterUpdate && blockUpdated == false ){
            var pw:GameObject = GameObject.Find( "water_"+upChk.chx + "_" + upChk.chy + "_" + upChk.chz );
            if(pw==null){
                pw = Instantiate( prefabMultiWaterCube,
                                  Vector3( upChk.chx*CHUNKSZ, upChk.chy*CHUNKSZ, upChk.chz*CHUNKSZ ),
                                  Quaternion.identity );
                pw.name = "water_"+upChk.chx + "_" + upChk.chy + "_" + upChk.chz;
            }
            var wmaker = pw.GetComponent( "ChunkMaker");
            wprof.start();
            wmaker.SetField(upChk.blocks, upChk.lights, CHUNKSZ );
            wprof.end(0);
            wmaker.objmode=2;
            upChk.needWaterUpdate=false;                        
        }
    } 
}

// 掘る
function sendGetField(chx:int,chy:int,chz:int){
    if( chx>=0 && chy>=0 && chz>=0 && chx<CHUNKMAX && chy<CHUNKMAX&& chz<CHUNKMAX){
        print("send getfield. chx:"+chx + ","+chy+","+chz);
        send( "getField",chx*CHUNKSZ, chy*CHUNKSZ, chz*CHUNKSZ,(chx+1)*CHUNKSZ, (chy+1)*CHUNKSZ, (chz+1)*CHUNKSZ );
    }
}
function sendGetFieldEdges(ix:int,iy:int,iz:int){
    var chx:int=ix/CHUNKSZ;
    var chy:int=iy/CHUNKSZ;
    var chz:int=iz/CHUNKSZ;
    
    if((ix%CHUNKSZ)==0) sendGetField(chx-1, chy, chz );
    if((iy%CHUNKSZ)==0) sendGetField(chx, chy-1, chz );
    if((iz%CHUNKSZ)==0) sendGetField(chx, chy, chz-1 );
    
    if((ix%CHUNKSZ)==(CHUNKSZ-1)) sendGetField(chx+1, chy, chz );
    if((iy%CHUNKSZ)==(CHUNKSZ-1)) sendGetField(chx, chy+1, chz );
    if((iz%CHUNKSZ)==(CHUNKSZ-1)) sendGetField(chx, chy, chz+1 );
}

function attack(){
    send("attack");
}

function digBlock( ix:int, iy:int, iz:int ) {
    //    print( "dig: "+ix+","+iy+","+iz);
    send( "dig", ix,iy,iz );
    var chx=ix/CHUNKSZ;
    var chy=iy/CHUNKSZ;
    var chz=iz/CHUNKSZ;


    sendGetField(chx, chy, chz );
    sendGetFieldEdges( ix, iy, iz );
    
}
function putItem( ix:int, iy:int, iz:int, tname ) {
    send( "put", ix, iy, iz, tname );
    var chx=ix/CHUNKSZ;
    var chy=iy/CHUNKSZ;
    var chz=iz/CHUNKSZ;    
    sendGetField(chx, chy, chz );
    sendGetFieldEdges( ix, iy, iz );    
}

function land(v:Vector3){
    send("land", v.x, v.y, v.z );
}
