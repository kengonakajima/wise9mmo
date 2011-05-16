var heightMap : Texture2D;
var material : Material;
var size = Vector3(200, 30, 200);


//　指定した位置に頂点をもつ立方体を返す
function makeCube( basepos : Vector3, vertices : Vector3[], uv : Vector2[], vi : int, triangles : int[], ti : int )
{

    vertices[vi+0] = basepos + Vector3( 0,0,0 ); // Z=0
    vertices[vi+1] = basepos + Vector3( 0,1,0 ); //
    vertices[vi+2] = basepos + Vector3( 1,0,0 ); //
    vertices[vi+3] = basepos + Vector3( 1,1,0 ); //

    vertices[vi+4] = basepos + Vector3( 0,0,1 ); // Z=1
    vertices[vi+5] = basepos + Vector3( 0,1,1 ); //    
    vertices[vi+6] = basepos + Vector3( 1,0,1 ); //
    vertices[vi+7] = basepos + Vector3( 1,1,1 ); //    
    
    uv[vi+0] = Vector2(0,0); // Z=0
    uv[vi+1] = Vector2(0,1);
    uv[vi+2] = Vector2(1,0);
    uv[vi+3] = Vector2(1,1);

    uv[vi+4] = Vector2(1,1); // Z=1
    uv[vi+5] = Vector2(1,0);
    uv[vi+6] = Vector2(0,0);
    uv[vi+7] = Vector2(0,1);

    triangles[ti+0] = vi+0; // Z=0平面の三角0
    triangles[ti+1] = vi+1; // 
    triangles[ti+2] = vi+2; //
    triangles[ti+3] = vi+1; // Z=0平面の三角1
    triangles[ti+4] = vi+3; // 
    triangles[ti+5] = vi+2; //

    triangles[ti+6] = vi+4; // Z=1平面の三角0
    triangles[ti+7] = vi+6;
    triangles[ti+8] = vi+5;
    triangles[ti+9] = vi+5; // Z=1平面の三角1
    triangles[ti+10]= vi+6;
    triangles[ti+11]= vi+7;

    triangles[ti+12] = vi+5; // X=0平面の三角0
    triangles[ti+13] = vi+1;
    triangles[ti+14] = vi+0;
    triangles[ti+15] = vi+0; // X=0平面の三角1
    triangles[ti+16] = vi+4;
    triangles[ti+17] = vi+5;

    triangles[ti+18] = vi+2; // X=1平面の三角0
    triangles[ti+19] = vi+3;
    triangles[ti+20] = vi+6;
    triangles[ti+21] = vi+3; // X=1平面の三角1
    triangles[ti+22] = vi+7;
    triangles[ti+23] = vi+6;

    triangles[ti+24] = vi+0; // Y=0平面の三角0
    triangles[ti+25] = vi+2;
    triangles[ti+26] = vi+6;
    triangles[ti+27] = vi+0; // Y=1平面の三角1
    triangles[ti+28] = vi+6;
    triangles[ti+29] = vi+4;

    triangles[ti+30] = vi+1; // Y=1平面の三角0
    triangles[ti+31] = vi+5;
    triangles[ti+32] = vi+3;
    triangles[ti+33] = vi+5; // Y=1平面の三角1
    triangles[ti+34] = vi+7;
    triangles[ti+35] = vi+3;        
}

function Start ()
{

	if (material)
		renderer.material = material;
	else
		renderer.material.color = Color.white;

	var mesh : Mesh = GetComponent(MeshFilter).mesh;

    mesh.Clear();

    var n:int = 4;
    var vertices : Vector3[] = new Vector3[ n*n*n *8 ];
    var uv : Vector2[] = new Vector2[ n*n*n *8 ];
    var triangles : int[] = new int[ n*n*n * 36 ];
    
    var vi:int=0;
    var ti:int=0;
    
    for( var z:int = 0; z < n; z++ ){
        for( var y:int = 0; y < n; y++ ){
            for( var x:int = 0; x < n; x++ ){
                // makeCube( Vector3(x*1.3,y*1.3,z*1.3));
                makeCube( Vector3(x*1.3,y*1.3,z*1.3 ),
                          vertices,
                          uv,
                          vi,
                          triangles,
                          ti );
                vi += 8;
                ti += 36;
            }
        }
    }
    
    mesh.vertices = vertices;
    mesh.uv = uv;
    mesh.triangles = triangles;

    mesh.RecalculateNormals();
}

function Update () {

    
}