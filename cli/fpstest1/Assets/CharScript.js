var toShift : Vector3;

var simpleCubePrefab : GameObject;

var rightHand : GameObject;
var leftHand : GameObject;
var head : GameObject;
var rightLeg : GameObject;
var leftLeg : GameObject;
var body : GameObject;

function adjustNormals(mesh){
    var norms = mesh.normals;
    for(var i=0;i< norms.length; i++){
        norms[i] = Vector3( 0,0.5,0);//mesh.normals[i];
    }
    mesh.normals = norms;
}

// 4x4のアトラスからuv4点をつくる
function charbaseUV(ind, uv, uviLD, uviRD, uviLU, uviRU) {
    var d = 1.0 / 4.0;
    var ep = 0.01;
    var row:int = ind / 4;
    var col:int = ind % 4;
    uv[uviLD] = Vector2( col*d+ep,1.0-row*d-(d-ep));
    uv[uviRD] = Vector2( col*d+d-ep,1.0-row*d-(d-ep));
    uv[uviLU] = Vector2( col*d+ep,1.0-row*d-ep);
    uv[uviRU] = Vector2( col*d+d-ep,1.0-row*d-ep);
    if( ind==1||ind==0){
        print(""+ uv[uviLD] +","+uv[uviRD]+","+uv[uviLU]+","+uv[uviRU]);
    } 
}
function charbaseUVall( mesh, ind ){
    var uv = mesh.uv;
    charbaseUV( ind, uv, 0,1,2,3 );
    charbaseUV( ind, uv, 7,6,11,10);
    charbaseUV( ind, uv, 16,18,19,17);
    charbaseUV( ind, uv, 22,20,21,23);
    charbaseUV( ind, uv, 9,5,8,4);
    charbaseUV( ind, uv, 12,13,14,15);
    mesh.uv = uv;
}

function Start() {
	var mesh : Mesh = GetComponent(MeshFilter).mesh;
    mesh.Clear();

    if( simpleCubePrefab == null )return;

    //手足作る
    transform.localScale = Vector3( 0.5,0.5,0.5);

    print( "charscript start: rot:" + transform.rotation );

    var m :Mesh;
    var uv;
    body = Instantiate( simpleCubePrefab, transform.position, transform.rotation );
    body.transform.parent = transform;
    body.transform.localPosition = Vector3(0,0,0);
    body.transform.localScale = Vector3( 1,1,0.7 );
    m = body.GetComponent(MeshFilter).mesh;
    adjustNormals(m);
    charbaseUVall( m, 12 );
    
    
    rightHand = Instantiate( simpleCubePrefab, transform.position, transform.rotation );
    rightHand.transform.parent = transform;
    rightHand.transform.localPosition = Vector3(0.7,0,0);
    rightHand.transform.localScale = Vector3(0.3,1,0.3);
    m = rightHand.GetComponent(MeshFilter).mesh;
    adjustNormals(m);
    charbaseUVall(m, 13);
    
    leftHand = Instantiate( simpleCubePrefab, transform.position, transform.rotation );
    leftHand.transform.parent = transform;
    leftHand.transform.localPosition = Vector3(-0.7,0,0);
    leftHand.transform.localScale = Vector3(0.3,1,0.3);
    m = leftHand.GetComponent(MeshFilter).mesh;
    adjustNormals(m);
    charbaseUVall(m,13);
    
    head = Instantiate( simpleCubePrefab, transform.position, transform.rotation );
    head.transform.parent = transform;
    head.transform.localPosition = Vector3( 0,1,0);
    head.transform.localScale = Vector3( 0.8,0.8,0.8);
    
    m = head.GetComponent(MeshFilter).mesh;
    adjustNormals( m );
    uv = m.uv;
    // 24個
    //    var uv = hm.uv;
    //    for(var i=0;i<uv.length;i++){
    //        print("hm:"+i+" " + uv[i] + " " + hm.vertices[i] );
    //    }

    // 24頂点あり、 z=0.5で4個
    // z=-0.5で4個
    // Y=0.5で4個
    // y=-0.5で4個
    // x=-0.5で4個
    // x=0.5で4個
    // の順番に並んでいる。
    // z=0.5が顔の方向(+z)。
    // [0] = (0.5,-0.5,0.5) uv(0,0)   向かって左下
    // [1] = (-0.5,-0.5,0.5) uv(1,0)  右下
    // [2] = (0.5,0.5,0.5) uv(0,1) 左上
    // [3] = (-0.5,0.5,0.5) uv(1,1)　右上
    
    // hm:4 (0.0, 1.0) (0.5, 0.5, -0.5) 後ろからみて 右上
    // hm:5 (1.0, 1.0) (-0.5, 0.5, -0.5)           左上
    // hm:6 (0.0, 1.0) (0.5, -0.5, -0.5)           右下
    // hm:7 (1.0, 1.0) (-0.5, -0.5, -0.5)          左下

    // hm:8 (0.0, 0.0) (0.5, 0.5, 0.5)
    
    // となっている。この状態で見た目は完全に前
    // basetextureは

    // 4x4のアトラスで左上が顔の前
    // [顔面][頭上][][]
    // [][側面左向][][]
    // [][][][]
    // [][][][]

    /*
0 (0.5, -0.5, 0.5)
1 (-0.5, -0.5, 0.5)
2 (0.5, 0.5, 0.5)
3 (-0.5, 0.5, 0.5)
4 (0.5, 0.5, -0.5)
5 (-0.5, 0.5, -0.5)
6 (0.5, -0.5, -0.5)
7 (-0.5, -0.5, -0.5)
8 (0.5, 0.5, 0.5)
9 (-0.5, 0.5, 0.5)
10 (0.5, 0.5, -0.5)
11 (-0.5, 0.5, -0.5)
12 (0.5, -0.5, -0.5)
13 (-0.5, -0.5, 0.5)
14 (-0.5, -0.5, -0.5)
15 (0.5, -0.5, 0.5)

16 (-0.5, -0.5, 0.5) -x 向かって左下
17 (-0.5, 0.5, -0.5) -x 向かってみぎうえ
18 (-0.5, -0.5, -0.5)  -x 向かって右した
19 (-0.5, 0.5, 0.5)  -x 向かって左上

20 (0.5, -0.5, -0.5) +x ひだりした
21 (0.5, 0.5, 0.5)　　みぎうえ
22 (0.5, -0.5, 0.5)　ひだりうえ
23 (0.5, 0.5, -0.5)　　みぎした

north 1 0 3 , 3 0 2 +z
up 9 8 5 , 5 8 4        +y
south 11 10 7, 7 10 6 -z
down 14 12 13, 13 12 15 -y
west 18 16 17, 17 16 19  -x
east 22 20 21,  21 20 23 +x

    */
    
    charbaseUV( 0, uv, 0,1,2,3 ); // +z north LD RD LU RU
    charbaseUV( 1, uv, 7,6,11,10 ); // -z south
    charbaseUV( 5, uv, 16,18,19,17 ); // -x west
    charbaseUV( 5, uv, 22,20,21,23 ); // +x east
    charbaseUV( 1, uv, 9,5,8,4 ); // up
    charbaseUV( 4, uv, 12,13,14,15 ); // down
    m.uv = uv;

    rightLeg = Instantiate( simpleCubePrefab, transform.position, transform.rotation );
    rightLeg.transform.parent = transform;
    rightLeg.transform.localPosition = Vector3( 0.3,-1,0);
    rightLeg.transform.localScale = Vector3( 0.4,1,0.4);
    m = rightLeg.GetComponent(MeshFilter).mesh;
    adjustNormals(m);
    charbaseUVall(m,13);

    leftLeg = Instantiate( simpleCubePrefab, transform.position, transform.rotation );
    leftLeg.transform.parent = transform;
    leftLeg.transform.localPosition = Vector3( -0.3,-1,0);
    leftLeg.transform.localScale = Vector3( 0.4,1,0.4);
    m = leftLeg.GetComponent(MeshFilter).mesh;
    adjustNormals(m);
    charbaseUVall(m,13);
    
}


var isBody = false ;

// transform.position と nextposから、位置の差がわかる。
//
function Update() {
    for (var child : Transform in transform) {
        //        print( "ch:" + child );
    }

    if( isBody == true ){
        var rh = transform.Find( "CubeRightHand" );
        print(" rh:" + rh );
        if( rh != null ){
            print("rh:name:"+name);
            rh.rotation.x = Random.value;
        }
    }
}
