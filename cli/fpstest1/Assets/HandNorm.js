//

function Start() {

    var lightNormal = 0.5;
    
    var layernames = [ "toolhand_1_animated/toolhand_board/Bone01" ];

    for( var nm in layernames ){
        var hh = transform.Find(nm);

        if( hh == null ){
            print("hh null.name:" + nm );
            continue;
        }
        print("hh:"+hh);
        
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
