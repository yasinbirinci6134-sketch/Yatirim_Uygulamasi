package com.yasin.yatirimapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;
import java.util.TimeZone;

/* Arka plan işi (yaklaşık 30 dakikada bir, internet varken): günlük analiz bildirimi, elindeki kalemler için çıkış uyarısı, fiyat alarmları. */
public class NotifyJob extends JobService {
  static final int JOB_ID = 1001;
  static final String RAW = "https://raw.githubusercontent.com/yasinbirinci6134-sketch/Yatirim_Uygulamasi/data/market.json";

  @Override public boolean onStartJob(final JobParameters p) {
    new Thread(() -> { try { run(getApplicationContext()); } catch (Throwable t) {} jobFinished(p, false); }).start();
    return true;
  }
  @Override public boolean onStopJob(JobParameters p) { return true; }

  static SharedPreferences prefs(Context c) { return c.getSharedPreferences("notif", MODE_PRIVATE); }

  static boolean anyOn(Context c) {
    try {
      JSONObject cfg = new JSONObject(prefs(c).getString("cfg", "{}"));
      if (cfg.optBoolean("daily") || cfg.optBoolean("exit")) return true;
      if (cfg.optBoolean("alarms", true)) {
        JSONArray a = new JSONArray(prefs(c).getString("alarms", "[]"));
        for (int i = 0; i < a.length(); i++) if (a.getJSONObject(i).optBoolean("on", true)) return true;
      }
    } catch (Exception e) {}
    return false;
  }

  static void schedule(Context c) {
    JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
    if (js == null) return;
    if (!anyOn(c)) { js.cancel(JOB_ID); return; }
    for (JobInfo j : js.getAllPendingJobs()) if (j.getId() == JOB_ID) return;
    JobInfo info = new JobInfo.Builder(JOB_ID, new ComponentName(c, NotifyJob.class))
        .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
        .setPeriodic(30 * 60 * 1000L)
        .setPersisted(true)
        .build();
    try { js.schedule(info); } catch (Exception e) {}
  }

  static void channels(Context c) {
    NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm == null) return;
    NotificationChannel a = new NotificationChannel("genel", "Günlük analiz ve uyarılar", NotificationManager.IMPORTANCE_DEFAULT);
    a.setDescription("Günün analizi hazır olduğunda ve elindeki bir kalem için uyarı çıktığında");
    NotificationChannel b = new NotificationChannel("alarm", "Fiyat alarmları", NotificationManager.IMPORTANCE_HIGH);
    b.setDescription("Kurduğun fiyat alarmı gerçekleştiğinde");
    nm.createNotificationChannel(a); nm.createNotificationChannel(b);
  }

  static void post(Context c, int id, String ch, String title, String text, String open) {
    NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm == null || !nm.areNotificationsEnabled()) return;
    channels(c);
    Intent i = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    if (open != null) i.putExtra("open", open);
    PendingIntent pi = PendingIntent.getActivity(c, id, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    Notification n = new Notification.Builder(c, ch).setSmallIcon(R.drawable.ic_stat).setColor(0xFF0F6B57)
        .setContentTitle(title).setContentText(text).setStyle(new Notification.BigTextStyle().bigText(text))
        .setContentIntent(pi).setAutoCancel(true).build();
    nm.notify(id, n);
  }

  static Calendar tr() { return Calendar.getInstance(TimeZone.getTimeZone("Europe/Istanbul")); }
  static boolean weekday(Calendar k) { int d = k.get(Calendar.DAY_OF_WEEK); return d != Calendar.SATURDAY && d != Calendar.SUNDAY; }
  static int minutes(Calendar k) { return k.get(Calendar.HOUR_OF_DAY) * 60 + k.get(Calendar.MINUTE); }

  static String firstSentence(String s) {
    if (s == null) return "";
    s = s.trim(); int i = s.indexOf(". ");
    String f = i > 0 ? s.substring(0, i + 1) : s;
    return f.length() > 160 ? f.substring(0, 157) + "…" : f;
  }
  static String fmt(double v) {
    String s = v >= 100 ? String.format(java.util.Locale.forLanguageTag("tr-TR"), "%,.2f", v) : v >= 1 ? String.format(java.util.Locale.forLanguageTag("tr-TR"), "%,.4f", v) : String.format(java.util.Locale.forLanguageTag("tr-TR"), "%,.6f", v);
    return s;
  }

  static void run(Context c) throws Exception {
    SharedPreferences p = prefs(c);
    JSONObject cfg = new JSONObject(p.getString("cfg", "{}"));
    Calendar k = tr();

    // 1) Günlük analiz ve çıkış uyarıları (GitHub'daki güncel analiz)
    if (cfg.optBoolean("daily") || cfg.optBoolean("exit")) {
      JSONObject h = new JSONObject();
      String et = p.getString("etag", null); if (et != null) h.put("If-None-Match", et);
      JSONObject r = Net.req("GET", RAW, null, h.toString());
      if (r.optBoolean("ok") && r.optInt("code") == 200 && r.optString("body").length() > 100) {
        if (r.has("etag")) p.edit().putString("etag", r.optString("etag")).apply();
        JSONObject m = new JSONObject(r.optString("body"));
        String up = m.optString("updatedAt", "");
        String last = p.getString("lastDaily", null);
        if (cfg.optBoolean("daily") && !up.isEmpty() && last != null && up.compareTo(last) > 0) {
          JSONObject adv = m.optJSONObject("advice");
          post(c, 1, "genel", "Günün analizi hazır", firstSentence(adv != null ? adv.optString("summary") : ""), "tab:gundem");
        }
        if (!up.isEmpty()) p.edit().putString("lastDaily", up).apply();
        if (cfg.optBoolean("exit")) {
          JSONArray held = new JSONArray(p.getString("held", "[]"));
          JSONArray seen = new JSONArray(p.getString("exitSeen", "[]"));
          JSONArray st = m.optJSONArray("stocks");
          boolean changed = false;
          for (int i = 0; st != null && i < st.length(); i++) {
            JSONObject x = st.getJSONObject(i);
            String code = x.optString("code"), ex = x.optString("exitAt", "");
            if (ex.isEmpty() || "null".equals(ex)) continue;
            boolean mine = false; for (int j = 0; j < held.length(); j++) if (code.equals(held.optString(j))) mine = true;
            String key = code + "@" + ex; boolean was = false;
            for (int j = 0; j < seen.length(); j++) if (key.equals(seen.optString(j))) was = true;
            if (mine && !was) {
              post(c, 2000 + Math.abs(code.hashCode() % 1000), "genel", code + ": listeden çıkabilir", x.optString("exitWhy", "Puanı düştü.") + " Elindeysen detayına bak.", "s:" + code);
              seen.put(key); changed = true;
            }
          }
          if (changed) { JSONArray t = new JSONArray(); for (int j = Math.max(0, seen.length() - 60); j < seen.length(); j++) t.put(seen.get(j)); p.edit().putString("exitSeen", t.toString()).apply(); }
        }
      }
    }

    // 2) Fiyat alarmları
    if (cfg.optBoolean("alarms", true)) {
      JSONArray a = new JSONArray(p.getString("alarms", "[]"));
      boolean changed = false;
      int mm = minutes(k); boolean wd = weekday(k);
      long lastFund = p.getLong("lastFundCheck", 0), now = System.currentTimeMillis();
      boolean fundTime = now - lastFund > 3 * 3600 * 1000L;
      for (int i = 0; i < a.length(); i++) {
        JSONObject al = a.getJSONObject(i);
        if (!al.optBoolean("on", true)) continue;
        String t = al.optString("t"), code = al.optString("c"), op = al.optString("op", ">");
        double target = al.optDouble("p", Double.NaN); if (Double.isNaN(target)) continue;
        Double px = null;
        if ("s".equals(t)) { if (wd && mm >= 595 && mm <= 1120) px = Net.yahoo(code + ".IS"); }
        else if ("x".equals(t)) { if (wd) px = Net.fx(code); }
        else if ("f".equals(t)) { if (fundTime) px = Net.fund(code); }
        if (px == null) continue;
        al.put("last", px); al.put("lastAt", now);
        boolean hit = ">".equals(op) ? px >= target : px <= target;
        if (hit) {
          post(c, 3000 + i, "alarm", code + " fiyat alarmı", code + " " + fmt(px) + (">".equals(op) ? " oldu; hedefin " + fmt(target) + " ve üstüydü." : " oldu; hedefin " + fmt(target) + " ve altıydı."), ("s".equals(t) ? "s:" : "f".equals(t) ? "f:" : "x:") + code);
          al.put("on", false); al.put("hitAt", now); al.put("hitPx", px);
        }
        changed = true;
      }
      if (fundTime) p.edit().putLong("lastFundCheck", now).apply();
      if (changed) p.edit().putString("alarms", a.toString()).apply();
    }
  }
}
