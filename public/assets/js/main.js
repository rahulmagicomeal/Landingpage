/* =========================================================================
   Magicomeal corporate catering LP — runtime behaviour.

   Three jobs only:
     1. Push a consistent analytics event stream (dataLayer + gtag).
     2. Validate and submit the lead form without a page reload.
     3. Report the Google Ads conversion on a successful submit.

   ~4 KB unminified, deferred, zero dependencies.
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.MM_CONFIG || {};
  window.dataLayer = window.dataLayer || [];

  /* ---------------------------------------------------------------- track */
  /**
   * Single entry point for every event on the page.
   * Pushes to dataLayer (so GTM can route it anywhere) AND calls gtag
   * directly (so GA4 gets it even if GTM is not configured for it).
   */
  function track(name, params) {
    var payload = params || {};
    payload.event = name;
    payload.hero_variant = CFG.heroVariant;
    try {
      window.dataLayer.push(payload);
    } catch (e) {
      /* never let analytics break the page */
    }
    if (typeof window.gtag === 'function') {
      var p = {};
      for (var k in payload) if (k !== 'event') p[k] = payload[k];
      try {
        window.gtag('event', name, p);
      } catch (e) {}
    }
  }
  window.mmTrack = track;

  track('page_view_lp', { page_type: 'landing_page', page_name: 'corporate-catering-mumbai' });

  /* ------------------------------------------------ delegated click events */
  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target.closest && ev.target.closest('[data-event]');
      if (!el) return;
      track(el.getAttribute('data-event'), {
        cta_location: el.getAttribute('data-loc') || 'unknown',
        cta_text: (el.textContent || '').trim().slice(0, 60),
      });
    },
    { passive: true }
  );

  /* ------------------------------------------------------- form_view (once) */
  // Observe the form card, not the whole section: the section is taller than
  // most viewports, so a percentage threshold on it can never be reached.
  var formSection = document.querySelector('#lead-form .formcard') || document.getElementById('lead-form');
  if (formSection && 'IntersectionObserver' in window) {
    var seen = false;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !seen) {
            seen = true;
            track('form_view', { form_name: 'corporate_catering_proposal' });
            io.disconnect();
          }
        });
      },
      { threshold: 0.01 }
    );
    io.observe(formSection);
  }

  /* ---------------------------------------------------------------- form */
  var form = document.getElementById('lead');
  if (!form) return;

  var btn = document.getElementById('submit-btn');
  var btnLabel = btn.querySelector('.label');
  var alertBox = document.getElementById('form-alert');
  var successBox = document.getElementById('form-success');
  var started = false;
  var submitted = false; // duplicate-submission guard
  var inFlight = false;

  var LABELS = {
    required: 'This field is required.',
    email: 'Enter a valid work email address.',
    phone: 'Enter a valid 10-digit Indian mobile number.',
    select: 'Please choose an option.',
  };

  // Deliberately permissive: rejects obvious typos, never a real address.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  /** Accepts 9876543210, +91 98765 43210, 098765-43210, etc. */
  function validPhone(raw) {
    var d = (raw || '').replace(/\D/g, '');
    if (d.length > 10 && d.indexOf('91') === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return d.length === 10 && /^[6-9]/.test(d);
  }

  function setError(field, message) {
    var msg = document.getElementById('e-' + field.name);
    if (message) {
      field.setAttribute('aria-invalid', 'true');
      if (msg) {
        msg.textContent = message;
        msg.classList.add('show');
      }
    } else {
      field.removeAttribute('aria-invalid');
      if (msg) {
        msg.textContent = '';
        msg.classList.remove('show');
      }
    }
  }

  function validateField(field) {
    var v = (field.value || '').trim();
    if (field.hasAttribute('required') && !v) {
      setError(field, field.tagName === 'SELECT' ? LABELS.select : LABELS.required);
      return false;
    }
    if (field.name === 'email' && v && !EMAIL_RE.test(v)) {
      setError(field, LABELS.email);
      return false;
    }
    if (field.name === 'phone' && v && !validPhone(v)) {
      setError(field, LABELS.phone);
      return false;
    }
    var MIN_2 = ['firstName', 'lastName', 'company', 'location'];
    if (MIN_2.indexOf(field.name) !== -1 && v && v.length < 2) {
      setError(field, LABELS.required);
      return false;
    }
    setError(field, '');
    return true;
  }

  var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea')).filter(
    function (f) {
      return f.name && f.name !== 'website';
    }
  );

  fields.forEach(function (f) {
    // form_start fires once, on the first real interaction.
    f.addEventListener('focus', function () {
      if (!started) {
        started = true;
        track('form_start', { form_name: 'corporate_catering_proposal' });
      }
    });
    // Validate on blur; clear the error as soon as they start fixing it.
    f.addEventListener('blur', function () {
      if ((f.value || '').trim() || f.getAttribute('aria-invalid')) validateField(f);
    });
    f.addEventListener('input', function () {
      if (f.getAttribute('aria-invalid')) validateField(f);
    });
  });

  function showAlert(msg) {
    alertBox.textContent = msg;
    alertBox.classList.add('show');
  }
  function hideAlert() {
    alertBox.classList.remove('show');
    alertBox.textContent = '';
  }

  function setBusy(busy) {
    inFlight = busy;
    btn.setAttribute('aria-busy', busy ? 'true' : 'false');
    btnLabel.textContent = busy ? 'Sending…' : 'Get My Catering Proposal';
  }

  /** Fires the Google Ads conversion. No-ops safely if the label is unset. */
  function reportAdsConversion(payload) {
    if (!CFG.adsConversionId) return;
    if (!CFG.adsConversionLabel) {
      // Loud in dev, harmless in production. See src/data/config.js.
      if (window.console && console.warn) {
        console.warn(
          '[Magicomeal] Google Ads conversion NOT reported: adsConversionLabel is empty. ' +
            'Set it in src/data/config.js and rebuild.'
        );
      }
      return;
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: CFG.adsConversionId + '/' + CFG.adsConversionLabel,
        value: 1.0,
        currency: 'INR',
        transaction_id: payload.leadId || '',
      });
    }
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (inFlight || submitted) return;
    hideAlert();

    var ok = true;
    var firstBad = null;
    fields.forEach(function (f) {
      if (!validateField(f)) {
        ok = false;
        if (!firstBad) firstBad = f;
      }
    });

    if (!ok) {
      track('form_error', { form_name: 'corporate_catering_proposal', error_type: 'validation' });
      if (firstBad) firstBad.focus();
      return;
    }

    var data = {};
    fields.forEach(function (f) {
      data[f.name] = (f.value || '').trim();
    });
    data.website = (form.querySelector('[name="website"]') || {}).value || ''; // honeypot
    data.pageUrl = location.href;
    data.heroVariant = CFG.heroVariant;
    // Attribution: hand the ad click straight to whatever receives the lead.
    var qs = new URLSearchParams(location.search);
    ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
      if (qs.get(k)) data[k] = qs.get(k);
    });
    data.referrer = document.referrer || '';

    track('form_submit', {
      form_name: 'corporate_catering_proposal',
      meals_per_day: data.meals,
      requirement: data.requirement,
    });

    setBusy(true);

    var timeout = setTimeout(function () {
      controller.abort();
    }, 15000);
    var controller = new AbortController();

    fetch(CFG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (body) {
            if (!res.ok) throw new Error(body.error || 'Request failed (' + res.status + ')');
            return body;
          });
      })
      .then(function (body) {
        clearTimeout(timeout);
        submitted = true;
        setBusy(false);

        form.style.display = 'none';
        successBox.classList.add('show');
        successBox.focus && successBox.focus();
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        track('form_success', {
          form_name: 'corporate_catering_proposal',
          meals_per_day: data.meals,
          requirement: data.requirement,
          lead_id: body.leadId || '',
        });
        track('proposal_request', {
          meals_per_day: data.meals,
          requirement: data.requirement,
          office_location: data.location,
        });
        reportAdsConversion({ leadId: body.leadId });
      })
      .catch(function (err) {
        clearTimeout(timeout);
        setBusy(false);
        showAlert(
          'Something went wrong. Please call us on ' +
            (CFG.phoneDisplay || '') +
            ' and we will take your details directly.'
        );
        track('form_error', {
          form_name: 'corporate_catering_proposal',
          error_type: 'network',
          error_message: String((err && err.message) || err).slice(0, 120),
        });
      });
  });
})();
