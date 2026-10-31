package com.yasin.yatirimapp;

import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;

/* Uygulama yalnızca bu veri kaynaklarına istek atar (sayfa adına ve arka plan bildirim işi için). */
final class Net {
  static String UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
  // Yahoo mobil tarayıcı kimliğine sık sık "çok fazla istek" (429) dönüyor; masaüstü kimliği ve çerezle sorunsuz
  static final String DESK = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
  static { if (CookieHandler.getDefault() == null) CookieHandler.setDefault(new CookieManager(null, CookiePolicy.ACCEPT_ALL)); }

  static boolean allowed(String h) {
    h = h.toLowerCase();
    return h.equals("query1.finance.yahoo.com") || h.equals("query2.finance.yahoo.com") || h.equals("fc.yahoo.com")
        || h.equals("fvt.com.tr") || h.equals("www.fvt.com.tr")
        || h.equals("raw.githubusercontent.com") || h.equals("api.github.com")
        || h.equals("www.isyatirim.com.tr") || h.equals("www.tefas.gov.tr");
  }

  static JSONObject req(String method, String url, String body, String headers) {
    JSONObject o = new JSONObject();
    try {
      URL u = new URL(url);
      if (!"https".equals(u.getProtocol()) || !allowed(u.getHost())) throw new IOException("izinsiz adres: " + u.getHost());
      HttpURLConnection c = (HttpURLConnection) u.openConnection();
      c.setConnectTimeout(15000); c.setReadTimeout(25000); c.setUseCaches(false); c.setInstanceFollowRedirects(true);
      boolean post = "POST".equalsIgnoreCase(method);
      c.setRequestMethod(post ? "POST" : "GET");
      c.setRequestProperty("User-Agent", u.getHost().contains("yahoo") ? DESK : UA);
      c.setRequestProperty("Accept-Language", "tr-TR,tr;q=0.9,en;q=0.8");
      if (headers != null && !headers.isEmpty()) {
        JSONObject h = new JSONObject(headers); Iterator<String> it = h.keys();
        while (it.hasNext()) { String k = it.next(); c.setRequestProperty(k, h.getString(k)); }
      }
      if (post) { c.setDoOutput(true); OutputStream os = c.getOutputStream(); os.write((body == null ? "" : body).getBytes("UTF-8")); os.close(); }
      int code = c.getResponseCode();
      InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
      String s = in == null ? "" : read(in);
      o.put("ok", code < 400); o.put("code", code); o.put("body", s);
      String et = c.getHeaderField("ETag"); if (et != null) o.put("etag", et);
      if (code >= 400) o.put("error", "HTTP " + code);
    } catch (Exception e) {
      try { o.put("ok", false); o.put("error", String.valueOf(e.getMessage())); } catch (Exception ignored) {}
    }
    return o;
  }

  static String read(InputStream in) throws IOException {
    BufferedReader r = new BufferedReader(new InputStreamReader(in, "UTF-8"));
    StringBuilder sb = new StringBuilder(); char[] b = new char[8192]; int n;
    while ((n = r.read(b)) > 0) sb.append(b, 0, n);
    r.close(); return sb.toString();
  }

  static String get(String url) { JSONObject o = req("GET", url, null, null); return o.optBoolean("ok") ? o.optString("body") : null; }

  /* --- Fiyatlar (arka plandaki alarm kontrolü için) --- */
  static boolean primed;
  static Double yahoo(String sym) {
    try {
      if (!primed) { req("GET", "https://fc.yahoo.com", null, null); primed = true; }
      String b = get("https://query1.finance.yahoo.com/v8/finance/chart/" + java.net.URLEncoder.encode(sym, "UTF-8") + "?range=1d&interval=1d");
      if (b == null) b = get("https://query2.finance.yahoo.com/v8/finance/chart/" + java.net.URLEncoder.encode(sym, "UTF-8") + "?range=1d&interval=1d");
      if (b == null) return null;
      JSONObject m = new JSONObject(b).getJSONObject("chart").getJSONArray("result").getJSONObject(0).getJSONObject("meta");
      double p = m.optDouble("regularMarketPrice", Double.NaN);
      return Double.isNaN(p) ? null : p;
    } catch (Exception e) { return null; }
  }
  static Double fx(String code) {
    switch (code) {
      case "XAU": return yahoo("GC=F");
      case "XAG": return yahoo("SI=F");
      case "GAU": case "GAG": {
        Double a = yahoo("GAU".equals(code) ? "GC=F" : "SI=F"), u = yahoo("USDTRY=X");
        return a == null || u == null ? null : a * u / 31.1034768;
      }
      default: return code.matches("[A-Z]{3}") ? yahoo(code + "TRY=X") : null;
    }
  }
  /* fvt fon sayfasındaki gömülü veriden son pay fiyatı */
  static Double fund(String code) {
    String h = get("https://fvt.com.tr/fonlar/yatirim-fonlari/" + code);
    if (h == null) return null;
    int i = h.indexOf("initialDetail"); if (i < 0) return null;
    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\\\\"fiyat\\\\\":\\\\\"([0-9.]+)\\\\\"").matcher(h);
    if (m.find(i)) { try { return Double.parseDouble(m.group(1)); } catch (Exception e) { return null; } }
    return null;
  }
}
