// 操作を反映する

var shortcutTextures : Texture2D[];



var selectedInventoryIndex : int ; // pickaxe:0, axe:1, torch:2, bow:3, bucket:4,   soil:5, stone:6

var com : GameObject;
var comsc;
var hero : GameObject;
var herosc;

var cursorCube : GameObject;

var chatString : String;
var chatShow : System.Boolean;



var cam : GameObject;

function Start () {
    Screen.lockCursor = true;
    //何故か機能しない    Screen.SetResolution( 1680,1050, true ); 
    
    hero = GameObject.Find( "HeroCube" );
    herosc = hero.GetComponent("HeroScript" );
    com = GameObject.Find("CommunicatorCube");
    comsc = com.GetComponent("CommunicatorScript");
    cursorCube = GameObject.Find("CursorCube");
    cam = GameObject.Find( "Main Camera" );

    selectedInventoryIndex = 0;
    herosc.SetToolTex( shortcutTextures[ selectedInventoryIndex ] );
    
    chatShow = false;
    chatString = "";

}


var damageEffectStartAt:float; //開始時刻
var damageEffectEndAt:float; //終了時刻

function startDamageEffect(dur:float ) {
    damageEffectStartAt = Time.realtimeSinceStartup;
    damageEffectEndAt = damageEffectStartAt + dur;
}




function Update () {

    var i:int;
    var cnt:int=0;
    
    var mx = Input.GetAxis( "Mouse X" );
    var my = Input.GetAxis( "Mouse Y" );

    var h = Input.GetAxis( "Horizontal");
    var v = Input.GetAxis( "Vertical" );

    if( comsc.died ){
        h = v = 0;
    }

    herosc.Move( mx / 10.0 * -1.0 , my / 10.0, h, v );

    var j = Input.GetButton( "Jump" );
    
    if(j){
        if( comsc.died ) {
            comsc.decrementRespawnCounter(10);
        } else {
            var canJump:System.Boolean;
            if( herosc.dy == 0 ){
                canJump = true;
            } else {
                if( herosc.inWater ){
                    canJump = true;
                }
            }
        
            if( canJump ){
                if( herosc.inWater){
                    herosc.dy = 2.0;
                } else {
                    herosc.dy = 4.0;
                }
                herosc.falling = true;
                herosc.needSend = true;
                herosc.jumped = true;
            
                comsc.send("jump", herosc.dy );
            }
        }
    }


    // ダメージ受けたら画面を赤くする
    if( comsc.damaged ){
        comsc.damaged = false;
        startDamageEffect(0.2);
    }
        
    
    var df = GameObject.Find( "DamageFilterGUITexture" );
    var nowt = Time.realtimeSinceStartup;
    if( nowt < damageEffectEndAt || comsc.died ){
        var r : float = ( nowt - damageEffectStartAt ) / ( damageEffectEndAt - damageEffectStartAt ); // 0から1に近づく
        if(comsc.died ){
            df.guiTexture.color = Color( 0.5,0.5,0.5, 0.3 );
        } else {
            df.guiTexture.color = Color( 0.5,0.5,0.5, (1 - r)*0.5 );            
        }
        
        df.transform.position.x = 0.5;
        df.transform.position.y = 0.5;
    } else {
        df.transform.position.x = -100;
        df.transform.position.y = -100;            
    }

    // 水の中にいるときは、あかるさをみてカメラの前になにかおくか

    var wf = GameObject.Find( "WaterFilterGUITexture");
    if( herosc.inWater && !comsc.died ){
        var lgt:int = comsc.getLight( cam.transform.position.x,
                                      cam.transform.position.y-0.1,
                                      cam.transform.position.z);
        wf.transform.position.x = 0.5;
        wf.transform.position.y = 0.5;
        switch(lgt){
        case 0:	
        case 1:
            wf.guiTexture.color= Color(0,0,0.1,0.5); break;
        case 2:
            wf.guiTexture.color= Color(0,0,0.15,0.45);break;
        case 3:
            wf.guiTexture.color= Color(0,0,0.2,0.4);break;
        case 4:
            wf.guiTexture.color= Color(0,0,0.3,0.35);break;
        case 5:
            wf.guiTexture.color= Color(0,0,0.4,0.3);break;
        case 6:
            wf.guiTexture.color= Color(0,0,0.7,0.25);break;
        case 7:
            wf.guiTexture.color= Color(0,0,1,0.2);break;
        case 8:
            wf.transform.position.x=-100;
            wf.transform.position.y=-100;
        }
    } else {
        wf.transform.position.x=-100;
        wf.transform.position.y=-100;
    }

    
}

var activeBoxTex : Texture2D;
var inactiveBoxTex : Texture2D;
var heartTexture : Texture2D;

var prevFireAt:float=0.0;


var openChatWinAudio : AudioClip;
var closeChatWinAudio : AudioClip;
var digAudio : AudioClip;
var bowAudio : AudioClip;
var torchAudio : AudioClip;



// クリックしたところのブロックを壊す
function OnGUI () {

    var attackKeyHit = false;
    var enterKeyHit = false;
    if( Event.current.type == EventType.KeyDown ) {
        var prevSel = selectedInventoryIndex;
        if( Event.current.keyCode == KeyCode.Alpha0) selectedInventoryIndex = 9;
        if( Event.current.keyCode == KeyCode.Alpha1) selectedInventoryIndex = 0;
        if( Event.current.keyCode == KeyCode.Alpha2) selectedInventoryIndex = 1;
        if( Event.current.keyCode == KeyCode.Alpha3) selectedInventoryIndex = 2;
        if( Event.current.keyCode == KeyCode.Alpha4) selectedInventoryIndex = 3;
        if( Event.current.keyCode == KeyCode.Alpha5) selectedInventoryIndex = 4;
        if( Event.current.keyCode == KeyCode.Alpha6) selectedInventoryIndex = 5;
        if( Event.current.keyCode == KeyCode.Alpha7) selectedInventoryIndex = 6;
        if( Event.current.keyCode == KeyCode.Alpha8) selectedInventoryIndex = 7;
        if( Event.current.keyCode == KeyCode.Alpha9) selectedInventoryIndex = 8;
        if( prevSel != selectedInventoryIndex ){
            herosc.SetToolTex( shortcutTextures[ selectedInventoryIndex ] );
        }
        if( Event.current.keyCode == KeyCode.X ||
            Event.current.keyCode == KeyCode.N ||
            Event.current.keyCode == KeyCode.E ) attackKeyHit = true;
        if( Event.current.keyCode == KeyCode.Return ) enterKeyHit = true;
    }


    // 視線の先にあるものの操作
    var ray = cam.camera.ScreenPointToRay( Vector3( Screen.width/2, Screen.height/2,0));

    var d = ray.direction / 30.0;

    var targetblk:int=-1;
    var targetv:Vector3=Vector3(-1,-1,-1);
    var prevTargetBlk:int=-1;
    var prevTargetv:Vector3=Vector3(-1,-1,-1);
    for(var i=0;i<300;i++){
        var v = ray.origin + d*i;
        var blk = comsc.getBlock( v.x , v.y, v.z );
        if( Vector3.Distance( v, ray.origin ) >4 ) break;

        var ix:int = v.x;
        var iy:int = v.y;
        var iz:int = v.z;        
        if( blk != comsc.AIR ){
            targetv = Vector3( ix,iy,iz);
            targetblk = blk;
            break;
        } else {
            prevTargetv = Vector3(ix,iy,iz);
            prevTargetBlk = blk;
        }
    }

    var cursorHit = false;

    switch( selectedInventoryIndex ){
    case 0: // pickaxe
        if( targetblk == comsc.SOIL ||
            targetblk == comsc.GRASS ||
            targetblk == comsc.STONE ){
            cursorHit = true;
        }
        break;
    case 1: // axe
        if( targetblk == comsc.LEAF ||
            targetblk == comsc.STEM ) {
            cursorHit = true;
        }
        break;
    case 2: // torch, bombflower
    case 9:        
        if( targetblk != comsc.AIR &&
            targetblk != comsc.WATER &&
            prevTargetv.y == ( targetv.y + 1 ) ){
            cursorHit = true;
        }            
        break;
    case 3: // bow
        break;
    case 4: // bucket
        if( targetblk == comsc.WATER ){
            cursorHit = true;
        }
        break;
    case 5: // stone, soil,water,stem
    case 6:
    case 7:
    case 8:        
        if( targetblk != comsc.AIR ){
            cursorHit = true;
        }
        break;
    }

    
    if( cursorHit ){
        cursorCube.transform.position = targetv + Vector3(0.5,0.5,0.5);
    } else {
        cursorCube.transform.position = Vector3(-1,-1,-1);
    }
    
    // hit
    //    var ray = cam.camera.ScreenPointToRay( Vector3( Screen.width/2, Screen.height/2,0));
    ///    var hitInfo : RaycastHit ;
    //    var mobhit = false;
    //    if( Physics.Raycast( cam.transform.position, ray.direction, hitInfo, 5 ) ){
        //        print("something hit!:"+ray.direction + " hitTr:" + hitInfo.transform + " p:" + hitInfo.point  + " d:" + hitInfo.distance );
//        mobhit = true;
//    }


        
    if( Input.GetButtonUp( "Fire1" ) || attackKeyHit ) {
        if( Time.realtimeSinceStartup > (prevFireAt + 0.2 ) ){
            prevFireAt = Time.realtimeSinceStartup;
            herosc.PlayUseAnimation();
            if( cursorHit ){
                switch( selectedInventoryIndex ) {
                case 0:
                case 1:
                case 4:
                    if( digAudio && comsc.toolLastNumNumber[selectedInventoryIndex]>0){
                        if( selectedInventoryIndex == 0 || selectedInventoryIndex == 1 ){
                            AudioSource.PlayClipAtPoint( digAudio, hero.transform.position );
                        }
                    }
                    comsc.digBlock(targetv.x,targetv.y,targetv.z);
                    break;
                case 2: // torch
                    // torchは、1歩前のところに
                    comsc.putTorch( prevTargetv.x, prevTargetv.y, prevTargetv.z );
                    if( torchAudio ){
                        AudioSource.PlayClipAtPoint( torchAudio, hero.transform.position);
                    }
                    break;
                case 3:
                    break;
                case 5: // put-stone
                    comsc.putDebri( prevTargetv.x, prevTargetv.y, prevTargetv.z, comsc.STONE );
                    break;
                case 6: // 
                    comsc.putDebri( prevTargetv.x, prevTargetv.y, prevTargetv.z, comsc.SOIL );
                    break;
                case 7: // 
                    comsc.putDebri( prevTargetv.x, prevTargetv.y, prevTargetv.z, comsc.WATER );
                    break;
                case 8: // 
                    comsc.putDebri( prevTargetv.x, prevTargetv.y, prevTargetv.z, comsc.STEM );
                    break;                    
                default:
                    break;
                }
            } else if( selectedInventoryIndex == 3 ){
                if( bowAudio ){
                    AudioSource.PlayClipAtPoint( bowAudio, hero.transform.position );
                }
                comsc.shoot();
            }
        }
    }
    if( Input.GetButtonDown( "Fire2" ) ) { // tab
        print( "f2");
        
    }
    if( chatShow ){
        chatString = GUI.TextField( Rect(10,Screen.height-80,400,20), chatString );
        if( enterKeyHit ){
            chatShow = false;
            AudioSource.PlayClipAtPoint( closeChatWinAudio, hero.transform.position );                    
            comsc.send( "chat", chatString );
        }
    }

    if( comsc.died ) {
        comsc.decrementRespawnCounter(1);
        GUI.Label( Rect( Screen.width/2 - 200, Screen.height /2 - 50, 450,50), "GAME OVER. Respawn? " + comsc.respawnCounter + " (Space key to urge)" );
    }
    
    
    
    if( Input.GetButtonDown( "Fire3" ) ) {
        if( Time.realtimeSinceStartup > ( prevFireAt + 0.2 ) ){
            prevFireAt = Time.realtimeSinceStartup;
            print( "f3");
            
            if(!chatShow){
                chatShow = true;
                AudioSource.PlayClipAtPoint( openChatWinAudio, hero.transform.position );        
                chatString = "";
            }
        }
    }

    // tool selection
    for(i=0;i<shortcutTextures.length;i++){
        var ofs=0;
        if( i >=5)ofs=4;

        var btex;
        if( selectedInventoryIndex == i ){
            btex = activeBoxTex;
        } else {
            btex = inactiveBoxTex;
        }
        var unit=36;
        GUI.DrawTexture( Rect(64+i*unit+ofs,Screen.height-unit, unit,unit ), btex, ScaleMode.ScaleToFit, true, 1.0f );            
        GUI.DrawTexture( Rect(64+i*unit+ofs+2,Screen.height-32-2, 32,32 ), shortcutTextures[i], ScaleMode.StretchToFill, true, 1.0f );

        GUI.Label( Rect(64+i*unit+ofs+24, Screen.height-16-2,20,20), "" + comsc.toolLastNumNumber[i] ); // 残り個数表示

    }

    // heart
    for(i=0;i<comsc.currentHP;i++){
        unit = 18;
        GUI.DrawTexture( Rect(64+i*unit,Screen.height-36-16-4,16,16), heartTexture );
    }

    
}


