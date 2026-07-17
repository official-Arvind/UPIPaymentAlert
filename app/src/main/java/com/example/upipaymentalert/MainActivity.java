// ============================================================================
// MainActivity Control Panel — UPI Payment Alert
// Serves as the user-facing configuration console and first-run permission wizard.
// Sets up user selections (language, volume, speed) and handles direct testing.
// ============================================================================
package com.example.upipaymentalert;

import android.Manifest;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.SeekBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ImageButton;
import android.text.InputType;
import android.app.AlertDialog;
import android.telephony.SmsManager;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    private static final int REQUEST_PERMISSIONS = 55001;

    private SharedPreferences prefs;
    private TextView permissionStatusTv;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        prefs = getSharedPreferences("UPI_PREFS", MODE_PRIVATE);

        // Start Foreground Service permanently
        Intent svc = new Intent(this, ForegroundTtsService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(svc);
        } else {
            startService(svc);
        }

        permissionStatusTv = findViewById(R.id.permission_status_tv);

        // Setup UI Elements
        setupLanguageSpinner();
        setupVolumeSlider();
        setupSpeedSlider();
        setupUpiAppsSpinner();
        setupTestButtons();
        setupSmsForwarder();
        
        Button grantPermissionsBtn = findViewById(R.id.grant_permissions_button);
        grantPermissionsBtn.setOnClickListener(v -> requestAllPermissions());

        checkPermissionsStatus();
    }

    private void setupLanguageSpinner() {
        Spinner langSpinner = findViewById(R.id.lang_spinner);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, new String[]{"English", "Hindi"});
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        langSpinner.setAdapter(adapter);
        
        String savedLang = prefs.getString("language", "English");
        langSpinner.setSelection(savedLang.equals("Hindi") ? 1 : 0);
        
        langSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                prefs.edit().putString("language", (String) parent.getItemAtPosition(position)).apply();
            }
            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    private void setupVolumeSlider() {
        SeekBar volumeSlider = findViewById(R.id.volume_slider);
        TextView volumeValue = findViewById(R.id.volume_value);
        
        int savedVolume = prefs.getInt("volume", 15);
        volumeSlider.setProgress(savedVolume);
        volumeValue.setText(savedVolume + "%");

        volumeSlider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                volumeValue.setText(progress + "%");
                prefs.edit().putInt("volume", progress).apply();
            }
            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}
            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });
    }

    private void setupSpeedSlider() {
        SeekBar speedSlider = findViewById(R.id.speed_slider);
        TextView speedValue = findViewById(R.id.speed_value);
        
        int savedSpeedProgress = prefs.getInt("speed_progress", 5);
        speedSlider.setProgress(savedSpeedProgress);
        float speed = 0.5f + (savedSpeedProgress * 0.1f);
        speedValue.setText(String.format(java.util.Locale.US, "%.1fx", speed));

        speedSlider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                float speed = 0.5f + (progress * 0.1f);
                speedValue.setText(String.format(java.util.Locale.US, "%.1fx", speed));
                prefs.edit()
                     .putInt("speed_progress", progress)
                     .putFloat("speed_value", speed)
                     .apply();
            }
            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}
            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });
    }

    private void setupTestButtons() {
        Button testSound = findViewById(R.id.test_sound_button);
        Button testAmount = findViewById(R.id.test_sound_amount_button);
        EditText amountInput = findViewById(R.id.amount_input);

        testSound.setOnClickListener(v -> {
            String lang = prefs.getString("language", "English");
            String phrase = lang.equalsIgnoreCase("Hindi") ? "आपको भुगतान प्राप्त हुआ" : "Test sound, payment received";
            sendSpeakIntent(phrase);
        });

        testAmount.setOnClickListener(v -> {
            String amt = amountInput.getText().toString().trim();
            if (amt.isEmpty()) amt = "an amount";
            String lang = prefs.getString("language", "English");
            String phrase = lang.equalsIgnoreCase("Hindi") ? ("आपको |" + amt + "| रुपये प्राप्त हुए") : ("Received |" + amt + "| rupees");
            sendSpeakIntent(phrase);
        });
    }
    
    private void sendSpeakIntent(String text) {
        Intent svc = new Intent(this, ForegroundTtsService.class);
        svc.setAction(ForegroundTtsService.ACTION_SPEAK);
        svc.putExtra(ForegroundTtsService.EXTRA_TEXT, text);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(svc);
        } else {
            startService(svc);
        }
    }

    private void setupUpiAppsSpinner() {
        Spinner upiSpinner = findViewById(R.id.upi_spinner);
        TextView appsView = findViewById(R.id.upi_apps_tv);
        
        Intent upiIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay"));
        List<ResolveInfo> apps = getPackageManager().queryIntentActivities(upiIntent, 0);
        
        List<String> labels = new ArrayList<>();
        labels.add(getString(R.string.all_upi_payments));
        
        StringBuilder sb = new StringBuilder("Detected Apps:\n");
        for (ResolveInfo info : apps) {
            CharSequence label = info.loadLabel(getPackageManager());
            String entry = label + " (" + info.activityInfo.packageName + ")";
            labels.add(entry);
            sb.append(entry).append("\n");
        }
        
        appsView.setText(sb.toString());
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, labels);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        upiSpinner.setAdapter(adapter);
    }

    private void setupSmsForwarder() {
        EditText numberInput = findViewById(R.id.forwarder_number_input);
        Button setButton = findViewById(R.id.forwarder_set_button);
        ImageButton eyeButton = findViewById(R.id.forwarder_eye_button);
        Spinner paymentFilterSpinner = findViewById(R.id.forwarder_payment_filter_spinner);
        Spinner typeFilterSpinner = findViewById(R.id.forwarder_type_filter_spinner);

        // Load saved values
        String savedNumber = prefs.getString("forwarder_number", "");
        if (!savedNumber.isEmpty()) {
            numberInput.setText(savedNumber);
            numberInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            setButton.setVisibility(View.GONE);
            eyeButton.setVisibility(View.VISIBLE);
        }

        // Setup Payment Filter Spinner
        Intent upiIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay"));
        List<ResolveInfo> apps = getPackageManager().queryIntentActivities(upiIntent, 0);
        List<String> appLabels = new ArrayList<>();
        List<String> appPackages = new ArrayList<>();
        appLabels.add("All Payment Apps");
        appPackages.add("all");
        for (ResolveInfo info : apps) {
            appLabels.add(info.loadLabel(getPackageManager()).toString());
            appPackages.add(info.activityInfo.packageName);
        }
        ArrayAdapter<String> appAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, appLabels);
        appAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        paymentFilterSpinner.setAdapter(appAdapter);

        String savedAppFilter = prefs.getString("forwarder_app_filter", "all");
        int appIdx = appPackages.indexOf(savedAppFilter);
        if (appIdx >= 0) paymentFilterSpinner.setSelection(appIdx);

        paymentFilterSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                prefs.edit().putString("forwarder_app_filter", appPackages.get(position)).apply();
            }
            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        // Setup Type Filter Spinner
        String[] types = {"Credited", "Debited", "Both"};
        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, types);
        typeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        typeFilterSpinner.setAdapter(typeAdapter);

        String savedTypeFilter = prefs.getString("forwarder_type_filter", "Credited");
        int typeIdx = 0;
        if (savedTypeFilter.equals("Debited")) typeIdx = 1;
        else if (savedTypeFilter.equals("Both")) typeIdx = 2;
        typeFilterSpinner.setSelection(typeIdx);

        typeFilterSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                prefs.edit().putString("forwarder_type_filter", types[position]).apply();
            }
            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        // Toggle buttons on input click
        numberInput.setOnClickListener(v -> {
            numberInput.setInputType(InputType.TYPE_CLASS_PHONE);
            setButton.setVisibility(View.VISIBLE);
            eyeButton.setVisibility(View.GONE);
        });
        
        numberInput.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                numberInput.setInputType(InputType.TYPE_CLASS_PHONE);
                setButton.setVisibility(View.VISIBLE);
                eyeButton.setVisibility(View.GONE);
            }
        });

        eyeButton.setOnClickListener(v -> {
            if (numberInput.getInputType() == (InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD)) {
                numberInput.setInputType(InputType.TYPE_CLASS_PHONE);
            } else {
                numberInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            }
            numberInput.setSelection(numberInput.getText().length());
        });

        setButton.setOnClickListener(v -> {
            String number = numberInput.getText().toString().trim();
            if (number.isEmpty()) {
                prefs.edit().remove("forwarder_number").apply();
                Toast.makeText(this, "Forwarding disabled", Toast.LENGTH_SHORT).show();
                return;
            }

            if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Please grant SEND_SMS permission first", Toast.LENGTH_SHORT).show();
                requestAllPermissions();
                return;
            }

            new AlertDialog.Builder(this)
                .setTitle("⚠️ Carrier SMS Charges")
                .setMessage("Yikes! The SMS Forwarder uses standard carrier networks. This means real text messages and real money if you don't have an unlimited plan! \n\nWe will send a test message right now to confirm.")
                .setPositiveButton("I Accept", (dialog, which) -> {
                    try {
                        SmsManager smsManager = SmsManager.getDefault();
                        smsManager.sendTextMessage(number, null, "UPI Payment Alert: Test SMS Forwarder", null, null);
                        prefs.edit().putString("forwarder_number", number).apply();
                        numberInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                        setButton.setVisibility(View.GONE);
                        eyeButton.setVisibility(View.VISIBLE);
                        Toast.makeText(this, "✅ Number set & test SMS sent!", Toast.LENGTH_LONG).show();
                    } catch (Exception e) {
                        Toast.makeText(this, "Failed to send SMS: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
        });
    }

    private void checkPermissionsStatus() {
        boolean allGranted = true;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) allGranted = false;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) allGranted = false;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) allGranted = false;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) allGranted = false;
        }

        // Notification Listener
        String enabledListeners = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        if (enabledListeners == null || !enabledListeners.contains(getPackageName())) {
            allGranted = false;
        }

        // Battery Optimization
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
            allGranted = false;
        }

        Button grantPermissionsBtn = findViewById(R.id.grant_permissions_button);

        if (allGranted) {
            permissionStatusTv.setVisibility(View.GONE);
            grantPermissionsBtn.setVisibility(View.GONE);
        } else {
            permissionStatusTv.setVisibility(View.VISIBLE);
            grantPermissionsBtn.setVisibility(View.VISIBLE);
            permissionStatusTv.setText("Some permissions are missing. Please grant them for the app to work reliably.");
            permissionStatusTv.setTextColor(ContextCompat.getColor(this, R.color.jigar_error));
        }
    }

    private void requestAllPermissions() {
        List<String> missing = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) missing.add(Manifest.permission.RECEIVE_SMS);
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) missing.add(Manifest.permission.READ_SMS);
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) missing.add(Manifest.permission.SEND_SMS);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) missing.add(Manifest.permission.POST_NOTIFICATIONS);
        }

        if (!missing.isEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toArray(new String[0]), REQUEST_PERMISSIONS);
        } else {
            requestSpecialPermissions();
        }
    }

    private void requestSpecialPermissions() {
        // Notification Listener
        String enabledListeners = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        if (enabledListeners == null || !enabledListeners.contains(getPackageName())) {
            Toast.makeText(this, "Please enable Notification Access for UPIPaymentAlert", Toast.LENGTH_LONG).show();
            startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS));
            return;
        }

        // Battery Optimization
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
            Toast.makeText(this, "Please disable battery optimization to keep app running", Toast.LENGTH_LONG).show();
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        }
        
        checkPermissionsStatus();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_PERMISSIONS) {
            requestSpecialPermissions();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        checkPermissionsStatus();
        
        String last = prefs.getString("last_sms", "");
        if (last != null && !last.isEmpty()) {
            TextView viewSMS = findViewById(R.id.view_sms_tv);
            viewSMS.setText(last);
        }
    }
}
