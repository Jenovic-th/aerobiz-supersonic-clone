# Workspace Operational Rules: Aerobiz Supersonic Project

This document defines mandatory, non-negotiable execution rules and quality safeguards for Antigravity when operating in this workspace.

---

## 1. CRITICAL EXECUTION PROTOCOL: ZERO PROCESS HANGS & STRICT TIMEOUTS

A recurring issue was processes (especially Electron or Node test runners) hanging in the background, blocking progress and wasting user time. The following rules are strictly enforced:

### A. Mandatory 15-Second Hard Watchdog in ALL Test Scripts
Every test, verification, or automated runner script (`scripts/*.cjs`, `scripts/*.js`) MUST include an unconditional watchdog timeout at the very top of the file:
```javascript
const _safetyWatchdog = setTimeout(() => {
  console.error('[WATCHDOG] Execution exceeded 15-second safety limit. Aborting immediately.');
  process.exit(1);
}, 15000);
if (_safetyWatchdog.unref) _safetyWatchdog.unref();
```

### B. Mandatory Global Exception Handlers
Never allow Electron or Node to swallow an error and stay alive waiting for GUI/window events. Every script MUST include:
```javascript
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});
```

### C. Mandatory Pre-Flight Syntax Check
Before running any generated script with `npx electron` or `node`:
1. ALWAYS run: `node -c <path_to_script>`
2. Only if `node -c` exits with code 0 may the script be executed.
3. If syntax check fails, fix the script immediately; do NOT run it.

### D. Avoid Nested Escaped Template Literals in File Writers
When writing scripts via file tools, NEVER generate complex nested backtick template literals (e.g. `\`...\``). Use clean string concatenation (`'string ' + variable + ' text'`) to completely eliminate syntax parsing errors.

### E. Background Task Vigilance
1. When a command runs as a background task, NEVER leave it unmonitored.
2. If a command does not report completion within expected time (max 10-15 seconds), immediately check `manage_task` with action `status`.
3. If any task shows an error or stalls, kill it immediately with `manage_task` (`kill`) and resolve the issue.

---

## 2. GIT VERSION CONTROL PROTOCOL

- **NO AUTOMATIC / UNPROMPTED `git push`**:
  Do NOT push to GitHub automatically on every round or commit. Keep commits local. Only execute `git push` when the user explicitly requests it (e.g., "ส่งขึ้น GitHub ได้เลย", "push ได้เลย").

---

## 3. GAME SIMULATION RULES (AEROBIZ SUPERSONIC)

### A. Initial Slots Integrity (Turn 1 / Game Start)
- Airlines (both Player and AI rivals) must ONLY be granted landing slots at:
  1. Their Corporate Headquarters (`homeCityId`): default 25 slots.
  2. Their explicitly assigned starter route partner cities: default 14 slots each.
- **NEVER** assign phantom starter slots to unserved cities (e.g., TYO, LON, NYC, DXB, SIN, PAR) where the airline has no presence.

### B. Intelligent AI Slot Acquisition & Intercontinental Reach
- AI *is permitted* to negotiate slots and fly intercontinentally if:
  1. Direct distance between base and destination is within certified range of an aircraft owned by AI or affordable in the active era market (e.g., 8,000–10,500 km).
  2. The airline personality matches (`GLOBAL_FLAGSHIP`, `AGGRESSIVE`, `LUXURY`). `REGIONAL` airlines must build at least 3 regional routes before expanding overseas.
  3. AI's departure hub has at least 4 free weekly departures to anchor the service.

### C. Strict Anti-Hoarding & Immediate Slot Utilization
- If an AI airline holds $\ge 4$ slots in any destination city with zero active flights ("Unserved Slot City"), it is strictly forbidden from requesting new slots in another city until it operates flights to the existing unserved slots.
- When an AI acquires landing slots, Route Operations assigns top priority (`+2500` score) to immediately open a route and deploy an aircraft to that destination.
- Requested slot counts must be modest (7 to 10 slots for 1 daily round-trip), never 20–30 slots.
- **Use-it-or-Lose-it Regulation**: Airlines with excessive idle slots in non-hub cities must relinquish excess slots back to the airport pool.

---

## 4. BUILD & VERIFICATION STANDARDS

- Always run `npm.cmd run build` (`tsc -b && vite build`) to ensure 0 TypeScript or bundler errors.
- Any UI or state changes must preserve full JSON serialization compatibility for the Save & Load system (`localStorage` + JSON export/import).

---

## 5. MANDATORY GAME CONSTITUTION: THE "MUST-HAVE" RULES (กฎเหล็กประจำเกม - ห้ามละเมิดเด็ดขาด)

All development, UI design, and gameplay mechanics MUST strictly adhere to the following non-negotiable principles. Violating any of these rules is considered a critical regression.

### Rule 1: Viewport Integrity & Zero Window Truncation (การย่อ-ขยายหน้าต่างต้องสมบูรณ์ 100% / ห้ามปุ่มหลุดจอ)
1. **Critical Terminal Actions Permanently Visible**:
   - The primary turn advancement button (`End Quarter`), modal confirmations (`Start Game`, `Next Step`, `Commence Airline`, `Order Aircraft`), and dismiss buttons (`Close`, `Cancel`) MUST remain 100% visible inside the viewport bounds across all window sizes and resolutions ($1024 \times 768$, $1280 \times 720$, $1366 \times 768$, $1600 \times 900$, $1920 \times 1080$).
   - The `End Quarter` button must be permanently pinned to the right edge of the bottom toolbar with its own fixed container (`shrink-0 z-20`). It is strictly forbidden for horizontal scrolling or wide toolbars to push `End Quarter` off-screen or cut it in half.
2. **Proportional Responsiveness**:
   - When a user resizes or compacts the game window, cards, typography, and modal dialogs must scale responsively (`min-h-0`, `max-h-[90vh]`, auto-adjusting padding).
   - Scrollbars must be isolated internally to content cards (using `.custom-scrollbar` or `.no-scrollbar`), never pushing parent containers outside the application window.

### Rule 2: Clean UI, Anti-Bloat & Zero Redundancy (UI สะอาด สบายตา ไม่รก และไม่ซ้ำซ้อน)
1. **Minimalist & Functional Management Interface**:
   - The main bottom toolbar must be limited strictly to 9–10 essential primary action buttons (`Open Route`, `My Routes`, `Fleet`, `Market`, `Slots`, `Ventures`, `Board`, `Financials`, `News`, and `HUD toggle`).
   - Never cram passive status badges or secondary telemetry (such as Fuel Index, Event Radar chips, or Route counters) directly into the primary bottom bar. These belong inside the slide-up `Operations HUD Drawer` or their dedicated analytical modals.
2. **Single Source of Truth for Utilities**:
   - System controls (`Save Game`, `Load Game`, `Settings`, `Restart`) live exclusively inside the top-right `System` menu. Duplicate "Quick Save" or "Quick Load" buttons on the main screen are strictly forbidden.

### Rule 3: Zero Button Overlap & Collision Prevention (ปุ่มกดต้องไม่ทับกัน)
1. **Absolute Hitbox Containment**:
   - Interactive buttons must strictly stay within their parent containers across all resolutions and dynamic content lengths.
   - No negative margins or unconstrained absolute coordinates that cause buttons to overlap headers, body text, or adjacent cards.
2. **Clear Spacing**:
   - Every clickable element must maintain dedicated breathing room and distinct visual hover states.

### Rule 4: Living World Map & Flight Animations (แผนที่ต้องมีชีวิต: มีเส้นทางบินและเครื่องบินบินไป-มา)
1. **Dynamic Flight Arcs**:
   - Whenever an airline (Player or AI rival) operates a route, a Great Circle curved flight arc connecting origin and destination MUST be rendered in the airline's brand color.
   - Deficit routes operating at a financial loss must visually pulse crimson red (`#ef4444`) to immediately alert the executive.
2. **Animated Airliners**:
   - Commercial aircraft sprites must continuously fly along active route curves in real time.
   - High-frequency routes ($\ge 4$ flights/week) must display bidirectional traffic (two airliners flying concurrently in opposite directions).
   - Aircraft orientation must precisely match the tangent angle of the flight curve.

### Rule 5: Soothing Soundscape & Immersion (เสียงกดสมจริง นุ่มนวล ไม่แสบหู / มี Lo-Fi BGM คลอเบาๆ)
1. **Tactile Mechanical Clicks Only**:
   - STRICTLY FORBIDDEN: High-pitched arcade sweeps, 8-bit laser chirps ("ปิ้วๆ"), and harsh synthesizer beeps.
   - All standard button clicks must use authentic, soft microswitch mouse click transients (`click`: 2.4kHz mechanical transient + 320Hz body tap, 6–8ms duration, gentle volume).
   - Major confirmations must use a soft tactile double-tap click (`confirm`).
2. **Procedural Lo-Fi Ambient BGM**:
   - The game must provide a procedural, warm Lo-Fi ambient music engine (warm Rhodes electric piano jazz chords, subtle vinyl dust crackle, analog tape warmth) looping soothingly in the background to foster executive focus.
   - Support custom external MP3 audio placed in `public/audio/bgm/` with automatic fallback to the procedural engine.
   - Settings must provide clear, independent volume sliders and mute toggles for both SFX and BGM.

### Rule 6: Anti-Regression Protocol: "ห้ามแก้หน้าลืมหลัง" (Strict Anti-Regression Verification)
1. **Check Before Modifying**:
   - Before implementing any new request or bug fix, verify that the planned change does not violate Rules 1 through 7.
2. **Preserve Completed Work**:
   - Never remove or degrade previously established features (e.g., responsive scaling, flight path animations, slot allocation integrity, soundscape enhancements, route distance indicators) when working on an unrelated task.
3. **Multi-Resolution Verification**:
   - Any visual change must be validated against multiple viewport sizes ($1024 \times 768$, $1280 \times 720$, and widescreen) via automated verification runners (`scripts/verify_*.cjs`) before declaring completion.

### Rule 7: Route Distance & Aircraft Range Transparency (ต้องแสดงระยะทางบินและพิสัยบินของเครื่องบินชัดเจนเสมอ)
1. **Prominent Route Distance Badge**:
   - In any route listing (especially `My Routes` / `Active Commercial Routes Network`), every route card MUST prominently display its exact Great Circle distance in kilometers (e.g. `[ 🧭 4,320 km ]`) immediately behind the origin and destination city pair header.
   - The route distance must also be stated in the route's secondary telemetry line (`Distance: 4,320 km`).
2. **Aircraft Range vs. Corridor Distance Comparison**:
   - Next to each assigned aircraft model, the aircraft's certified range MUST be explicitly stated (e.g. `Boeing 707-320B (พิสัยบิน 9,250 km)`).
   - In route modification and dispatch modals (`Modify Route`), every aircraft card (both currently assigned planes and available idle planes in the hangar) MUST display:
     1. The aircraft's certified range (`model.rangeKm`).
     2. The route's direct corridor distance (`editingDistance`).
     3. The explicit range margin/buffer (e.g. `ส่วนต่างพิสัย: +1,454 km` / `ส่วนเกินพิสัย: +1,454 km`).
   - It is strictly forbidden to hide or omit distance and range data, as executives depend on distance metrics to select, swap, and optimize fleet deployment.

