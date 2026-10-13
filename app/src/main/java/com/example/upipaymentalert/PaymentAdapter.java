package com.example.upipaymentalert;

import android.animation.ObjectAnimator;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.text.format.DateUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.upipaymentalert.model.PaymentTransaction;

import java.util.List;

public class PaymentAdapter extends RecyclerView.Adapter<PaymentAdapter.ViewHolder> {

    private static final java.util.Map<String, android.graphics.drawable.Drawable> iconCache = new java.util.HashMap<>();
    private List<PaymentTransaction> transactions;
    private int lastPosition = -1;

    public PaymentAdapter(List<PaymentTransaction> transactions) {
        this.transactions = transactions;
    }

    public void setTransactions(List<PaymentTransaction> transactions) {
        this.transactions = transactions;
        notifyDataSetChanged();
    }

    public List<PaymentTransaction> getTransactions() {
        return transactions;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_payment, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        PaymentTransaction t = transactions.get(position);

        String senderLabel = t.sender != null && !t.sender.isEmpty() ? t.sender : "Unknown";
        
        String packageNameToExtractIcon = null;
        if (t.sender != null && t.sender.contains(".")) {
            packageNameToExtractIcon = t.sender;
        }

        // Format known package names cleanly for notification transactions
        if (senderLabel.contains("com.google.android.apps.nbu.paisa.user") || senderLabel.toLowerCase().contains("gpay") || senderLabel.toLowerCase().contains("google pay")) {
            senderLabel = "Google Pay";
            packageNameToExtractIcon = "com.google.android.apps.nbu.paisa.user";
        } else if (senderLabel.contains("com.phonepe.app") || senderLabel.toLowerCase().contains("phonepe")) {
            senderLabel = "PhonePe";
            packageNameToExtractIcon = "com.phonepe.app";
        } else if (senderLabel.contains("net.one97.paytm") || senderLabel.toLowerCase().contains("paytm")) {
            senderLabel = "Paytm";
            packageNameToExtractIcon = "net.one97.paytm";
        } else if (senderLabel.contains("in.org.npci.upiapp") || senderLabel.toLowerCase().contains("bhim")) {
            senderLabel = "BHIM";
            packageNameToExtractIcon = "in.org.npci.upiapp";
        } else if (senderLabel.contains("com.dreamplug.androidapp") || senderLabel.toLowerCase().contains("cred")) {
            senderLabel = "Cred";
            packageNameToExtractIcon = "com.dreamplug.androidapp";
        } else if (senderLabel.contains("in.amazon.mShop.android.shopping") || senderLabel.toLowerCase().contains("amazon pay")) {
            senderLabel = "Amazon Pay";
            packageNameToExtractIcon = "in.amazon.mShop.android.shopping";
        } else if (senderLabel.contains("com.sbi.upi.intent")) {
            senderLabel = "SBI Pay";
            packageNameToExtractIcon = "com.sbi.upi.intent";
        } else if (senderLabel.contains(".")) {
            senderLabel = "App Notification";
        }

        if (packageNameToExtractIcon != null && !packageNameToExtractIcon.isEmpty()) {
            if (iconCache.containsKey(packageNameToExtractIcon)) {
                android.graphics.drawable.Drawable icon = iconCache.get(packageNameToExtractIcon);
                if (icon != null) {
                    holder.appIconIv.setImageDrawable(icon);
                    holder.appIconIv.setVisibility(View.VISIBLE);
                    holder.rupeeTv.setVisibility(View.GONE);
                } else {
                    holder.appIconIv.setVisibility(View.GONE);
                    holder.rupeeTv.setVisibility(View.VISIBLE);
                }
            } else {
                try {
                    android.graphics.drawable.Drawable icon = holder.itemView.getContext().getPackageManager().getApplicationIcon(packageNameToExtractIcon);
                    iconCache.put(packageNameToExtractIcon, icon);
                    holder.appIconIv.setImageDrawable(icon);
                    holder.appIconIv.setVisibility(View.VISIBLE);
                    holder.rupeeTv.setVisibility(View.GONE);
                } catch (Exception e) {
                    iconCache.put(packageNameToExtractIcon, null);
                    holder.appIconIv.setVisibility(View.GONE);
                    holder.rupeeTv.setVisibility(View.VISIBLE);
                }
            }
        } else {
            holder.appIconIv.setVisibility(View.GONE);
            holder.rupeeTv.setVisibility(View.VISIBLE);
        }
        
        holder.senderTv.setText(senderLabel);
        holder.timeTv.setText(getRelativeTimeSpan(t.timestamp));
        holder.bodyTv.setText(t.body);

        android.graphics.drawable.Drawable bgDrawable = holder.colorCircle.getBackground();
        GradientDrawable bgShape = null;
        if (bgDrawable instanceof GradientDrawable) {
            bgShape = (GradientDrawable) bgDrawable;
        }

        if ("credit".equals(t.type)) {
            holder.amountTv.setText("+₹" + t.amount);
            holder.amountTv.setTextColor(Color.parseColor("#10B981"));
            if (bgShape != null) bgShape.setColor(Color.parseColor("#10B981"));
        } else {
            holder.amountTv.setText("-₹" + t.amount);
            holder.amountTv.setTextColor(Color.parseColor("#EF4444"));
            if (bgShape != null) bgShape.setColor(Color.parseColor("#EF4444"));
        }

        // Expand/Collapse logic
        holder.bodyTv.setVisibility(View.GONE);
        holder.itemView.setOnClickListener(v -> {
            if (holder.bodyTv.getVisibility() == View.GONE) {
                holder.bodyTv.setVisibility(View.VISIBLE);
            } else {
                holder.bodyTv.setVisibility(View.GONE);
            }
        });

        // Animation
        setAnimation(holder.itemView, position);
    }

    private void setAnimation(View viewToAnimate, int position) {
        if (position > lastPosition) {
            ObjectAnimator animator = ObjectAnimator.ofFloat(viewToAnimate, "translationY", 100f, 0f);
            animator.setDuration(300);
            animator.start();
            ObjectAnimator alpha = ObjectAnimator.ofFloat(viewToAnimate, "alpha", 0f, 1f);
            alpha.setDuration(300);
            alpha.start();
            lastPosition = position;
        }
    }

    @Override
    public int getItemCount() {
        return transactions != null ? transactions.size() : 0;
    }

    private String getRelativeTimeSpan(long timestamp) {
        return DateUtils.getRelativeTimeSpanString(
                timestamp,
                System.currentTimeMillis(),
                DateUtils.MINUTE_IN_MILLIS,
                DateUtils.FORMAT_ABBREV_RELATIVE
        ).toString();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        View colorCircle;
        android.widget.ImageView appIconIv;
        TextView rupeeTv;
        TextView senderTv;
        TextView timeTv;
        TextView amountTv;
        TextView bodyTv;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            colorCircle = itemView.findViewById(R.id.color_circle);
            appIconIv = itemView.findViewById(R.id.app_icon_iv);
            rupeeTv = itemView.findViewById(R.id.rupee_tv);
            senderTv = itemView.findViewById(R.id.sender_tv);
            timeTv = itemView.findViewById(R.id.time_tv);
            amountTv = itemView.findViewById(R.id.amount_tv);
            bodyTv = itemView.findViewById(R.id.body_tv);
        }
    }
}

