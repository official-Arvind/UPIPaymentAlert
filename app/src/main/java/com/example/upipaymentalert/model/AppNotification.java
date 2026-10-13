package com.example.upipaymentalert.model;

import androidx.annotation.Keep;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Keep
public class AppNotification {
    public String id;
    public String packageName;
    public String title;
    public String text;
    public long timestamp;

    public AppNotification() {}

    public AppNotification(String id, String packageName, String title, String text, long timestamp) {
        this.id = id;
        this.packageName = packageName;
        this.title = title;
        this.text = text;
        this.timestamp = timestamp;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id != null ? id : "");
        map.put("packageName", packageName != null ? packageName : "");
        map.put("title", title != null ? title : "");
        map.put("text", text != null ? text : "");
        map.put("timestamp", timestamp);
        return map;
    }

    public static AppNotification fromMap(Map<String, Object> map) {
        if (map == null) return null;
        String id = (String) (map.get("id") != null ? map.get("id") : map.get("a"));
        String pkg = (String) (map.get("packageName") != null ? map.get("packageName") : map.get("b"));
        String title = (String) (map.get("title") != null ? map.get("title") : map.get("c"));
        String text = (String) (map.get("text") != null ? map.get("text") : map.get("d"));
        Object tsObj = map.get("timestamp") != null ? map.get("timestamp") : map.get("e");
        long timestamp = 0L;
        if (tsObj instanceof Long) {
            timestamp = (Long) tsObj;
        } else if (tsObj instanceof Number) {
            timestamp = ((Number) tsObj).longValue();
        }
        if (id == null && pkg == null && title == null && text == null) {
            return null;
        }
        return new AppNotification(
            id != null ? id : "",
            pkg != null ? pkg : "",
            title != null ? title : "",
            text != null ? text : "",
            timestamp
        );
    }

    public JSONObject toJson() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("id", id);
            obj.put("packageName", packageName);
            obj.put("title", title);
            obj.put("text", text);
            obj.put("timestamp", timestamp);
            return obj;
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    public static AppNotification fromJson(JSONObject obj) {
        try {
            return new AppNotification(
                    obj.optString("id", ""),
                    obj.optString("packageName", ""),
                    obj.optString("title", ""),
                    obj.optString("text", ""),
                    obj.optLong("timestamp", 0)
            );
        } catch (Exception e) {
            return null;
        }
    }

    public static String toJsonArray(List<AppNotification> list) {
        JSONArray arr = new JSONArray();
        for (AppNotification n : list) {
            if (n != null) arr.put(n.toJson());
        }
        return arr.toString();
    }

    public static List<AppNotification> fromJsonArray(String jsonStr) {
        List<AppNotification> list = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(jsonStr);
            for (int i = 0; i < arr.length(); i++) {
                AppNotification n = fromJson(arr.getJSONObject(i));
                if (n != null) list.add(n);
            }
        } catch (Exception ignored) {}
        return list;
    }
}

