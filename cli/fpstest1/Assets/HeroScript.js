
var headTextPrefab : GameObject;

var headPrefab : GameObject;

var pitch : float;
var yaw : float;

var dy : float;

var speedPerSec : float;

var nose : Vector3; // こういう風に関数の外に変数定義するとGUIで見える
var falling = false;
var needSend = false;

var prevInWater;
var inWater; 

var cam : GameObject;

var clientID = -1; // サーバ内のid


var lastInterval : float;

var showName : String;

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

// ag: antigravity
function SetMove( speedps, pt, yw, pos, _dy, dt, ag ) {
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
        t.renderer.material.mainTexture = tex;
    }
}


function Update() {

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
    var com = GameObject.Find("CommunicatorCube");
    var cs = com.GetComponent("CommunicatorScript");


    var blkcur = cs.getBlock( transform.position.x, transform.position.y, transform.position.z);
    if( blkcur != null ){
        if( blkcur == cs.WATER ){
            // 水の中
            inWater=true;
            if( prevInWater!=true){
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
        var b = cs.getBlock( transform.position.x, by, transform.position.z);
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
            nextpos.y = blkhity + 1;
            falling = false;
            dy=0;
        }
    }
    
    var blkn = cs.getBlock( nextpos.x, nextpos.y, nextpos.z);

    var x_ok=false;
    var y_ok=false;
    var z_ok=false;
    
    if( blkn == null || ( cs.isSolidBlock(blkn) == false)  ){
        // 進む先が空気や水の場合
        x_ok = y_ok = z_ok = true;
    } else {
        // 進む先が壁などの場合
        // y
        var nextpos2 = Vector3( transform.position.x, nextpos.y, transform.position.z );
        var blkcur2 = cs.getBlock( nextpos2.x, nextpos2.y, nextpos2.z );
        if( blkcur2 != null && (!cs.isSolidBlock(blkcur2))  ) y_ok = true;
        // z
        var nextpos3 = Vector3( transform.position.x, transform.position.y, nextpos.z );
        var blkcur3 = cs.getBlock( nextpos3.x, nextpos3.y, nextpos3.z );
        if( blkcur3 != null && (!cs.isSolidBlock(blkcur3)) ) z_ok = true;
        // x
        var nextpos4 = Vector3( nextpos.x, transform.position.y, transform.position.z );
        var blkcur4 = cs.getBlock( nextpos4.x, nextpos4.y, nextpos4.z );
        if( blkcur4 != null && (!cs.isSolidBlock(blkcur4)) ) x_ok = true;
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

}
function PlayUseAnimation() {

    var toolT = transform.Find( "toolhand_1_animated");

    toolT.animation.Play("use");
    
    print("Use");
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
        GUI.Label( Rect( v.x, Screen.height-v.y  - 50, 100,50 ), showName  );
    }    
    
}

    


