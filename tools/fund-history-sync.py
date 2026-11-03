#!/usr/bin/env python3
"""Publish real TEFAS 12-month fund price series, never synthetic history."""
import datetime as dt
import json
import math
import pathlib
import re
import sys
import time

def price_rows(rows, code="", today=None):
    today = today or dt.date.today()
    cutoff = today - dt.timedelta(days=405)
    points = {}
    for row in rows if isinstance(rows, list) else []:
        if isinstance(row, dict):
            date, value = row.get("tarih"), row.get("fiyat")
            row_code = str(row.get("fonKodu") or "").upper()
        elif isinstance(row, (list, tuple)) and len(row) >= 2:
            date, value, row_code = row[0], row[1], ""
        else:
            continue
        if code and row_code and row_code != code.upper():
            continue
        date = str(date or "")[:10]
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
            continue
        try:
            day = dt.date.fromisoformat(date)
            v = float(value.replace(",", ".") if isinstance(value, str) else value)
        except (ValueError, TypeError):
            continue
        if day < cutoff or day > today or not math.isfinite(v) or v <= 0:
            continue
        points[date] = round(v, 8)
    return [[date, points[date]] for date in sorted(points)]

def merge_history(old, new, code="", today=None):
    return price_rows(price_rows(old, code, today) + price_rows(new, code, today), code, today)

def self_test():
    today = dt.date(2026, 11, 3)
    old = [["2025-11-04", 10], ["2026-09-17", 12]]
    new = [{"tarih": "2026-09-18", "fiyat": "12,45", "fonKodu": "ALE"},
           {"tarih": "2026-11-02", "fiyat": 15, "fonKodu": "ALE"},
           {"tarih": "2026-07-01", "fiyat": 7, "fonKodu": "XYZ"},
           {"tarih": "2026-02-30", "fiyat": 7, "fonKodu": "ALE"},
           {"tarih": "2027-01-01", "fiyat": 7, "fonKodu": "ALE"}]
    result = merge_history(old, new, "ALE", today)
    assert result == [["2025-11-04", 10], ["2026-09-17", 12],
                      ["2026-09-18", 12.45], ["2026-11-02", 15]], result
    assert merge_history(old, [], "ALE", today) == old
    print("fund history normalization, validation and merge tests passed")

def read_json(path, default):
    try:
        return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default

def main(market_file, old_file, out_file):
    market = read_json(market_file, {})
    prior = read_json(old_file, {})
    funds = market.get("funds") if isinstance(market, dict) else []
    codes = sorted({str(x.get("code", "")).strip().upper() for x in funds or []
                    if isinstance(x, dict) and re.fullmatch(r"[A-Z0-9]{3,5}", str(x.get("code", "")).strip().upper())})
    if not codes:
        raise SystemExit("No fund codes in market.json; refusing empty feed")
    old_map = prior.get("funds", {}) if isinstance(prior, dict) else {}
    if not isinstance(old_map, dict):
        old_map = {}
    try:
        from tefasmak import fon_fiyat_gecmisi
    except ImportError as e:
        raise SystemExit("tefasmak import failed: " + str(e))
    today = dt.datetime.now(dt.timezone.utc).date()
    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    result, fetched, older, failed = {}, 0, 0, []
    for index, code in enumerate(codes):
        old_entry = old_map.get(code, {})
        old_rows = old_entry.get("h", []) if isinstance(old_entry, dict) else []
        previous = price_rows(old_rows, code, today)
        fresh = []
        try:
            fresh = price_rows(fon_fiyat_gecmisi(code, periyod=12), code, today)
            if len(fresh) < 5:
                raise ValueError("fewer than five valid TEFAS prices")
            fetched += 1
        except Exception as e:
            failed.append(code)
            print(f"{code}: TEFAS unavailable ({type(e).__name__}: {str(e)[:100]})", flush=True)
        merged = merge_history(previous, fresh, code, today)
        if merged:
            span = (dt.date.fromisoformat(merged[-1][0]) - dt.date.fromisoformat(merged[0][0])).days
            complete = span >= 300
            if complete:
                older += 1
            result[code] = {
                "source": "TEFAS",
                "fetchedAt": now if fresh else str(old_entry.get("fetchedAt", "")) if isinstance(old_entry, dict) else "",
                "first": merged[0][0], "last": merged[-1][0],
                "spanDays": span, "complete1y": complete, "h": merged
            }
            print(f"{code}: {len(merged)} prices {merged[0][0]}..{merged[-1][0]}, "
                  f"complete1y={complete}, fetched={len(fresh)}", flush=True)
        if index < len(codes)-1:
            time.sleep(10)
    if not fetched and not result:
        raise SystemExit("No valid history; refusing publication of empty prices")
    output = {"schema": 1, "source": "TEFAS", "generatedAt": now, "asOf": str(today),
              "requested": codes, "successfulFetches": fetched, "complete1yCount": older,
              "failedCodes": failed, "funds": result}
    pathlib.Path(out_file).write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":"))+"\n", encoding="utf-8")
    print(f"Archive validated: requested={len(codes)}, fetched={fetched}, available={len(result)}, "
          f"fullYear={older}, failed={failed}", flush=True)

if __name__ == "__main__":
    if len(sys.argv)==2 and sys.argv[1]=="--self-test":
        self_test()
    elif len(sys.argv)==4:
        main(sys.argv[1],sys.argv[2],sys.argv[3])
    else:
        raise SystemExit("usage: fund-history-sync.py MARKET OLD OUTPUT | --self-test")
