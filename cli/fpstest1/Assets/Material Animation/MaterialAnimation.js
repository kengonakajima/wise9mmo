function Start () {
	var clip = new AnimationClip ();
	clip.SetCurve ("", typeof(Material), "_Color.a", AnimationCurve.EaseInOut(0, 0, 1, 2));

	var curve = AnimationCurve.Linear(0, 0, 1.8, 360);
	curve.postWrapMode = WrapMode.Loop;
	clip.SetCurve ("", typeof(Material), "_MainTex.rotation", curve);

//	curve = AnimationCurve.Linear(0, 0, 1, 1.8);
//	clip.SetCurve ("", typeof(Material), "_MainTex.offset.x", curve);

	animation.AddClip (clip, clip.name);
	animation.Play(clip.name);
}
@script RequireComponent(Animation)