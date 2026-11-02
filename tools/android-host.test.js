"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../app/src/main/java/com/yasin/yatirimapp/MainActivity.java"),"utf8");
assert.match(source,/import android\.webkit\.WebChromeClient;/);
assert.match(source,/web\\.setWebChromeClient\\(new WebChromeClient\\(\\) \\{/,
 "Android WebView must provide a ChromeClient for dialogs and file picking");
assert.match(source,/onShowFileChooser\\(WebView view, ValueCallback<Uri\\[\\]> callback, FileChooserParams params\\)/);
assert.match(source,/Intent\\.ACTION_OPEN_DOCUMENT/);
assert.match(source,/void onActivityResult\\(int requestCode, int resultCode, Intent data\\)/);
assert.match(source,/callback\\.onReceiveValue\\(picked == null \\? null : new Uri\\[\\]\\{picked\\}\\)/);
assert.match(source,/s\.setJavaScriptEnabled\(true\)/);
assert.match(source,/web\.addJavascriptInterface\(new Bridge\(\), "YatirimApp"\)/);
assert.match(source,/getPackageName\(\)\.endsWith\("\.preview"\)/);
console.log("Android WebView host wiring tests passed");
