package com.yasin.yatirimapp;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;

/* Bağımsız uygulama: arayüz GitHub'dan güncellenebilir (yeniden kurulum gerekmez), bozuk sürümde paketteki arayüze döner.
   Veriler: GitHub (yapay zekânın günlük analizi), Yahoo (hisse/döviz, 15 dk gecikmeli), fvt.com.tr (fon). */
public class MainActivity extends Activity {
  static final String BASE = "https://yatirim.app/";
  static final String OLD_APP = "https://claude.ai/artifact/KGLuNpASfKJZT1QXGir68H";
  static final String UI_URL = "https://raw.githubusercontent.com/yasinbirinci6134-sketch/Yatirim_Uygulamasi/main/ui/index.html";
  // GitHub API: önbelleği kısa (raw ~5 dk bekletir); ETag ile 304 dönen istekler kota yemez
  static final String UI_API = "https://api.github.com/repos/yasinbirinci6134-sketch/Yatirim_Uygulamasi/contents/ui/index.html?ref=main";
  static final String MARK = "<!--yatirim-ui-->";
  static final java.util.concurrent.ExecutorService NET = java.util.concurrent.Executors.newFixedThreadPool(6);
  static final java.util.concurrent.ConcurrentHashMap<String, String> RES = new java.util.concurrent.ConcurrentHashMap<>();
  final Handler ui = new Handler(Looper.getMainLooper());
  WebView web; boolean ready, checked; long lastCheck, stoppedAt; String source = "asset", curSha = ""; String pendingOpen;

  SharedPreferences up() { return getSharedPreferences("ui", MODE_PRIVATE); }
  File uiFile() { return new File(getFilesDir(), "ui.html"); }
  File newFile() { return new File(getFilesDir(), "ui_new.html"); }

  static String sha(String s) {
    try { MessageDigest d = MessageDigest.getInstance("SHA-1"); StringBuilder b = new StringBuilder();
      for (byte x : d.digest(s.getBytes("UTF-8"))) b.append(String.format("%02x", x)); return b.toString(); } catch (Exception e) { return ""; }
  }
  static String readAll(InputStream in) throws Exception {
    java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream(); byte[] buf = new byte[16384]; int n;
    while ((n = in.read(buf)) > 0) bo.write(buf, 0, n); in.close(); return bo.toString("UTF-8");
  }
  @SuppressWarnings("deprecation")
  int versionCode() { try { android.content.pm.PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0); return Build.VERSION.SDK_INT >= 28 ? (int) pi.getLongVersionCode() : pi.versionCode; } catch (Exception e) { return 0; } }
  String versionName() { try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; } }

  /* Hangi arayüz yüklenecek: indirilmiş güncel sürüm (bozuk işaretlenmediyse) ya da paketteki */
  String pickUi() {
    SharedPreferences p = up();
    try {
      // APK güncellendiyse paketteki arayüz daha yeni olabilir: indirilmişi bırak
      if (p.getInt("apk", 0) != versionCode()) { uiFile().delete(); newFile().delete(); p.edit().putInt("apk", versionCode()).apply(); }
      if (newFile().exists()) { File f = uiFile(); f.delete(); newFile().renameTo(f); }
      if (uiFile().exists()) {
        String h = readAll(new java.io.FileInputStream(uiFile())), s = sha(h);
        if (!s.equals(p.getString("bad", "")) && h.contains(MARK)) { source = "file"; curSha = s; return h; }
        uiFile().delete();
      }
    } catch (Exception e) {}
    try { String h = readAll(getAssets().open("index.html")); source = "asset"; curSha = sha(h); return h; }
    catch (Exception e) { return "<p>Uygulama yüklenemedi: " + e.getMessage() + "</p>"; }
  }

  void load() {
    ready = false;
    web.loadDataWithBaseURL(BASE, pickUi(), "text/html", "UTF-8", null);
    final String src = source, s = curSha;
    // Güvenlik: indirilen arayüz 12 sn içinde açılmazsa bozuk say, paketteki arayüze dön
    ui.postDelayed(() -> { if (!ready && "file".equals(src) && s.equals(curSha)) { up().edit().putString("bad", s).apply(); uiFile().delete(); load(); } }, 12000);
  }

  void checkUi() {
    if (checked) return; checked = true; lastCheck = System.currentTimeMillis();
    NET.execute(() -> {
      try {
        JSONObject h = new JSONObject(); String et = up().getString("etag2", null); if (et != null && uiFile().exists()) h.put("If-None-Match", et);
        h.put("Accept", "application/vnd.github.raw");
        JSONObject r = Net.req("GET", UI_API, null, h.toString());
        if (r.optInt("code") == 304) return;
        if (!r.optBoolean("ok") || r.optInt("code") != 200) { r = Net.req("GET", UI_URL + "?t=" + (System.currentTimeMillis() / 60000), null, "{}"); if (!r.optBoolean("ok") || r.optInt("code") != 200) return; r.remove("etag"); }
        String body = r.optString("body"), s = sha(body);
        if (!body.contains(MARK) || !body.contains("</html>") || s.equals(curSha) || s.equals(up().getString("bad", ""))) return;
        try (FileOutputStream o = new FileOutputStream(newFile())) { o.write(body.getBytes("UTF-8")); }
        if (r.has("etag")) up().edit().putString("etag2", r.optString("etag")).apply();
        ui.post(() -> web.evaluateJavascript("window.__uiUpdateReady&&__uiUpdateReady()", null));
      } catch (Exception e) {}
    });
  }

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    boolean night = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
    SharedPreferences bp = getSharedPreferences("bars", MODE_PRIVATE);
    int c0 = bp.getInt("c", night ? Color.parseColor("#0E1513") : Color.parseColor("#F2F4F1"));
    applyBars(c0, bp.getBoolean("d", night));
    web = new WebView(this);
    web.setBackgroundColor(c0);
    web.setOverScrollMode(View.OVER_SCROLL_NEVER);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true);
    Net.UA = s.getUserAgentString().replace("; wv", "").replace("Version/4.0 ", "");
    web.addJavascriptInterface(new Bridge(), "YatirimApp");
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl(); if (u.toString().startsWith(BASE)) return false;
        open(u.toString()); return true;
      }
    });
    setContentView(web);
    pendingOpen = getIntent() == null ? null : getIntent().getStringExtra("open");
    load();
    NotifyJob.schedule(this);
  }

  @Override protected void onNewIntent(Intent i) {
    super.onNewIntent(i);
    String o = i == null ? null : i.getStringExtra("open");
    if (o != null) { pendingOpen = o; if (ready) deliverOpen(); }
  }
  void deliverOpen() {
    if (pendingOpen == null) return; String o = JSONObject.quote(pendingOpen); pendingOpen = null;
    web.evaluateJavascript("window.__openFromNotif&&__openFromNotif(" + o + ")", null);
  }

  void open(String url) {
    try {
      if (url.startsWith(OLD_APP)) {   // eski uygulama (Claude bağlantılı) kuruluysa onunla aç
        Intent o = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).setClassName("com.yasin.yatirim", "com.yasin.yatirim.WebActivity");
        try { startActivity(o); return; } catch (Exception ignored) {}
      }
      startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
    } catch (Exception e) {}
  }

  void applyBars(int c, boolean dark) {
    Window w = getWindow();
    w.setStatusBarColor(c); w.setNavigationBarColor(c);
    int f = 0; if (!dark) { f |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR; f |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR; }
    w.getDecorView().setSystemUiVisibility(f);
    if (web != null) web.setBackgroundColor(c);
    getSharedPreferences("bars", MODE_PRIVATE).edit().putInt("c", c).putBoolean("d", dark).apply();
  }

  void js(String code) { ui.post(() -> web.evaluateJavascript(code, null)); }

  @Override public void onRequestPermissionsResult(int rc, String[] perms, int[] res) {
    if (rc == 7) { boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED; js("window.__notifyPerm&&__notifyPerm(" + ok + ")"); }
  }

  class Bridge {
    @JavascriptInterface public void ready() { ui.post(() -> { ready = true; deliverOpen(); checkUi(); }); }
    @JavascriptInterface public int netVersion() { return 2; }
    @JavascriptInterface public boolean standalone() { return true; }
    @JavascriptInterface public int appVersion() { return versionCode(); }
    @JavascriptInterface public String appVersionName() { return versionName(); }
    @JavascriptInterface public String uiSource() { return source; }
    @JavascriptInterface public void applyUpdate() { ui.post(() -> { checked = true; load(); }); }
    @JavascriptInterface public void reload() { ui.post(() -> load()); }
    @JavascriptInterface public void checkUpdate() { ui.post(() -> { if (ready && System.currentTimeMillis() - lastCheck > 60 * 1000L) { checked = false; MainActivity.this.checkUi(); } }); }
    @JavascriptInterface public void openUrl(final String url) { ui.post(() -> open(url)); }
    @JavascriptInterface public void share(final String text, final String title) {
      ui.post(() -> { try { Intent i = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text);
        if (title != null && !title.isEmpty()) i.putExtra(Intent.EXTRA_SUBJECT, title);
        startActivity(Intent.createChooser(i, title == null || title.isEmpty() ? "Paylaş" : title)); } catch (Exception e) {} });
    }
    @JavascriptInterface public void setBars(final String rgb, final boolean dark) {
      try {
        String[] p = rgb.replaceAll("[^0-9,]", "").split(",");
        final int c = Color.rgb(Integer.parseInt(p[0].trim()), Integer.parseInt(p[1].trim()), Integer.parseInt(p[2].trim()));
        ui.post(() -> applyBars(c, dark));
      } catch (Exception e) {}
    }
    @JavascriptInterface public String http(final String method, final String url, final String body, final String headers) {
      final String id = java.util.UUID.randomUUID().toString();
      NET.execute(() -> RES.put(id, Net.req(method, url, body, headers).toString()));
      return id;
    }
    @JavascriptInterface public String take(String id) { String r = RES.remove(id); return r == null ? "" : r; }

    /* Bildirimler */
    @JavascriptInterface public String notifyStatus() {
      if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) return "off";
      android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
      return nm != null && nm.areNotificationsEnabled() ? "on" : "blocked";
    }
    @JavascriptInterface public void requestNotify() {
      ui.post(() -> {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED)
          requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 7);
        else if ("blocked".equals(notifyStatus())) {
          try { startActivity(new Intent("android.settings.APP_NOTIFICATION_SETTINGS").putExtra("android.provider.extra.APP_PACKAGE", getPackageName())); } catch (Exception e) {}
        } else js("window.__notifyPerm&&__notifyPerm(true)");
      });
    }
    @JavascriptInterface public String getNotify() { return NotifyJob.prefs(MainActivity.this).getString("cfg", "{}"); }
    @JavascriptInterface public void setNotify(String json) { NotifyJob.prefs(MainActivity.this).edit().putString("cfg", json).apply(); NotifyJob.channels(MainActivity.this); NotifyJob.schedule(MainActivity.this); }
    @JavascriptInterface public void setHeld(String json) { NotifyJob.prefs(MainActivity.this).edit().putString("held", json).apply(); }
    @JavascriptInterface public String getAlarms() { return NotifyJob.prefs(MainActivity.this).getString("alarms", "[]"); }
    @JavascriptInterface public void setAlarms(String json) {
      try { new JSONArray(json); NotifyJob.prefs(MainActivity.this).edit().putString("alarms", json).apply(); NotifyJob.schedule(MainActivity.this); } catch (Exception e) {}
    }
  }

  @Override protected void onStop() { super.onStop(); stoppedAt = System.currentTimeMillis(); }

  // Arka plandan dönünce: indirilmiş yeni arayüz varsa uygula (30 sn+ uzak kalındıysa), yoksa en çok dakikada bir denetle
  @Override protected void onResume() {
    super.onResume();
    long now = System.currentTimeMillis();
    if (ready && stoppedAt > 0 && now - stoppedAt > 30 * 1000L && newFile().exists()) { checked = true; lastCheck = now; load(); return; }
    if (ready && now - lastCheck > 60 * 1000L) { checked = false; checkUi(); }
  }

  @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else moveTaskToBack(true); }
}
