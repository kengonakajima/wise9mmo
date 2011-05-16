var prefab : GameObject;

function Start ()
{
	// Create the clip with the curve
	var clip = new AnimationClip();
	var curve = AnimationCurve.EaseInOut(0, 0, 3, 10);
	clip.SetCurve("", Transform, "m_LocalPosition.x", curve);

	// Add Event to animation clip
	// This function can easily be called from an editor script
	// to inject animation events into an animation clip
	var event = new AnimationEvent();
	event.time = 1;
	event.functionName = "InstantiateParticle";
	clip.AddEvent(event);

	// Add clip to animation	
	animation.AddClip(clip, "test");
	
	// Add and play the clip
	animation.Play("test");
}

function InstantiateParticle (animEvent : AnimationEvent)
{
	Instantiate(prefab, transform.position, transform.rotation);
}

@script RequireComponent(Animation)