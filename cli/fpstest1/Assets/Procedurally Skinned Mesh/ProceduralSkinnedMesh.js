function Start () {
	gameObject.AddComponent(Animation);
	gameObject.AddComponent(SkinnedMeshRenderer);
	var renderer : SkinnedMeshRenderer = GetComponent(SkinnedMeshRenderer);
	
	// Build basic mesh
	var mesh : Mesh = new Mesh ();
	mesh.vertices = [Vector3(-1, 0, 0), Vector3(1, 0, 0), Vector3(-1, 5, 0),
					 Vector3(1, 5, 0)];
	mesh.uv = [Vector2(0, 0), Vector2(1, 0), Vector2(0, 1), Vector2(1, 1)];
	mesh.triangles = [0, 1, 2, 1, 3, 2];
	mesh.RecalculateNormals();

	// Assign mesh to mesh filter & renderer
	renderer.material = new Material (Shader.Find(" Diffuse"));

	// Assign bone weights to mesh
	// We use 2 bones. One for the lower vertices, one for the upper vertices.
	var weights = new BoneWeight[4];

	weights[0].boneIndex0 = 0;
	weights[0].weight0 = 1;

	weights[1].boneIndex0 = 0;
	weights[1].weight0 = 1;

	weights[2].boneIndex0 = 1;
	weights[2].weight0 = 1;

	weights[3].boneIndex0 = 1;
	weights[3].weight0 = 1;

	mesh.boneWeights = weights;
	
	// Create Bone Transforms and Bind poses
	// One bone at the bottom and one at the top
	var bones = new Transform[2];
	var bindPoses = new Matrix4x4[2];

	bones[0] = new GameObject ("Lower").transform;
	bones[0].parent = transform;
	// Set the position relative to the parent
	bones[0].localRotation = Quaternion.identity;
	bones[0].localPosition = Vector3.zero;
	// The bind pose is bone's inverse transformation matrix
	// In this case the matrix we also make this matrix relative to the root
	// So that we can move the root game object around freely
	bindPoses[0] = bones[0].worldToLocalMatrix * transform.localToWorldMatrix;
	
	bones[1] = new GameObject ("Upper").transform;
	bones[1].parent = transform;
	// Set the position relative to the parent
	bones[1].localRotation = Quaternion.identity;
	bones[1].localPosition = Vector3 (0, 5, 0);
	// The bind pose is bone's inverse transformation matrix
	// In this case the matrix we also make this matrix relative to the root
	// So that we can move the root game object around freely
	bindPoses[1] = bones[1].worldToLocalMatrix * transform.localToWorldMatrix;

	mesh.bindposes = bindPoses;
	
	// Assign bones and bind poses
	renderer.bones = bones;
	renderer.sharedMesh = mesh;

	// Assign a simple waving animation to the bottom bone
	var curve = new AnimationCurve();
	curve.keys = [ new Keyframe (0, 0, 0, 0), new Keyframe (1, 3, 0, 0),
				   new Keyframe (2, 0.0, 0, 0) ];

	// Create the clip with the curve
	var clip = new AnimationClip();
	clip.SetCurve("Lower", Transform, "m_LocalPosition.z", curve);
	
	// Add and play the clip
	animation.AddClip(clip, "test");
	animation.Play("test");
}