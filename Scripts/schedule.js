/* ============================================================
   schedule.js — Polaris co-stream calendar renderer

   EDIT YOUR SCHEDULE HERE.
   Add / remove / change entries in the scheduleData array below
   — that's it. Nothing else in this file needs to change.

   Fields:
     game    -> string, name of the game/stream
     date    -> "YYYY-MM-DD"  (local calendar date of the stream)
     time    -> "HH:MM"       (24hr, LOCAL TIME where you are, e.g. Ireland)
     timezone-> label shown next to the time, e.g. "IST" or "Europe/Dublin"
     duration-> approx length in minutes (used only for the
                "LIVE" window, defaults to 180 if omitted)
     note    -> optional short string, e.g. "Ranked grind", "Co-op with friend"
     platform-> "twitch" | "youtube"  (controls icon/badge)
   ============================================================ */

const scheduleData = [
    {
        game: "Scrap Mechanic 1.0",
        date: "2026-07-25",
        time: "23:30",
        timezone: "SAST",
        duration: 180,
        note: "Co-op with Kill3rKai",
        platform: "twitch"
    },
    {
        game: "Phasmophobia",
        date: "2026-07-31",
        time: "23:00",
        timezone: "SAST",
        duration: 180,
        note: "Co-op with Polaris and Teo",
        platform: "twitch"
    },
    {
        game: "Machine Party",
        date: "2026-08-01",
        time: "23:00",
        timezone: "SAST",
        duration: 180,
        note: "Co-op with Polaris and Teo",
        platform: "twitch"
    },
    {
        game: "Palword",
        date: "2026-08-07",
        time: "23:00",
        timezone: "SAST",
        duration: 180,
        note: "Co-op with Polaris and maybe Teo",
        platform: "twitch"
    },
    {
        game: "Crashout Crew",
        date: "2026-08-07",
        time: "23:00",
        timezone: "SAST",
        duration: 120,
        note: "Co-op with Polaris and maybe Teo",
        platform: "twitch"
    },
    {
        game: "Palword",
        date: "2026-08-08",
        time: "23:00",
        timezone: "IST",
        duration: 180,
        note: "Co-op with Polaris and maybe Teo",
        platform: "twitch"
    }
];

(function () {
    const PLATFORM = {
        twitch: { icon: "fa-brands fa-twitch", color: "#9146ff" },
        youtube: { icon: "fa-brands fa-youtube", color: "#ff0000" }
    };
    const MONTH_NAMES = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

    let entries = [];
    let view = { year: null, month: null }; // month is 0-indexed

    function toKey(y, m, d) {
        return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }

    function parseEntries(raw) {
        return raw.map((e) => {
            const start = new Date(`${e.date}T${e.time}:00`);
            const end = new Date(start.getTime() + (e.duration || 180) * 60000);
            return { ...e, start, end };
        });
    }

    function groupByDate(list) {
        const map = {};
        list.forEach((e) => {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }

    function formatTime(d) {
        return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }

    function formatFullDate(d) {
        return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    }

    function typeText(el, text, speed = 28) {
        el.textContent = "";
        let i = 0;
        clearInterval(el._typeTimer);
        el._typeTimer = setInterval(() => {
            el.textContent += text[i];
            i++;
            if (i >= text.length) clearInterval(el._typeTimer);
        }, speed);
    }

    function updateTicker() {
        const now = new Date();
        const el = document.getElementById("ticker-text");
        const upcoming = entries
            .filter((e) => e.end > now)
            .sort((a, b) => a.start - b.start)[0];

        if (!upcoming) {
            typeText(el, "NO STREAMS SCHEDULED — CHECK BACK SOON");
            return;
        }
        const live = now >= upcoming.start && now <= upcoming.end;
        const text = live
            ? `LIVE NOW: ${upcoming.game.toUpperCase()} — TUNE IN`
            : `NEXT_STREAM: ${upcoming.game.toUpperCase()} — ${formatFullDate(upcoming.start).toUpperCase()}, ${formatTime(upcoming.start)} ${upcoming.timezone || ""}`;
        typeText(el, text);
    }

    function openDetail(dateKey, dayEntries) {
        const backdrop = document.getElementById("cal-detail-backdrop");
        const dateEl = document.getElementById("cal-detail-date");
        const bodyEl = document.getElementById("cal-detail-body");

        dateEl.textContent = formatFullDate(dayEntries[0].start);
        bodyEl.innerHTML = dayEntries.map((e) => {
            const p = PLATFORM[e.platform] || PLATFORM.twitch;
            const now = new Date();
            const live = now >= e.start && now <= e.end;
            return `
        <div class="cal-detail-entry">
          <i class="${p.icon} cal-detail-icon" style="color:${p.color};"></i>
          <div>
            <div class="cal-detail-game">${e.game}</div>
            <div class="cal-detail-time">${live ? "LIVE NOW · " : ""}${formatTime(e.start)} ${e.timezone || ""}</div>
            ${e.note ? `<div class="cal-detail-note">${e.note}</div>` : ""}
          </div>
        </div>
      `;
        }).join("");

        backdrop.classList.add("open");
    }

    function closeDetail() {
        document.getElementById("cal-detail-backdrop").classList.remove("open");
    }

    function renderCalendar() {
        const { year, month } = view;
        const grid = document.getElementById("cal-grid");
        const title = document.getElementById("cal-title");
        title.textContent = `${MONTH_NAMES[month]} ${year}`;

        const byDate = groupByDate(entries);
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const today = new Date();
        const cells = [];

        // leading days from previous month
        for (let i = firstWeekday - 1; i >= 0; i--) {
            cells.push({ day: daysInPrevMonth - i, otherMonth: true, y: month === 0 ? year - 1 : year, m: month === 0 ? 11 : month - 1 });
        }
        // current month days
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ day: d, otherMonth: false, y: year, m: month });
        }
        // trailing days to complete the grid (multiple of 7, up to 42)
        while (cells.length % 7 !== 0 || cells.length < 42) {
            const last = cells[cells.length - 1];
            const nextM = last.m === 11 ? 0 : last.m + 1;
            const nextY = last.m === 11 ? last.y + 1 : last.y;
            const dayNum = cells.length - (firstWeekday + daysInMonth) + 1;
            cells.push({ day: dayNum, otherMonth: true, y: nextY, m: nextM });
            if (cells.length >= 42) break;
        }

        grid.innerHTML = cells.map((c) => {
            const key = toKey(c.y, c.m, c.day);
            const dayEntries = byDate[key] || [];
            const isToday = !c.otherMonth &&
                c.y === today.getFullYear() && c.m === today.getMonth() && c.day === today.getDate();

            const classes = ["cal-cell"];
            if (c.otherMonth) classes.push("other-month");
            if (isToday) classes.push("is-today");
            if (dayEntries.length) classes.push("has-event");

            const now = new Date();
            let pillsHtml = "";
            if (dayEntries.length) {
                const shown = dayEntries.slice(0, 2);
                pillsHtml = shown.map((e) => {
                    const live = now >= e.start && now <= e.end;
                    return `
            <span class="cal-pill ${live ? "is-live" : ""}">
              ${live ? '<span class="cal-live-dot"></span>' : ""}
              <span class="cal-pill-mask"><span class="cal-pill-label">${e.game}</span></span>
            </span>
          `;
                }).join("");
                if (dayEntries.length > shown.length) {
                    pillsHtml += `<span class="cal-pill-more">+${dayEntries.length - shown.length} more</span>`;
                }
            }

            return `
        <div class="${classes.join(" ")}" data-key="${key}">
          <span class="cal-daynum">${c.day}</span>
          ${pillsHtml}
        </div>
      `;
        }).join("");

        // attach click handlers
        grid.querySelectorAll(".cal-cell.has-event").forEach((cell) => {
            cell.addEventListener("click", () => {
                const key = cell.getAttribute("data-key");
                openDetail(key, byDate[key]);
            });
        });

        // only turn on the scroll for names that actually don't fit —
        // short names (e.g. "Rust") just sit still.
        grid.querySelectorAll(".cal-pill-mask").forEach((mask) => {
            const label = mask.querySelector(".cal-pill-label");
            if (!label) return;
            const overflow = label.scrollWidth - mask.clientWidth;
            if (overflow > 2) {
                const dist = overflow + 6; // small buffer so the tail fully clears
                const duration = Math.min(10, Math.max(4, dist / 12));
                mask.classList.add("marquee");
                label.style.setProperty("--marquee-dist", `-${dist}px`);
                label.style.setProperty("--marquee-duration", `${duration}s`);
            }
        });
    }

    function changeMonth(delta) {
        let { year, month } = view;
        month += delta;
        if (month < 0) { month = 11; year -= 1; }
        if (month > 11) { month = 0; year += 1; }
        view = { year, month };
        const screen = document.getElementById("obs-screen");
        screen.style.opacity = "0.3";
        setTimeout(() => {
            renderCalendar();
            screen.style.transition = "opacity 0.25s ease";
            screen.style.opacity = "1";
        }, 120);
    }

    function init() {
        entries = parseEntries(typeof scheduleData !== "undefined" ? scheduleData : []);
        const now = new Date();
        view = { year: now.getFullYear(), month: now.getMonth() };

        renderCalendar();
        updateTicker();

        document.getElementById("cal-prev").addEventListener("click", () => changeMonth(-1));
        document.getElementById("cal-next").addEventListener("click", () => changeMonth(1));
        document.getElementById("cal-detail-close").addEventListener("click", closeDetail);
        document.getElementById("cal-detail-backdrop").addEventListener("click", (e) => {
            if (e.target.id === "cal-detail-backdrop") closeDetail();
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();