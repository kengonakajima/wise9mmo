var hero : GameObject;
var hs;



function Start () {
    hero = GameObject.Find( "HeroCube" );
    hs = hero.GetComponent("HeroScript");
    
}



function Update () {
    

    // 以下の位置調整はheroscriptのほうでやらないと1フレームずれた
    //    transform.position = hero.transform.position + Vector3(0,1,0);// - dv.normalized*0.5;
    //     transform.LookAt( hs.nose );



    //        var dscr = Input.GetAxis( "Mouse ScrollWheel" );
        //        transform.position += Vector3( 0, dscr*5, 0 );
    //        transform.LookAt( hs.nose );

    

    
}
