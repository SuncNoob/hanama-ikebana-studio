Shader "Hanama/Botanical"
{
    Properties
    {
        _MainTex ("Flower", 2D) = "white" {}
        _LightColor ("Light color", Color) = (1, .94, .83, 1)
        _LightDirection ("Light direction", Vector) = (-.7, .7, 0, 0)
        _LightPower ("Light strength", Float) = .65
        _Selected ("Selection", Float) = 0
        _Shadow ("Shadow pass", Float) = 0
        _Softness ("Penumbra", Vector) = (.005, .005, 0, 0)
        _EraseTex ("Transient eraser mask", 2D) = "black" {}
        _EraseActive ("Eraser preview", Float) = 0
    }
    SubShader
    {
        Tags { "Queue"="Transparent" "RenderType"="Transparent" "IgnoreProjector"="True" }
        Cull Off Lighting Off ZWrite Off
        Blend SrcAlpha OneMinusSrcAlpha
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            struct appdata { float4 vertex : POSITION; float2 uv : TEXCOORD0; };
            struct v2f { float4 vertex : SV_POSITION; float2 uv : TEXCOORD0; };
            sampler2D _MainTex, _EraseTex;
            float4 _MainTex_TexelSize, _LightDirection, _LightColor, _Softness;
            float _LightPower, _Selected, _Shadow, _EraseActive;
            v2f vert(appdata v) { v2f o; o.vertex=UnityObjectToClipPos(v.vertex); o.uv=v.uv; return o; }
            fixed4 frag(v2f i) : SV_Target
            {
                fixed4 c=tex2D(_MainTex,i.uv);
                if (_EraseActive>.5)
                {
                    // Shadow geometry includes 12% padding; the mask uses the flower's UVs.
                    float2 maskUV=_Shadow>.5?i.uv*1.24-.12:i.uv;
                    c.a*=1-tex2D(_EraseTex,maskUV).r;
                }
                if (_Shadow>.5)
                    return fixed4(.28,.30,.26,c.a*lerp(.035,.085,_LightPower)*lerp(1,.56,saturate(i.uv.y)));
                // A broad wrapped light retains the source photograph's soft botanical detail.
                // Colour variation in a petal is never treated as geometric relief.
                float2 n=(i.uv-.5)*float2(1.1,.65);
                float wrapped=saturate(.55+dot(float2(-n.x,.45),_LightDirection.xy)*.35);
                float gain=lerp(1,clamp(.96+wrapped*.09,.96,1.05),_LightPower);
                c.rgb*=lerp(float3(1,1,1),_LightColor.rgb,.24*_LightPower)*gain;
                c.rgb=lerp(c.rgb,c.rgb*float3(1.015,1.01,.99),_Selected*.35);
                return c;
            }
            ENDCG
        }
    }
}
