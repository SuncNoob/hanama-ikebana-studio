mergeInto(LibraryManager.library, {
  HanamaEvent: function (pointer) {
    var json = UTF8ToString(pointer);
    if (window.hanamaUnityEvent) window.hanamaUnityEvent(json);
  }
});
