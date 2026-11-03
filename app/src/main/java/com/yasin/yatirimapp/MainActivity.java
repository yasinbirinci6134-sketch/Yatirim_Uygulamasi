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
import android.view.Gravity;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ValueCallback;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

/* Bağımsız uygulama: arayüz GitHub'dan güncellenebilir (yeniden kurulum gerekmez), bozuk sürümde paketteki arayüze döner.
   Veriler: GitHub (yapay zekânın günlük analizi), Yahoo (hisse/döviz, 15 dk gecikmeli), fvt.com.tr (fon). */
public class MainActivity extends Activity {
  static final String BASE = "https://yatirim.app/";
  static final String OLD_APP = "https://claude.ai/artifact/KGLuNpASfKJZT1QXGir68H";
  static final String PREVIEW_BRANCH = "feature/fon-pusulasi-v2-phase1";
  static final String PREVIEW_STATUS_URL = "https://raw.githubusercontent.com/yasinbirinci6134-sketch/Yatirim_Uygulamasi/" + PREVIEW_BRANCH + "/.github/status/v2-preview-build.json";
  static final String PRODUCTION_STATUS_URL = "https://raw.githubusercontent.com/yasinbirinci6134-sketch/Yatirim_Uygulamasi/main/.github/status/v2-production-build.json";
  static final String UI_URL = "https://raw.githubusercontent.com/yasinbirinci6134-sketch/Yatirim_Uygulamasi/main/ui/index.html";
  // GitHub API: önbelleği kısa (raw ~5 dk bekletir); ETag ile 304 dönen istekler kota yemez
  static final String UI_API = "https://api.github.com/repos/yasinbirinci6134-sketch/Yatirim_Uygulamasi/contents/ui/index.html?ref=main";
  static final String MARK = "<!--yatirim-ui-->";
  static final java.util.concurrent.ExecutorService NET = java.util.concurrent.Executors.newFixedThreadPool(6);
  static final java.util.concurrent.ConcurrentHashMap<String, String> RES = new java.util.concurrent.ConcurrentHashMap<>();
  final Handler ui = new Handler(Looper.getMainLooper());
  WebView web; LinearLayout recoveryPane; int loadGeneration; long lastLoadStarted; boolean ready, checked; long lastCheck, stoppedAt; String source = "asset", curSha = ""; String pendingOpen;
  static final int STATEMENT_FILE_PICKER_REQUEST = 2045;
  ValueCallback<Uri[]> pendingFileChooser;

  SharedPreferences up() { return getSharedPreferences("ui", MODE_PRIVATE); }
  File uiFile() { return new File(getFilesDir(), "ui.html"); }
  File newFile() { return new File(getFilesDir(), "ui_new.html"); }
  File lastGoodFile() { return new File(getFilesDir(), "ui_last_good.html"); }

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

  /* Every candidate is staged. Only UI that called JS ready() may be backed up. */
  static boolean validUi(String html) {
    return html != null && html.contains(MARK) && html.contains("</html>");
  }
  boolean restoreLastGood(SharedPreferences prefs) {
    File backup = lastGoodFile();
    if (!backup.isFile()) return false;
    try {
      String html = readAll(new java.io.FileInputStream(backup));
      String known = prefs.getString("lastGoodSha", "");
      if (known.isEmpty() || !known.equals(sha(html)) || !validUi(html)
          || known.equals(prefs.getString("bad", ""))) {
        backup.delete();
        return false;
      }
      Files.copy(backup.toPath(), uiFile().toPath(), StandardCopyOption.REPLACE_EXISTING);
      return true;
    } catch (Exception e) { return false; }
  }

  String pickUi() {
    SharedPreferences p = up();
    try {
      // A new APK bundles its own already-tested HTML; discard older downloaded versions only.
      if (p.getInt("apk", 0) != versionCode()) {
        uiFile().delete(); newFile().delete(); lastGoodFile().delete();
        p.edit().putInt("apk", versionCode()).remove("lastGoodSha").remove("etag2").apply();
      }
      if (newFile().isFile()) {
        String candidate = readAll(new java.io.FileInputStream(newFile()));
        if (!validUi(candidate) || sha(candidate).equals(p.getString("bad", ""))) {
          newFile().delete();
        } else {
          File active = uiFile();
          if (active.isFile()) {
            String oldHtml = readAll(new java.io.FileInputStream(active));
            if (validUi(oldHtml) && sha(oldHtml).equals(p.getString("lastGoodSha", ""))) {
              Files.copy(active.toPath(), lastGoodFile().toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
          }
          Files.move(newFile().toPath(), active.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
      }
      File active = uiFile();
      if (active.isFile()) {
        String html = readAll(new java.io.FileInputStream(active));
        String fingerprint = sha(html);
        if (validUi(html) && !fingerprint.equals(p.getString("bad", ""))) {
          source = "file"; curSha = fingerprint; return html;
        }
        active.delete();
      }
      if (restoreLastGood(p)) {
        String html = readAll(new java.io.FileInputStream(uiFile()));
        source = "file"; curSha = sha(html); return html;
      }
    } catch (Exception e) {
      // An I/O exception must never turn a partially moved candidate into permanent data loss.
      try {
        if (uiFile().isFile()) {
          String html = readAll(new java.io.FileInputStream(uiFile()));
          if (validUi(html) && !sha(html).equals(p.getString("bad", ""))) {
            source = "file"; curSha = sha(html); return html;
          }
        }
        if (restoreLastGood(p)) {
          String html = readAll(new java.io.FileInputStream(uiFile()));
          source = "file"; curSha = sha(html); return html;
        }
      } catch (Exception ignored) {}
    }
    try {
      String html = readAll(getAssets().open("index.html"));
      source = "asset"; curSha = sha(html); return html;
    } catch (Exception e) {
      source = "asset"; curSha = "";
      return "<p>Uygulama açılamadı. Lütfen yeniden deneyin.</p>";
    }
  }

  void showStartupRecovery() {
    if (recoveryPane != null) recoveryPane.setVisibility(View.VISIBLE);
  }

  void load() {
    ready = false;
    if (recoveryPane != null) recoveryPane.setVisibility(View.GONE);
    final int generation = ++loadGeneration;
    lastLoadStarted = System.currentTimeMillis();
    SharedPreferences stats = up();
    stats.edit().putInt("bootAttempts", stats.getInt("bootAttempts", 0) + 1)
      .putLong("lastAttemptAt", lastLoadStarted).putString("bootOutcome", "loading").apply();
    String html = pickUi();
    final String loadedSource = source, fingerprint = curSha;
    web.loadDataWithBaseURL(BASE, html, "text/html", "UTF-8", null);
    // A failed downloaded UI rolls back after 12 seconds; even a bundled failure offers retry.
    ui.postDelayed(() -> {
      if (generation != loadGeneration || ready) return;
      if ("file".equals(loadedSource) && fingerprint.equals(curSha)) {
        SharedPreferences fallbackStats = up();
        fallbackStats.edit().putString("bad", fingerprint)
          .putInt("rollbacks", fallbackStats.getInt("rollbacks", 0) + 1)
          .putLong("lastFailureAt", System.currentTimeMillis())
          .putString("bootOutcome", "rollback").apply();
        if (uiFile().isFile()) {
          try {
            String current = readAll(new java.io.FileInputStream(uiFile()));
            if (fingerprint.equals(sha(current))) uiFile().delete();
          } catch (Exception ignored) {}
        }
        load();
      } else {
        SharedPreferences stallStats = up();
        stallStats.edit().putInt("startupStalls", stallStats.getInt("startupStalls", 0) + 1)
          .putLong("lastFailureAt", System.currentTimeMillis())
          .putString("bootOutcome", "stalled").apply();
        showStartupRecovery();
      }
    }, "file".equals(loadedSource) ? 12000 : 20000);
  }

  void checkUi() {
    // 2.1 release candidates use the tested bundled UI until 2.1 remote updates are approved.
    if (versionName().startsWith("2.1.")) return;
    if (checked) return; checked = true; lastCheck = System.currentTimeMillis();
    NET.execute(() -> {
      try {
        JSONObject h = new JSONObject(); String et = up().getString("etag2", null); if (et != null && uiFile().exists()) h.put("If-None-Match", et);
        h.put("Accept", "application/vnd.github.raw");
        boolean preview = getPackageName().startsWith("com.yasin.yatirimapp.preview");
        // Live and test installations accept only CI-verified immutable UI commits.
        // A missing or failed build retains the bundled/last-known-good HTML.
        String statusUrl = preview ? PREVIEW_STATUS_URL : PRODUCTION_STATUS_URL;
        JSONObject statusResponse = Net.req("GET", statusUrl + "?t=" + (System.currentTimeMillis() / 60000), null, "{}");
        if (!statusResponse.optBoolean("ok") || statusResponse.optInt("code") != 200) return;
        JSONObject status = new JSONObject(statusResponse.optString("body", "{}"));
        String pinned = status.optString("source_commit", "");
        if (!"success".equals(status.optString("status")) || !pinned.matches("[0-9a-f]{40}")) return;
        String api = UI_API.replace("ref=main", "ref=" + pinned);
        String raw = UI_URL.replace("/main/", "/" + pinned + "/");
        JSONObject r = Net.req("GET", api, null, h.toString());
        if (r.optInt("code") == 304) return;
        if (!r.optBoolean("ok") || r.optInt("code") != 200) { r = Net.req("GET", raw + "?t=" + (System.currentTimeMillis() / 60000), null, "{}"); if (!r.optBoolean("ok") || r.optInt("code") != 200) return; r.remove("etag"); }
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
    // Required for JavaScript confirm()/alert()/prompt() on Android WebView.
    // Without a WebChromeClient confirm() silently returns false.
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
        if (pendingFileChooser != null) pendingFileChooser.onReceiveValue(null);
        pendingFileChooser = callback;
        Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        pick.setType("*/*");
        pick.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"text/csv", "text/plain", "application/csv", "application/vnd.ms-excel", "application/octet-stream"});
        try {
          startActivityForResult(pick, STATEMENT_FILE_PICKER_REQUEST);
          return true;
        } catch (Exception e) {
          pendingFileChooser = null;
          callback.onReceiveValue(null);
          return true;
        }
      }
    });
    Net.UA = s.getUserAgentString().replace("; wv", "").replace("Version/4.0 ", "");
    web.addJavascriptInterface(new Bridge(), "YatirimApp");
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl(); if (u.toString().startsWith(BASE)) return false;
        open(u.toString()); return true;
      }
    });
    FrameLayout container = new FrameLayout(this);
    container.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
    recoveryPane = new LinearLayout(this);
    recoveryPane.setOrientation(LinearLayout.VERTICAL);
    recoveryPane.setPadding(36, 30, 36, 30);
    recoveryPane.setBackgroundColor(Color.parseColor("#203138"));
    TextView recoveryText = new TextView(this);
    recoveryText.setText("Fon Pusulası açılamadı. Portföy ve ayarlar silinmedi. İnterneti kontrol edip tekrar deneyebilirsin.");
    recoveryText.setTextColor(Color.WHITE);
    recoveryText.setTextSize(15);
    recoveryPane.addView(recoveryText);
    Button retry = new Button(this);
    retry.setText("Yeniden dene");
    retry.setOnClickListener(v -> load());
    recoveryPane.addView(retry);
    recoveryPane.setVisibility(View.GONE);
    FrameLayout.LayoutParams recoveryParams = new FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
    recoveryParams.setMargins(24, 24, 24, 24);
    container.addView(recoveryPane, recoveryParams);
    setContentView(container);
    pendingOpen = getIntent() == null ? null : getIntent().getStringExtra("open");
    load();
    NotifyJob.schedule(this);
  }

  @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode != STATEMENT_FILE_PICKER_REQUEST) return;
    ValueCallback<Uri[]> callback = pendingFileChooser;
    pendingFileChooser = null;
    if (callback == null) return;
    Uri picked = resultCode == RESULT_OK && data != null ? data.getData() : null;
    callback.onReceiveValue(picked == null ? null : new Uri[]{picked});
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
    @JavascriptInterface public void ready() {
      ui.post(() -> {
        ready = true;
        if (recoveryPane != null) recoveryPane.setVisibility(View.GONE);
        SharedPreferences.Editor successful = up().edit()
          .putString("bootOutcome", "ready")
          .putString("lastBootSource", source)
          .putLong("lastReadyAt", System.currentTimeMillis())
          .putLong("lastBootMs", Math.max(0L, System.currentTimeMillis() - lastLoadStarted));
        if ("file".equals(source) && !curSha.isEmpty()) successful.putString("lastGoodSha", curSha);
        successful.apply();
        deliverOpen();
        checkUi();
      });
    }
    /* Technical counters only: no holdings, balances, logins, transaction details or URLs. */
    @JavascriptInterface public String startupReport() {
      SharedPreferences p = up();
      JSONObject report = new JSONObject();
      try {
        report.put("appVersion", versionName());
        report.put("status", p.getString("bootOutcome", "unknown"));
        report.put("lastSource", p.getString("lastBootSource", "unknown"));
        report.put("attempts", p.getInt("bootAttempts", 0));
        report.put("rollbacks", p.getInt("rollbacks", 0));
        report.put("stalls", p.getInt("startupStalls", 0));
        report.put("lastDurationMs", p.getLong("lastBootMs", 0L));
        report.put("lastReadyAt", p.getLong("lastReadyAt", 0L));
        report.put("lastFailureAt", p.getLong("lastFailureAt", 0L));
      } catch (Exception ignored) {}
      return report.toString();
    }
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
