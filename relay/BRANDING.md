# Relay — Branding Guide

Copy-paste reference for maintaining consistent design across all parts of the app.

---

## Color Palette

```css
:root {
  --bg:       #ffffff;   /* Page background */
  --surface:  #f5f5f5;   /* Card / input backgrounds */
  --surface2: #eeeeee;   /* Secondary surface, hover states */
  --border:   #e0e0e0;   /* All borders and dividers */
  --text:     #0a0a0a;   /* Primary text */
  --muted:    #888888;   /* Secondary / label text */
  --muted2:   #c0c0c0;   /* Placeholder text, inactive states */
  --black:    #0a0a0a;   /* CTAs, active elements, icons */
  --white:    #ffffff;   /* Text on black backgrounds */
  --green:    #18c964;   /* Success states only */
  --radius:    20px;     /* Large cards, input boxes */
  --radius-sm: 12px;     /* Small cards, banners */
  --radius-xs:  8px;     /* Inline elements */
}
```

**Rule:** No color accents (no blue, purple, red). Black and white only except `--green` for resolved/success.

---

## Typography

```css
font-family: -apple-system, "Inter", "Segoe UI", system-ui, sans-serif;
-webkit-font-smoothing: antialiased;
```

| Use | Size | Weight | Letter-spacing |
|---|---|---|---|
| Hero headline | `clamp(42px, 6.5vw, 72px)` | 900 | `-3px` |
| Section heading | `30–36px` | 900 | `-1.2px` |
| Card heading | `26px` | 900 | `-.8px` |
| Body | `15px` | 400 | normal |
| Label / meta | `11–12px` | 700 | `.1–.12em` uppercase |
| Small detail | `13px` | 400–600 | normal |

**Rule:** Headings are always weight 900, tight letter-spacing. Body never exceeds weight 600.

---

## Buttons

```css
/* Primary — black fill, white text */
.btn-primary {
  background: #0a0a0a; color: #ffffff;
  font-size: 14px; font-weight: 700;
  border: none; border-radius: 100px; padding: 13px 28px;
  cursor: pointer; transition: background .15s, transform .1s;
  letter-spacing: -.2px;
}
.btn-primary:hover { background: #333333; }
.btn-primary:active { transform: scale(.97); }
.btn-primary:disabled { opacity: .3; cursor: not-allowed; }

/* Ghost — white fill, light border */
.btn-ghost {
  background: #ffffff; color: #0a0a0a;
  font-size: 14px; font-weight: 700;
  border: 2px solid #e0e0e0; border-radius: 100px; padding: 11px 24px;
  cursor: pointer; transition: border-color .15s;
  letter-spacing: -.2px;
}
.btn-ghost:hover { border-color: #0a0a0a; }

/* Outline — white fill, black border, inverts on hover */
.btn-outline {
  background: #ffffff; color: #0a0a0a;
  font-size: 14px; font-weight: 700;
  border: 2px solid #0a0a0a; border-radius: 100px; padding: 11px 24px;
  cursor: pointer; transition: background .15s, color .15s;
  letter-spacing: -.2px;
}
.btn-outline:hover { background: #0a0a0a; color: #ffffff; }
```

---

## Navigation Bar

```css
.nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 40px;
  border-bottom: 1px solid #e0e0e0;
}
```

**Logo mark:** 30×30px, `border-radius: 9px`, black background, white "R", weight 900.
**Logo name:** 16px, weight 800, `letter-spacing: -.4px`.
**Nav tag pill:** 12px, weight 600, muted text, surface background, 100px border-radius.

---

## Input Box (issue input)

```css
.input-shell {
  background: #ffffff; border: 2px solid #0a0a0a;
  border-radius: 20px; padding: 6px 6px 6px 22px;
  display: flex; align-items: flex-end; gap: 10px;
  transition: box-shadow .2s;
}
.input-shell:focus-within {
  box-shadow: 0 0 0 4px rgba(10,10,10,.07);
}
/* Send button inside */
.send-btn {
  background: #0a0a0a; color: #ffffff; border: none;
  border-radius: 13px; width: 42px; height: 42px; font-size: 17px;
  cursor: pointer;
}
```

---

## Cards

```css
/* Standard surface card */
.card {
  background: #f5f5f5; border: 1px solid #e0e0e0;
  border-radius: 20px; padding: 24px;
}

/* Emphasis card (black) */
.card-dark {
  background: #0a0a0a; color: #ffffff;
  border-radius: 12px; padding: 18px 20px;
}
.card-dark p { opacity: .75; }
.card-dark a { color: #ffffff; font-weight: 700; text-decoration: underline; }

/* Journey / thread card — heavy border */
.card-bordered {
  border: 2px solid #0a0a0a;
  border-radius: 20px; overflow: hidden;
}
```

---

## Chips / Tags / Pills

```css
/* Quick-select chip */
.chip {
  background: #f5f5f5; border: 1px solid #e0e0e0;
  border-radius: 100px; font-size: 12px; font-weight: 500;
  color: #888888; padding: 6px 14px; cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.chip:hover { background: #0a0a0a; color: #ffffff; border-color: #0a0a0a; }

/* Status pill (outlined) */
.status-pill {
  font-size: 11px; font-weight: 800; letter-spacing: .08em;
  text-transform: uppercase; padding: 4px 12px; border-radius: 100px;
  border: 2px solid #0a0a0a; color: #0a0a0a;
}
.status-pill.resolved { background: #0a0a0a; color: #ffffff; }

/* Department / category tag */
.dept-tag {
  background: #eeeeee; color: #888888;
  font-size: 11px; font-weight: 700;
  padding: 4px 10px; border-radius: 100px;
  border: 1px solid #e0e0e0;
}
```

---

## Notification Banner

```css
.notif {
  position: fixed; top: -100px; left: 50%; transform: translateX(-50%);
  background: #0a0a0a; color: #ffffff;
  border-radius: 16px; padding: 13px 18px;
  display: flex; align-items: center; gap: 12px;
  min-width: 300px; max-width: 420px; z-index: 1000;
  transition: top .45s cubic-bezier(.34,1.56,.64,1);
  box-shadow: 0 12px 40px rgba(0,0,0,.14);
}
.notif.show { top: 22px; }
/* App label: 10px, weight 800, uppercase, .1em spacing, 50% opacity */
/* Title: 13px, weight 700 */
/* Body: 12px, 60% opacity */
```

Trigger: add `.show` class. Remove after 4500ms.

---

## Chat Thread (Relay view)

```css
/* Outgoing (student) */
.bubble-out {
  background: #0a0a0a; color: #ffffff;
  border-radius: 18px; border-bottom-right-radius: 4px;
  padding: 13px 17px; font-size: 14px; max-width: 76%;
}

/* Incoming (department reply) */
.bubble-in {
  background: #f5f5f5; color: #0a0a0a;
  border: 1px solid #e0e0e0;
  border-radius: 18px; border-bottom-left-radius: 4px;
  padding: 13px 17px; font-size: 14px; max-width: 76%;
}
```

---

## Status / Progress Indicators

```css
/* Pulsing dot (in progress) */
.dot-active {
  width: 8px; height: 8px; border-radius: 50%;
  background: #0a0a0a;
  animation: pulse-dot 1.4s infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .3; transform: scale(.6); }
}

/* Spinning loader */
.icon-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Completed icon */
.icon-done {
  background: #0a0a0a; color: #ffffff;
  border-radius: 50%; font-size: 11px; font-weight: 900;
}
```

---

## Spacing & Layout

- Max content width: `580–640px`, centred
- Section padding: `48px 24px`
- Card internal padding: `24px`
- Gap between stacked elements: `10–16px`
- Mobile breakpoint: `540px` — stack horizontal button groups vertically

---

## Eyebrow Labels

All section labels use this pattern:

```css
font-size: 11px; font-weight: 700;
letter-spacing: .12em; text-transform: uppercase;
color: #888888; margin-bottom: 10px;
```

---

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use black fills for primary actions | Add color accents (blue, purple, green except success) |
| Heavy 900-weight headings, tight tracking | Mix font weights loosely |
| Rounded pills (100px) for buttons and tags | Use squared corners anywhere |
| Border-radius 20px for large cards | Use shadows on cards (borders only) |
| `--surface` (#f5f5f5) for card backgrounds | Use white-on-white without border |
| `--green` (#18c964) only for resolved/success | Use green for anything other than resolution |
