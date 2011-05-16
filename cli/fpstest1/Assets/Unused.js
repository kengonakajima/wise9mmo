/*
    var nt;
    var s : int;
    var t : int;
    if( Input.GetButtonDown( "Fire1" ) ) {

        tmpcounter0 +=1;
        for(t = 0;t<16;t++){
            for(s = 0; s<16; s++){
                var cu = Instantiate( prefabVoxel, Vector3( t*1.2 , tmpcounter0 *1.2, s*1.2 ), Quaternion.identity );
                cubes.Push(cu);
            }
        }
        setStat(tmpcounter0*16*16);

    }
    if( Input.GetButtonDown( "Fire2" ) ){
        tmpcounter1 +=  1;
        for(t = 0;t<8;t++){
            for(s = 0; s<8; s++){
                cu = Instantiate( prefabMulti, Vector3( t*16, tmpcounter1 *16, s*16 ), Quaternion.identity );
                cubes.Push(cu);
            }
        }
        setStat(tmpcounter1*8*8* 8*8*8 );
    }
    if( Input.GetButtonDown( "Fire3" ) ){
        var yy : int = tmpcounter2 / 16;
        var zz : int = ( tmpcounter2 % 16 ) / 4;
        var xx : int = ( tmpcounter2 % 4 ) ;

        
        for(t = 0;t<6;t++){
            for(s = 0; s<6; s++){
                cu = Instantiate( prefabProcedural, Vector3( xx*6*10+s*10, yy *10, zz*6*10+t*10 ), Quaternion.identity );                
                cubes.Push(cu);
            }
        }
        tmpcounter2 += 1;        
        setStat(tmpcounter2*6*6* 4*4*4 );
    }
/////////////////////////////////////////////////////////////////////////////////

function clearCubes() {

    for( var c in cubes ) {
        Destroy(c);
    }
    
    cubes = new Array();
    tmpcounter0 = tmpcounter1 = tmpcounter2 = 0;
    setStat(0);

    // FBXビューワー
	var mesh : Mesh = GetComponent(MeshFilter).mesh;
    var ii : int;
    for( ii  = 0; ii < mesh.vertices.length ; ii ++ ) {
        print( "v["+ii+"]:" + mesh.vertices[ii] );
    }
    for( ii = 0; ii < mesh.uv.length; ii ++ ){
        print( "uv["+ii+"]:" + mesh.uv[ii] );
    }
    
}
*/

/*
  
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
*/
