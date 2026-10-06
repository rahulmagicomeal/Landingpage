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

/* =========================================================================
   Gallery carousel
   The track is a CSS scroll-snap strip, so swipe/trackpad/arrow-keys already
   work with no JS. This only wires the arrow buttons and disables them at
   the ends. If this block never runs, the carousel is still usable.
   ========================================================================= */
(function () {
  'use strict';
  var roots = document.querySelectorAll('[data-carousel]');
  Array.prototype.forEach.call(roots, function (root) {
    var track = root.querySelector('.carousel__track');
    var prev = root.querySelector('[data-car-prev]');
    var next = root.querySelector('[data-car-next]');
    if (!track || !prev || !next) return;

    // Step by a whole number of slides so the track always lands exactly on a
    // snap point. Measured from the live DOM rather than hard-coded, because
    // the slide width changes at four breakpoints.
    function pitch() {
      var a = track.children[0];
      var b = track.children[1];
      if (a && b && b.offsetLeft > a.offsetLeft) return b.offsetLeft - a.offsetLeft;
      return Math.max(160, track.clientWidth * 0.8);
    }
    function step() {
      var p = pitch();
      return Math.max(1, Math.floor(track.clientWidth / p)) * p;
    }
    function sync() {
      var max = track.scrollWidth - track.clientWidth;
      // The first slide rests a few px in (the track is padded so the focus
      // ring is not clipped), so compare with a tolerance rather than 0.
      prev.disabled = track.scrollLeft <= 8;
      next.disabled = track.scrollLeft >= max - 8;
    }
    /**
     * Native smooth scrolling, with a guaranteed landing.
     *
     * The animation is skipped entirely in contexts that do not run it — a
     * backgrounded tab, or a user who asked for reduced motion. The timeout
     * reconciles the final position so the carousel can never be left stranded
     * part-way between slides if the animation does not complete.
     */
    var settle = null;
    function go(dir) {
      var max = track.scrollWidth - track.clientWidth;
      var to = Math.max(0, Math.min(max, track.scrollLeft + dir * step()));
      if (Math.abs(to - track.scrollLeft) < 1) return;

      var still =
        document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (still) {
        track.scrollLeft = to;
        sync();
        return;
      }

      try {
        track.scrollTo({ left: to, behavior: 'smooth' });
      } catch (e) {
        track.scrollLeft = to; // older browsers without the options form
      }

      clearTimeout(settle);
      settle = setTimeout(function () {
        if (Math.abs(track.scrollLeft - to) > 2) track.scrollLeft = to;
        sync();
      }, 500);
    }

    prev.addEventListener('click', function () {
      go(-1);
    });
    next.addEventListener('click', function () {
      go(1);
    });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });
})();

/* =========================================================================
   Hero background carousel
   Cross-fades the photographs behind the headline. Auto-advance stops on
   hover/focus, on tab-hide, under prefers-reduced-motion, and whenever the
   visitor presses pause — WCAG 2.2.2 requires a way to stop moving content.
   ========================================================================= */
(function () {
  'use strict';
  var root = document.querySelector('[data-hero-carousel]');
  if (!root) return;

  var slides = root.querySelectorAll('.hero__slide');
  var pauseBtn = root.querySelector('[data-hero-pause]');
  if (slides.length < 2) {
    if (pauseBtn) pauseBtn.hidden = true;
    return;
  }

  var interval = Number(root.getAttribute('data-interval')) || 6000;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var index = 0;
  var timer = null;
  var pausedByUser = reduce.matches;

  function show(i) {
    slides[index].classList.remove('is-active');
    index = (i + slides.length) % slides.length;
    slides[index].classList.add('is-active');
  }
  function tick() {
    if (!document.hidden) show(index + 1);
  }
  function start() {
    if (timer || pausedByUser || reduce.matches) return;
    timer = setInterval(tick, interval);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }
  function setPressed() {
    if (!pauseBtn) return;
    var paused = pausedByUser;
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pauseBtn.setAttribute(
      'aria-label',
      paused ? 'Play background slideshow' : 'Pause background slideshow'
    );
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      pausedByUser = !pausedByUser;
      if (pausedByUser) stop();
      else start();
      setPressed();
    });
  }

  // Pause while someone is reading or using the form over the top of it.
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', function (e) {
    if (!root.contains(e.relatedTarget)) start();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });
  if (reduce.addEventListener) {
    reduce.addEventListener('change', function () {
      stop();
      start();
    });
  }

  setPressed();
  start();
})();

/* =========================================================================
   Partner logo marquee
   The scroll itself is a CSS animation, and it already pauses on hover and
   focus-within. This only adds the explicit pause control that WCAG 2.2.2
   requires for content that moves on its own.
   ========================================================================= */
(function () {
  'use strict';
  var root = document.querySelector('[data-marquee]');
  if (!root) return;
  var btn = root.querySelector('[data-marquee-pause]');
  if (!btn) return;

  // Under reduced motion the strip is a static grid and the button is hidden.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    btn.hidden = true;
    return;
  }

  btn.addEventListener('click', function () {
    var paused = root.classList.toggle('is-paused');
    btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    btn.setAttribute('aria-label', paused ? 'Play the partner logos' : 'Pause the partner logos');
  });
})();

/* =========================================================================
   Cuisine pizza
   Six slices and a matching name list drive one piece of state. Hover, focus,
   click and keyboard all select. SVG has no z-index, so the chosen slice is
   moved to the end of its parent — otherwise the slices drawn after it clip
   its enlarged edge.
   ========================================================================= */
(function () {
  'use strict';
  var root = document.querySelector('[data-wheel]');
  if (!root) return;

  var svg = root.querySelector('svg');
  var slices = root.querySelectorAll('[data-slice]');
  var label = root.querySelector('[data-wheel-label]');
  var host = root.closest('.herofeat__item') || root.parentElement;
  var legend = host ? host.querySelectorAll('[data-legend]') : [];
  if (!slices.length || !label || !svg) return;

  var names = Array.prototype.map.call(slices, function (s) {
    return s.getAttribute('data-name') || '';
  });
  var current = -1;

  function select(i) {
    if (i === current || i < 0 || i >= slices.length) return;
    current = i;

    Array.prototype.forEach.call(slices, function (s, n) {
      s.classList.toggle('is-active', n === i);
    });
    Array.prototype.forEach.call(legend, function (b, n) {
      b.setAttribute('aria-pressed', n === i ? 'true' : 'false');
    });

    // Paint the chosen slice last so its lifted edge sits above the others.
    svg.appendChild(slices[i]);

    label.textContent = names[i] || '';
  }

  // Pointer only — the slices are aria-hidden. Keyboard and screen-reader
  // users drive the same state through the name list below.
  Array.prototype.forEach.call(slices, function (s, i) {
    ['mouseenter', 'click'].forEach(function (ev) {
      s.addEventListener(ev, function () {
        select(i);
      });
    });
  });

  Array.prototype.forEach.call(legend, function (b, i) {
    ['mouseenter', 'focus', 'click'].forEach(function (ev) {
      b.addEventListener(ev, function () {
        select(i);
      });
    });
  });

  select(0);
})();
