/**
 * ==========================================================================
 * RPAVault AI Career Counselor & Course Assistant Widget
 * Dual Mode: Full-Page App (#rpavault-counselor-app) OR Floating Bubble Widget
 * ==========================================================================
 */

(function () {
  "use strict";

  // Configuration (Override via window.RPAVAULT_CHAT_CONFIG if desired)
  const CONFIG = Object.assign(
    {
      apiUrl: "https://rpavault-chatbot.hikumarswamy.workers.dev/api/chat", // Live Cloudflare Worker
      leadUrl: "https://rpavault-chatbot.hikumarswamy.workers.dev/api/chat/lead", // Lead capture endpoint
      formSubmitEndpoint: "https://formsubmit.co/ajax/f89e890a8c606cde8e0e84b29c03a3d2", // RPAVault FormSubmit endpoint
      botName: "RPAVault AI",
      botSubtitle: "Online • Automation & Training",
      sessionTimeoutMinutes: 30,
      starterChips: [
        "💬 Connect on WhatsApp",
        "Can I switch to RPA with a career gap?",
        "Non-IT to RPA: Can I learn without coding?",
        "Enterprise Automations & Services",
        "Upcoming batch dates & fees"
      ]
    },
    window.RPAVAULT_CHAT_CONFIG || {}
  );

  // --- Analytics Tracking Helper ---
  function trackAnalyticsEvent(eventName, params) {
    try {
      const payload = Object.assign(
        {
          page_path: window.location.pathname,
          page_url: window.location.href,
          session_id: getSessionId()
        },
        params || {}
      );

      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, payload);
      } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: eventName }, payload));
      }
    } catch (e) {
      // Defensive: ad/tracking blockers should never disrupt user experience
    }
  }

  // --- Session Management ---
  function getSessionId() {
    const now = Date.now();
    const storedId = sessionStorage.getItem("rpav_session_id");
    const storedTime = parseInt(sessionStorage.getItem("rpav_session_time") || "0", 10);

    // If session exists and is within timeout window, reuse it
    if (storedId && now - storedTime < CONFIG.sessionTimeoutMinutes * 60 * 1000) {
      sessionStorage.setItem("rpav_session_time", now.toString());
      return storedId;
    }

    // Otherwise generate a clean new session
    const newId = "sess_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
    sessionStorage.setItem("rpav_session_id", newId);
    sessionStorage.setItem("rpav_session_time", now.toString());
    sessionStorage.setItem("rpav_chat_history", JSON.stringify([]));
    return newId;
  }

  function getHistory() {
    try {
      return JSON.parse(sessionStorage.getItem("rpav_chat_history") || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    // Keep up to last 10 messages for lightweight context
    const trimmed = history.slice(-10);
    sessionStorage.setItem("rpav_chat_history", JSON.stringify(trimmed));
  }

  function getFormattedTranscript() {
    const history = getHistory();
    if (!history.length) return "No conversation history.";
    return history
      .map(function (item) {
        return (item.role === "user" ? "Visitor: " : "Counselor: ") + item.text;
      })
      .join("\n\n");
  }

  // --- Active Webpage Context Extractor (for "summarise this page" and context-awareness) ---
  function getPageContext() {
    try {
      const url = window.location.href;
      const pathname = window.location.pathname;
      const title = document.title || "";
      const heading = (document.querySelector("h1")?.innerText || "").trim();
      const metaDesc = (document.querySelector('meta[name="description"]')?.content || "").trim();

      // Extract clean main content snippet (up to 2500 characters)
      let contentSnippet = "";
      const mainEl = document.querySelector("main") || document.querySelector("article") || document.body;
      if (mainEl) {
        const clone = mainEl.cloneNode(true);
        const noise = clone.querySelectorAll("script, style, noscript, nav, footer, #rpav-chat-modal, #rpav-bubble-launcher, .whatsapp-float, .rpv-modal, .modal-overlay");
        for (let i = 0; i < noise.length; i++) {
          noise[i].remove();
        }
        contentSnippet = (clone.innerText || "").replace(/\s+/g, " ").trim().substring(0, 2500);
      }

      return {
        url: url,
        pathname: pathname,
        title: title,
        heading: heading,
        metaDescription: metaDesc,
        contentSnippet: contentSnippet
      };
    } catch (e) {
      return { url: window.location.href, pathname: window.location.pathname };
    }
  }

  // --- SVG Icons ---
  const ICONS = {
    chat: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.38A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    bot: '<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h4V5.72A2 2 0 0 1 10 4a2 2 0 0 1 2-2m-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-6 5a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2z"/></svg>',
    whatsapp: '<svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.7 6L4 29l8.2-1.6c1.2.6 2.5.9 3.8.9 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.2 0-2.4-.3-3.5-.8l-.6-.3-4.9 1 1-4.7-.3-.6c-.7-1.2-1-2.6-1-4 0-5.2 4.2-9.4 9.4-9.4s9.4 4.2 9.4 9.4-4.3 9.4-9.5 9.4zm5.2-7c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 2.9 4.6 4.1.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.3-.6-.4z"/></svg>'
  };

  // --- UI Builder ---
  function buildChatMarkup(isFullPage) {
    return `
      <div class="rpav-header">
        <div class="rpav-header-left">
          <div class="rpav-avatar">
            ${ICONS.bot}
            <div class="rpav-online-dot"></div>
          </div>
          <div class="rpav-header-info">
            <h3>${CONFIG.botName}</h3>
            <p>${CONFIG.botSubtitle}</p>
          </div>
        </div>
        <div class="rpav-header-actions">
          ${!isFullPage ? `<button class="rpav-icon-btn" id="rpav-btn-close" title="Close">${ICONS.close}</button>` : ""}
        </div>
      </div>

      <div class="rpav-messages" id="rpav-messages-list">
        <div class="rpav-msg rpav-msg-bot">
          <div class="rpav-bubble">
            👋 Hello! I'm RPAVault's AI assistant, here to guide you across our <strong>Enterprise Automations</strong>, <strong>IT Consulting & Services</strong>, and <strong>Training programs</strong> (courses, fees, batches, and placements).
            <br/><br/>
            Before we start — <strong>what's your name?</strong> 😊
          </div>
          <span class="rpav-msg-time">Just now</span>
        </div>
      </div>

      <div class="rpav-chips-wrapper" id="rpav-chips-container">
        ${CONFIG.starterChips
          .map(function (chip) {
            const isWa = chip.includes("WhatsApp");
            return `<button class="rpav-chip ${isWa ? "rpav-chip-wa" : ""}" data-question="${chip}">${isWa ? ICONS.whatsapp + " " : ""}${chip}</button>`;
          })
          .join("")}
      </div>

      <div class="rpav-footer">
        <input type="text" class="rpav-input-box" id="rpav-input" placeholder="Ask a question..." autocomplete="off" />
        <button class="rpav-send-btn" id="rpav-btn-send" title="Send">${ICONS.send}</button>
      </div>
    `;
  }

  // --- App Initialization ---
  function initApp() {
    const fullPageTarget = document.getElementById("rpavault-counselor-app");
    let container, messagesList, inputField, sendBtn, chipsContainer;

    if (fullPageTarget) {
      // 1. Dedicated Full-Page Mode
      fullPageTarget.innerHTML = buildChatMarkup(true);
      container = fullPageTarget;
      trackAnalyticsEvent("chat_open", { trigger: "standalone_page" });
    } else {
      // 2. Floating Bubble Mode
      const launcher = document.createElement("div");
      launcher.id = "rpav-bubble-launcher";
      launcher.title = "Chat with RPA Career Counselor";
      launcher.innerHTML = `${ICONS.chat}<div id="rpav-bubble-badge"></div>`;

      const modal = document.createElement("div");
      modal.id = "rpav-chat-modal";
      modal.innerHTML = buildChatMarkup(false);

      document.body.appendChild(launcher);
      document.body.appendChild(modal);

      container = modal;

      function updateLauncherPosition() {
        const wa = document.querySelector(".whatsapp-float");
        if (wa && window.getComputedStyle(wa).display !== "none") {
          launcher.style.bottom = "84px";
        } else {
          launcher.style.bottom = "22px";
        }
      }
      updateLauncherPosition();
      window.addEventListener("resize", updateLauncherPosition);

      launcher.addEventListener("click", function () {
        const isOpen = modal.classList.contains("rpav-open");
        if (isOpen) {
          modal.classList.remove("rpav-open");
          launcher.style.display = "flex";
        } else {
          modal.classList.add("rpav-open");
          launcher.style.display = "none";
          const badge = document.getElementById("rpav-bubble-badge");
          if (badge) badge.style.display = "none";
          trackAnalyticsEvent("chat_open", { trigger: "floating_bubble" });
          setTimeout(function () {
            focusInputOnDesktop();
          }, 250);
        }
      });

      const closeBtn = document.getElementById("rpav-btn-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          modal.classList.remove("rpav-open");
          launcher.style.display = "flex";
          updateLauncherPosition();
        });
      }
    }

    messagesList = container.querySelector("#rpav-messages-list");
    inputField = container.querySelector("#rpav-input");
    sendBtn = container.querySelector("#rpav-btn-send");
    chipsContainer = container.querySelector("#rpav-chips-container");

    // Hide quick chips once conversation starts
    function hideChips() {
      if (chipsContainer) {
        chipsContainer.style.display = "none";
      }
    }

    // Hide chips if user already has conversation history
    if (getHistory().length > 0) {
      hideChips();
    }

    // Scroll to bottom helper
    function scrollToBottom() {
      if (messagesList) {
        messagesList.scrollTop = messagesList.scrollHeight;
      }
    }

    // Device detection: identify mobile devices with soft on-screen keyboards
    function isTouchOrMobile() {
      return (
        window.innerWidth <= 768 ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    }

    // Strictly focus input ONLY on desktop hardware keyboards.
    // NEVER programmatically pull up the on-screen soft keyboard on mobile devices.
    function focusInputOnDesktop() {
      if (!isTouchOrMobile() && inputField) {
        inputField.focus();
      }
    }

    // Mobile soft keyboard & viewport defense
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", function () {
        setTimeout(scrollToBottom, 60);
      });
    }
    if (inputField) {
      inputField.addEventListener("focus", function () {
        setTimeout(scrollToBottom, 260);
      });
    }

    // Formats markdown links, bare URLs, and bold text into clickable HTML elements
    function formatBubbleContent(text) {
      if (!text) return "";
      let formatted = text;

      // 1. Convert Markdown links: [Title](url) -> <a href="url" target="_blank" rel="noopener" class="rpav-link">Title</a>
      formatted = formatted.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s\)]+)\)/g, function(_, label, url) {
        return `<a href="${url}" target="_blank" rel="noopener" class="rpav-link">${label}</a>`;
      });

      // 2. Convert Markdown bold: **text** -> <strong>text</strong>
      formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

      // 3. Convert bare URLs (that are not already inside an href="...") into clickable links
      formatted = formatted.replace(/(^|[^">])(https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)/g, function(match, prefix, fullUrl) {
        let url = fullUrl;
        let trailingPunct = "";
        const punctMatch = url.match(/[.,;:?!)]+$/);
        if (punctMatch) {
          trailingPunct = punctMatch[0];
          url = url.slice(0, -trailingPunct.length);
        }
        return `${prefix}<a href="${url}" target="_blank" rel="noopener" class="rpav-link">${url}</a>${trailingPunct}`;
      });

      // 4. Convert newlines to <br/>
      formatted = formatted.replace(/\n/g, "<br/>");

      return formatted;
    }

    // Append Message helper
    function appendMessage(text, role) {
      const msgDiv = document.createElement("div");
      msgDiv.className = "rpav-msg " + (role === "user" ? "rpav-msg-user" : "rpav-msg-bot");

      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      msgDiv.innerHTML = `
        <div class="rpav-bubble">${formatBubbleContent(text)}</div>
        <span class="rpav-msg-time">${timeStr}</span>
      `;

      messagesList.appendChild(msgDiv);
      scrollToBottom();
    }

    // Typing indicator
    function showTypingIndicator() {
      const typingDiv = document.createElement("div");
      typingDiv.className = "rpav-msg rpav-msg-bot rpav-typing-msg";
      typingDiv.id = "rpav-typing-indicator";
      typingDiv.innerHTML = `
        <div class="rpav-typing">
          <div class="rpav-typing-dot"></div>
          <div class="rpav-typing-dot"></div>
          <div class="rpav-typing-dot"></div>
        </div>
      `;
      messagesList.appendChild(typingDiv);
      scrollToBottom();
    }

    function removeTypingIndicator() {
      const typingDiv = document.getElementById("rpav-typing-indicator");
      if (typingDiv) typingDiv.remove();
    }

    // Embedded Lead Capture Form
    let leadFormShown = false;
    function injectLeadForm() {
      if (leadFormShown) return;
      leadFormShown = true;

      const leadDiv = document.createElement("div");
      leadDiv.className = "rpav-lead-card";
      leadDiv.innerHTML = `
        <div class="rpav-lead-header">
          <span>📄 Get the Detailed Roadmap & Document</span>
        </div>
        <p style="margin: 0; font-size: 12.5px; color: #475569;">
          Leave your WhatsApp or email below and we will deliver the detailed curriculum and career roadmap document directly to you:
        </p>
        <input type="text" id="rpav-lead-name" placeholder="Your Name" value="${sessionStorage.getItem('rpav_user_name') || ''}" required />
        <input type="tel" id="rpav-lead-phone" placeholder="WhatsApp Phone Number (e.g. 9876543210)" required />
        <input type="email" id="rpav-lead-email" placeholder="Email Address" required />
        <button type="button" class="rpav-lead-btn" id="rpav-lead-submit">
          Send Me the Document
        </button>
      `;

      messagesList.appendChild(leadDiv);
      scrollToBottom();

      const submitBtn = leadDiv.querySelector("#rpav-lead-submit");
      submitBtn.addEventListener("click", function () {
        const name = (leadDiv.querySelector("#rpav-lead-name").value || "").trim();
        const phone = (leadDiv.querySelector("#rpav-lead-phone").value || "").trim();
        const email = (leadDiv.querySelector("#rpav-lead-email").value || "").trim();

        if (!name || phone.length < 10 || !email.includes("@")) {
          alert("Please enter your name, valid WhatsApp number (at least 10 digits), and email.");
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        const sessionId = getSessionId();
        const transcript = getFormattedTranscript();

        // Dispatch GA4 standard lead conversion event & custom chat lead event
        trackAnalyticsEvent("generate_lead", {
          currency: "INR",
          value: 1,
          lead_source: "chatbot",
          lead_name: name,
          course_interest: "Chatbot Roadmap Lead"
        });
        trackAnalyticsEvent("chat_lead_captured", {
          has_phone: Boolean(phone),
          has_email: Boolean(email)
        });

        // 1. Submit to FormSubmit.co AJAX (captures IP, City, User Agent, Referrer + full chat)
        if (CONFIG.formSubmitEndpoint) {
          fetch(CONFIG.formSubmitEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify({
              _subject: "🔥 New RPAVault Lead: " + name + " (" + phone + ")",
              Name: name,
              WhatsApp: phone,
              Email: email,
              Session_ID: sessionId,
              Page_URL: window.location.href,
              Full_Chat_Transcript: transcript
            })
          }).catch(function (err) {
            console.warn("FormSubmit notice:", err);
          });
        }

        // 2. Compute query topic from conversation history
        const userQuestions = getHistory()
          .filter(function (h) {
            return h.role === "user" && !h.text.toLowerCase().startsWith("my name is") && !h.text.includes("WhatsApp");
          })
          .map(function (h) { return h.text; });
        const queryTopic = userQuestions.length > 0 ? userQuestions[userQuestions.length - 1] : "courses and consulting services";
        const waUrl = buildWhatsAppUrl(name, queryTopic);

        // 3. Submit to Cloudflare Backend to update Notion Session Page
        fetch(CONFIG.leadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId,
            name: name,
            phone: phone,
            email: email,
            topic: queryTopic,
            pageUrl: window.location.href
          })
        }).catch(function () {});

        // 4. Update UI with success badge
        leadDiv.innerHTML = `
          <div class="rpav-lead-success">
            ✅ Thank you, <strong>${name}</strong>!<br/>
            Your details have been received. We'll deliver the detailed roadmap to ${email || phone}!
          </div>
        `;
        scrollToBottom();

        // 5. Prompt for instant WhatsApp connection with custom pre-filled message
        sessionStorage.setItem("rpav_custom_wa_url", waUrl);
        sessionStorage.setItem("rpav_awaiting_wa_confirm", "true");

        setTimeout(function () {
          const promptDiv = document.createElement("div");
          promptDiv.className = "rpav-msg rpav-msg-bot";
          promptDiv.innerHTML = `
            <div class="rpav-bubble">
              ⚡ <strong>Would you like an instant reply on WhatsApp right now, ${name}?</strong>
              <div class="rpav-wa-prompt-buttons">
                <button type="button" class="rpav-btn-wa-confirm" id="rpav-btn-wa-yes">
                  ${ICONS.whatsapp} Yes, Chat on WhatsApp Now
                </button>
                <button type="button" class="rpav-btn-wa-cancel" id="rpav-btn-wa-no">
                  No, I'll wait for callback
                </button>
              </div>
            </div>
            <span class="rpav-msg-time">Just now</span>
          `;
          messagesList.appendChild(promptDiv);
          scrollToBottom();

          const yesBtn = promptDiv.querySelector("#rpav-btn-wa-yes");
          const noBtn = promptDiv.querySelector("#rpav-btn-wa-no");

          yesBtn.addEventListener("click", function () {
            trackAnalyticsEvent("chat_whatsapp_click", { source: "lead_prompt" });
            promptDiv.querySelector(".rpav-wa-prompt-buttons").remove();
            appendMessage("Yes, connect on WhatsApp", "user");
            const botReply = `Awesome, ${name}! Click below to chat directly with us on WhatsApp:<br/><br/>
              <a href="${waUrl}" target="_blank" rel="noopener" class="rpav-wa-action-btn">
                ${ICONS.whatsapp} Open WhatsApp Chat (+91 9160949996)
              </a>`;
            appendMessage(botReply, "bot");
            sessionStorage.removeItem("rpav_awaiting_wa_confirm");
            window.open(waUrl, "_blank");
          });

          noBtn.addEventListener("click", function () {
            promptDiv.querySelector(".rpav-wa-prompt-buttons").remove();
            appendMessage("No, I'll wait for callback", "user");
            const botReply = `No problem, ${name}! Our senior advisor will review your request and connect with you shortly. Feel free to ask any other questions here in the meantime!`;
            appendMessage(botReply, "bot");
            sessionStorage.removeItem("rpav_awaiting_wa_confirm");
          });
        }, 500);
      });
    }

    // Helper to get clean website URL for WhatsApp
    function getSiteUrl() {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const base = isLocal ? "https://rpavault.com" : window.location.origin;
      const path = window.location.pathname === "/" ? "" : window.location.pathname;
      return base + path;
    }

    // Custom WhatsApp URL generator: "Hi, my name is {name}. i am looking for {queryTopic} on {siteUrl}. can you help?"
    function buildWhatsAppUrl(name, queryTopic) {
      const siteUrl = getSiteUrl();
      const topic = queryTopic || "courses and enterprise services";
      const msg = name
        ? `Hi, my name is ${name}. I am looking for ${topic} on ${siteUrl}. Can you help?`
        : `Hi, I am looking for ${topic} on ${siteUrl}. Can you help?`;
      return "https://wa.me/919160949996?text=" + encodeURIComponent(msg);
    }

    // Direct WhatsApp Connection Handler
    function handleWhatsAppDirect() {
      trackAnalyticsEvent("chat_whatsapp_click", { source: "starter_chip" });
      hideChips();
      const storedName = sessionStorage.getItem("rpav_user_name") || "";
      const userQuestions = getHistory()
        .filter(function (h) {
          return h.role === "user" && !h.text.toLowerCase().startsWith("my name is") && !h.text.includes("WhatsApp");
        })
        .map(function (h) { return h.text; });
      const queryTopic = userQuestions.length > 0 ? userQuestions[userQuestions.length - 1] : "courses and consulting services";
      const waUrl = buildWhatsAppUrl(storedName, queryTopic);

      appendMessage("💬 Connect on WhatsApp", "user");

      const replyHtml = `You can connect directly with our senior team on WhatsApp for an instant reply:<br/><br/>
        <a href="${waUrl}" target="_blank" rel="noopener" class="rpav-wa-action-btn">
          ${ICONS.whatsapp} Chat on WhatsApp (+91 9160949996)
        </a>`;

      appendMessage(replyHtml, "bot");

      const history = getHistory();
      history.push({ role: "user", text: "💬 Connect on WhatsApp" });
      history.push({ role: "model", text: "Connected via WhatsApp (+91 9160949996)" });
      saveHistory(history);

      window.open(waUrl, "_blank");
    }

    // Handle Send Message
    async function handleSend(userText) {
      hideChips();
      const text = (userText || inputField.value || "").trim();
      if (!text) return;

      trackAnalyticsEvent("chat_message_sent", {
        message_length: text.length,
        is_first_message: getHistory().length === 0
      });

      inputField.value = "";
      sendBtn.disabled = true;

      // On mobile / touch devices, blur input so the on-screen keyboard dismisses
      // and leaves full, unobstructed screen space to view incoming answer
      if (isTouchOrMobile() && inputField) {
        inputField.blur();
      }

      // Check if user is answering the instant WhatsApp prompt
      if (sessionStorage.getItem("rpav_awaiting_wa_confirm") === "true") {
        sessionStorage.removeItem("rpav_awaiting_wa_confirm");
        const waUrl = sessionStorage.getItem("rpav_custom_wa_url") || "https://wa.me/919160949996";
        const isYes = /^(yes|yeah|sure|yep|yup|ok|okay|please|connect|open|chat)/i.test(text.trim());
        appendMessage(text, "user");
        if (isYes) {
          const botReply = `Awesome! Click below to open WhatsApp with your inquiry pre-filled:<br/><br/>
            <a href="${waUrl}" target="_blank" rel="noopener" class="rpav-wa-action-btn">
              ${ICONS.whatsapp} Open WhatsApp Chat (+91 9160949996)
            </a>`;
          appendMessage(botReply, "bot");
          window.open(waUrl, "_blank");
        } else {
          appendMessage("No problem! Our senior advisor will review your request and connect with you shortly. Feel free to ask any other questions here in the meantime!", "bot");
        }
        sendBtn.disabled = false;
        focusInputOnDesktop();
        return;
      }

      const sessionId = getSessionId();
      const storedName = sessionStorage.getItem("rpav_user_name");
      const nameSkipped = sessionStorage.getItem("rpav_name_skipped");

      // Name-First Onboarding Check (Turn 1)
      if (!storedName && !nameSkipped) {
        const cleanName = text.replace(/^(my name is|i am|i'm|myself)\s+/i, "").replace(/[.!,]/g, "").trim();
        const looksLikeQuestion = text.includes("?") || /^(what|how|why|when|where|can|is|tell|do|fee|batch|course|consult|hiring|project)/i.test(text);
        const notANameWords = /\b(from|having|with|looking|interested|seeking|graduate|graduated|student|year|years|gap|work|working|experience|non-it|it|mechanical|civil|commerce|bcom|bsc|btech|mtech|degree|rpa|uipath|course|batch|fee|fees|pricing|cost|demo|class|training|job|placed|placement|salary|help|consult|consulting|automation)\b/i;
        const words = cleanName.split(/\s+/);
        const isLikelyName = !looksLikeQuestion &&
                             !notANameWords.test(text) &&
                             words.length >= 1 &&
                             words.length <= 3 &&
                             /^[a-zA-Z\s.'-]+$/.test(cleanName) &&
                             cleanName.length >= 2 &&
                             cleanName.length <= 30;

        if (isLikelyName) {
          // User provided their name!
          sessionStorage.setItem("rpav_user_name", cleanName);
          appendMessage(text, "user");

          const greetingReply = `Nice to meet you, <strong>${cleanName}</strong>! 🎉<br/><br/>Whether you're exploring career transitions from a non-IT background, upskilling after a career gap, or looking for enterprise services, I'm here to help.<br/><br/>So, ${cleanName}, <strong>what would you like to know first?</strong>`;

          appendMessage(greetingReply, "bot");
          const history = getHistory();
          history.push({ role: "user", text: `My name is ${cleanName}` });
          history.push({ role: "model", text: `Nice to meet you, ${cleanName}! What would you like to know first?` });
          saveHistory(history);

          inputField.placeholder = "Ask about courses, career gap, fees, or consulting...";
          sendBtn.disabled = false;
          focusInputOnDesktop();

          // Update Notion session in background with their real name
          fetch(CONFIG.leadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionId,
              name: cleanName,
              phone: "",
              email: "",
              pageUrl: window.location.href
            })
          }).catch(function () {});

          return;
        } else {
          // User skipped name and asked a question directly!
          sessionStorage.setItem("rpav_name_skipped", "true");
          // Proceed directly without asking name again!
        }
      }

      appendMessage(text, "user");

      const previousHistory = getHistory();
      showTypingIndicator();

      try {
        const pageContext = getPageContext();

        const response = await fetch(CONFIG.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId: sessionId,
            userName: storedName || "",
            history: previousHistory.slice(-10), // Send previous turns for conversational memory
            pageUrl: window.location.href,
            pageContext: pageContext
          })
        });

        const data = await response.json();
        removeTypingIndicator();

        const botReply = data.reply || "I'm having a brief connection issue. Please feel free to leave your contact details so our team can assist you directly.";
        appendMessage(botReply, "bot");

        const updatedHistory = getHistory();
        updatedHistory.push({ role: "user", text: text });
        updatedHistory.push({ role: "model", text: botReply });
        saveHistory(updatedHistory);

        // Offer lead card only if user agreed to document or asked for contact
        const userAgreed = /^(yes|yeah|sure|yep|send|please|ok|okay|send it|share|why not|definitely)/i.test(text.trim());
        const askedDoc = text.toLowerCase().includes("syllabus") || text.toLowerCase().includes("document") || text.toLowerCase().includes("whatsapp") || text.toLowerCase().includes("pdf") || text.toLowerCase().includes("brochure");
        const lastBotOffer = /document|whatsapp|roadmap|syllabus/i.test(botReply);

        if ((data.suggest_contact && (userAgreed || askedDoc)) || (userAgreed && lastBotOffer) || askedDoc) {
          injectLeadForm();
        }
      } catch (err) {
        removeTypingIndicator();
        appendMessage(
          "I apologize, our counseling server is momentarily unavailable. Please feel free to try again in a moment.",
          "bot"
        );
      } finally {
        sendBtn.disabled = false;
        focusInputOnDesktop();
      }
    }

    // Event Listeners
    sendBtn.addEventListener("click", function () {
      handleSend();
    });

    inputField.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    });

    // Starter Chip clicks
    chipsContainer.addEventListener("click", function (e) {
       const chip = e.target.closest(".rpav-chip");
       if (chip) {
         const question = chip.getAttribute("data-question");
         if (question) {
           trackAnalyticsEvent("chat_chip_click", { chip_text: question });
         }
         if (question && question.includes("WhatsApp")) {
           handleWhatsAppDirect();
         } else {
           handleSend(question);
         }
       }
     });
  }

  // Auto-run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
