!function () {
  "use strict";

  var WEB3FORMS_URL = "https://api.web3forms.com/submit";
  var WEB3FORMS_KEY = "819ea922-d3eb-4714-8961-d90e50778ac7";

  function showError(form, msg) {
    var el = form.querySelector(".srt-form-error");
    if (!el) {
      el = document.createElement("div");
      el.className = "srt-form-error";
      el.style.cssText = "color:#e74c3c;font-size:13px;padding:8px 12px;background:rgba(231,76,60,0.1);border-radius:6px;margin-bottom:12px;";
      var btn = form.querySelector("button") || form.lastElementChild;
      form.insertBefore(el, btn);
    }
    el.textContent = msg;
    el.style.display = "block";
  }

  function clearError(form) {
    var el = form.querySelector(".srt-form-error");
    if (el) el.style.display = "none";
  }

  function showSuccess(form) {
    form.innerHTML = '<div style="text-align:center;padding:40px 20px;">' +
      '<i class="fa-solid fa-circle-check" style="font-size:48px;color:#25bbcc;margin-bottom:16px;display:block;"></i>' +
      '<h3 style="color:#fff;margin-bottom:10px;">Thank You!</h3>' +
      '<p style="color:#ccc;">Your consultation request has been received. Our team will contact you within 24 hours.</p>' +
      '</div>';
  }

  function submitToWeb3Forms(data) {
    var formData = new FormData();
    formData.append("access_key", WEB3FORMS_KEY);
    formData.append("subject", "New Consultation Request - " + data.doctor_name);
    formData.append("from_name", "SRT Digital Solutions");
    formData.append("Doctor Name", data.doctor_name);
    formData.append("Clinic Name", data.clinic_name);
    formData.append("Email", data.email);
    formData.append("Phone", data.phone);
    formData.append("Specialty", data.specialty);
    formData.append("Message", data.message);
    formData.append("Source", data.source);

    return fetch(WEB3FORMS_URL, {
      method: "POST",
      body: formData
    }).then(function (res) { return res.json(); });
  }

  window.handleConsultationForm = function (e) {
    e.preventDefault();

    var form = document.getElementById("consultationForm");
    if (!form) return false;

    var btn = form.querySelector("button[type='submit'], button:last-of-type");
    var fields = form.querySelectorAll("input, select, textarea");
    var values = {};

    fields.forEach(function (f) {
      var name = f.name || f.getAttribute("name");
      if (name && name !== "honeypot") {
        values[name] = f.value ? f.value.trim() : "";
      }
    });

    var data = {
      doctor_name: values.doctor_name || values.doctorName || "",
      clinic_name: values.clinic_name || values.clinicName || "",
      email: values.email || "",
      phone: values.phone || "",
      specialty: values.specialty || "",
      message: values.message || "",
      source: "index-contact",
      status: "new"
    };

    // Honeypot check
    var honeypot = form.querySelector('[name="honeypot"]');
    if (honeypot && honeypot.value) {
      showSuccess(form);
      return false;
    }

    // Validation
    if (!data.doctor_name) { showError(form, "Please enter your name."); return false; }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { showError(form, "Please enter a valid email address."); return false; }
    if (!data.phone || data.phone.length < 8) { showError(form, "Please enter a valid phone number."); return false; }

    // reCAPTCHA validation
    var recaptchaResponse = typeof grecaptcha !== "undefined" ? grecaptcha.getResponse() : "";
    if (!recaptchaResponse) {
      showError(form, "Please complete the reCAPTCHA verification.");
      return false;
    }

    // Rate limiting
    var lastSub = localStorage.getItem("srt_last_submission");
    if (lastSub && Date.now() - parseInt(lastSub) < 60000) {
      showError(form, "Please wait a moment before submitting again.");
      return false;
    }

    // Disable button
    if (btn) {
      btn.disabled = true;
      btn.setAttribute("data-original-text", btn.textContent);
      btn.textContent = "Sending...";
      btn.style.opacity = "0.7";
    }

    clearError(form);

    // Submit to Supabase (if available)
    var supabase = typeof SRT !== "undefined" && SRT.getSupabase ? SRT.getSupabase() : null;
    var supabasePromise = supabase
      ? supabase.from("form_submissions").insert(data)
      : Promise.resolve({ error: null });

    // Submit to Web3Forms
    var web3Promise = submitToWeb3Forms(data);

    Promise.all([supabasePromise, web3Promise]).then(function (results) {
      var sbResult = results[0];
      var w3Result = results[1];

      if (sbResult && sbResult.error) console.warn("Supabase form error:", sbResult.error);
      if (w3Result && !w3Result.success) console.warn("Web3Forms error:", w3Result.message);

      localStorage.setItem("srt_last_submission", Date.now().toString());
      if (typeof grecaptcha !== "undefined") grecaptcha.reset();
      showSuccess(form);
    }).catch(function (err) {
      console.error("Form submission error:", err);
      localStorage.setItem("srt_last_submission", Date.now().toString());
      if (typeof grecaptcha !== "undefined") grecaptcha.reset();
      showSuccess(form);
    });

    return false;
  };
}();
