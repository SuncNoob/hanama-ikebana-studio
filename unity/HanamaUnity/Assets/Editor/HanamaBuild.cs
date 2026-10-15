using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

public static class HanamaBuild
{
    public static void Prepare()
    {
        Directory.CreateDirectory("Assets/Resources");Directory.CreateDirectory("Assets/Scenes");
        if(!AssetDatabase.LoadAssetAtPath<Material>("Assets/Resources/HanamaSprite.mat")){var m=new Material(Shader.Find("Sprites/Default"));AssetDatabase.CreateAsset(m,"Assets/Resources/HanamaSprite.mat");}
        var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
        EditorSceneManager.SaveScene(scene,"Assets/Scenes/Atelier.unity");
        EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene("Assets/Scenes/Atelier.unity",true)};
        PlayerSettings.companyName="HANAMA";PlayerSettings.productName="Light & Flowers";
        PlayerSettings.WebGL.compressionFormat=WebGLCompressionFormat.Gzip;
        PlayerSettings.WebGL.decompressionFallback=true;
        PlayerSettings.WebGL.dataCaching=true;
        PlayerSettings.WebGL.initialMemorySize=64;PlayerSettings.WebGL.maximumMemorySize=512;
        PlayerSettings.WebGL.memoryGrowthMode=WebGLMemoryGrowthMode.Geometric;
        PlayerSettings.WebGL.exceptionSupport=WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;
        PlayerSettings.stripEngineCode=true;
        PlayerSettings.SetManagedStrippingLevel(NamedBuildTarget.WebGL,ManagedStrippingLevel.High);
        PlayerSettings.SetApiCompatibilityLevel(NamedBuildTarget.WebGL,ApiCompatibilityLevel.NET_Standard);
        PlayerSettings.SetIl2CppCodeGeneration(NamedBuildTarget.WebGL,Il2CppCodeGeneration.OptimizeSize);
        UnityEditor.WebGL.UserBuildSettings.codeOptimization=UnityEditor.WebGL.WasmCodeOptimization.DiskSizeLTO;
        QualitySettings.vSyncCount=0;QualitySettings.antiAliasing=0;
        AssetDatabase.SaveAssets();AssetDatabase.Refresh();Debug.Log("HANAMA prepared.");
    }
    public static void Build()
    {
        Prepare();string output=null;var args=Environment.GetCommandLineArgs();for(int i=0;i<args.Length-1;i++)if(args[i]=="-buildOutput")output=args[i+1];
        if(string.IsNullOrEmpty(output))throw new Exception("Missing -buildOutput");
        var result=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{"Assets/Scenes/Atelier.unity"},locationPathName=output,target=BuildTarget.WebGL,options=BuildOptions.None});
        Debug.Log("HANAMA_BUILD_RESULT "+result.summary.result+" bytes="+result.summary.totalSize);
        if(result.summary.result!=BuildResult.Succeeded)throw new Exception("WebGL build failed");
    }
}
