Shader "WaterShader" {
    Properties {
		_Color ( "Main Color", Color ) = (1,1,1,1)
        _SpecColor ("Spec Color", Color) = (1,1,1,1)
        _Emission ("Emmisive Color", Color) = (0,0,0,0)
        _Shininess ("Shininess", Range (0.01, 1)) = 0.7        
        _MainTex ("MainTex to blend..", 2D) = "black" {}
    }
    SubShader {
        Tags { "Queue" = "Transparent" }
        
        Pass {
            Material {
                Diffuse [_Color]
                Ambient [_Color]
                Shininess [_Shininess]
                Specular [_SpecColor]
                Emission [_Emission]                
            }
            ZWrite Off

            Lighting on
//            SeparateSpecular On

            Blend SrcAlpha OneMinusSrcAlpha  // これにして、generate alpha from grayscale　でやったらなんとなくそれっぽくなった


            SetTexture [_MainTex] {
                constantColor  [_Color] // primaryを掛けないと、ライティングが効かない。
                Combine texture * primary DOUBLE , texture * constant
//                Combine texture , texture * constant
            }


        }
    }
}