

var protocol;
var rpcfunctions={};
var myClientID=0;



function addRPC(name,f){
    rpcfunctions[name]=f;
}

function escape(s){
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

function searchPC( id:int ){
    return GameObject.Find(""+id);
}

function ensurePC( id:int, typeName:String, pos:Vector3 ){

    var pc = searchPC(id);
    if(pc==null){
        pc = Instantiate( prefabGuest, pos,  Quaternion.identity );
        pc.name = "" + id;
        var hs = pc.GetComponent( "HeroScript" );
        hs.clientID = id;
        hs.showName =  typeName + "_" + id;
        if( hs.clientID == myClientID ){
            pc.transform.localScale = Vector3(0.2,0.2,0.2);
        } else {
            pc.transform.localScale = Vector3(0.7,0.7,0.7);
        }
        
        if( typeName == "zombie" ){
            hs.walkAnimName = "zwalk";
            hs.idleAnimName = "zidle";
        } else {
            hs.walkAnimName = "walk";
            hs.idleAnimName = "idle";            
        }
    }
    return pc;
}

function rpcEcho( any ) {
    //    print("echo:"+any);
}

// xyz:初期位置
function rpcLoginResult( cliID, x,y,z, speedps ) {
    AppendLog( "LoginResult: new cliID:" +cliID );
	myClientID = cliID;

    var hero = GameObject.Find( "HeroCube" );
    var hs = hero.GetComponent("HeroScript" );
    hs.clientID = myClientID;

    hs.SetMove( speedps, 0, 0, Vector3( x,y,z ), 0, 1 );


}

function rpcMoveNotify( cliID, typeName, x,y,z, speed, pitch, yaw, dy, dt ){
        print( "id:"+cliID+" dt:" +dt  + " xyz:"+x+","+y+","+z + " p:"+pitch + " yw:"+yaw + " dy:" +dy + " dt:" + dt + " sp:"+speed );
    
    // idからpcを検索
    var pos:Vector3 = Vector3( x, y, z );
    var pc = ensurePC( cliID, typeName, pos );

    var hs = pc.GetComponent( "HeroScript");
    hs.SetMove( speed, pitch, yaw, pos, dy, dt );

    // 遠すぎたら強制ワープ
    var hero = GameObject.Find( "HeroCube" );
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

//変化のお知らせがあったので地形要求
function rpcChangeFieldNotify( x,y,z ) {
    var chx=x/CHUNKSZ;
    var chy=y/CHUNKSZ;
    var chz=z/CHUNKSZ;
    
    sendGetField(chx,chy,chz);
    sendGetFieldEdges(chx,chy,chz);
}

function rpcJumpNotify( cliID, dy ) {
    var pc = searchPC(cliID);
    if(pc==null)return;
    var hs = pc.GetComponent( "HeroScript");
    hs.JumpByRemote(dy);
}

// 通信をするobj
function Start () {

    protocol = GetComponent( "ProtocolScript");
    addRPC( "loginResult", rpcLoginResult );
    addRPC( "moveNotify", rpcMoveNotify );
    addRPC( "getFieldResult", rpcGetFieldResult );
    addRPC( "changeFieldNotify", rpcChangeFieldNotify );
    addRPC( "jumpNotify", rpcJumpNotify );
    addRPC( "echo",rpcEcho);
    addRPC( "statusChange", rpcStatusChange );
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
    var hero = GameObject.Find( "HeroCube" );
    var hs = hero.GetComponent("HeroScript" );
    var t = Time.realtimeSinceStartup;
    var thresSec = 0.2;
    if( hs.falling ) thresSec = 0.05;
    if(  t > ( protocolLastSent + thresSec ) || hs.needSend ){
        send( "move",
              hero.transform.position.x,
              hero.transform.position.y,
              hero.transform.position.z,
              hs.speedPerSec,
              hs.pitch,
              hs.yaw,
              hs.dy,
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
    for( var i=0;i<args.Count;i++){
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
            var aa = new Array(args[i].list.Count);
            for(var ii=0;ii<args[i].list.Count;ii++){
                switch(args[i].list[ii].type){
                case 1: // str
                    aa[ii] = args[i].list[ii].str;
                    break;                    
                case 2: // number
                    aa[ii] = args[i].list[ii].n;
                    break;
                case 5: // bool
                    aa[ii] = args[i].list[ii].b;
                    break;
                default:
                    aa[ii] = null;
                    break;
                }
            }
            ra[i]=aa;

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


// 地形の読み込み, chunkで持っておいてまだロードしてなかったら(nullだったら)



var CHUNKMAX = 32;  //32x32x32 chunkサイズは16x16x16
var CHUNKSZ = 8;
var chunks = new Array(CHUNKMAX*CHUNKMAX*CHUNKMAX);

function toChunkIndex(x,y,z) : int {
    var i = y * CHUNKMAX *CHUNKMAX + z * CHUNKMAX + x;
    //    print("i:"+i+"x:"+x+"y:"+y+"z:"+z+"chm:"+CHUNKMAX);
    return i;
}
 
function Field() {
    chunks = new Array( CHUNKMAX *CHUNKMAX*CHUNKMAX );
    for(var i=0;i<chunks.length;i++)chunks[i]=null;
}


// pos : キャラの座標
var VIEWRANGE = 64; // 見える範囲

var updatedSomeChunk=false; // どれか１個でも更新されてたらtrue

class Chunk {
    var blocks : int[];
    var lights : int[];
    var size;
    var state;
    var needUpdate; // 再描画が必要.
    var chx;
    var chy;
    var chz;
    function Chunk( sz:int, _chx:int, _chy:int, _chz:int ){
        //        Debug.Log( "xyz:"+_chx+_chy+_chz);
        chx=_chx; chy=_chy; chz=_chz;
        size=sz;
        state="init";
        needUpdate=false;
        blocks = new int[size*size*size];
        lights = new int[(size+2)*(size+2)*(size+2)];
        for(var i=0;i<blocks.length;i++)blocks[i]=-1;
        for(i=0;i<lights.length;i++) lights[i]=0;
        
    }
    function toBlockIndex(x,y,z){
        return y * size * size + z * size + x;
    }
    // chunk内座標でもどちでもよい
    function getBlock(x,y,z) {
        return blocks[ toBlockIndex(x%size,y%size,z%size) ];
    }
    // lights:3x3x3の光源情報
    function setBlock(x,y,z, t, lights) {
        x = x % size;
        y = y % size;
        z = z % size;
        blocks[ toBlockIndex(x,y,z) ] = t;
        for(var iy=0;iy<3;iy++){
            for(var iz=0;iz<3;iz++){
                for(var ix=0;ix<3;ix++){
                    if( (x-1+ix)<0||(y-1+iy)<0||(z-1+iz)<0) continue;
                    var li = toLightIndex(x+1-1+ix,y+1-1+iy,z+1-1+iz);
                    this.lights[li] = lights[ ix + iz*3+iy*3*3 ];
                }
            }
        }
        needUpdate=true;
    }
    // 0 ~ (size+2) 
    function toLightIndex(x,y,z){
        return y * (size+2) * (size+2) + z * (size+2) + x;
    }
    

    function setArray( blks, lts ) {
        if( blks.length != size*size*size ) throw "invalid blocks length:"+blks.length.ToString();
        if( lts.length != (size+2)*(size+2)*(size+2) ) throw "invalid lts length:"+lts.length.ToString();
        var i:int;

        // x,z平面でy高さ方向が最後のループで統一
        for(i=0;i<blks.length;i++) this.blocks[i] = blks[i];
        for(i=0;i<lts.length;i++) this.lights[i] = lts[i];
                    
        state="loaded";
        needUpdate=true;
        print("loaded");
    }
    function countBlocks() {
        var cnt:int=0;
        for(var i=0;i<this.blocks.length;i++){
            if( this.blocks[i] != 0 )cnt++;
        }
        return cnt;
    }
    function countItems() {
        var cnt:int=0;
        for(var i=0;i<this.blocks.length;i++){
            if( this.blocks[i] >= 100 )cnt++;
        }
        return cnt;
    }
    
};


//bxyz: block座標
function ensureChunks( bx:int,by:int,bz:int ){
    var chx = bx / CHUNKSZ;
    var chy = by / CHUNKSZ;
    var chz = bz / CHUNKSZ;
    var chrange = VIEWRANGE / CHUNKSZ;

    for(var y= chy-chrange; y <= chy+chrange; y++){
        if(y<0||y>=CHUNKMAX)continue;
        for(var x= chx-chrange; x <= chx+chrange; x++){
        if(x<0||x>=CHUNKMAX)continue;            
            for(var z= chz-chrange; z <= chz+chrange; z++){
                if(z<0||z>=CHUNKMAX)continue;
                var ch = chunks[ toChunkIndex( x,y,z ) ];
                if(ch==null){
                    chunks[ toChunkIndex(x,y,z) ] = new Chunk(CHUNKSZ,x,y,z);
                    send( "getField",
                          x*CHUNKSZ,y*CHUNKSZ,z*CHUNKSZ,
                          (x+1)*CHUNKSZ,(y+1)*CHUNKSZ,(z+1)*CHUNKSZ );
                    return; // １ループに１かいまで
                }
            }
        }
    }
}
function getChunk(chx,chy,chz){
    if( chx<0||chy<0||chz<0||chx>=CHUNKMAX||chy>=CHUNKMAX||chz>=CHUNKMAX) return null;
    return chunks[ toChunkIndex( chx, chy, chz ) ];
}

function updateChunk( chx,chy,chz, blkary,lgtary ) {
    try{
    var chk = getChunk(chx,chy,chz);
    if(chk==null) throw"invalid chcoord:"+chx.ToString()+chy.ToString()+chz.ToString();
    chk.setArray(blkary, lgtary);
    } catch(e){}
    updatedSomeChunk=true;
}
function chunkStat(){
    var nl=0;
    var init=0;
    var loaded=0;
    var needup=0;
    for(var i=0;i<chunks.length;i++){
        if( chunks[i]==null){ nl++;  continue; }
        if( chunks[i].state=="init") init++;
        if( chunks[i].state=="loaded") loaded++;
        if( chunks[i].needUpdate==true) needup++;
    }
    return ""+nl+"/"+init+"/"+loaded+"/"+needup;
}

// ix,iy,iz:整数のブロック座標
function getBlock( ix:int,iy:int,iz:int ) {
    if(ix<0||iy<0||iz<0)return null;
    
    var chk = getChunk( ix/CHUNKSZ, iy/CHUNKSZ, iz/CHUNKSZ);
    if(chk==null)return null;
    return chk.getBlock( ix%CHUNKSZ,iy%CHUNKSZ,iz%CHUNKSZ);
        
}



function findUpdatedChunk() {
    if( updatedSomeChunk == false){
        return null;
    }
    for(var i=0;i<chunks.length;i++){
        if( chunks[i]!=null && chunks[i].state=="loaded" && chunks[i].needUpdate==true ){
            return chunks[i];
        }
    }
    updatedSomeChunk=false;
    return null;       
}




function rpcGetFieldResult( x0,y0,z0,x1,y1,z1,blkary,lgtary) {
    if( x0<0||y0<0||z0<0||x0>=CHUNKMAX*CHUNKSZ||y0>=CHUNKMAX*CHUNKSZ||z0>=CHUNKMAX*CHUNKSZ||blkary== null || blkary[0] == null ||lgtary==null||lgtary[0]==null )return;
    //        print( "field data. xyz:"+x0+y0+z0+x1+y1+z1+":"+blkary);
    updateChunk( x0/CHUNKSZ, y0/CHUNKSZ, z0/CHUNKSZ, blkary, lgtary );
}

var stonePrefab : GameObject;
var waterPrefab : GameObject;

var chs="";
var counter=0;

var AIR=0;
var STONE=1;
var SOIL=2;
var GRASS=3;
var WATER=4;
var LEAF=5;
var STEM=6;

var REDFLOWER=100;
var BLUEFLOWER=101;


function Update () {

    
    send("echo",123); // 何故か送らないと受信できない
    doProtocol();

    counter++;
    if( (counter%10)==0){
        chs = chunkStat();
    }


    var cam = GameObject.Find( "Main Camera" );
    var ray = cam.camera.ScreenPointToRay( Vector3( Screen.width/2, Screen.height/2,0));
    
    var hero = GameObject.Find( "HeroCube" );
    var hs = hero.GetComponent("HeroScript" );
    nt = statText.GetComponent( "GUIText" );
    nt.text = "v:"+hero.transform.position+" chunk:"+chs + " ray:"+ray.origin + ">"+ray.direction + " nose:"+hs.nose;

    // ここまでで0.03 ~ 0.04
    ensureChunks( hero.transform.position.x, hero.transform.position.y, hero.transform.position.z );

    // 0.04 ~ 0.055
    var upChk = findUpdatedChunk(); // 軽い

    
    if( upChk != null){
        var p;
        var po;
        p = GameObject.Find( "chunk_"+upChk.chx + "_" + upChk.chy + "_" + upChk.chz );
        //        if(p)Destroy(p);
        po = GameObject.Find( "obj_"+upChk.chx + "_" + upChk.chy + "_" + upChk.chz );
        //        if(po)Destroy(po);
        

        
        if( upChk.countBlocks() > 0 ){
            if(p==null){
                p = Instantiate( prefabMultiCube,
                                 Vector3( upChk.chx*CHUNKSZ, upChk.chy*CHUNKSZ, upChk.chz*CHUNKSZ ),
                                 Quaternion.identity );
                p.name = "chunk_" +upChk.chx + "_" + upChk.chy + "_" + upChk.chz;
            }
            var maker = p.GetComponent( "ChunkMaker" );
            maker.SetField( upChk.blocks, upChk.lights, CHUNKSZ );
            maker.objmode=0;
        }

        
        if( upChk.countItems() > 0 ){
            if(po==null){
                po = Instantiate( prefabMultiObjCube,
                                  Vector3( upChk.chx*CHUNKSZ, upChk.chy*CHUNKSZ, upChk.chz*CHUNKSZ ),
                                  Quaternion.identity );
                po.name = "obj_"+upChk.chx + "_" + upChk.chy + "_" + upChk.chz;
            }
            var objmaker = po.GetComponent( "ChunkMaker" );
            objmaker.SetField(upChk.blocks, upChk.lights, CHUNKSZ );
            objmaker.objmode=1;
        }

        
        upChk.needUpdate=false;

    } 

}

// 掘る
function sendGetField(chx:int,chy:int,chz:int){
    if( chx>=0 && chy>=0 && chz>=0 && chx<CHUNKMAX && chy<CHUNKMAX&& chz<CHUNKMAX){
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

