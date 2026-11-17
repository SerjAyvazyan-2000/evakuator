/* =========================================================
   ТРОС — шаблон «Эвакуатор 24/7». Чистый JS, без библиотек.
   ========================================================= */
(() => {
  "use strict";

  const doc = document.documentElement;
  doc.classList.add("js");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("ru-RU");
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- год в футере ---------- */
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- разбивка заголовка на слова ---------- */
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const w = document.createElement("span"); w.className = "word";
            const inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--i", i++);
            w.append(inner); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-in")));
  });

  /* ---------- появление при скролле ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  $$("[data-reveal]").forEach((el) => io.observe(el));

  /* ---------- шапка + мобильная кнопка звонка ---------- */
  const header = $("#header");
  const callbar = $(".callbar");
  let lastY = 0;
  const onScrollUI = () => {
    const sy = window.scrollY;
    header.classList.toggle("is-scrolled", sy > 10);
    if (callbar) callbar.classList.toggle("is-show", sy > window.innerHeight * 0.6);
    lastY = sy;
  };

  /* ---------- меню ---------- */
  const burger = $("#burger"), nav = $("#nav");
  const closeMenu = () => { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); };
  burger.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", closeMenu));
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  matchMedia("(min-width: 961px)").addEventListener("change", (e) => { if (e.matches) closeMenu(); });

  /* активный пункт меню */
  const sections = $$("main section[id]");
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      $$(".nav a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => navIO.observe(s));

  /* ---------- параллакс + дорога процесса (один rAF) ---------- */
  const para = $$("[data-parallax]");
  const truck = $("[data-parallax-x]");
  const proc = $(".process__wrap");
  const steps = $$(".step");
  let ticking = false;

  const frame = () => {
    ticking = false;
    const sy = window.scrollY, vh = window.innerHeight;
    onScrollUI();

    if (!reduce && sy < vh * 1.2) {
      para.forEach((el) => {
        const k = parseFloat(el.dataset.parallax) || 0.2;
        el.style.transform = `translate3d(0, ${sy * k}px, 0)`;
      });
      if (truck) truck.style.transform = `translate3d(${-sy * 0.35}px, 0, 0)`;
    }

    if (proc) {
      const r = proc.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = Math.min(1, Math.max(0, (vh * 0.55 - r.top) / r.height));
        proc.style.setProperty("--p", (p * 100).toFixed(2) + "%");
        steps.forEach((s) => {
          const sr = s.getBoundingClientRect();
          s.classList.toggle("is-on", sr.top < vh * 0.62);
        });
      }
    }
  };
  const requestFrame = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", requestFrame, { passive: true });
  addEventListener("resize", requestFrame, { passive: true });
  frame();

  /* ---------- наклон карточек техники (кнопки не двигаются) ---------- */
  if (fine && !reduce) {
    /* наклон карточек техники */
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", (px * 6).toFixed(2) + "deg");
        card.style.setProperty("--rx", (-py * 6).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", () => { card.style.setProperty("--ry", "0deg"); card.style.setProperty("--rx", "0deg"); });
    });
  }

  /* ---------- «Что случилось?» ---------- */
  const CASES = {
    start: { title: "Машина не заводится", time: "Подача 20–30 мин", price: "от 2 500 ₽",
      text: "Сначала попробуем завести: прикурим или поставим бустер. Не помогло — грузим на платформу и везём в ваш сервис.",
      list: ["Прикурить / бустер на месте", "Погрузка с лебёдкой без запуска двигателя", "Доставка в любой сервис или к дому"] },
    crash: { title: "Авто после ДТП", time: "Подача 20–40 мин", price: "от 3 500 ₽",
      text: "Приедем, даже если машина не катится. Поможем с фотофиксацией для страховой и отвезём на стоянку или в сервис.",
      list: ["Погрузка разбитого авто без доп. повреждений", "Фото для страховой и европротокола", "Хранение на охраняемой стоянке"] },
    lock: { title: "Заблокированы колёса", time: "Подача 25–40 мин", price: "от 3 500 ₽",
      text: "Коробка-автомат в «паркинге», руль на замке или сломан привод — ставим колёса на подкатные тележки и грузим.",
      list: ["Подкатные тележки под каждое колесо", "Без буксировки и износа коробки", "Подходит для полного привода"] },
    moto: { title: "Перевезти мотоцикл", time: "Подача 30–45 мин", price: "от 2 000 ₽",
      text: "Возим мотоциклы, скутеры и квадроциклы в специальных фиксаторах — без риска уронить или поцарапать.",
      list: ["Фиксатор переднего колеса", "Мягкие ремни, не касаемся пластика", "На сезонное хранение и в сервис"] },
    stuck: { title: "Застрял в снегу или кювете", time: "Подача 30–50 мин", price: "от 4 000 ₽",
      text: "Вытащим лебёдкой или манипулятором. Если машина на ходу — поедете сами, платите только за вытаскивание.",
      list: ["Лебёдка до 5 тонн", "Манипулятор, если не подъехать", "Выезд за город и на трассы"] },
    move: { title: "Перевезти авто без поломки", time: "По времени, удобному вам", price: "от 2 500 ₽",
      text: "Купили машину, переезжаете или везёте на тюнинг — доставим в другой город или район к нужному часу.",
      list: ["Межгород до 1000 км", "Бронирование на дату и время", "Договор и закрывающие документы"] }
  };
  const panel = $(".help__panel");
  const h = (k) => $(`[data-h="${k}"]`, panel);
  const keys = Object.keys(CASES);
  $$(".chip").forEach((chip) => chip.addEventListener("click", () => {
    if (chip.classList.contains("is-active")) return;
    $$(".chip").forEach((c) => { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-selected", String(c === chip)); });
    const d = CASES[chip.dataset.case];
    panel.classList.add("is-swap");
    setTimeout(() => {
      h("num").textContent = String(keys.indexOf(chip.dataset.case) + 1).padStart(2, "0");
      h("title").textContent = d.title; h("time").textContent = d.time; h("price").textContent = d.price; h("text").textContent = d.text;
      h("list").innerHTML = d.list.map((li) => `<li>${li}</li>`).join("");
      panel.classList.remove("is-swap");
    }, 260);
  }));

  /* ---------- калькулятор ----------
     Цены меняйте здесь: base — подача и первые 10 км, km — каждый следующий км */
  const PRICES = {
    car:   { name: "Легковой",     base: 2500, km: 70 },
    suv:   { name: "Внедорожник",  base: 3200, km: 90 },
    moto:  { name: "Мотоцикл",     base: 2000, km: 60 },
    van:   { name: "Микроавтобус", base: 4000, km: 110 },
    heavy: { name: "Спецтехника",  base: 6000, km: 150 }
  };
  const EXTRA = { lock: { name: "Колёса заблокированы", add: 1000 }, winch: { name: "Лебёдка", add: 1500 } };
  const NIGHT = 1.2;

  const kmIn = $("#calcKm"), kmOut = $("#kmOut"), rows = $("#ticketRows"), priceOut = $("#priceOut");
  let shown = 0, animRaf;
  const animatePrice = (to) => {
    cancelAnimationFrame(animRaf);
    if (reduce) { shown = to; priceOut.textContent = fmt(to); return; }
    const from = shown, t0 = performance.now(), dur = 600;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      shown = from + (to - from) * e; priceOut.textContent = fmt(shown);
      if (k < 1) animRaf = requestAnimationFrame(step);
    };
    animRaf = requestAnimationFrame(step);
  };
  const calc = () => {
    const type = PRICES[$('input[name="type"]:checked').value];
    const km = +kmIn.value;
    kmOut.textContent = km + " км";
    kmIn.style.setProperty("--p", ((km - kmIn.min) / (kmIn.max - kmIn.min)) * 100 + "%");
    const extraKm = Math.max(0, km - 10);
    const list = [[`Подача + 10 км · ${type.name}`, type.base]];
    if (extraKm) list.push([`Ещё ${extraKm} км × ${type.km} ₽`, extraKm * type.km]);
    let sum = type.base + extraKm * type.km;
    $$(".calc__opts input:checked").forEach((c) => {
      if (EXTRA[c.value]) { list.push([EXTRA[c.value].name, EXTRA[c.value].add]); sum += EXTRA[c.value].add; }
    });
    if ($('.calc__opts input[value="night"]').checked) {
      const add = Math.round(sum * (NIGHT - 1) / 50) * 50;
      list.push(["Ночной коэффициент ×1,2", add]); sum += add;
    }
    sum = Math.round(sum / 50) * 50;
    rows.innerHTML = list.map(([n, v], i) => `<div class="ticket__row" style="animation-delay:${i * 40}ms"><span>${n}</span><span>${fmt(v)} ₽</span></div>`).join("");
    animatePrice(sum);
    $("#calcCta").dataset.price = sum;
  };
  $$("#calc input").forEach((el) => el.addEventListener("input", calc));
  calc();
  $("#ticketId").textContent = String(Math.floor(1000 + Math.random() * 8999));

  /* перенос расчёта в комментарий заявки */
  $("#calcCta").addEventListener("click", () => {
    const ta = $('#orderForm textarea[name="comment"]');
    const type = PRICES[$('input[name="type"]:checked').value].name;
    ta.value = `${type}, ~${kmIn.value} км. Расчёт на сайте: ${fmt(+$("#calcCta").dataset.price)} ₽`;
  });

  /* ---------- счётчики ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || "";
      countIO.unobserve(el);
      if (reduce) { el.textContent = fmt(to) + suf; return; }
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * ease) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- «машин на линии» ---------- */
  const live = $("[data-live]");
  if (live) setInterval(() => { live.textContent = 2 + Math.floor(Math.random() * 3); }, 9000);

  /* ---------- лента техники: стрелки + drag ---------- */
  const rail = $("#fleetRail");
  if (rail) {
    $$("[data-fleet]").forEach((b) => b.addEventListener("click", () => {
      const card = rail.querySelector(".truck-card");
      rail.scrollBy({ left: (+b.dataset.fleet) * (card.offsetWidth + 20), behavior: reduce ? "auto" : "smooth" });
    }));
    if (fine) {
      let down = false, sx = 0, sl = 0, moved = false;
      rail.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
      addEventListener("pointermove", (e) => {
        if (!down) return;
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 5 && !moved) { moved = true; rail.classList.add("is-drag"); }
        if (moved) rail.scrollLeft = sl - dx;
      });
      addEventListener("pointerup", () => { if (!down) return; down = false; rail.classList.remove("is-drag"); });
    }
  }

  /* ---------- аккордеон ---------- */
  $$(".acc__btn").forEach((btn) => btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    $$(".acc__btn").forEach((b) => b.setAttribute("aria-expanded", "false"));
    btn.setAttribute("aria-expanded", String(!open));
  }));

  /* ---------- модалка политики ---------- */
  const modal = $("#privacy");
  $$("[data-open]").forEach((b) => b.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    const a = b.dataset.anchor && modal.querySelector("#" + b.dataset.anchor);
    if (a) setTimeout(() => a.scrollIntoView({ block: "start" }), 50); else modal.scrollTop = 0;
  }));
  $$("[data-close]", modal).forEach((b) => b.addEventListener("click", () => modal.close()));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  /* ---------- маска телефона ---------- */
  const tel = $('#orderForm input[name="phone"]');
  tel.addEventListener("input", () => {
    let d = tel.value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    let out = "+7";
    if (p[0]) out += " (" + p[0]; if (p[0].length === 3) out += ")";
    if (p[1]) out += " " + p[1]; if (p[2]) out += "-" + p[2]; if (p[3]) out += "-" + p[3];
    tel.value = d.length > 1 ? out : "";
  });

  /* ---------- форма ----------
     Чтобы заявки приходили в Telegram / CRM — отправьте данные на свой
     обработчик (PHP, serverless-функция) в месте, отмеченном TODO. */
  const form = $("#orderForm"), status = $("#formStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name, consent = form.elements.consent;
    let ok = true;
    [name, tel].forEach((f) => f.closest(".field").classList.remove("is-error"));
    consent.closest(".check").classList.remove("is-error");
    if (name.value.trim().length < 2) { name.closest(".field").classList.add("is-error"); ok = false; }
    if (tel.value.replace(/\D/g, "").length < 11) { tel.closest(".field").classList.add("is-error"); ok = false; }
    if (!consent.checked) { consent.closest(".check").classList.add("is-error"); ok = false; }
    if (!ok) { status.className = "form__status err"; status.textContent = "Проверьте имя, телефон и согласие на обработку данных."; return; }

    // TODO: fetch("/send.php", { method: "POST", body: new FormData(form) })
    status.className = "form__status ok";
    status.textContent = "Заявка принята. Диспетчер перезвонит в течение минуты.";
    form.reset();
  });

  /* ---------- cookie (152-ФЗ) ----------
     Аналитика (Метрика и т.п.) запускается ТОЛЬКО после согласия — в loadAnalytics() */
  const KEY = "cookie-consent-v1";
  const banner = $("#cookie"), opts = $("#cookieOpts"), ckA = $("#ckAnalytics");
  const loadAnalytics = () => {
    /* сюда вставьте код Яндекс Метрики / GA */
  };
  const save = (analytics) => {
    store.set(KEY, { necessary: true, analytics, date: new Date().toISOString() });
    banner.hidden = true;
    if (analytics) loadAnalytics();
  };
  const saved = store.get(KEY);
  if (saved) { if (saved.analytics) loadAnalytics(); }
  else setTimeout(() => { banner.hidden = false; }, 1200);

  $("#ckAccept").addEventListener("click", () => save(opts.hidden ? true : ckA.checked));
  $("#ckNecessary").addEventListener("click", () => save(false));
  $("#ckSettings").addEventListener("click", () => {
    opts.hidden = !opts.hidden;
    $("#ckAccept .btn__label").textContent = opts.hidden ? "Принять все" : "Сохранить выбор";
  });
  $("#cookieSettingsLink").addEventListener("click", () => {
    const s = store.get(KEY); ckA.checked = !!(s && s.analytics);
    opts.hidden = false; $("#ckAccept .btn__label").textContent = "Сохранить выбор";
    banner.hidden = false;
  });
})();
