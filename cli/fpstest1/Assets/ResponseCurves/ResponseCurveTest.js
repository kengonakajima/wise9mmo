var curve = AnimationCurve.Linear(0, 0, 10, 10);
//var otherCurveVariable = AnimationCurve.Linear(0, 0, 10, 10);

function Update () {
	transform.position.x = Time.time;
	transform.position.y = curve.Evaluate(Time.time);
}