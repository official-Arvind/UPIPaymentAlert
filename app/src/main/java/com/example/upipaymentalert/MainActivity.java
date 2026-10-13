package com.example.upipaymentalert;

import android.Manifest;
import android.app.DatePickerDialog;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.telephony.SmsManager;
import android.text.InputType;
import android.text.format.DateFormat;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.os.LocaleListCompat;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.upipaymentalert.db.AppDatabase;
import com.example.upipaymentalert.db.TransactionDao;
import com.example.upipaymentalert.model.PaymentTransaction;
import com.example.upipaymentalert.smsparser.AnnouncementPhrases;
import com.example.upipaymentalert.smsparser.SmsParser;
import com.google.android.material.slider.Slider;
import com.google.android.material.switchmaterial.SwitchMaterial;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Executors;

public class MainActivity extends AppCompatActivity {
    private static final int REQUEST_PERMISSIONS = 55001;

    private SharedPreferences prefs;
    private TextView permissionStatusTv;
    private DrawerLayout drawerLayout;
    private RecyclerView recyclerView;
    private PaymentAdapter adapter;
    private TextView totalBalanceTv;
    private View emptyStateLayout;

    private Spinner filterAppSpinner;
    private Spinner filterDateSpinner;
    private final List<String> filterAppPackages = new ArrayList<>();
    private long customStartTimestamp = 0;
    private long customEndTimestamp = Long.MAX_VALUE;

    private final BroadcastReceiver paymentReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            loadTransactions();
        }
    };

    @Override
    protected void attachBaseContext(Context newBase) {
        super.attachBaseContext(LocaleHelper.applyLocale(newBase));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Pre-warm Google TTS & Indian language voices (ported from C/S TtsEngineHelper.kt)
        TtsEngineHelper.prewarmAndPrepareVoiceData(this);

        initMainUI();
    }

    private void initMainUI() {
        prefs = getSharedPreferences("UPI_PREFS", MODE_PRIVATE);

        // Keep foreground service alive for continuous TTS announcements
        Intent svc = new Intent(this, ForegroundTtsService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(svc);
        } else {
            startService(svc);
        }

        permissionStatusTv = findViewById(R.id.permission_status_tv);
        drawerLayout = findViewById(R.id.drawer_layout);

        ImageButton menuButton = findViewById(R.id.menu_button);
        if (menuButton != null) {
            menuButton.setOnClickListener(v -> {
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                if (drawerLayout != null) {
                    drawerLayout.openDrawer(GravityCompat.END);
                }
            });
        }

        ImageButton drawerCloseButton = findViewById(R.id.drawer_close_button);
        if (drawerCloseButton != null) {
            drawerCloseButton.setOnClickListener(v -> {
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                if (drawerLayout != null) {
                    drawerLayout.closeDrawer(GravityCompat.END);
                }
            });
        }

        totalBalanceTv = findViewById(R.id.total_balance_tv);
        emptyStateLayout = findViewById(R.id.empty_state_layout);

        recyclerView = findViewById(R.id.recycler_view);
        if (recyclerView != null) {
            recyclerView.setLayoutManager(new LinearLayoutManager(this));
            adapter = new PaymentAdapter(new ArrayList<>());
            recyclerView.setAdapter(adapter);
        }

        filterAppSpinner = findViewById(R.id.filter_app_spinner);
        filterDateSpinner = findViewById(R.id.filter_date_spinner);
        setupFilters();

        ImageButton exportBtn = findViewById(R.id.export_csv_btn);
        if (exportBtn != null) {
            exportBtn.setOnClickListener(v -> {
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                exportTransactionsToHtml();
            });
        }

        loadTransactions();

        setupLanguageSpinner();
        setupVolumeSlider();
        setupSpeedSlider();
        setupUpiAppsSpinner();
        setupTestButtons();
        setupSmsForwarder();

        SwitchMaterial announceSenderSwitch = findViewById(R.id.announce_sender_switch);
        if (announceSenderSwitch != null) {
            announceSenderSwitch.setChecked(prefs.getBoolean("announce_sender_name", true));
            announceSenderSwitch.setOnCheckedChangeListener((btn, isChecked) -> {
                btn.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                prefs.edit().putBoolean("announce_sender_name", isChecked).apply();
            });
        }

        SwitchMaterial masterMuteSwitch = findViewById(R.id.master_mute_switch);
        if (masterMuteSwitch != null) {
            masterMuteSwitch.setChecked(prefs.getBoolean("is_muted", false));
            masterMuteSwitch.setOnCheckedChangeListener((btn, isChecked) -> {
                btn.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                prefs.edit().putBoolean("is_muted", isChecked).apply();
                Toast.makeText(MainActivity.this, isChecked ? "Announcements Muted \uD83D\uDD15" : "Announcements Unmuted \uD83D\uDD0A", Toast.LENGTH_SHORT).show();
            });
        }

        Button grantPermissionsBtn = findViewById(R.id.grant_permissions_button);
        if (grantPermissionsBtn != null) {
            grantPermissionsBtn.setOnClickListener(v -> {
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                requestAllPermissions();
            });
        }

        checkPermissionsStatus();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(paymentReceiver, new IntentFilter("com.example.upipaymentalert.PAYMENT_RECEIVED"), Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(paymentReceiver, new IntentFilter("com.example.upipaymentalert.PAYMENT_RECEIVED"));
        }

        Button appVersionBtn = findViewById(R.id.app_version_button);
        if (appVersionBtn != null) {
            appVersionBtn.setText("App Version: " + BuildConfig.VERSION_NAME);
            appVersionBtn.setOnClickListener(v -> {
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("UPI Payment Alert " + BuildConfig.VERSION_NAME)
                        .setMessage("Open Source Community Edition\nVersion: " + BuildConfig.VERSION_NAME + "\n\nReal-time voice alerts for UPI payments in 13 Indian languages.")
                        .setPositiveButton("OK", null)
                        .show();
            });
        }

        setupAppLanguageButton();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(paymentReceiver);
        } catch (Exception ignored) {}
    }

    private void setupFilters() {
        if (filterDateSpinner == null || filterAppSpinner == null) return;

        final String[] dates = {"All Dates", "Today", "Yesterday", "Custom..."};
        final ArrayAdapter<String> dateAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, dates);
        dateAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        filterDateSpinner.setAdapter(dateAdapter);

        Intent upiIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay"));
        List<ResolveInfo> apps = getPackageManager().queryIntentActivities(upiIntent, 0);
        List<String> appLabels = new ArrayList<>();
        filterAppPackages.clear();
        filterAppPackages.add("all");
        appLabels.add("All Apps");

        for (ResolveInfo info : apps) {
            if (info.activityInfo != null) {
                String pkg = info.activityInfo.packageName;
                if (!filterAppPackages.contains(pkg)) {
                    filterAppPackages.add(pkg);
                    appLabels.add(info.loadLabel(getPackageManager()).toString());
                }
            }
        }

        ArrayAdapter<String> appAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, appLabels);
        appAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        filterAppSpinner.setAdapter(appAdapter);

        AdapterView.OnItemSelectedListener filterListener = new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (parent == filterDateSpinner && position == 3) {
                    Calendar calendar = Calendar.getInstance();
                    new DatePickerDialog(MainActivity.this, (picker, year, month, dayOfMonth) -> {
                        Calendar sel = Calendar.getInstance();
                        sel.set(year, month, dayOfMonth, 0, 0, 0);
                        customStartTimestamp = sel.getTimeInMillis();
                        sel.set(year, month, dayOfMonth, 23, 59, 59);
                        customEndTimestamp = sel.getTimeInMillis();

                        String formatted = DateFormat.format("MMM d, yyyy", sel).toString();
                        dates[3] = formatted;
                        dateAdapter.notifyDataSetChanged();

                        loadTransactions();
                    }, calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH)).show();
                    return;
                }
                loadTransactions();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        };

        filterDateSpinner.setOnItemSelectedListener(filterListener);
        filterAppSpinner.setOnItemSelectedListener(filterListener);
    }

    private void loadTransactions() {
        if (filterAppSpinner == null || filterDateSpinner == null) return;

        int appPos = filterAppSpinner.getSelectedItemPosition();
        int datePos = filterDateSpinner.getSelectedItemPosition();

        String selectedPackage = appPos > 0 && appPos < filterAppPackages.size() ? filterAppPackages.get(appPos) : "all";

        long startTimestamp = 0;
        long endTimestamp = Long.MAX_VALUE;

        Calendar cal = Calendar.getInstance();
        if (datePos == 1) { // Today
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            startTimestamp = cal.getTimeInMillis();
        } else if (datePos == 2) { // Yesterday
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            endTimestamp = cal.getTimeInMillis() - 1;
            cal.add(Calendar.DAY_OF_YEAR, -1);
            startTimestamp = cal.getTimeInMillis();
        } else if (datePos == 3) { // Custom
            startTimestamp = customStartTimestamp;
            endTimestamp = customEndTimestamp;
        }

        final long finalStart = startTimestamp;
        final long finalEnd = endTimestamp;

        Executors.newSingleThreadExecutor().execute(() -> {
            TransactionDao dao = AppDatabase.getInstance(getApplicationContext()).transactionDao();
            List<PaymentTransaction> transactions;

            if ("all".equals(selectedPackage)) {
                if (datePos == 0) {
                    transactions = dao.getAllTransactions();
                } else {
                    transactions = dao.getTransactionsByDate(finalStart, finalEnd);
                }
            } else {
                if (datePos == 0) {
                    transactions = dao.getTransactionsByApp(selectedPackage);
                } else {
                    transactions = dao.getTransactionsByAppAndDate(selectedPackage, finalStart, finalEnd);
                }
            }

            double totalBalance = 0;
            for (PaymentTransaction t : transactions) {
                try {
                    double amount = Double.parseDouble(t.amount);
                    if ("credit".equals(t.type)) {
                        totalBalance += amount;
                    } else {
                        totalBalance -= amount;
                    }
                } catch (NumberFormatException ignored) {}
            }

            final double finalBalance = totalBalance;
            runOnUiThread(() -> {
                if (adapter != null) {
                    adapter.setTransactions(transactions);
                }
                if (emptyStateLayout != null) {
                    emptyStateLayout.setVisibility(transactions.isEmpty() ? View.VISIBLE : View.GONE);
                }
                if (totalBalanceTv != null) {
                    totalBalanceTv.setText(String.format(Locale.US, "₹%.2f", finalBalance));
                }
            });
        });
    }

    private void setupLanguageSpinner() {
        Spinner langSpinner = findViewById(R.id.lang_spinner);
        if (langSpinner == null) return;

        String[] languages = AnnouncementPhrases.SUPPORTED_LANGUAGES;
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, languages);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        langSpinner.setAdapter(adapter);

        String savedLang = prefs.getString("language", "English");
        int index = 0;
        for (int i = 0; i < languages.length; i++) {
            if (languages[i].equalsIgnoreCase(savedLang)) {
                index = i;
                break;
            }
        }
        langSpinner.setSelection(index);

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
        Slider volumeSlider = findViewById(R.id.volume_slider);
        TextView volumeValue = findViewById(R.id.volume_value);
        if (volumeSlider == null || volumeValue == null) return;

        int savedVolume = prefs.getInt("volume", 100);
        volumeSlider.setValue(savedVolume);
        updateVolumeLabel(volumeValue, savedVolume);

        volumeSlider.addOnChangeListener((slider, value, fromUser) -> {
            if (fromUser) {
                slider.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
            }
            int progress = (int) value;
            updateVolumeLabel(volumeValue, progress);
            prefs.edit().putInt("volume", progress).apply();
        });
    }

    private void updateVolumeLabel(TextView tv, int volume) {
        if (tv == null) return;
        if (volume > 100) {
            tv.setText(volume + "% (Boosted)");
        } else {
            tv.setText(volume + "%");
        }
    }

    private void setupSpeedSlider() {
        Slider speedSlider = findViewById(R.id.speed_slider);
        TextView speedValue = findViewById(R.id.speed_value);
        if (speedSlider == null || speedValue == null) return;

        int savedSpeedInt = prefs.getInt("speed_int", 5);
        speedSlider.setValue(savedSpeedInt);
        float actualSpeed = 0.5f + (savedSpeedInt * 0.1f);
        speedValue.setText(String.format(Locale.US, "%.1fx", actualSpeed));

        speedSlider.addOnChangeListener((slider, value, fromUser) -> {
            if (fromUser) {
                slider.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
            }
            int progress = (int) value;
            float currentSpeed = 0.5f + (progress * 0.1f);
            speedValue.setText(String.format(Locale.US, "%.1fx", currentSpeed));
            prefs.edit().putInt("speed_int", progress)
                    .putInt("speed_progress", progress)
                    .putFloat("speed_value", currentSpeed)
                    .putFloat("speed_float", currentSpeed).apply();
        });
    }

    private void setupTestButtons() {
        Button testSound = findViewById(R.id.test_sound_button);
        Button testAmount = findViewById(R.id.test_sound_amount_button);
        EditText amountInput = findViewById(R.id.amount_input);

        if (testSound != null) {
            testSound.setOnClickListener(v -> {
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                String lang = prefs.getString("language", "English");
                boolean announceSender = prefs.getBoolean("announce_sender_name", true);
                String fakeBody = "Rs 500.00 credited to your A/c";
                String phrase = new SmsParser().getAmountFromMessageBody(MainActivity.this, fakeBody, lang, announceSender, "Test User");
                sendSpeakIntent(phrase);
            });
        }

        if (testAmount != null) {
            testAmount.setOnClickListener(v -> {
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                String amt = amountInput != null ? amountInput.getText().toString().trim() : "";
                if (amt.isEmpty()) amt = "1500.00";
                String lang = prefs.getString("language", "English");
                boolean announceSender = prefs.getBoolean("announce_sender_name", true);
                String fakeBody = "Rs " + amt + " credited to your A/c";
                String phrase = new SmsParser().getAmountFromMessageBody(MainActivity.this, fakeBody, lang, announceSender, "Test User");
                sendSpeakIntent(phrase);
            });
        }
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
        if (upiSpinner == null || appsView == null) return;

        Intent upiIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay"));
        List<ResolveInfo> apps = getPackageManager().queryIntentActivities(upiIntent, 0);

        List<String> labels = new ArrayList<>();
        labels.add("All UPI Payments");

        StringBuilder sb = new StringBuilder("Detected Apps:\n");
        for (ResolveInfo info : apps) {
            if (info.activityInfo != null) {
                CharSequence label = info.loadLabel(getPackageManager());
                String entry = label + " (" + info.activityInfo.packageName + ")";
                labels.add(entry);
                sb.append(entry).append("\n");
            }
        }

        appsView.setText(sb.toString());
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, labels);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        upiSpinner.setAdapter(adapter);
        upiSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position > 0) {
                    Toast.makeText(MainActivity.this, "We automatically monitor all these apps.", Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    private void setupSmsForwarder() {
        EditText numberInput = findViewById(R.id.forwarder_number_input);
        Button setButton = findViewById(R.id.forwarder_set_button);
        ImageButton eyeButton = findViewById(R.id.forwarder_eye_button);
        Spinner paymentFilterSpinner = findViewById(R.id.forwarder_payment_filter_spinner);
        Spinner typeFilterSpinner = findViewById(R.id.forwarder_type_filter_spinner);

        if (numberInput == null || setButton == null) return;

        String savedNumber = prefs.getString("forwarder_number", "");
        if (!savedNumber.isEmpty()) {
            numberInput.setText(savedNumber);
            numberInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            setButton.setVisibility(View.GONE);
            if (eyeButton != null) eyeButton.setVisibility(View.VISIBLE);
        }

        if (paymentFilterSpinner != null) {
            Intent upiIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay"));
            List<ResolveInfo> apps = getPackageManager().queryIntentActivities(upiIntent, 0);
            List<String> appLabels = new ArrayList<>();
            List<String> appPackages = new ArrayList<>();
            appLabels.add("All Payment Apps");
            appPackages.add("all");
            for (ResolveInfo info : apps) {
                if (info.activityInfo != null) {
                    appLabels.add(info.loadLabel(getPackageManager()).toString());
                    appPackages.add(info.activityInfo.packageName);
                }
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
        }

        if (typeFilterSpinner != null) {
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
        }

        numberInput.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            numberInput.setInputType(InputType.TYPE_CLASS_PHONE);
            setButton.setVisibility(View.VISIBLE);
            if (eyeButton != null) eyeButton.setVisibility(View.GONE);
        });

        numberInput.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                numberInput.setInputType(InputType.TYPE_CLASS_PHONE);
                setButton.setVisibility(View.VISIBLE);
                if (eyeButton != null) eyeButton.setVisibility(View.GONE);
            }
        });

        if (eyeButton != null) {
            eyeButton.setOnClickListener(v -> {
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                if (numberInput.getInputType() == (InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD)) {
                    numberInput.setInputType(InputType.TYPE_CLASS_PHONE);
                } else {
                    numberInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                }
                numberInput.setSelection(numberInput.getText().length());
            });
        }

        setButton.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
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
                    .setMessage("The SMS Forwarder uses standard carrier networks. Real text messages may incur standard SMS charges.\n\nWe will send a test message right now to confirm.")
                    .setPositiveButton("I Accept", (dialog, which) -> {
                        try {
                            SmsManager smsManager;
                            if (Build.VERSION.SDK_INT >= 31) {
                                smsManager = getSystemService(SmsManager.class);
                            } else {
                                smsManager = SmsManager.getDefault();
                            }
                            smsManager.sendTextMessage(number, null, "UPI Payment Alert: Test SMS Forwarder", null, null);
                            prefs.edit().putString("forwarder_number", number).apply();
                            numberInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                            setButton.setVisibility(View.GONE);
                            if (eyeButton != null) eyeButton.setVisibility(View.VISIBLE);
                            Toast.makeText(this, "✅ Number configured & test SMS sent!", Toast.LENGTH_LONG).show();
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

        String enabledListeners = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        if (enabledListeners == null || !enabledListeners.contains(getPackageName())) {
            allGranted = false;
        }

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
            allGranted = false;
        }

        View permissionBanner = findViewById(R.id.permission_banner);
        if (permissionBanner != null) {
            if (allGranted) {
                permissionBanner.setVisibility(View.GONE);
            } else {
                permissionBanner.setVisibility(View.VISIBLE);
                if (permissionStatusTv != null) {
                    permissionStatusTv.setText("Some permissions are missing. Please grant them for alerts to work reliably.");
                }
            }
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
        String enabledListeners = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        if (enabledListeners == null || !enabledListeners.contains(getPackageName())) {
            Toast.makeText(this, "Please enable Notification Access for UPI Payment Alert", Toast.LENGTH_LONG).show();
            startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS));
            return;
        }

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
            new AlertDialog.Builder(this)
                    .setTitle("Step 1: Unrestricted Battery Usage")
                    .setMessage("To ensure alerts trigger reliably when your screen is off, please allow Unrestricted Battery Usage.")
                    .setPositiveButton("Go", (dialog, which) -> {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName()));
                        startActivity(intent);
                    })
                    .show();
            return;
        }

        Intent autoStartIntent = AutoStartHelper.getAutoStartIntent(this);
        if (autoStartIntent != null && !prefs.getBoolean("has_prompted_autostart", false)) {
            String title = "Step 2: Auto Start Settings";
            String msg = "Your device (" + Build.MANUFACTURER + ") has aggressive background limits.\nPlease enable 'Auto Start' or remove background restrictions on the next screen.";
            if ("samsung".equalsIgnoreCase(Build.MANUFACTURER)) {
                title = "Step 2: Never Auto Sleeping";
                msg = "Samsung devices freeze background apps. Please set battery to 'Unrestricted' or add this app to 'Never auto sleeping apps'.";
            }
            new AlertDialog.Builder(this)
                    .setTitle(title)
                    .setMessage(msg)
                    .setPositiveButton("Go to Settings", (dialog, which) -> {
                        prefs.edit().putBoolean("has_prompted_autostart", true).apply();
                        try {
                            startActivity(autoStartIntent);
                        } catch (Exception e) {
                            Toast.makeText(this, "Auto-start screen not found.", Toast.LENGTH_SHORT).show();
                        }
                    })
                    .show();
            return;
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

        try {
            android.content.ComponentName componentName = new android.content.ComponentName(this, NotificationListener.class);
            android.service.notification.NotificationListenerService.requestRebind(componentName);
        } catch (Exception ignored) {}
    }

    private void exportTransactionsToHtml() {
        if (adapter == null) return;
        List<PaymentTransaction> transactionsToExport = adapter.getTransactions();

        if (transactionsToExport == null || transactionsToExport.isEmpty()) {
            Toast.makeText(this, "No transactions to export", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            String fileName = "UPI_Statement_" + new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date()) + ".html";
            OutputStream fos = null;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, "text/html");
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri != null) {
                    fos = getContentResolver().openOutputStream(uri);
                }
            } else {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 100);
                    Toast.makeText(this, "Storage permission required to export.", Toast.LENGTH_LONG).show();
                    return;
                }
                File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File file = new File(downloadDir, fileName);
                fos = new FileOutputStream(file);
            }

            if (fos != null) {
                PrintWriter writer = new PrintWriter(new OutputStreamWriter(fos, "UTF-8"));

                writer.println("<!DOCTYPE html><html><head><meta charset=\"UTF-8\">");
                writer.println("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
                writer.println("<title>Transaction Statement</title>");
                writer.println("<style>");
                writer.println("@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');");
                writer.println("body { font-family: 'Inter', sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 20px; }");
                writer.println(".container { max-width: 800px; margin: 0 auto; background: #1E293B; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }");
                writer.println(".header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #334155; padding-bottom: 20px; }");
                writer.println(".header h1 { margin: 0 0 10px 0; color: #F8FAFC; font-size: 28px; }");
                writer.println(".header p { margin: 0; color: #94A3B8; font-size: 14px; }");
                writer.println("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
                writer.println("th { background-color: #0F172A; color: #94A3B8; text-transform: uppercase; font-size: 12px; font-weight: 600; padding: 12px; text-align: left; }");
                writer.println("th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }");
                writer.println("th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }");
                writer.println("td { padding: 16px 12px; border-bottom: 1px solid #334155; font-size: 14px; vertical-align: middle; }");
                writer.println("tr:last-child td { border-bottom: none; }");
                writer.println(".sender { font-weight: 600; color: #E2E8F0; }");
                writer.println(".date-time { color: #94A3B8; font-size: 12px; margin-top: 4px; }");
                writer.println(".amount { font-weight: 700; font-size: 16px; text-align: right; }");
                writer.println(".credit { color: #10B981; }");
                writer.println(".debit { color: #EF4444; }");
                writer.println(".details { font-size: 12px; color: #64748B; max-width: 250px; line-height: 1.4; }");
                writer.println("</style></head><body>");

                writer.println("<div class=\"container\">");
                writer.println("<div class=\"header\">");
                writer.println("<h1>UPI Payment Statement</h1>");
                writer.println("<p>Generated on " + new SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.US).format(new Date()) + "</p>");
                writer.println("</div>");

                writer.println("<table>");
                writer.println("<thead><tr><th>Transaction</th><th>Details</th><th style=\"text-align:right;\">Amount</th></tr></thead>");
                writer.println("<tbody>");

                SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMM yyyy", Locale.US);
                SimpleDateFormat timeFormat = new SimpleDateFormat("hh:mm a", Locale.US);

                for (PaymentTransaction t : transactionsToExport) {
                    Date d = new Date(t.timestamp);
                    String dateStr = dateFormat.format(d);
                    String timeStr = timeFormat.format(d);

                    String type = t.type != null ? t.type.toLowerCase() : "unknown";
                    String sender = t.sender != null ? t.sender : "Unknown Sender";
                    String amount = t.amount != null ? t.amount : "0.00";
                    String body = t.body != null ? t.body.replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;") : "";

                    boolean isCredit = !type.equals("debit");
                    String sign = isCredit ? "+" : "-";
                    String colorClass = isCredit ? "credit" : "debit";

                    writer.println("<tr>");
                    writer.println("<td><div class=\"sender\">" + sender + "</div><div class=\"date-time\">" + dateStr + " • " + timeStr + "</div></td>");
                    writer.println("<td><div class=\"details\">" + body + "</div></td>");
                    writer.println("<td><div class=\"amount " + colorClass + "\">" + sign + "₹" + amount + "</div></td>");
                    writer.println("</tr>");
                }

                writer.println("</tbody></table>");
                writer.println("</div></body></html>");

                writer.flush();
                writer.close();
                fos.close();
                Toast.makeText(this, "✅ Statement exported to Downloads!", Toast.LENGTH_LONG).show();
            }
        } catch (Exception e) {
            Toast.makeText(this, "Failed to export statement: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void setupAppLanguageButton() {
        Button langBtn = findViewById(R.id.app_language_button);
        TextView langSubtitle = findViewById(R.id.app_language_subtitle_tv);
        if (langBtn == null) return;

        String[] options = LocaleHelper.SUPPORTED_NAMES;
        String[] codes   = LocaleHelper.SUPPORTED_CODES;

        String current = LocaleHelper.getLanguage(this);
        String currentName = "English";
        for (int i = 0; i < codes.length; i++) {
            if (codes[i].equals(current)) {
                currentName = options[i];
                break;
            }
        }
        if (langSubtitle != null) {
            langSubtitle.setText(currentName);
        }

        langBtn.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);

            int startIdx = 0;
            for (int i = 0; i < codes.length; i++) {
                if (codes[i].equals(current)) { startIdx = i; break; }
            }
            final int[] selected = {startIdx};

            new AlertDialog.Builder(this)
                    .setTitle("Select App Language")
                    .setSingleChoiceItems(options, startIdx, (dialog, which) -> selected[0] = which)
                    .setPositiveButton("Apply", (dialog, which) -> {
                        String chosenCode = codes[selected[0]];
                        LocaleHelper.setAppLanguage(this, chosenCode, true);
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        });
    }
}
