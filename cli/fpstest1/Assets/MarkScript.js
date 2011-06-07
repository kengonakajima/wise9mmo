var startAt : float;

function Start() {
    startAt = Time.realtimeSinceStartup;
}

function Update() {
    if( Time.realtimeSinceStartup > ( startAt + 10 ) ){
        Destroy(gameObject);
    }
}
