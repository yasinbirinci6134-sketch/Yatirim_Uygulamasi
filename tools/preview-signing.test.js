"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const gradle=fs.readFileSync(path.join(__dirname,"../app/build.gradle"),"utf8");
const workflow=fs.readFileSync(path.join(__dirname,"../.github/workflows/v2-preview.yml"),"utf8");
const manifest=fs.readFileSync(path.join(__dirname,"../app/src/main/AndroidManifest.xml"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"../ui/index.html"),"utf8");
const host=fs.readFileSync(path.join(__dirname,"../app/src/main/java/com/yasin/yatirimapp/MainActivity.java"),"utf8");
assert.ok(gradle.includes("preview {")&&gradle.includes("initWith release"),"preview must inherit release signing");
assert.ok(gradle.includes("applicationIdSuffix '.preview2'"),"old temporary debug preview must coexist for data transfer");
assert.ok(gradle.includes("signingConfig signingConfigs.release"),"release signing config must not use ephemeral debug signing");
assert.ok(gradle.includes('versionCode run'),"APK version must rise with GitHub workflow run");
assert.ok(manifest.includes('android:label="\${appDisplayName}"'),"2.0 launcher must be distinguishable");
assert.ok(gradle.includes("appDisplayName: 'Fon Pusulası 2.0'"),"preview2 icon needs its own label");
assert.match(host,/getPackageName\(\)\.startsWith\("com\.yasin\.yatirimapp\.preview"\)/,
 "preview2 must still pin UI updates to successful preview commits");
assert.ok(workflow.includes("secrets.KEYSTORE_B64")&&workflow.includes("secrets.KEYSTORE_PASSWORD"),"permanent key must come from encrypted repository secrets");
assert.ok(workflow.includes("gradle assemblePreview --no-daemon"),"workflow must build the signed preview type");
assert.ok(!workflow.includes("gradle assembleDebug --no-daemon"),"do not publish new CI debug signatures");
assert.ok(workflow.includes("apksigner")&&workflow.includes("certificate SHA-256 digest:"),"check actual APK signing identity");
assert.ok(workflow.includes('10#$new_code > 10#$old_code'),"compare APK versionCodes before overwriting existing preview2 release");
assert.ok(workflow.includes('test "$old_cert" = "$new_cert"'),"refuse cert regression");
assert.ok(html.includes("...(S.cashflows||[])")&&html.includes("...(S.journal||[])"),
 "cross-signature migration backup must include cashflows and investment journal");
assert.ok(html.includes('watch:{s:S.watch,f:S.fwatch,x:S.fxwatch},theme:{...TH},layout:{...LAY},autoq:[...AUTOQ]'),
 "local preferences must remain exportable for first migration");
assert.ok(html.includes('if(o.theme&&typeof o.theme==="object")'),"import must restore theme");
console.log("Stable-signed Preview2 update, package pinning and migration backup tests passed");
