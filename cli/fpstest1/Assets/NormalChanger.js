function Start() {

    var mesh : Mesh = GetComponent( MeshFilter ).mesh;

    mesh.RecalculateNormals();

    var norms : Vector3[] = new Vector3[ mesh.normals.length ];
    for(var i=0;i<mesh.normals.length;i++){
        norms[i].x = mesh.normals[i].x;
        norms[i].y = mesh.normals[i].y + 0.5;
        norms[i].z = mesh.normals[i].z;
    }
    mesh.normals = norms;

}
