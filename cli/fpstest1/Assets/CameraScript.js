var hero : GameObject;




function Start () {
    hero = GameObject.Find( "HeroCube" );
}



function Update () {
    
    var hs = hero.GetComponent("HeroScript");

        
    var dv = hs.nose - hero.transform.position;

    transform.position = hero.transform.position + Vector3(0,1,0) - dv.normalized*0.3;
    transform.LookAt( hs.nose );


/*
        var dscr = Input.GetAxis( "Mouse ScrollWheel" );
        transform.position += Vector3( 0, dscr*5, 0 );
        transform.LookAt( hs.nose );
*/
    

    
}
