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
            sampler2D _MainTex;
            float4 _MainTex_TexelSize, _LightDirection, _LightColor, _Softness;
            float _LightPower, _Selected, _Shadow;
            v2f vert(appdata v) { v2f o; o.vertex=UnityObjectToClipPos(v.vertex); o.uv=v.uv; return o; }
            fixed4 frag(v2f i) : SV_Target
            {
                fixed4 c=tex2D(_MainTex,i.uv);
                if (_Shadow>.5)
                {
                    float2 s=_Softness.xy;
                    float a=c.a*4;
                    a+=tex2D(_MainTex,i.uv+float2(s.x,0)).a*2+tex2D(_MainTex,i.uv-float2(s.x,0)).a*2;
                    a+=tex2D(_MainTex,i.uv+float2(0,s.y)).a*2+tex2D(_MainTex,i.uv-float2(0,s.y)).a*2;
                    a+=tex2D(_MainTex,i.uv+s).a+tex2D(_MainTex,i.uv-s).a;
                    a+=tex2D(_MainTex,i.uv+float2(s.x,-s.y)).a+tex2D(_MainTex,i.uv+float2(-s.x,s.y)).a;
                    return fixed4(.18,.20,.17,a/16*lerp(.055,.22,_LightPower));
                }
                float2 t=_MainTex_TexelSize.xy*2;
                fixed4 l=tex2D(_MainTex,i.uv-float2(t.x,0)),r=tex2D(_MainTex,i.uv+float2(t.x,0));
                fixed4 b=tex2D(_MainTex,i.uv-float2(0,t.y)),u=tex2D(_MainTex,i.uv+float2(0,t.y));
                // Image-derived relief preserves the original botanical photography.
                float3 weights=float3(.2126,.7152,.0722);
                float2 relief=float2(dot(l.rgb-r.rgb,weights),dot(b.rgb-u.rgb,weights));
                float3 normal=normalize(float3(relief*2.2,1));
                float3 light=normalize(float3(_LightDirection.xy,.9));
                float diffuse=dot(normal,light);
                float edge=max(0,c.a-min(min(l.a,r.a),min(u.a,b.a)));
                float directional=saturate(dot(float2(l.a-r.a,b.a-u.a),_LightDirection.xy));
                float gain=lerp(1,.91+diffuse*.23,_LightPower);
                c.rgb*=lerp(float3(1,1,1),_LightColor.rgb,.28*_LightPower)*gain;
                c.rgb+=_LightColor.rgb*directional*.13*_LightPower;
                c.rgb=lerp(c.rgb,float3(.82,.69,.40),saturate(edge*_Selected*.6));
                return c;
            }
            ENDCG
        }
    }
}
