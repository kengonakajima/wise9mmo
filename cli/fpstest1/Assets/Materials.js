
var i ;
function Update () {

    var h = Input.GetAxis( "Horizontal");
    var v = Input.GetAxis( "Vertical" );
    transform.Translate(v/5,0,h/5);
    
}


