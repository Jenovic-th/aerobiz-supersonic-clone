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
