using System;
using UnityEngine;

public sealed partial class HanamaGame
{
    const int Bones=8;
    sealed class StemChain
    {
        public readonly float[] rest=new float[Bones],angles=new float[Bones],speed=new float[Bones],start=new float[Bones];
        public readonly Vector2[] joints=new Vector2[Bones+1],solve=new Vector2[Bones+1];
        public float extent,length,phase,stiffness,limit,windBlend;public bool dirty=true;
    }
    bool bending;int grip;Vector2 gripOffset;
    float lastOrganicTime;
    void SyncOrganic(Piece p)
    {
        if(!p.data.interactive)return;
        bool fresh=p.chain==null;if(fresh)p.chain=new StemChain();var c=p.chain;
        c.extent=Mathf.Max(1,p.data.extent);c.length=c.extent/Bones;
        c.phase=StablePhase(p.data.id);c.stiffness=Mathf.Lerp(70,32,p.data.flexibility);c.limit=Mathf.Lerp(.055f,.16f,p.data.flexibility);
        for(int i=0;i<Bones;i++)
        {
            c.rest[i]=p.data.flex!=null&&i<p.data.flex.Length?Mathf.Clamp(p.data.flex[i],-.6f,.6f):0;
            if(fresh)c.angles[i]=c.rest[i];
        }
        if(tool!="move"||!settings.motion||settings.reducedMotion||settings.paused){Array.Copy(c.rest,c.angles,Bones);Array.Clear(c.speed,0,Bones);c.windBlend=0;}
        c.dirty=true;Forward(c,c.angles,c.joints);
        if(p.shadowTex==null&&p.tex)BuildSoftShadow(p);
    }
    static float StablePhase(string key)
    {
        uint hash=2166136261;foreach(char ch in key??""){hash^=ch;hash*=16777619;}return (hash%10000)*.001f;
    }
    static void Forward(StemChain c,float[] angles,Vector2[] joints)
    {
        joints[0]=Vector2.zero;for(int i=0;i<Bones;i++)joints[i+1]=joints[i]+new Vector2(Mathf.Sin(angles[i]),Mathf.Cos(angles[i]))*c.length;
    }
    void RestOrganic(Piece p)
    {
        var c=p?.chain;if(c==null)return;
        Array.Copy(c.rest,c.angles,Bones);Array.Clear(c.speed,0,Bones);c.windBlend=0;
        Forward(c,c.angles,c.joints);UpdateOrganicMesh(p);
    }
    Vector2 BendLocal(Piece p,Vector2 at)
    {
        var c=p.chain;if(c==null||at.y<=0)return at;
        float f=at.y/c.length;int i=Mathf.Clamp(Mathf.FloorToInt(f),0,Bones-1);float t=f-i;
        Vector2 center=c.joints[i]+(c.joints[i+1]-c.joints[i])*t;
        return center+new Vector2(Mathf.Cos(c.angles[i]),-Mathf.Sin(c.angles[i]))*at.x;
    }
    Vector2 UnbendLocal(Piece p,Vector2 at)
    {
        var c=p.chain;if(c==null||at.y<=0)return at;
        Vector2 best=at;float error=float.MaxValue;
        for(int i=0;i<Bones;i++)
        {
            var d=at-c.joints[i];var tangent=new Vector2(Mathf.Sin(c.angles[i]),Mathf.Cos(c.angles[i]));
            float t=Vector2.Dot(d,tangent)/c.length;
            if(i<Bones-1&&(t<-.001f||t>1.001f))continue;if(i==Bones-1&&t<-.001f)continue;
            float x=Vector2.Dot(d,new Vector2(tangent.y,-tangent.x));var flat=new Vector2(x,(i+t)*c.length);
            float e=(BendLocal(p,flat)-at).sqrMagnitude+Mathf.Abs(x)*.000001f;
            if(e<error){error=e;best=flat;}
        }
        return best;
    }
    void BeginBend(Piece p,Vector2 at)
    {
        var c=p.chain;Array.Copy(c.rest,c.start,Bones);
        Vector2 local=p.root.transform.InverseTransformPoint(at),flat=UnbendLocal(p,local);
        grip=Mathf.Clamp(Mathf.RoundToInt(flat.y/c.length),2,Bones);
        gripOffset=local-c.joints[grip];
    }
    // FABRIK: two forward/backward passes, fixed lengths, fixed root, botanical angle limits.
    void SolveBend(Piece p,Vector2 at)
    {
        var c=p.chain;var target=(Vector2)p.root.transform.InverseTransformPoint(at)-gripOffset;
        float cap=Mathf.Lerp(.22f,.55f,p.data.flexibility);
        target.x=Mathf.Clamp(target.x,-c.extent*cap,c.extent*cap);target.y=Mathf.Max(c.extent*.35f,target.y);
        Array.Copy(c.joints,c.solve,Bones+1);
        for(int pass=0;pass<3;pass++)
        {
            c.solve[grip]=target;
            for(int i=grip-1;i>=0;i--){var d=(c.solve[i]-c.solve[i+1]).normalized;c.solve[i]=c.solve[i+1]+d*c.length;}
            c.solve[0]=Vector2.zero;float previous=0;
            for(int i=0;i<grip;i++)
            {
                Vector2 d=c.solve[i+1]-c.solve[i];float a=Mathf.Atan2(d.x,d.y);
                float limit=i==0?c.limit*.7f:c.limit;float max=Mathf.Lerp(.22f,.58f,p.data.flexibility);
                a=Mathf.Clamp(a,Mathf.Max(-max,previous-limit),Mathf.Min(max,previous+limit));
                // The crown moves as one form; petals are never individually stretched.
                if(i>=6)a=previous;
                c.rest[i]=a;c.solve[i+1]=c.solve[i]+new Vector2(Mathf.Sin(a),Mathf.Cos(a))*c.length;previous=a;
            }
            for(int i=grip;i<Bones;i++){c.rest[i]=c.rest[grip-1]+(c.start[i]-c.start[grip-1])*.5f;c.rest[i]=Mathf.Clamp(c.rest[i],-.6f,.6f);}
        }
        for(int i=0;i<Bones;i++){c.angles[i]=Mathf.Lerp(c.angles[i],c.rest[i],.65f);c.speed[i]=0;}
        Forward(c,c.angles,c.joints);c.dirty=true;UpdateOrganicMesh(p);
    }
    void UpdateOrganicMesh(Piece p)
    {
        var c=p.chain;if(c==null)return;
        for(int i=0;i<p.vertices.Length;i++){var v=BendLocal(p,p.basis[i]);p.vertices[i]=new Vector3(v.x,v.y,0);}
        p.mesh.vertices=p.vertices;
        if(p.shadowMesh!=null)
        {
            for(int i=0;i<p.shadowVertices.Length;i++){var v=BendLocal(p,p.shadowBasis[i]);p.shadowVertices[i]=new Vector3(v.x,v.y,0);}
            p.shadowMesh.vertices=p.shadowVertices;
        }
        c.dirty=false;
    }
    void AnimateOrganic(float dt)
    {
        if(frame==null||settings.paused)return;
        float now=Time.unscaledTime;
        // Simulation is bounded to 30 Hz off-gesture; the root remains exact at every render.
        float cadence=Time.unscaledDeltaTime>.05f?1f/20:1f/30;
        if(!held&&now-lastOrganicTime<cadence)return;
        float step=Mathf.Min(.04f,Mathf.Max(.001f,now-lastOrganicTime));lastOrganicTime=now;
        float angle=settings.direction*Mathf.Deg2Rad;var dir=new Vector2(Mathf.Cos(angle),Mathf.Sin(angle));
        lightVector=Vector2.Lerp(lightVector,dir,1-Mathf.Exp(-step*4));lightPower=Mathf.Lerp(lightPower,settings.power,1-Mathf.Exp(-step*4));
        var tint=frame.light=="moon"?new Color(.92f,.95f,1):frame.light=="dusk"?new Color(1,.94f,.86f):new Color(1,.99f,.97f);
        lightColor=Color.Lerp(lightColor,tint,1-Mathf.Exp(-step*4));
        foreach(var p in pieces.Values)
        {
            if(!p.data.interactive||p.chain==null)continue;var c=p.chain;
            Vector2 pos=p.root.transform.position;float impulse=Mathf.Clamp(-(pos.x-p.previous.x)*.012f,-.1f,.1f);p.previous=pos;
            // Source-space scissors/eraser must see the saved resting curve, never a wind offset.
            bool motion=settings.motion&&!settings.reducedMotion&&tool=="move"&&!(held&&picked==p);
            bool changed=c.dirty;
            if(!(held&&picked==p&&bending))
            {
                // A slow coherent breeze is visibly alive within a second, without jittering petals.
                // Distinct stable phases keep neighbouring stems from swinging as one flat card.
                c.windBlend=motion?Mathf.MoveTowards(c.windBlend,1,step/.85f):0;
                float wave=Mathf.Sin(now*.83f+c.phase)*.67f+Mathf.Sin(now*1.31f+c.phase*.71f)*.23f+Mathf.Sin(now*.37f+c.phase*1.7f)*.10f;
                float gust=wave*Mathf.Lerp(.026f,.052f,Mathf.Clamp01(p.data.flexibility))*c.windBlend;
                for(int i=0;i<Bones;i++)
                {
                    // Identical upper offsets move the flower crown as one form. The root joint stays zero.
                    float t=Mathf.Min(i,4)/4f,weight=.08f+.92f*t*t*(3-2*t);
                    float wanted=c.rest[i]+(motion?gust*weight:0);
                    c.speed[i]+=impulse*weight;
                    c.speed[i]+=((wanted-c.angles[i])*c.stiffness-2*Mathf.Sqrt(c.stiffness)*.82f*c.speed[i])*step;
                    float next=motion?c.angles[i]+c.speed[i]*step:c.rest[i];
                    if(!motion)c.speed[i]=0;
                    if(Mathf.Abs(next-c.angles[i])>.000015f)changed=true;c.angles[i]=next;
                }
                if(changed){Forward(c,c.angles,c.joints);UpdateOrganicMesh(p);}
            }
            p.mat.SetVector("_LightDirection",new Vector4(lightVector.x,lightVector.y,0,0));p.mat.SetColor("_LightColor",lightColor);p.mat.SetFloat("_LightPower",lightPower);
            p.mat.SetFloat("_Selected",!capturing&&!settings.photo&&selected==p.data.id ? .55f : 0);
            if(p.shadow)
            {
                float distance=Mathf.Lerp(.8f,2.1f,lightPower);
                p.shadow.transform.SetPositionAndRotation(p.root.transform.position+(Vector3)(-lightVector*distance),p.root.transform.rotation);
                p.shadow.transform.localScale=p.root.transform.localScale;p.shadowMaterial.SetFloat("_LightPower",lightPower);
            }
        }
        foreach(var m in motes)if(m.life>0)
        {
            m.life-=step;m.root.position+=(Vector3)(m.velocity*step);var col=m.sprite.color;col.a=Mathf.Max(0,m.life*.25f);m.sprite.color=col;if(m.life<=0)m.root.gameObject.SetActive(false);
        }
    }
    // Pre-filter alpha once on texture change. Rendering each shadow costs one texture sample.
    void BuildSoftShadow(Piece p)
    {
        const int S=128;const float pad=.12f;var a=new float[S*S];var b=new float[S*S];
        var pixels=p.tex.GetPixels32();int w=p.tex.width,h=p.tex.height;
        for(int y=0;y<S;y++)for(int x=0;x<S;x++)
        {
            float u=(x+.5f)/S*(1+2*pad)-pad,v=(y+.5f)/S*(1+2*pad)-pad;
            if(u>=0&&u<=1&&v>=0&&v<=1)a[y*S+x]=pixels[Mathf.Clamp((int)(v*h),0,h-1)*w+Mathf.Clamp((int)(u*w),0,w-1)].a/255f;
        }
        for(int pass=0;pass<3;pass++)
        {
            for(int y=0;y<S;y++)
            {
                float top=Mathf.Clamp01((y/(float)S-.12f)/.76f);int radius=Mathf.RoundToInt(Mathf.Lerp(2,5,top));
                for(int x=0;x<S;x++){float sum=0;for(int k=-radius;k<=radius;k++)if(x+k>=0&&x+k<S)sum+=a[y*S+x+k];b[y*S+x]=sum/(radius*2+1);}
            }
            for(int y=0;y<S;y++)for(int x=0;x<S;x++)
            {
                int radius=3;float sum=0;for(int k=-radius;k<=radius;k++)if(y+k>=0&&y+k<S)sum+=b[(y+k)*S+x];a[y*S+x]=sum/7;
            }
        }
        var colors=new Color32[S*S];for(int i=0;i<colors.Length;i++)colors[i]=new Color32(255,255,255,(byte)Mathf.Clamp(Mathf.RoundToInt(a[i]*255),0,255));
        if(p.shadowTex)Destroy(p.shadowTex);p.shadowTex=new Texture2D(S,S,TextureFormat.RGBA32,false);p.shadowTex.SetPixels32(colors);p.shadowTex.wrapMode=TextureWrapMode.Clamp;p.shadowTex.filterMode=FilterMode.Bilinear;p.shadowTex.Apply(false,true);
        if(p.shadowMaterial)p.shadowMaterial.mainTexture=p.shadowTex;
    }
    void MakeShadowMesh(Piece p)
    {
        if(p.shadowMesh)Destroy(p.shadowMesh);p.shadowMesh=new Mesh();p.shadowMesh.MarkDynamic();
        const int nx=4,ny=16;const float pad=.12f;int k=0;
        p.shadowBasis=new Vector3[(nx+1)*(ny+1)];p.shadowVertices=new Vector3[p.shadowBasis.Length];var uv=new Vector2[p.shadowBasis.Length];var tris=new int[nx*ny*6];
        for(int y=0;y<=ny;y++)for(int x=0;x<=nx;x++)
        {
            int i=y*(nx+1)+x;float u=(float)x/nx,v=(float)y/ny;
            p.shadowBasis[i]=new Vector3(((u*(1+2*pad)-pad)-p.data.px)*p.data.width,((v*(1+2*pad)-pad)-1+p.data.py)*p.data.height,0);uv[i]=new Vector2(u,v);
            if(x<nx&&y<ny){tris[k++]=i;tris[k++]=i+nx+1;tris[k++]=i+1;tris[k++]=i+nx+1;tris[k++]=i+nx+2;tris[k++]=i+1;}
        }
        Array.Copy(p.shadowBasis,p.shadowVertices,p.shadowBasis.Length);p.shadowMesh.vertices=p.shadowVertices;p.shadowMesh.uv=uv;p.shadowMesh.triangles=tris;p.shadowMesh.RecalculateBounds();var bounds=p.shadowMesh.bounds;bounds.Expand(20);p.shadowMesh.bounds=bounds;
        p.shadow.GetComponent<MeshFilter>().sharedMesh=p.shadowMesh;
    }
}
