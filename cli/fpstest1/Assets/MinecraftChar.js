// キャラの明るさ調整(なにもしないと側面が真っ黒になる)
//

function Start() {

    var lightNormal = 0.5;
    
    var layernames = [ "minecraftchar_2mo/minecraftchar:Layer2",
                  "minecraftchar_2mo/minecraftchar:Layer3",
                  "minecraftchar_2mo/minecraftchar:Layer4",
                  "minecraftchar_2mo/minecraftchar:Layer5",
                  "minecraftchar_2mo/minecraftchar:Layer6",
                  "minecraftchar_2mo/minecraftchar:Layer7"
                  ];

    for( var nm in layernames ){
        var hh = transform.Find(nm);
        print("hh:"+ hh);

        var skmr :SkinnedMeshRenderer = hh.GetComponent(SkinnedMeshRenderer);
        var sm = skmr.sharedMesh;
        sm.RecalculateNormals();
    
        var hhns  = sm.normals;
    
        var norms : Vector3[] = new Vector3[ hhns.length ];
        for(var i=0;i<norms.length;i++){
            norms[i].x = sm.normals[i].x;
            norms[i].y = sm.normals[i].y + lightNormal; 
            norms[i].z = sm.normals[i].z;
        }
        sm.normals = norms;
    }
}
