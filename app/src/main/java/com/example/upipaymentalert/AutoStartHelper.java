package com.example.upipaymentalert;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

public class AutoStartHelper {

    public static Intent getAutoStartIntent(Context context) {
        String manufacturer = Build.MANUFACTURER.toLowerCase();
        Intent intent = new Intent();
        
        try {
            if ("xiaomi".equals(manufacturer) || "poco".equals(manufacturer) || "redmi".equals(manufacturer)) {
                intent.setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
            } else if ("oppo".equals(manufacturer) || "realme".equals(manufacturer) || "oneplus".equals(manufacturer)) {
                intent.setComponent(new ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"));
                if (!isIntentResolved(context, intent)) {
                    intent.setComponent(new ComponentName("com.coloros.safecenter", "com.coloros.privacypermissionsentry.PermissionTopActivity"));
                }
                if (!isIntentResolved(context, intent)) {
                    intent.setComponent(new ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"));
                }
            } else if ("vivo".equals(manufacturer) || "iqoo".equals(manufacturer)) {
                intent.setComponent(new ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"));
                if (!isIntentResolved(context, intent)) {
                    intent.setComponent(new ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"));
                }
                if (!isIntentResolved(context, intent)) {
                    intent.setComponent(new ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager"));
                }
            } else if ("huawei".equals(manufacturer) || "honor".equals(manufacturer)) {
                intent.setComponent(new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"));
                if (!isIntentResolved(context, intent)) {
                    intent.setComponent(new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"));
                }
                if (!isIntentResolved(context, intent)) {
                    intent.setComponent(new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity"));
                }
            } else if ("asus".equals(manufacturer)) {
                intent.setComponent(new ComponentName("com.asus.mobilemanager", "com.asus.mobilemanager.entry.FunctionActivity"));
                if (!isIntentResolved(context, intent)) {
                    intent.setComponent(new ComponentName("com.asus.mobilemanager", "com.asus.mobilemanager.autostart.AutoStartActivity"));
                }
            } else if ("letv".equals(manufacturer)) {
                intent.setComponent(new ComponentName("com.letv.android.letvsafe", "com.letv.android.letvsafe.AutobootManageActivity"));
            } else if ("samsung".equals(manufacturer)) {
                // Samsung's direct battery intent is broken in One UI 5/6. Fallback to App Info page so user can click Battery -> Unrestricted.
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + context.getPackageName()));
            } else {
                return null;
            }
            
            if (intent.getComponent() != null && !isIntentResolved(context, intent) && !"samsung".equals(manufacturer)) {
                return null;
            }
        } catch (Exception e) {
            return null;
        }
        
        return intent;
    }
    
    private static boolean isIntentResolved(Context context, Intent intent) {
        PackageManager pm = context.getPackageManager();
        return pm.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY) != null;
    }
}

