package com.yasin.yatirimapp;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/* Bağımsız uygulama: arayüz APK'nın içinde; veriler GitHub'dan (yapay zekânın günlük çıktısı), Yahoo ve TEFAS'tan (canlı fiyat). */
public class MainActivity extends Activity {
  static final String BASE = "https://yatirim.app/";
  static final String OLD_APP = "https://claude.ai/artifact/KGLuNpASfKJZT1QXGir68H";
  static final java.util.concurrent.ExecutorService NET = java.util.concurrent.Executors.newFixedThreadPool(8);
  static final java.util.concurrent.ConcurrentHashMap<String, String> RES = new java.util.concurrent.ConcurrentHashMap<>();
  static String UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
  static { java.net.CookieHandler.setDefault(new java.net.CookieManager(null, java.net.CookiePolicy.ACCEPT_ALL)); }
  WebView web;

  static boolean allowed(String h) {
    return h.equals("query1.finance.yahoo.com") || h.equals("query2.finance.yahoo.com") || h.equals("www.tefas.gov.tr") || h.equals("tefas.gov.tr")
        || h.equals("raw.githubusercontent.com");
  }
  static String fetch(String method, String url, String body, String headers) {
    org.json.JSONObject o = new org.json.JSONObject();
    try {
      java.net.URL u = new java.net.URL(url);
      if (!"https".equals(u.getProtocol()) || !allowed(u.getHost())) throw new Exception("izinsiz adres: " + u.getHost());
      java.net.HttpURLConnection c = (java.net.HttpURLConnection) u.openConnection();
      c.setConnectTimeout(15000); c.setReadTimeout(25000); c.setUseCaches(false);
      boolean post = "POST".equalsIgnoreCase(method);
      c.setRequestMethod(post ? "POST" : "GET");
      c.setRequestProperty("User-Agent", UA);
      c.setRequestProperty("Accept-Language", "tr-TR,tr;q=0.9,en;q=0.8");
      org.json.JSONObject h = new org.json.JSONObject(headers == null || headers.isEmpty() ? "{}" : headers);
      java.util.Iterator<String> it = h.keys();
      while (it.hasNext()) { String k = it.next(); c.setRequestProperty(k, h.getString(k)); }
      if (post) { c.setDoOutput(true); java.io.OutputStream os = c.getOutputStream(); os.write((body == null ? "" : body).getBytes("UTF-8")); os.close(); }
      int code = c.getResponseCode();
      java.io.InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
      StringBuilder sb = new StringBuilder();
      if (in != null) {
        java.io.BufferedReader r = new java.io.BufferedReader(new java.io.InputStreamReader(in, "UTF-8"));
        char[] buf = new char[8192]; int n; while ((n = r.read(buf)) > 0) sb.append(buf, 0, n); r.close();
      }
      o.put("ok", code < 400); o.put("code", code); o.put("body", sb.toString());
      if (code >= 400) o.put("error", "HTTP " + code);
    } catch (Exception e) {
      try { o.put("ok", false); o.put("error", String.valueOf(e.getMessage())); } catch (Exception ignored) {}
    }
    return o.toString();
  }

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    boolean night = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
    android.content.SharedPreferences bp = getSharedPreferences("bars", MODE_PRIVATE);
    int c0 = bp.getInt("c", night ? Color.parseColor("#0E1513") : Color.parseColor("#F2F4F1"));
    applyBars(c0, bp.getBoolean("d", night));
    web = new WebView(this);
    web.setBackgroundColor(c0);
    web.setOverScrollMode(View.OVER_SCROLL_NEVER);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true);
    UA = s.getUserAgentString().replace("; wv", "").replace("Version/4.0 ", "");
    web.addJavascriptInterface(new Bridge(), "YatirimApp");
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl(); if (u.toString().startsWith(BASE)) return false;
        open(u.toString()); return true;
      }
    });
    setContentView(web);
    try {
      java.io.InputStream in = getAssets().open("index.html");
      java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream(); byte[] buf = new byte[16384]; int n;
      while ((n = in.read(buf)) > 0) bo.write(buf, 0, n); in.close();
      web.loadDataWithBaseURL(BASE, bo.toString("UTF-8"), "text/html", "UTF-8", null);
    } catch (Exception e) { web.loadData("Uygulama yüklenemedi: " + e.getMessage(), "text/plain", "UTF-8"); }
  }

  void open(String url) {
    try {
      Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
      if (url.startsWith(OLD_APP)) {   // eski uygulama (Claude bağlantılı) kuruluysa onunla aç
        Intent o = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).setClassName("com.yasin.yatirim", "com.yasin.yatirim.WebActivity");
        try { startActivity(o); return; } catch (Exception ignored) {}
      }
      startActivity(i);
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

  class Bridge {
    @JavascriptInterface public void ready() {}
    @JavascriptInterface public int netVersion() { return 1; }
    @JavascriptInterface public boolean standalone() { return true; }
    @JavascriptInterface public void openUrl(final String url) { runOnUiThread(() -> open(url)); }
    @JavascriptInterface public void setBars(final String rgb, final boolean dark) {
      try {
        String[] p = rgb.replaceAll("[^0-9,]", "").split(",");
        final int c = Color.rgb(Integer.parseInt(p[0].trim()), Integer.parseInt(p[1].trim()), Integer.parseInt(p[2].trim()));
        runOnUiThread(() -> applyBars(c, dark));
      } catch (Exception e) {}
    }
    @JavascriptInterface public String http(final String method, final String url, final String body, final String headers) {
      final String id = java.util.UUID.randomUUID().toString();
      NET.execute(() -> RES.put(id, fetch(method, url, body, headers)));
      return id;
    }
    @JavascriptInterface public String take(String id) { String r = RES.remove(id); return r == null ? "" : r; }
  }

  @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else moveTaskToBack(true); }
}
