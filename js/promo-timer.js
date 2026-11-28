/* ==========================================================================
   UPI Payment Alert — Launch Offer Controller (3-Month Free Promo Window)
   Active window: 28 Nov 2026 -> 28 Feb 2027 23:59:59 IST (+05:30)
   After expiry, UI automatically switches Complete Edition back to ₹199 checkout.
   Zero external tracking, zero network beacons, zero telemetry.
   ========================================================================== */
(function (global) {
  'use strict';

  var PROMO_END_ISO = '2027-02-28T23:59:59+05:30';
  var PROMO_END_MS = Date.parse(PROMO_END_ISO);

  var COMPLETE_APK_URL = 'https://www.mediafire.com/file/ptx6k7k7fiy8jly/app-complete-release.apk/file';
  var OS_RELEASE_APK_URL = 'https://github.com/official-Arvind/UPIPaymentAlert/releases/latest';

  function getNowMs() {
    if (typeof global.__PROMO_TEST_NOW_MS__ === 'number') {
      return global.__PROMO_TEST_NOW_MS__;
    }
    return Date.now();
  }

  function getPromoState(nowMs) {
    var ts = typeof nowMs === 'number' ? nowMs : getNowMs();
    var diff = PROMO_END_MS - ts;
    if (diff > 0) {
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      return {
        isFree: true,
        remainingMs: diff,
        days: days,
        hours: hours,
        minutes: mins,
        endDateLabel: '28 Feb 2027',
        countdownText: days + 'd ' + hours + 'h ' + mins + 'm left',
        completeApkUrl: COMPLETE_APK_URL,
        osApkUrl: OS_RELEASE_APK_URL
      };
    }
    return {
      isFree: false,
      remainingMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      endDateLabel: '28 Feb 2027',
      countdownText: 'Offer ended',
      completeApkUrl: COMPLETE_APK_URL,
      osApkUrl: OS_RELEASE_APK_URL
    };
  }

  function applyPromoToDOM(doc) {
    if (!doc) return;
    var state = getPromoState();

    // Update countdown readouts
    doc.querySelectorAll('[data-promo-countdown]').forEach(function (el) {
      el.textContent = state.countdownText;
    });

    // Toggle elements marked for promo-active vs promo-expired
    doc.querySelectorAll('[data-promo-active]').forEach(function (el) {
      el.hidden = !state.isFree;
      if (!state.isFree) {
        el.style.display = 'none';
      } else {
        el.style.removeProperty('display');
      }
    });

    doc.querySelectorAll('[data-promo-expired]').forEach(function (el) {
      el.hidden = state.isFree;
      if (state.isFree) {
        el.style.display = 'none';
      } else {
        el.style.removeProperty('display');
      }
    });

    // Update hero/nav CTAs & labels tagged with data-promo-cta
    doc.querySelectorAll('[data-promo-cta]').forEach(function (el) {
      var freeText = el.getAttribute('data-free-text');
      var paidText = el.getAttribute('data-paid-text');
      var freeHref = el.getAttribute('data-free-href');
      var paidHref = el.getAttribute('data-paid-href');
      if (state.isFree) {
        if (freeText) el.textContent = freeText;
        if (freeHref) el.setAttribute('href', freeHref);
      } else {
        if (paidText) el.textContent = paidText;
        if (paidHref) el.setAttribute('href', paidHref);
      }
    });

    // Ensure Open-Source links point cleanly
    doc.querySelectorAll('[data-os-release-link]').forEach(function (el) {
      el.setAttribute('href', state.osApkUrl);
    });

    // Ensure Complete APK download links point cleanly during free promo
    if (state.isFree) {
      doc.querySelectorAll('[data-complete-free-link]').forEach(function (el) {
        el.setAttribute('href', state.completeApkUrl);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      });
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PROMO_END_ISO: PROMO_END_ISO,
      PROMO_END_MS: PROMO_END_MS,
      COMPLETE_APK_URL: COMPLETE_APK_URL,
      OS_RELEASE_APK_URL: OS_RELEASE_APK_URL,
      getPromoState: getPromoState
    };
  }

  global.UPIPromoTimer = {
    PROMO_END_ISO: PROMO_END_ISO,
    PROMO_END_MS: PROMO_END_MS,
    COMPLETE_APK_URL: COMPLETE_APK_URL,
    OS_RELEASE_APK_URL: OS_RELEASE_APK_URL,
    getPromoState: getPromoState,
    applyPromoToDOM: applyPromoToDOM
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        applyPromoToDOM(document);
      });
    } else {
      applyPromoToDOM(document);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
