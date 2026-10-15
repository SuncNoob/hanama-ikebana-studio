using UnityEditor;
using UnityEditor.PackageManager;
using UnityEditor.PackageManager.Requests;
using UnityEngine;
public static class PackageRecovery
{
 static SearchRequest search;static AddAndRemoveRequest change;static double deadline;
 public static void Install(){deadline=EditorApplication.timeSinceStartup+600;search=Client.Search("com.unity.inputsystem");EditorApplication.update+=Poll;}
 static void Poll(){
  if(EditorApplication.timeSinceStartup>deadline){Debug.LogError("Package recovery timed out");EditorApplication.Exit(2);return;}
  if(search!=null&&search.IsCompleted){if(search.Status!=StatusCode.Success||search.Result.Length==0){Debug.LogError(search.Error?.message);EditorApplication.Exit(1);return;}string version=search.Result[0].versions.latestCompatible;Debug.Log("Updating Input System to "+version+" and removing unused collab proxy");search=null;change=Client.AddAndRemove(new[]{"com.unity.inputsystem@"+version},new[]{"com.unity.collab-proxy"});}
  if(change!=null&&change.IsCompleted){EditorApplication.update-=Poll;Debug.Log("PACKAGE_RECOVERY "+change.Status+" "+change.Error?.message);EditorApplication.Exit(change.Status==StatusCode.Success?0:1);}
 }
}
