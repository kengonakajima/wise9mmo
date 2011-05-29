// 操作を反映する

var hero : GameObject;
var herosc;
function Start () {
    hero = GameObject.Find( "HeroCube" );
    herosc = hero.GetComponent("HeroScript" );
}

function Update () {
    
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


            var com = GameObject.Find("CommunicatorCube");
            var cs = com.GetComponent("CommunicatorScript");
            cs.send("jump", herosc.dy );
        }
    }

}

var prevFireAt:float=0.0;

var multicubePrefab:GameObject;
var simpleObjPrefab:GameObject;
var charPrefab : GameObject;

// クリックしたところのブロックを壊す
function OnGUI () {

    var cam = GameObject.Find( "Main Camera" );
    var ray = cam.camera.ScreenPointToRay( Vector3( Screen.width/2, Screen.height/2,0));

    var com = GameObject.Find("CommunicatorCube");
    var cs = com.GetComponent("CommunicatorScript");

    var d = ray.direction / 30.0;

    var targetv:Vector3=Vector3(-1,-1,-1);
    var prevTargetv:Vector3=Vector3(-1,-1,-1);
    for(var i=0;i<300;i++){
        var v = ray.origin + d*i;
        var blk = cs.getBlock( v.x , v.y, v.z );

        var ix:int = v.x;
        var iy:int = v.y;
        var iz:int = v.z;        
        if( blk != cs.AIR ){
            targetv = Vector3( ix,iy,iz);
            break;
        } else {
            prevTargetv = Vector3(ix,iy,iz);
        }
    }
    
    // hit
    //    var ray = cam.camera.ScreenPointToRay( Vector3( Screen.width/2, Screen.height/2,0));
    var hitInfo : RaycastHit ;
    var mobhit = false;
    if( Physics.Raycast( cam.transform.position, ray.direction, hitInfo, 5 ) ){
        //        print("something hit!:"+ray.direction + " hitTr:" + hitInfo.transform + " p:" + hitInfo.point  + " d:" + hitInfo.distance );
        mobhit = true;
    }

        
    if( Input.GetButtonUp( "Fire1" ) ) {
        if( Time.realtimeSinceStartup > (prevFireAt + 0.2 ) ){
            prevFireAt = Time.realtimeSinceStartup;
            
            if( mobhit ){
                cs.attackMob( parseInt( hitInfo.transform.name ) );
            } else {
                if( targetv.x != -1 ){
                    cs.digBlock(targetv.x,targetv.y,targetv.z);
                }
            }
        }
    }
    if( Input.GetButtonDown( "Fire2" ) ) {
        print( "f2");                
    }
    if( Input.GetButtonDown( "Fire3" ) ) {

        
        if( Time.realtimeSinceStartup > ( prevFireAt + 0.2 ) ){
            var q = Instantiate( charPrefab, Vector3( 5,3,2 ), Quaternion.identity );
            q.name = "pc_1000";

            prevFireAt = Time.realtimeSinceStartup;
            print( "f3");

        }

        
    }

    //    var chat = GUI.TextField( Rect(10,Screen.height-20,400,20), "chat text", 25 );
}

