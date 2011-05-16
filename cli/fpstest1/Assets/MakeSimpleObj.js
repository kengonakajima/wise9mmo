// 花とかトーチとかのシンプルなオブジェクトを生成
// ２枚x2の固定ポリゴン (両面から見える)　で構成

var material:Material;

function Start() {
	if (material)
		renderer.material = material;
	else
		renderer.material.color = Color.white;

	var mesh : Mesh = GetComponent(MeshFilter).mesh;

    mesh.Clear();

    var vertices : Vector3[] = new Vector3[ (4 + 4)*2 ]; // しかくいポリゴンが２個で、かつ両面
    var uv : Vector2[] = new Vector2[ (4 + 4)*2 ]; // uvは超点数と同じ
    var triangles : int[] = new int[ 4 * 2 * 3 ]; // 両面で２倍
    var normals : Vector3[] = new Vector3[ (4 + 4)*2 ]; // 両面なので頂点ｘ２

    // Z=0.5
    vertices[0] = Vector3( 0,0,0.5 ); // z=0.5の面(裏表共用)
    vertices[1] = Vector3( 1,0,0.5 );
    vertices[2] = Vector3( 1,1,0.5 );
    vertices[3] = Vector3( 0,1,0.5 );

    vertices[4] = Vector3( 0.5,0,0 ); // x=0.5の面(裏表共用)
    vertices[5] = Vector3( 0.5,0,1 );
    vertices[6] = Vector3( 0.5,1,1 );
    vertices[7] = Vector3( 0.5,1,0 );


    var wi = ( 512 / 16 ); // １行に３２個
    
    var texInd = 256; // 赤い花の番号
    var atlasCol :int = texInd % wi;
    var atlasRow :int = texInd / wi;
    var unit : float = 1.0 / wi; // アトラス１個あたりのuv差
    
    var uStart :float = atlasCol*unit;
    var vStart :float = 1.0 - atlasRow*unit - unit;

    var ep=0.001;
    print( "u:"+uStart + " v:" + vStart + " col:"+atlasCol + " row:"+atlasRow );
    uv[0] = Vector2(uStart+ep,vStart+ep);
    uv[1] = Vector2(uStart+unit-ep,vStart+ep);
    uv[2] = Vector2(uStart+unit-ep,vStart+unit-ep);
    uv[3] = Vector2(uStart+ep,vStart+unit-ep);

    uv[4] = uv[0];
    uv[5] = uv[1];
    uv[6] = uv[2];
    uv[7] = uv[3];

    var l=0.3;
    normals[0] = Vector3(0,l,0);
    normals[1] = Vector3(0,l,0);
    normals[2] = Vector3(0,l,0);    
    normals[3] = Vector3(0,l,0);

    normals[4] = normals[0];
    normals[5] = normals[1];
    normals[6] = normals[2];
    normals[7] = normals[3];

    triangles[0] = 0; // z=0.5 表
    triangles[1] = 2;
    triangles[2] = 1;
    triangles[3] = 0;
    triangles[4] = 3;
    triangles[5] = 2;

    triangles[6] = 0; // z=0.5 裏
    triangles[7] = 1;
    triangles[8] = 2;
    triangles[9] = 0;
    triangles[10] = 2;
    triangles[11] = 3;

    triangles[12] = 4; // x=0.5表(X+)
    triangles[13] = 6;
    triangles[14] = 5;
    triangles[15] = 4;
    triangles[16] = 7;
    triangles[17] = 6;

    triangles[18] = 4;
    triangles[19] = 5;
    triangles[20] = 6;    
    triangles[21] = 4;
    triangles[22] = 6;
    triangles[23] = 7;        

    

    mesh.vertices = vertices;
    mesh.uv = uv;
    mesh.triangles = triangles;
    mesh.normals = normals;
}

