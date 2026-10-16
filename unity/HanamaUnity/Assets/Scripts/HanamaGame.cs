using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;
using UnityEngine.Rendering;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

// The game owns rendering and gestures. The host owns the durable composition schema.
public sealed partial class HanamaGame : MonoBehaviour
{
    [Serializable] public class Node { public string id, texture, key, name; public float x,y,width,height,px,py,angle,h,minScale=.8f,maxScale=1.25f; public bool flip,interactive,seated; public float extent,flexibility=.6f; public float[] flex; public int order; }
    [Serializable] public class Frame { public Node[] nodes; public string selected,mode,light; public float mouthX,mouthY,brush=2; }
    [Serializable] public class Point { public float x,y; public Point(Vector2 p){x=p.x;y=p.y;} }
    [Serializable] public class GameEvent { public string type,id,mode,image; public bool snapped; public float x,y,angle,scale=1; public Point[] points; public float[] flex; }
    sealed class Piece { public Node data; public GameObject root; public Mesh mesh; public MeshRenderer renderer,shadow; public Material mat,shadowMaterial; public Texture2D tex; public string key; public float scale=1,bend,velocity,phase; public Vector3[] basis,vertices; public Vector2 previous; public float width,height,px,py,lastBend=float.NaN; public StemChain chain; public Mesh shadowMesh; public Texture2D shadowTex; public Vector3[] shadowBasis,shadowVertices; }
    sealed class Mote { public Transform root; public SpriteRenderer sprite; public Vector2 velocity; public float life; }
    readonly Dictionary<string,Piece> pieces=new Dictionary<string,Piece>();
    readonly List<Mote> motes=new List<Mote>();
    readonly List<Vector2> cutPoints=new List<Vector2>();
    Camera cameraRig; Material baseMaterial; Shader botanical; Sprite dot; Frame frame;
    Piece picked; Vector2 down,offset; float startAngle,startScale,turnStart,pinchDistance,pinchAngle; bool held,started,turning,scaling,pinching,nearMouth,capturing; float scaleDistance,previewAt; string hovered=""; string selected="",tool="move";
    LineRenderer ring,cutLine,snapRing,anchorLine,brushRing; GameObject handle,scaleHandle,rootHandle; int lastWidth,lastHeight; float idle;
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")] static extern void HanamaEvent(string json);
#endif
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)] static void Boot(){ new GameObject("HanamaGame").AddComponent<HanamaGame>(); }
    void Start()
    {
        Application.targetFrameRate=-1; QualitySettings.vSyncCount=0;
#if UNITY_WEBGL && !UNITY_EDITOR
        WebGLInput.captureAllKeyboardInput=false;
#endif
        cameraRig=Camera.main; if(!cameraRig)cameraRig=new GameObject("AtelierCamera").AddComponent<Camera>();
        cameraRig.orthographic=true;cameraRig.orthographicSize=50;cameraRig.transform.position=new Vector3(50,50,-100);cameraRig.clearFlags=CameraClearFlags.SolidColor;cameraRig.backgroundColor=new Color(.93f,.93f,.9f);
        botanical=Resources.Load<Shader>("Botanical");baseMaterial=Resources.Load<Material>("HanamaSprite"); if(!baseMaterial)baseMaterial=new Material(Shader.Find("Sprites/Default"));
        ring=MakeLine("Selection",new Color(.66f,.48f,.28f,.9f),.22f,1900);snapRing=MakeLine("Mouth",new Color(.75f,.78f,.47f,.95f),.3f,1890);cutLine=MakeLine("Scissors",new Color(.85f,.46f,.31f),.35f,1950);
        anchorLine=MakeLine("Stem anchor",new Color(.65f,.55f,.35f,.4f),.12f,1890);brushRing=MakeLine("Brush cursor",new Color(.98f,.95f,.82f,.9f),.19f,1950);
        var tex=new Texture2D(24,24,TextureFormat.RGBA32,false);var pixels=new Color[576];for(int y=0;y<24;y++)for(int x=0;x<24;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(12,12));pixels[y*24+x]=new Color(1,1,1,Mathf.Clamp01(12-d));}tex.SetPixels(pixels);tex.Apply();dot=Sprite.Create(tex,new Rect(0,0,24,24),new Vector2(.5f,.5f),24);
        handle=new GameObject("RotationHandle");var hr=handle.AddComponent<SpriteRenderer>();hr.sprite=dot;hr.color=new Color(.71f,.42f,.27f);hr.sortingOrder=1910;handle.transform.localScale=Vector3.one*1.8f;handle.SetActive(false);
        scaleHandle=MakeHandle("Scale",new Color(.31f,.49f,.40f),1.8f);rootHandle=MakeHandle("Stem base",new Color(.91f,.86f,.69f),1.1f);
        for(int i=0;i<28;i++){var go=new GameObject("Petal");var sr=go.AddComponent<SpriteRenderer>();sr.sprite=dot;sr.sortingOrder=2000;go.SetActive(false);motes.Add(new Mote{root=go.transform,sprite=sr});}
        Emit(new GameEvent{type="ready"});
    }
    GameObject MakeHandle(string name,Color color,float size)
    {
        var go=new GameObject(name);var sr=go.AddComponent<SpriteRenderer>();sr.sprite=dot;sr.color=color;sr.sortingOrder=1910;
        go.transform.localScale=Vector3.one*size;go.SetActive(false);return go;
    }
    LineRenderer MakeLine(string name,Color color,float width,int order){var line=new GameObject(name).AddComponent<LineRenderer>();line.sharedMaterial=baseMaterial;line.startColor=line.endColor=color;line.startWidth=line.endWidth=width;line.sortingOrder=order;line.useWorldSpace=true;line.numCapVertices=4;return line;}
    void Emit(GameEvent e){
#if UNITY_WEBGL && !UNITY_EDITOR
        HanamaEvent(JsonUtility.ToJson(e));
#endif
    }
    // Atomic updates: reuse textures and meshes; no allocation per drag frame.
    public void ReceiveFrame(string json)
    {
        try{var next=JsonUtility.FromJson<Frame>(json);if(next==null||next.nodes==null)return;frame=next;selected=next.selected??"";tool=next.mode??"move";
            var keep=new HashSet<string>();foreach(var node in next.nodes){if(string.IsNullOrEmpty(node.id))continue;keep.Add(node.id);if(!pieces.TryGetValue(node.id,out var p)){p=new Piece{root=new GameObject(node.id),mesh=new Mesh()};p.mesh.MarkDynamic();p.phase=pieces.Count*2.4f;p.mat=node.interactive?new Material(botanical):new Material(baseMaterial);p.renderer=p.root.AddComponent<MeshRenderer>();p.renderer.sharedMaterial=p.mat;p.root.AddComponent<MeshFilter>().sharedMesh=p.mesh;pieces.Add(node.id,p);}
                p.data=node;p.scale=1;
                if(!string.IsNullOrEmpty(node.texture)&&p.key!=node.key){var comma=node.texture.IndexOf(',');if(comma>=0){var bytes=Convert.FromBase64String(node.texture.Substring(comma+1));var tex=new Texture2D(2,2,TextureFormat.RGBA32,false);if(ImageConversion.LoadImage(tex,bytes,false)){tex.filterMode=FilterMode.Bilinear;tex.wrapMode=TextureWrapMode.Clamp;if(p.tex)Destroy(p.tex);p.tex=tex;p.mat.mainTexture=tex;p.key=node.key;if(p.shadowTex){Destroy(p.shadowTex);p.shadowTex=null;}}else Destroy(tex);}}
                SetGeometry(p);p.renderer.sortingOrder=node.order;p.root.transform.position=new Vector3(node.x,100-node.y,0);p.root.transform.rotation=Quaternion.Euler(0,0,-node.angle);p.root.transform.localScale=new Vector3(node.flip?-1:1,1,1);p.previous=p.root.transform.position;
                if(node.interactive){if(!p.shadow){var sh=new GameObject("Soft stem shadow");sh.AddComponent<MeshFilter>().sharedMesh=p.mesh;p.shadow=sh.AddComponent<MeshRenderer>();p.shadowMaterial=new Material(botanical);p.shadowMaterial.SetFloat("_Shadow",1);p.shadow.sharedMaterial=p.shadowMaterial;}p.shadow.sortingOrder=10+Mathf.Clamp(node.order%100,0,60);if(!p.shadowMesh)MakeShadowMesh(p);SyncOrganic(p);p.shadowMaterial.mainTexture=p.shadowTex;}
            }
            var remove=new List<string>();foreach(var kv in pieces)if(!keep.Contains(kv.Key))remove.Add(kv.Key);foreach(var id in remove){var p=pieces[id];Destroy(p.root);Destroy(p.mesh);Destroy(p.mat);if(p.shadow)Destroy(p.shadow.gameObject);if(p.shadowMaterial)Destroy(p.shadowMaterial);if(p.tex)Destroy(p.tex);if(p.shadowTex)Destroy(p.shadowTex);if(p.shadowMesh)Destroy(p.shadowMesh);pieces.Remove(id);}
            idle=0;DrawSelection();
        }catch(Exception e){Debug.LogWarning("Hanama frame rejected: "+e.Message);Emit(new GameEvent{type="error",mode="frame"});}
    }
    void SetGeometry(Piece p)
    {
        var n=p.data;
        if(p.basis!=null&&p.width==n.width&&p.height==n.height&&p.px==n.px&&p.py==n.py)return;
        p.width=n.width;p.height=n.height;p.px=n.px;p.py=n.py;p.lastBend=float.NaN;
        int nx=n.interactive?4:1,ny=n.interactive?16:1,k=0;
        p.basis=new Vector3[(nx+1)*(ny+1)];p.vertices=new Vector3[p.basis.Length];
        var uv=new Vector2[p.basis.Length];var tris=new int[nx*ny*6];
        for(int y=0;y<=ny;y++)for(int x=0;x<=nx;x++)
        {
            int i=y*(nx+1)+x;float u=(float)x/nx,v=(float)y/ny;
            p.basis[i]=new Vector3((u-n.px)*n.width,(v-1+n.py)*n.height,0);uv[i]=new Vector2(u,v);
            if(x<nx&&y<ny){tris[k++]=i;tris[k++]=i+nx+1;tris[k++]=i+1;tris[k++]=i+nx+1;tris[k++]=i+nx+2;tris[k++]=i+1;}
        }
        Array.Copy(p.basis,p.vertices,p.basis.Length);p.mesh.Clear();p.mesh.vertices=p.vertices;p.mesh.uv=uv;p.mesh.triangles=tris;
        p.mesh.RecalculateBounds();var bounds=p.mesh.bounds;bounds.Expand(8);p.mesh.bounds=bounds;if(n.interactive&&p.shadow)MakeShadowMesh(p);
    }
    Vector2 World(Vector2 p){var v=cameraRig.ScreenToWorldPoint(new Vector3(p.x,p.y,0));return new Vector2(v.x,v.y);}
    Vector2 Pointer(){
#if ENABLE_INPUT_SYSTEM
        if(Touchscreen.current!=null&&Touchscreen.current.primaryTouch.press.isPressed)return Touchscreen.current.primaryTouch.position.ReadValue();return Mouse.current!=null?Mouse.current.position.ReadValue():Vector2.zero;
#else
        return Input.touchCount>0?Input.GetTouch(0).position:(Vector2)Input.mousePosition;
#endif
    }
    bool Pressed(){
#if ENABLE_INPUT_SYSTEM
        return (Mouse.current!=null&&Mouse.current.leftButton.wasPressedThisFrame)||(Touchscreen.current!=null&&Touchscreen.current.primaryTouch.press.wasPressedThisFrame);
#else
        return Input.GetMouseButtonDown(0)||(Input.touchCount>0&&Input.GetTouch(0).phase==TouchPhase.Began);
#endif
    }
    bool IsHeld(){
#if ENABLE_INPUT_SYSTEM
        return (Mouse.current!=null&&Mouse.current.leftButton.isPressed)||(Touchscreen.current!=null&&Touchscreen.current.primaryTouch.press.isPressed);
#else
        return Input.GetMouseButton(0)||Input.touchCount>0;
#endif
    }
    bool Shift(){
#if ENABLE_INPUT_SYSTEM
        return Keyboard.current!=null&&(Keyboard.current.leftShiftKey.isPressed||Keyboard.current.rightShiftKey.isPressed);
#else
        return Input.GetKey(KeyCode.LeftShift)||Input.GetKey(KeyCode.RightShift);
#endif
    }
    float Scroll(){
#if ENABLE_INPUT_SYSTEM
        return Mouse.current!=null?Mouse.current.scroll.ReadValue().y/120:0;
#else
        return Input.mouseScrollDelta.y;
#endif
    }
    bool TwoTouches(out Vector2 a,out Vector2 b){a=b=Vector2.zero;
#if ENABLE_INPUT_SYSTEM
        var screen=Touchscreen.current;if(screen==null)return false;int count=0;foreach(var t in screen.touches)if(t.press.isPressed){if(count++==0)a=World(t.position.ReadValue());else{b=World(t.position.ReadValue());return true;}}return false;
#else
        if(Input.touchCount<2)return false;a=World(Input.GetTouch(0).position);b=World(Input.GetTouch(1).position);return true;
#endif
    }
    Piece Pick(Vector2 at){Piece best=null;foreach(var p in pieces.Values){if(!p.data.interactive||!p.tex)continue;var v=UnbendLocal(p,p.root.transform.InverseTransformPoint(at));float u=v.x/p.data.width+p.data.px,w=v.y/p.data.height+1-p.data.py;if(u<0||u>1||w<0||w>1)continue;if(p.tex.GetPixelBilinear(u,w).a<.14f)continue;if(best==null||p.data.order>best.data.order)best=p;}return best;}
    void BeginEdit(){if(started)return;started=true;Emit(new GameEvent{type="begin",id=selected});}
    static float Angle(Vector2 p){return Mathf.Atan2(p.y,p.x)*Mathf.Rad2Deg;}
    void Move(Piece p,Vector2 pos){p.root.transform.position=new Vector3(Mathf.Clamp(pos.x,5,95),Mathf.Clamp(pos.y,5,85),0);}
    bool Alt(){return Keyboard.current!=null&&(Keyboard.current.leftAltKey.isPressed||Keyboard.current.rightAltKey.isPressed);}
    void Update()
    {
        if(Screen.width!=lastWidth||Screen.height!=lastHeight){lastWidth=Screen.width;lastHeight=Screen.height;cameraRig.aspect=1;}
        float dt=Mathf.Min(Time.unscaledDeltaTime,.033f);Animate(dt);
        if(frame==null||settings.paused){OnDemandRendering.renderFrameInterval=12;return;}
        Vector2 screen=Pointer(),at=World(screen);bool inside=screen.x>=0&&screen.y>=0&&screen.x<=Screen.width&&screen.y<=Screen.height;
        if(settings.photo){HideSelection();OnDemandRendering.renderFrameInterval=(!settings.motion||settings.reducedMotion)?4:1;return;}
        if(Keyboard.current!=null&&Keyboard.current.escapeKey.wasPressedThisFrame){CancelGesture("");return;}
        if(Pressed()&&inside)
        {
            idle=0;bool hitTurn=handle.activeSelf&&Vector2.Distance(at,handle.transform.position)<2.5f;
            bool hitScale=scaleHandle.activeSelf&&Vector2.Distance(at,scaleHandle.transform.position)<2.5f;
            bool hitRoot=rootHandle.activeSelf&&Vector2.Distance(at,rootHandle.transform.position)<2.4f;
            picked=(hitTurn||hitScale||hitRoot)&&pieces.ContainsKey(selected)?pieces[selected]:Pick(at);
            if(picked==null&&tool!="move")pieces.TryGetValue(selected,out picked);
            if(picked==null){selected="";DrawSelection();Emit(new GameEvent{type="select",id=""});return;}
            RestOrganic(picked);selected=picked.data.id;down=at;offset=(Vector2)picked.root.transform.position-at;startAngle=picked.data.angle;startScale=picked.scale;
            turnStart=Angle(at-(Vector2)picked.root.transform.position);scaleDistance=Mathf.Max(2,Vector2.Distance(at,picked.root.transform.position));
            turning=tool=="move"&&(hitTurn||(!hitRoot&&(settings.tool=="rotate"||Shift())));
            scaling=tool=="move"&&(hitScale||(!hitRoot&&settings.tool=="scale"));
            var flat=UnbendLocal(picked,picked.root.transform.InverseTransformPoint(at));
            bending=tool=="move"&&!turning&&!scaling&&!hitRoot&&picked.chain!=null&&flat.y>picked.chain.extent*.16f;
            if(bending)BeginBend(picked,at);held=true;started=false;pinching=false;cutPoints.Clear();
            if(tool!="move")cutPoints.Add(at);Emit(new GameEvent{type="select",id=selected});DrawSelection();
        }
        if(held&&picked!=null)
        {
            idle=0;
            if(TwoTouches(out var a,out var b)&&tool=="move")
            {
                BeginEdit();bending=false;float d=Vector2.Distance(a,b),angle=Angle(b-a);
                if(!pinching){pinching=true;pinchDistance=Mathf.Max(.1f,d);pinchAngle=angle;startScale=picked.scale;startAngle=-picked.root.transform.eulerAngles.z;offset=(Vector2)picked.root.transform.position-(a+b)*.5f;}
                ApplyScale(picked,startScale*d/pinchDistance);SetAngle(picked,startAngle-Mathf.DeltaAngle(pinchAngle,angle));Move(picked,(a+b)*.5f+offset);
            }
            else if(pinching){pinching=false;offset=(Vector2)picked.root.transform.position-at;turnStart=Angle(at-(Vector2)picked.root.transform.position);startAngle=-picked.root.transform.eulerAngles.z;startScale=picked.scale;}
            else if(IsHeld())
            {
                if(Vector2.Distance(down,at)>.25f)BeginEdit();
                if(started)
                {
                    if(tool!="move")
                    {
                        if(cutPoints.Count<512&&Vector2.Distance(cutPoints[cutPoints.Count-1],at)>.22f)cutPoints.Add(at);
                        cutLine.positionCount=cutPoints.Count;for(int i=0;i<cutPoints.Count;i++)cutLine.SetPosition(i,cutPoints[i]);
                    }
                    else if(scaling)ApplyScale(picked,startScale*Vector2.Distance(at,picked.root.transform.position)/scaleDistance);
                    else if(turning)SetAngle(picked,startAngle-Mathf.DeltaAngle(turnStart,Angle(at-(Vector2)picked.root.transform.position)));
                    else if(bending)SolveBend(picked,at);
                    else
                    {
                        Move(picked,at+offset);var mouth=new Vector2(frame.mouthX,100-frame.mouthY);bool near=Vector2.Distance(picked.root.transform.position,mouth)<5;
                        if(near&&!nearMouth)Emit(new GameEvent{type="magnet",id=selected});nearMouth=near;DrawCircle(snapRing,mouth,near?2.4f:1.1f);
                    }
                }
            }
            if(started&&Time.unscaledTime-previewAt>.05f){previewAt=Time.unscaledTime;EmitTransform(picked,"preview");}
            if(!IsHeld())Finish(at);
        }
        float scroll=inside?Scroll():0;
        if(!held&&(Shift()||Alt())&&Mathf.Abs(scroll)>.01f&&pieces.TryGetValue(selected,out var active))
        {
            Emit(new GameEvent{type="begin",id=selected});if(Alt())ApplyScale(active,active.scale*(1+scroll*.03f));else SetAngle(active,-active.root.transform.eulerAngles.z+scroll*3);EmitTransform(active,"commit");idle=0;
        }
        if(!held&&inside&&Time.unscaledTime-previewAt>.09f)
        {
            previewAt=Time.unscaledTime;var hit=Pick(at);string id=hit?.data.id??"";
            if(hovered!=id){hovered=id;Emit(new GameEvent{type="hover",id=id});}
        }
        DrawCircle(brushRing,at,inside&&tool=="brush"?frame.brush:0);DrawSelection();idle+=dt;
        OnDemandRendering.renderFrameInterval=(!settings.motion||settings.reducedMotion)&&idle>2?4:1;
    }
    void Finish(Vector2 at)
    {
        held=false;pinching=false;
        if(started)
        {
            if(tool!="move")
            {
                var points=new Point[cutPoints.Count];for(int i=0;i<points.Length;i++)points[i]=new Point(new Vector2(cutPoints[i].x,100-cutPoints[i].y));
                Emit(new GameEvent{type="cut",id=selected,mode=tool,points=points});Burst(at,8);
            }
            else
            {
                var mouth=new Vector2(frame.mouthX,100-frame.mouthY);bool snap=!turning&&!scaling&&!bending&&Vector2.Distance(picked.root.transform.position,mouth)<5;
                if(snap){picked.root.transform.position=mouth;Burst(mouth,4);}EmitTransform(picked,"commit",snap);
            }
        }
        cutLine.positionCount=snapRing.positionCount=0;nearMouth=false;started=false;bending=false;picked=null;
    }
    public void CancelGesture(string unused)
    {
        if(held&&picked!=null)
        {
            var n=picked.data;picked.root.transform.SetPositionAndRotation(new Vector3(n.x,100-n.y,0),Quaternion.Euler(0,0,-n.angle));ApplyScale(picked,1);SyncOrganic(picked);if(picked.chain!=null){Array.Copy(picked.chain.rest,picked.chain.angles,Bones);Forward(picked.chain,picked.chain.angles,picked.chain.joints);UpdateOrganicMesh(picked);}
            bool wasStarted=started;held=started=pinching=false;picked=null;if(wasStarted)Emit(new GameEvent{type="cancel"});
        }
        cutLine.positionCount=snapRing.positionCount=0;nearMouth=false;bending=false;
    }
    void SetAngle(Piece p,float angle){p.root.transform.rotation=Quaternion.Euler(0,0,-angle);}
    void ApplyScale(Piece p,float scale){p.scale=Mathf.Clamp(scale,p.data.minScale,p.data.maxScale);p.root.transform.localScale=new Vector3((p.data.flip?-1:1)*p.scale,p.scale,1);}
    void EmitTransform(Piece p,string type="commit",bool snapped=false){Emit(new GameEvent{type=type,snapped=snapped,id=p.data.id,x=p.root.transform.position.x,y=100-p.root.transform.position.y,angle=Mathf.DeltaAngle(0,-p.root.transform.eulerAngles.z),scale=p.scale,flex=p.chain?.rest});}
    void DrawCircle(LineRenderer line,Vector2 center,float radius){if(radius<=0){line.positionCount=0;return;}line.positionCount=49;for(int i=0;i<49;i++){float a=i*Mathf.PI/24;line.SetPosition(i,center+new Vector2(Mathf.Cos(a),Mathf.Sin(a))*radius);}}
    void HideSelection(){ring.positionCount=anchorLine.positionCount=brushRing.positionCount=0;handle.SetActive(false);scaleHandle.SetActive(false);rootHandle.SetActive(false);}
    void DrawSelection()
    {
        if(!handle)return;
        if(capturing||settings.photo||!pieces.TryGetValue(selected,out var p)||tool!="move"){HideSelection();return;}
        float radius=Mathf.Clamp(Mathf.Min(p.data.width,p.data.height)*.43f,4,11)*p.scale;
        Vector2 center=p.root.transform.TransformPoint(BendLocal(p,new Vector2(p.data.width*(.5f-p.data.px),p.data.height*(p.data.py-.5f))));
        center=new Vector2(Mathf.Clamp(center.x,5,95),Mathf.Clamp(center.y,6,94));ring.positionCount=0;
        handle.transform.position=center+new Vector2(radius*.707f,radius*.707f);scaleHandle.transform.position=center+new Vector2(radius*.707f,-radius*.707f);rootHandle.transform.position=p.root.transform.position;
        handle.SetActive(true);scaleHandle.SetActive(true);rootHandle.SetActive(true);anchorLine.positionCount=0;
    }
    void Burst(Vector2 at,int count)
    {
        if(settings.reducedMotion||!settings.motion)return;
        foreach(var m in motes)
        {
            if(count<=0)break;if(m.life>0)continue;count--;m.life=UnityEngine.Random.Range(.35f,.8f);m.root.position=at;
            float s=UnityEngine.Random.Range(.25f,.65f);m.root.localScale=new Vector3(s,s*.6f,1);m.velocity=UnityEngine.Random.insideUnitCircle*5+Vector2.up*3;
            m.sprite.color=new Color(.84f,.73f,.48f,.7f);m.root.gameObject.SetActive(true);
        }
    }
    [Serializable] public class Presentation
    {
        public bool motion=true,photo,paused,reducedMotion;public float power=.35f,direction=125;public string tool="move";
    }
    Presentation settings=new Presentation();Color lightColor=Color.white;Vector2 lightVector;float lightPower;
    GameEvent pendingCapture;
    public void SetPresentation(string json)
    {
        settings=JsonUtility.FromJson<Presentation>(json)??new Presentation();settings.power=Mathf.Clamp01(settings.power);idle=0;
        if(settings.paused)CancelGesture("");
        if(settings.paused||settings.reducedMotion||!settings.motion)foreach(var p in pieces.Values)RestOrganic(p);
        DrawSelection();
    }
    void Animate(float dt){AnimateOrganic(dt);}
    public void Capture(string unused)
    {
        if(held||capturing){Emit(new GameEvent{type="capture-error"});return;}
        var target=RenderTexture.GetTemporary(1600,1600,24,RenderTextureFormat.ARGB32);var previous=RenderTexture.active;Texture2D tex=null;capturing=true;
        try
        {
            HideSelection();cutLine.enabled=snapRing.enabled=false;
            foreach(var p in pieces.Values)if(p.data.interactive)p.mat.SetFloat("_Selected",0);foreach(var m in motes)m.sprite.enabled=false;
            cameraRig.targetTexture=target;cameraRig.Render();RenderTexture.active=target;
            tex=new Texture2D(1600,1600,TextureFormat.RGB24,false);tex.ReadPixels(new Rect(0,0,1600,1600),0,0);tex.Apply();
            pendingCapture=new GameEvent{type="capture",image=Convert.ToBase64String(tex.EncodeToPNG())};
        }
        catch(Exception e){Debug.LogWarning(e.Message);pendingCapture=new GameEvent{type="capture-error"};}
        finally
        {
            cameraRig.targetTexture=null;RenderTexture.active=previous;RenderTexture.ReleaseTemporary(target);if(tex)Destroy(tex);
            capturing=false;cutLine.enabled=snapRing.enabled=true;foreach(var m in motes)m.sprite.enabled=true;DrawSelection();
        }
    }
    void LateUpdate(){if(pendingCapture!=null){var result=pendingCapture;pendingCapture=null;Emit(result);}}
    void OnApplicationFocus(bool focused){if(!focused)CancelGesture("");}
}
