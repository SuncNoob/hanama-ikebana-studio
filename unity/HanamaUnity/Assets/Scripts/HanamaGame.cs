using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

// The game owns rendering and gestures. The host owns the durable composition schema.
public sealed class HanamaGame : MonoBehaviour
{
    [Serializable] public class Node { public string id, texture, key; public float x,y,width,height,px,py,angle,h,minScale=.8f,maxScale=1.25f; public bool flip,interactive; public int order; }
    [Serializable] public class Frame { public Node[] nodes; public string selected,mode,light; public float mouthX,mouthY,brush=2; }
    [Serializable] public class Point { public float x,y; public Point(Vector2 p){x=p.x;y=p.y;} }
    [Serializable] public class GameEvent { public string type,id,mode; public float x,y,angle,scale=1; public Point[] points; }
    sealed class Piece { public Node data; public GameObject root; public Mesh mesh; public MeshRenderer renderer,shadow; public Material mat,shadowMaterial; public Texture2D tex; public string key; public float scale=1; }
    sealed class Mote { public Transform root; public SpriteRenderer sprite; public Vector2 velocity; public float life; }
    readonly Dictionary<string,Piece> pieces=new Dictionary<string,Piece>();
    readonly List<Mote> motes=new List<Mote>();
    readonly List<Vector2> cutPoints=new List<Vector2>();
    Camera cameraRig; Material baseMaterial; Sprite dot; Frame frame;
    Piece picked; Vector2 down,offset; float startAngle,startScale,turnStart,pinchDistance,pinchAngle; bool held,turning,scaling,pinching; string selected="",tool="move";
    LineRenderer ring,cutLine,snapRing; GameObject handle; int lastWidth,lastHeight; float idle;
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
        baseMaterial=Resources.Load<Material>("HanamaSprite"); if(!baseMaterial)baseMaterial=new Material(Shader.Find("Sprites/Default"));
        ring=MakeLine("Selection",new Color(.66f,.48f,.28f,.9f),.22f,1900);snapRing=MakeLine("Mouth",new Color(.75f,.78f,.47f,.95f),.3f,1890);cutLine=MakeLine("Scissors",new Color(.85f,.46f,.31f),.35f,1950);
        var tex=new Texture2D(24,24,TextureFormat.RGBA32,false);var pixels=new Color[576];for(int y=0;y<24;y++)for(int x=0;x<24;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(12,12));pixels[y*24+x]=new Color(1,1,1,Mathf.Clamp01(12-d));}tex.SetPixels(pixels);tex.Apply();dot=Sprite.Create(tex,new Rect(0,0,24,24),new Vector2(.5f,.5f),24);
        handle=new GameObject("RotationHandle");var hr=handle.AddComponent<SpriteRenderer>();hr.sprite=dot;hr.color=new Color(.71f,.42f,.27f);hr.sortingOrder=1910;handle.transform.localScale=Vector3.one*1.8f;handle.SetActive(false);
        for(int i=0;i<32;i++){var go=new GameObject("Petal");var sr=go.AddComponent<SpriteRenderer>();sr.sprite=dot;sr.sortingOrder=2000;go.SetActive(false);motes.Add(new Mote{root=go.transform,sprite=sr});}
        Emit(new GameEvent{type="ready"});
    }
    LineRenderer MakeLine(string name,Color color,float width,int order){var line=new GameObject(name).AddComponent<LineRenderer>();line.material=baseMaterial;line.startColor=line.endColor=color;line.startWidth=line.endWidth=width;line.sortingOrder=order;line.useWorldSpace=true;return line;}
    void Emit(GameEvent e){
#if UNITY_WEBGL && !UNITY_EDITOR
        HanamaEvent(JsonUtility.ToJson(e));
#endif
    }
    // Atomic updates: reuse textures and meshes; no allocation per drag frame.
    public void ReceiveFrame(string json)
    {
        try{var next=JsonUtility.FromJson<Frame>(json);if(next==null||next.nodes==null)return;frame=next;selected=next.selected??"";tool=next.mode??"move";
            var keep=new HashSet<string>();foreach(var node in next.nodes){if(string.IsNullOrEmpty(node.id))continue;keep.Add(node.id);if(!pieces.TryGetValue(node.id,out var p)){p=new Piece{root=new GameObject(node.id),mesh=new Mesh()};p.mat=new Material(baseMaterial);p.renderer=p.root.AddComponent<MeshRenderer>();p.renderer.sharedMaterial=p.mat;p.root.AddComponent<MeshFilter>().sharedMesh=p.mesh;pieces.Add(node.id,p);}
                p.data=node;p.scale=1;
                if(!string.IsNullOrEmpty(node.texture)&&p.key!=node.key){var comma=node.texture.IndexOf(',');if(comma>=0){var bytes=Convert.FromBase64String(node.texture.Substring(comma+1));var tex=new Texture2D(2,2,TextureFormat.RGBA32,false);if(ImageConversion.LoadImage(tex,bytes,false)){tex.filterMode=FilterMode.Bilinear;tex.wrapMode=TextureWrapMode.Clamp;if(p.tex)Destroy(p.tex);p.tex=tex;p.mat.mainTexture=tex;p.key=node.key;}else Destroy(tex);}}
                SetGeometry(p);p.renderer.sortingOrder=node.order;p.root.transform.position=new Vector3(node.x,100-node.y,0);p.root.transform.rotation=Quaternion.Euler(0,0,-node.angle);p.root.transform.localScale=new Vector3(node.flip?-1:1,1,1);
                if(node.interactive){if(!p.shadow){var sh=new GameObject("Soft stem shadow");sh.transform.SetParent(p.root.transform,false);sh.AddComponent<MeshFilter>().sharedMesh=p.mesh;p.shadow=sh.AddComponent<MeshRenderer>();p.shadowMaterial=new Material(baseMaterial);p.shadowMaterial.color=new Color(.18f,.23f,.16f,.12f);p.shadow.sharedMaterial=p.shadowMaterial;}p.shadowMaterial.mainTexture=p.tex;p.shadow.sortingOrder=node.order-1;p.shadow.transform.localPosition=new Vector3(.75f,-.7f,.1f);}
            }
            var remove=new List<string>();foreach(var kv in pieces)if(!keep.Contains(kv.Key))remove.Add(kv.Key);foreach(var id in remove){var p=pieces[id];Destroy(p.root);Destroy(p.mesh);Destroy(p.mat);if(p.shadowMaterial)Destroy(p.shadowMaterial);if(p.tex)Destroy(p.tex);pieces.Remove(id);}
            idle=0;DrawSelection();
        }catch(Exception e){Debug.LogWarning("Hanama frame rejected: "+e.Message);Emit(new GameEvent{type="error",mode="frame"});}
    }
    void SetGeometry(Piece p){var n=p.data;float l=-n.width*n.px,r=l+n.width,t=n.height*n.py,b=t-n.height;p.mesh.Clear();p.mesh.vertices=new[]{new Vector3(l,b,0),new Vector3(r,b,0),new Vector3(l,t,0),new Vector3(r,t,0)};p.mesh.uv=new[]{new Vector2(0,0),new Vector2(1,0),new Vector2(0,1),new Vector2(1,1)};p.mesh.triangles=new[]{0,2,1,2,3,1};p.mesh.RecalculateBounds();}
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
    Piece Pick(Vector2 at){Piece best=null;foreach(var p in pieces.Values){if(!p.data.interactive||!p.tex)continue;var v=p.root.transform.InverseTransformPoint(at);float u=v.x/p.data.width+p.data.px,w=v.y/p.data.height+1-p.data.py;if(u<0||u>1||w<0||w>1)continue;if(p.tex.GetPixelBilinear(u,w).a<.14f)continue;if(best==null||p.data.order>best.data.order)best=p;}return best;}
    void Update()
    {
        if(Screen.width!=lastWidth||Screen.height!=lastHeight){lastWidth=Screen.width;lastHeight=Screen.height;cameraRig.aspect=1;}
        foreach(var m in motes)if(m.life>0){m.life-=Time.unscaledDeltaTime;m.velocity+=Vector2.down*(Time.unscaledDeltaTime*8);m.root.position+=(Vector3)(m.velocity*Time.unscaledDeltaTime);var c=m.sprite.color;c.a=Mathf.Clamp01(m.life);m.sprite.color=c;if(m.life<=0)m.root.gameObject.SetActive(false);}
        if(frame==null)return;Vector2 screen=Pointer(),at=World(screen);bool inside=screen.x>=0&&screen.y>=0&&screen.x<=Screen.width&&screen.y<=Screen.height;
        if(Pressed()&&inside){idle=0;bool hitHandle=handle.activeSelf&&Vector2.Distance(at,handle.transform.position)<3;picked=hitHandle&&pieces.ContainsKey(selected)?pieces[selected]:Pick(at);if(picked==null&&tool!="move")pieces.TryGetValue(selected,out picked);if(picked==null){selected="";DrawSelection();Emit(new GameEvent{type="select",id=""});return;}selected=picked.data.id;down=at;offset=(Vector2)picked.root.transform.position-at;startAngle=picked.data.angle;startScale=picked.scale;turnStart=Mathf.Atan2(at.y-picked.root.transform.position.y,at.x-picked.root.transform.position.x)*Mathf.Rad2Deg;turning=hitHandle||Shift();scaling=false;held=true;cutPoints.Clear();if(tool!="move")cutPoints.Add(at);Emit(new GameEvent{type="begin",id=selected});DrawSelection();}
        if(held&&picked!=null){idle=0;if(TwoTouches(out var a,out var b)){float d=Vector2.Distance(a,b),angle=Mathf.Atan2(b.y-a.y,b.x-a.x)*Mathf.Rad2Deg;if(!pinching){pinching=true;pinchDistance=Mathf.Max(.1f,d);pinchAngle=angle;startScale=picked.scale;startAngle=-picked.root.transform.eulerAngles.z;}ApplyScale(picked,startScale*d/pinchDistance);SetAngle(picked,startAngle-Mathf.DeltaAngle(pinchAngle,angle));}
            else if(pinching){pinching=false;offset=(Vector2)picked.root.transform.position-at;}
            else if(IsHeld()){if(tool!="move"){if(cutPoints.Count<512&&(cutPoints.Count==0||Vector2.Distance(cutPoints[cutPoints.Count-1],at)>.35f))cutPoints.Add(at);cutLine.positionCount=cutPoints.Count;for(int i=0;i<cutPoints.Count;i++)cutLine.SetPosition(i,cutPoints[i]);}
                else if(turning){float angle=Mathf.Atan2(at.y-picked.root.transform.position.y,at.x-picked.root.transform.position.x)*Mathf.Rad2Deg;SetAngle(picked,startAngle-Mathf.DeltaAngle(turnStart,angle));}
                else{var pos=at+offset;picked.root.transform.position=new Vector3(Mathf.Clamp(pos.x,5,95),Mathf.Clamp(pos.y,5,85),0);bool near=Vector2.Distance(picked.root.transform.position,new Vector2(frame.mouthX,100-frame.mouthY))<6;DrawCircle(snapRing,new Vector2(frame.mouthX,100-frame.mouthY),near?3:0);}}
            if(!IsHeld()){held=false;pinching=false;if(tool!="move"){var points=new Point[cutPoints.Count];for(int i=0;i<points.Length;i++)points[i]=new Point(new Vector2(cutPoints[i].x,100-cutPoints[i].y));Emit(new GameEvent{type="cut",id=selected,mode=tool,points=points});cutLine.positionCount=0;Burst(at,10);}
                else{var pos=(Vector2)picked.root.transform.position;var mouth=new Vector2(frame.mouthX,100-frame.mouthY);if(!turning&&Vector2.Distance(pos,mouth)<6){pos=mouth;picked.root.transform.position=pos;Burst(pos,12);}EmitTransform(picked);Burst(pos,5);}snapRing.positionCount=0;picked=null;}}
        float scroll=inside?Scroll():0;if(!held&&Mathf.Abs(scroll)>.01f&&pieces.TryGetValue(selected,out var active)){Emit(new GameEvent{type="begin",id=selected});if(Shift())ApplyScale(active,active.scale*(1+scroll*.03f));else SetAngle(active,-active.root.transform.eulerAngles.z+scroll*3);EmitTransform(active);idle=0;}
        DrawSelection();idle+=Time.unscaledDeltaTime;
    }
    void SetAngle(Piece p,float angle){p.root.transform.rotation=Quaternion.Euler(0,0,-angle);}
    void ApplyScale(Piece p,float scale){p.scale=Mathf.Clamp(scale,p.data.minScale,p.data.maxScale);p.root.transform.localScale=new Vector3((p.data.flip?-1:1)*p.scale,p.scale,1);}
    void EmitTransform(Piece p){Emit(new GameEvent{type="commit",id=p.data.id,x=p.root.transform.position.x,y=100-p.root.transform.position.y,angle=Mathf.DeltaAngle(0,-p.root.transform.eulerAngles.z),scale=p.scale});}
    void DrawCircle(LineRenderer line,Vector2 center,float radius){if(radius<=0){line.positionCount=0;return;}line.positionCount=49;for(int i=0;i<49;i++){float a=i*Mathf.PI/24;line.SetPosition(i,center+new Vector2(Mathf.Cos(a),Mathf.Sin(a))*radius);}}
    void DrawSelection(){if(!pieces.TryGetValue(selected,out var p)||tool!="move"){ring.positionCount=0;handle.SetActive(false);return;}float radius=Mathf.Clamp(Mathf.Min(p.data.width,p.data.height)*.42f,4,11)*p.scale;Vector2 center=p.root.transform.TransformPoint(new Vector3(p.data.width*(.5f-p.data.px),p.data.height*(p.data.py-.5f),0));DrawCircle(ring,center,radius);handle.transform.position=center+new Vector2(radius*.707f,radius*.707f);handle.SetActive(true);}
    void Burst(Vector2 at,int count){foreach(var m in motes){if(count<=0)break;if(m.life>0)continue;count--;m.life=UnityEngine.Random.Range(.4f,.85f);m.root.position=at;m.root.localScale=Vector3.one*UnityEngine.Random.Range(.35f,.8f);m.velocity=UnityEngine.Random.insideUnitCircle*9+Vector2.up*4;m.sprite.color=new Color(.85f,.72f,.46f,.9f);m.root.gameObject.SetActive(true);}}
    void OnApplicationFocus(bool focus){if(!focus&&held){held=false;pinching=false;picked=null;cutLine.positionCount=0;Emit(new GameEvent{type="cancel"});}}
}
