// A FPS counter.
// It calculates frames/second over each updateInterval,
// so the display does not keep changing wildly.
 
var updateInterval = 0.5;
private var lastInterval : double; // Last interval end time
private var frames = 0; // Frames over current interval
private var fps : float; // Current FPS

var fpsText : GUIText;

function Start() {
    lastInterval = Time.realtimeSinceStartup;
    frames = 0;
}





function Update() {
    ++frames;
    var timeNow = Time.realtimeSinceStartup;
    if( timeNow > lastInterval + updateInterval )
    {
        fps = frames / (timeNow - lastInterval);
        frames = 0;
        lastInterval = timeNow;

        var nt = fpsText.GetComponent( "GUIText" );
        nt.text = "FPS: " + fps.ToString("f2");
        
    }
}
