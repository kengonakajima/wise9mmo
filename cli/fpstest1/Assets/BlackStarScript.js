var prevT:float;
function Update() {
    var t:float = Time.realtimeSinceStartup;
    var dt:float = t - prevT;
    transform.Rotate( Vector3.up * Time.deltaTime * 150, Space.World );
    prevT = t;
}
