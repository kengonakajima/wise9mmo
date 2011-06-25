// 操作を反映する

var shortcutTextures : Texture2D[];

var selectedInventoryIndex : int ;

var com : GameObject;
var comsc;
var hero : GameObject;
var herosc;

var cursorCube : GameObject;

var chatString : String;
var chatShow : System.Boolean;

function Start () {
    Screen.lockCursor = true;
    //何故か機能しない    Screen.SetResolution( 1680,1050, true ); 
    
    hero = GameObject.Find( "HeroCube" );
    herosc = hero.GetComponent("HeroScript" );
    com = GameObject.Find("CommunicatorCube");
    comsc = com.GetComponent("CommunicatorScript");
    cursorCube = GameObject.Find("CursorCube");
    
    selectedInventoryIndex = 0;
    herosc.SetToolTex( shortcutTextures[ selectedInventoryIndex ] );
    
    chatShow = false;
    chatString = "";
    
}


function Update () {

    var i:int;
    var cnt:int=0;
    var ttt = Time.realtimeSinceStartup;
    for(i=0;i<100000;i++){
        for(var q:int=0;q<2;q++){
            cnt++;
        }
    }
    var eee = Time.realtimeSinceStartup;
    //    print("D###############DT:" + ( eee-ttt) );
    
    var mx = Input.GetAxis( "Mouse X" );
    var my = Input.GetAxis( "Mouse Y" );

    var h = Input.GetAxis( "Horizontal");
    var v = Input.GetAxis( "Vertical" );    

    herosc.Move( mx / 10.0 * -1.0 , my / 10.0, h, v );

    var j = Input.GetButton( "Jump" );
    if(j){
        if( herosc.dy == 0 ){
            herosc.dy = 4.0;
            herosc.falling = true;
			herosc.needSend = true;
            
            comsc.send("jump", herosc.dy );
        }
    }

}

var activeBoxTex : Texture2D;
var inactiveBoxTex : Texture2D;
var heartTexture : Texture2D;

var prevFireAt:float=0.0;



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
        if( Event.current.keyCode == KeyCode.X ) attackKeyHit = true;
        if( Event.current.keyCode == KeyCode.Return ) enterKeyHit = true;
    }


    // 視線の先にあるものの操作
    var cam = GameObject.Find( "Main Camera" );
    var ray = cam.camera.ScreenPointToRay( Vector3( Screen.width/2, Screen.height/2,0));

    var d = ray.direction / 30.0;

    var targetv:Vector3=Vector3(-1,-1,-1);
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
            break;
        } else {
            prevTargetv = Vector3(ix,iy,iz);
        }
    }


    
    if( targetv.x != -1 ){
        cursorCube.transform.position = targetv + Vector3(0.5,0.5,0.5);
    } else {
        cursorCube.transform.position = Vector3(-1,-1,-1);
    }
    
    // hit
    //    var ray = cam.camera.ScreenPointToRay( Vector3( Screen.width/2, Screen.height/2,0));
    var hitInfo : RaycastHit ;
    var mobhit = false;
    if( Physics.Raycast( cam.transform.position, ray.direction, hitInfo, 5 ) ){
        //        print("something hit!:"+ray.direction + " hitTr:" + hitInfo.transform + " p:" + hitInfo.point  + " d:" + hitInfo.distance );
        mobhit = true;
    }


        
    if( Input.GetButtonUp( "Fire1" ) || attackKeyHit ) {
        if( Time.realtimeSinceStartup > (prevFireAt + 0.2 ) ){
            prevFireAt = Time.realtimeSinceStartup;
            herosc.PlayUseAnimation();
            if( targetv.x != -1 ){
                comsc.digBlock(targetv.x,targetv.y,targetv.z);
            } else {
                comsc.attack();
            }
        }
    }
    if( Input.GetButtonDown( "Fire2" ) ) {
        print( "f2");                
    }
    if( chatShow ){
        chatString = GUI.TextField( Rect(10,Screen.height-80,400,20), chatString );
        if( enterKeyHit ){
            chatShow = false;
            comsc.send( "chat", chatString );
        }
    }
    
    
    
    if( Input.GetButtonDown( "Fire3" ) ) {
        if( Time.realtimeSinceStartup > ( prevFireAt + 0.2 ) ){
            prevFireAt = Time.realtimeSinceStartup;
            print( "f3");
            if(!chatShow){
                chatShow = true;
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

        GUI.Label( Rect(64+i*unit+ofs+16, Screen.height-16-2,20,20), ""+99); // 残り個数表示


    }

    // heart
    for(i=0;i<comsc.currentHP;i++){
        unit = 18;
        GUI.DrawTexture( Rect(64+i*unit,Screen.height-36-16-4,16,16), heartTexture );
    }

    
}


