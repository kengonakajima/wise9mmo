
var headTextPrefab : GameObject;

var headPrefab : GameObject;

var waterParticleEmitterPrefab : GameObject;

var pitch : float;
var yaw : float;

var dy : float;

var speedPerSec : float;

var nose : Vector3; // こういう風に関数の外に変数定義するとGUIで見える
var falling = false;
var needSend = false;

var jumped = false; // 明示的にジャンプ操作をしたらtrue

var prevInWater;
var inWater; 

var cam : GameObject;

var clientID = -1; // サーバ内のid


var lastInterval : float;

var showName : String;
var isPC : System.Boolean;

var headObj : GameObject; 

var walkAnimName : String;
var idleAnimName : String;




var omitBody: System.Boolean; // trueにすると、身体を省略して手だけにする（自キャラ用）

function Start() {
    pitch = 0;
    dy = 0;

    cam = GameObject.Find( "Main Camera" );

    if( omitBody ){

    } else {
        if( headPrefab ){
            headObj = Instantiate(  headPrefab, transform.position + Vector3(-0.125,1.4,0), transform.rotation );
        }
    }

    
}

var hVel=0.0;
var vVel=0.0;

function Move( dpitch:float, dyaw:float, h:float, v:float ) {
    yaw += dyaw;
    pitch += dpitch;
    hVel = h;
    vVel = v;
}

var gotoPos : Vector3;
var gotoTime : float;
var gotoDiffTime : float;
var gotoOrigPos : Vector3;
var gotoYaw : float;
var gotoOrigYaw : float;
var gotoPitch : float;
var gotoOrigPitch : float;
var antiGravity : float;

var prevPos : Vector3;

var stepAudio : AudioClip;
var waterSplashAudio : AudioClip;

var curHP:int;
var maxHP:int;

// ag: antigravity
function SetMove( speedps, pt, yw, pos, _dy, dt, ag, hp, maxhp ) {
    speedPerSec = speedps;
    antiGravity = ag;
    gotoYaw = yw;
    gotoOrigYaw = yaw;
    gotoPitch = pt;
    gotoOrigPitch = pitch;
    gotoPos = pos;
	gotoTime = Time.realtimeSinceStartup + dt;	
	gotoDiffTime = dt;	
	gotoOrigPos = transform.position;

    if( hp != null ) curHP = hp;
    if( maxhp != null ) maxHP = maxhp;
}
function JumpByRemote( _dy) {
    dy = _dy;
    falling=true;
}

var texture:Texture;

function setMaterial(tex) {
    texture = tex;
    
    renderer.material.mainTexture = tex;

    var layernames = [ "minecraftchar_body_3_animated/minecraftchar_body_3:Layer3",
                       "minecraftchar_body_3_animated/minecraftchar_body_3:Layer4",
                       "minecraftchar_body_3_animated/minecraftchar_body_3:Layer5",
                       "minecraftchar_body_3_animated/minecraftchar_body_3:Layer6",
                       "minecraftchar_body_3_animated/minecraftchar_body_3:Layer7"
                       ];

    for( var nm in layernames ){
        var t = transform.Find(nm);
        if(t)t.renderer.material.mainTexture = tex;
    }
}

// ある位置から次の位置にいくことが可能かのテスト. xyzのぬるぬる状況を別々に返す
function testPointToPointOK( frompos, topos, outary ) {
    outary[0]=outary[1]=outary[2]=false;
    var blkn = cs.getBlock( topos.x, topos.y, topos.z);
    if( blkn == null || ( cs.isSolidBlock(blkn) == false)  ){
        // 進む先が空気や水の場合
        outary[0] = outary[1] = outary[2] = true;
    } else {
        // 進む先が壁などの場合
        // y
        var topos2 = Vector3( frompos.x, topos.y, frompos.z );
        var blkcur2 = cs.getBlock( topos2.x, topos2.y, topos2.z );
        if( blkcur2 != null && (!cs.isSolidBlock(blkcur2))  ) outary[1] = true;
        // z
        var topos3 = Vector3( frompos.x, frompos.y, topos.z );
        var blkcur3 = cs.getBlock( topos3.x, topos3.y, topos3.z );
        if( blkcur3 != null && (!cs.isSolidBlock(blkcur3)) ) outary[2] = true;
        // x
        var topos4 = Vector3( topos.x, frompos.y, frompos.z );
        var blkcur4 = cs.getBlock( topos4.x, topos4.y, topos4.z );
        if( blkcur4 != null && (!cs.isSolidBlock(blkcur4)) ) outary[0] = true;
    }
    
}

// いまいる位置にブロックあったら返す
function getCurrentPosBlock( pos:Vector3, s:float, h:float) {
    var dCoords:Vector3[] = new Vector3[16];
    getHitCoords( s, h, dCoords );
    var blk=null;
    for(var i:int=0;i<dCoords.length;i++){
        var b = cs.getBlock( pos.x+dCoords[i].x, pos.y+dCoords[i].y, pos.z+dCoords[i].z);
        if( b != null ){
            blk = b;
            if( blk != 0 ){
                return b;
            }
        }
    }
    return blk;
}
// ある点を中心とした地形ヒット判定用座標16個を返す
function getHitCoords( s:float, h:float, out:Vector3[] ) {
    out[0] = Vector3(-s,0,s);
    out[1] = Vector3(s,0,s);
    out[2] = Vector3(-s,0,-s);
    out[3] = Vector3(s,0,-s);
    out[4] = transform.forward*s;
    out[5] = transform.forward*s*-1;
    out[6] = transform.right*s;
    out[7] = transform.right*s*-1;
    
    out[8] = out[0] + Vector3(0,h,0);
    out[9] = out[1] + Vector3(0,h,0);
    out[10] = out[2] + Vector3(0,h,0);
    out[11] = out[3] + Vector3(0,h,0);
    out[12] = out[4] + Vector3(0,h,0);
    out[13] = out[5] + Vector3(0,h,0);
    out[14] = out[6] + Vector3(0,h,0);
    out[15] = out[7] + Vector3(0,h,0);
    
}

var com = null;
var cs = null;

var hitHeight:float=1.7; 
var hitSize:float =0.35;

var lastStepPosXZ:Vector3;

function Update() {
    
    if( com==null) com = GameObject.Find("CommunicatorCube");
    if( cs==null) cs = com.GetComponent("CommunicatorScript");
    prevPos = this.transform.position;
    
    var dTime = Time.realtimeSinceStartup - lastInterval;
    lastInterval = Time.realtimeSinceStartup;
    
    var dnose : Vector3;
    var dside : Vector3;
    
    dnose.x = 1.0 * Mathf.Cos(pitch);
    dnose.y = yaw;
    dnose.z = 1.0 * Mathf.Sin(pitch);
    dside.x = 1.0 * Mathf.Cos(pitch - Mathf.PI/2);
    dside.y = 0;
    dside.z = 1.0 * Mathf.Sin(pitch - Mathf.PI/2);

    
    
    nose = transform.position + dnose ;
    var flatNose = Vector3( nose.x, transform.position.y, nose.z );
    transform.LookAt( flatNose );

    if( inWater){
        vVel /= 2;
        hVel /= 2;
    }
    
    var dtr : Vector3;
    dtr = dnose * vVel * speedPerSec + dside * hVel * speedPerSec;

    vVel = hVel = 0;

    if(falling){
        var gravity : float = 6.5 / antiGravity;
        if( inWater){
            gravity /= 8;
        }
        dy -= gravity * dTime;
        if( dy < -10000 )dy=0; // antigravityが巨大な場合
    }
    
    // 絶対的な世界の底
    if( transform.position.y < 0 ){
        transform.position.y = 0;
        dy = 0;
        falling = false;
    }

    dtr.y = dy;


 var nextpos = transform.position + dtr * dTime;



    
    //地形判定
    var blkcur = getCurrentPosBlock( transform.position, hitSize, hitHeight );

    if( blkcur != null ){
        if( blkcur == cs.WATER ){
            // 水の中
            inWater=true;
            if( prevInWater!=true){
                // 着水の瞬間
                if( waterParticleEmitterPrefab ){
                    Instantiate( waterParticleEmitterPrefab, transform.position, transform.rotation );
                    if( waterSplashAudio && dy < -0.5 ){
                        AudioSource.PlayClipAtPoint( waterSplashAudio, transform.position );
                    }                    
                }
                dy=0;
                
            } else {
                if( dy < -1 ){
                    dy=-1;
                }
            }
        } else {
            inWater=false;
            if( cs.isSolidBlock(blkcur) ) {
                // 壁の中にいま埋まってる場合
                nextpos.y += 1;
                falling = false;
                dy=0;
            }
        }
    }
    
    var blkfound=false;
    var blkhity=-999;

    for(var by:int=nextpos.y;by>=0;by--){
        //        var b = cs.getBlock( transform.position.x, by, transform.position.z);
        var b = getCurrentPosBlock( Vector3( transform.position.x, by, transform.position.z ), hitSize, hitHeight );
        if( b!=null && cs.isSolidBlock(b)){
            blkfound=true;
            blkhity = by;
            break;
        }
    }
    if( blkfound ){
        var pcy:int = nextpos.y;
        if( blkhity < pcy ) {
            // 自分の位置より下にある
            falling = true;
        } else {
            //着地した
            if( jumped==true && cs.myClientID == clientID ){
                jumped=false;
            }
            
            nextpos.y = blkhity + 1;
            falling = false;

            if( isPC ){
                if( stepAudio && dy < -0.5 ) AudioSource.PlayClipAtPoint( stepAudio, transform.position );
            }
            dy=0;
        }
    }

    var okary:System.Boolean[] = new System.Boolean[3];
    var dCoords:Vector3[] = new Vector3[ 4+4+4+4];
    getHitCoords( hitSize, hitHeight, dCoords );
    
    var x_ok : System.Boolean = true;
    var y_ok : System.Boolean = true;
    var z_ok : System.Boolean = true;
    for(var i:int=0;i<dCoords.length;i++){
        testPointToPointOK( transform.position+dCoords[i], nextpos+dCoords[i], okary );
        x_ok &= okary[0]; y_ok &= okary[1]; z_ok &= okary[2];
    }


    var finalnextpos = transform.position;
    if( x_ok ) finalnextpos.x = nextpos.x;
    if( y_ok ) finalnextpos.y = nextpos.y;
    if( z_ok ) finalnextpos.z = nextpos.z;
    if( finalnextpos.x <0 ) finalnextpos.x = 0;
    if( finalnextpos.z <0 ) finalnextpos.z = 0;

    transform.position = finalnextpos;

    // 以下の部分がないとカメラが腐る
    dnose.x = 1.0 * Mathf.Cos(pitch);
    dnose.y = yaw;
    dnose.z = 1.0 * Mathf.Sin(pitch);
    nose = transform.position + dnose ;

    // ネットワーク経由での移動指示
	if( gotoTime > Time.realtimeSinceStartup ) {
		var v : Vector3;
		var dv = gotoPos - gotoOrigPos;
		var rate = ( gotoTime - Time.realtimeSinceStartup ) / gotoDiffTime;
		var nextv = gotoOrigPos + dv * (1.0-rate);
		transform.position.x = nextv.x;
		transform.position.y = nextv.y;        
		transform.position.z = nextv.z;
        var dyaw = gotoYaw - gotoOrigYaw;
        var nextyaw = gotoOrigYaw + dyaw * (1.0-rate);
        yaw = nextyaw;
        var dpitch = gotoPitch - gotoOrigPitch;
        var nextpitch = gotoOrigPitch + dpitch * (1.0-rate);
        pitch = nextpitch;
	}

    // 頭は別のgameobjectなのでそれを合わせる
    if( headObj ){
        var sv = Vector3( 0, 1.4 * transform.localScale.y, 0 );//-0.125 * transform.localScale.z ) ;
        headObj.transform.position = transform.position + sv;
        headObj.transform.localScale = transform.localScale;
        headObj.transform.LookAt( nose + sv ); 

        headObj.renderer.material.mainTexture = texture; // TODO: 重い. サボってる
    }

    if( omitBody == false ){
        // アニメーションの設定
        var moveSpeed:float = Vector3.Distance( prevPos, transform.position ) / dTime;
        for( var t :Transform  in transform ) {
            var a : AnimationState;
            if( moveSpeed < 0.01 ){
                t.animation.CrossFade( idleAnimName ,0.5);
            } else {
                a = t.animation[ walkAnimName];
                if(a != null ){
                    a.speed = moveSpeed;
                }
                t.animation.Play(walkAnimName);
            }
        }
    } else {
        cam = GameObject.Find( "Main Camera" );

        dv = nose - transform.position;
        cam.transform.position = transform.position + Vector3(0,1.5,0) - dv.normalized*0.5;
        cam.transform.LookAt( nose );

        var toolT = transform.Find( "toolhand_1_animated" );


        toolT.position = cam.transform.position + cam.transform.forward*0.6 + (cam.transform.right*0.2) + cam.transform.up*-0.2;

        toolT.rotation = cam.transform.rotation;
        
    }

    prevInWater = inWater;

    // 歩行音関連
    if( stepAudio && (!falling) && isPC ){
        if( Vector3.Distance( lastStepPosXZ, Vector3(transform.position.x,0,transform.position.z) ) > 1.0 ){
            lastStepPosXZ.x = transform.position.x;
            lastStepPosXZ.z = transform.position.z;
            AudioSource.PlayClipAtPoint( stepAudio, transform.position );
        }
    }
}
function PlayUseAnimation() {

    var toolT = transform.Find( "toolhand_1_animated");

    toolT.animation.Play("use");
    
}

var savedHandMesh;

var ttt : Texture;

function SetToolTex( tex ) {

    var toolT = transform.Find( "toolhand_1_animated/toolhand_board/Bone01" );
    //    print("m:" + toolT.renderer.material );
    toolT.renderer.material.mainTexture = tex;

}

function OnGUI () {
    var v: Vector3 = cam.camera.WorldToScreenPoint(transform.position);

    if( clientID != -1 &&  v.x>0&&v.y>0&&v.z > 2.0 ){
        var hpstr = "";
        if( maxHP != 0 ){
            hpstr = " ("+curHP+"/"+maxHP+")" ;
        }
        GUI.Label( Rect( v.x, Screen.height-v.y  - 50, 180,50 ), showName + hpstr );
    }    
    
}

    


