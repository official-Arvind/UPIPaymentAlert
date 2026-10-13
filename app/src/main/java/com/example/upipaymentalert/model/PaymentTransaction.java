package com.example.upipaymentalert.model;

import androidx.annotation.Keep;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Keep
@Entity(tableName = "transactions")
public class PaymentTransaction {
    @PrimaryKey
    @NonNull
    public String id = "";
    public String amount;
    public String type; // "credit" or "debit"
    public String sender;
    public String body;
    public long timestamp;

    public PaymentTransaction() {}

    @androidx.room.Ignore
    public PaymentTransaction(String id, String amount, String type, String sender, String body, long timestamp) {
        this.id = id;
        this.amount = amount;
        this.type = type;
        this.sender = sender;
        this.body = body;
        this.timestamp = timestamp;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id != null ? id : "");
        map.put("amount", amount != null ? amount : "");
        map.put("type", type != null ? type : "");
        map.put("sender", sender != null ? sender : "");
        map.put("body", body != null ? body : "");
        map.put("timestamp", timestamp);
        return map;
    }

    public static PaymentTransaction fromMap(Map<String, Object> map) {
        if (map == null) return null;
        String id = (String) (map.get("id") != null ? map.get("id") : map.get("a"));
        String amount = (String) (map.get("amount") != null ? map.get("amount") : map.get("b"));
        String type = (String) (map.get("type") != null ? map.get("type") : map.get("c"));
        String sender = (String) (map.get("sender") != null ? map.get("sender") : map.get("d"));
        String body = (String) (map.get("body") != null ? map.get("body") : map.get("e"));
        Object tsObj = map.get("timestamp") != null ? map.get("timestamp") : map.get("f");
        if (tsObj == null) tsObj = map.get("e");
        long timestamp = 0L;
        if (tsObj instanceof Long) {
            timestamp = (Long) tsObj;
        } else if (tsObj instanceof Number) {
            timestamp = ((Number) tsObj).longValue();
        }
        if (id == null && sender == null && amount == null && body == null) {
            return null;
        }
        return new PaymentTransaction(
            id != null ? id : "",
            amount != null ? amount : "",
            type != null ? type : "",
            sender != null ? sender : "",
            body != null ? body : "",
            timestamp
        );
    }

    public static PaymentTransaction fromJson(JSONObject json) throws JSONException {
        return new PaymentTransaction(
                json.optString("id", ""),
                json.optString("amount", ""),
                json.optString("type", ""),
                json.optString("sender", ""),
                json.optString("body", ""),
                json.optLong("timestamp", 0)
        );
    }

    public JSONObject toJson() throws JSONException {
        JSONObject json = new JSONObject();
        json.put("id", id);
        json.put("amount", amount);
        json.put("type", type);
        json.put("sender", sender);
        json.put("body", body);
        json.put("timestamp", timestamp);
        return json;
    }

    public static String toJsonArray(List<PaymentTransaction> transactions) {
        JSONArray array = new JSONArray();
        for (PaymentTransaction t : transactions) {
            try {
                if (t != null) array.put(t.toJson());
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return array.toString();
    }

    public static List<PaymentTransaction> fromJsonArray(String jsonString) {
        List<PaymentTransaction> list = new ArrayList<>();
        if (jsonString == null || jsonString.isEmpty()) return list;
        try {
            JSONArray array = new JSONArray(jsonString);
            for (int i = 0; i < array.length(); i++) {
                PaymentTransaction t = fromJson(array.getJSONObject(i));
                if (t != null) list.add(t);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return list;
    }
}

