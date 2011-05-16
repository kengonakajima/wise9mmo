function Start() {
    for(var a:AnimationState in animation){
        print( "a:"+a.name );
        a.enabled = true;
    }
    animation.Play("idle");

}

function Update() {
    var idle :AnimationState = animation["idle"];

    print("len:"+idle.length + " en:" + idle.enabled + " tm:" + idle.time + " sp:" + idle.speed + " w:" + idle.weight  + " cl:" + idle.clip + " fr:" + idle.clip.frameRate );

    for( var child : Transform in transform ){
        print( "child:" + child );
    }
    var f = transform.Find( "anim2box_bone3/anim2box/Bone03" );
    //    f.rotation.x = Random.value;


    
}

