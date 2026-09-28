# ✈️ Aerobiz Supersonic Clone

A modern web & desktop airline management simulation game inspired by the legendary 1990s Koei classics **Aerobiz** and **Aerobiz Supersonic** (SNES / Sega Genesis / PC-98).

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **Canvas 2D**, and packaged with **Electron**.

---

## 🌟 Key Features

* **Turn-Based Quarterly Progression:** Manage your airline one quarter at a time across historical eras (starting from 1980 through modern and supersonic eras).
* **Interactive 2D World Map:** Great-circle routes, airport slot indicators, regional filters, and city demographic dioramas.
* **Realistic Commercial Aircraft Catalog:** 30+ meticulously detailed aircraft across Boeing, McDonnell Douglas, Airbus, Lockheed, Tupolev, Ilyushin, and Aérospatiale-BAC, complete with 4K air-to-air photography and vector blueprints.
* **Batch Procurement & Invoice Contracts:** Purchase airframes in bulk ($1, 2, 3, 5, 10, \text{Max}$) with formal procurement contracts and post-purchase cashflow projections.
* **Commercial Route Modification & Yield Management:**
  * Dynamic fare pricing ($-30\%$ to $+50\%$) with real-time base fare calculations.
  * Flight frequency scaling ($1\times$ to $14\times$ weekly flights) constrained by airport slot allocations.
  * 3-tier maintenance budget control (Budget, Standard Certified, Rigorous Premium) affecting airframe wear, reliability, and passenger demand.
  * **Capacity & Passenger Utilization Analysis:** Automatic baseline load factor conversion ($\frac{\text{Previous Pax}}{\text{New Seats}} \times 100\%$) and projected next-quarter market load factor when right-sizing or swapping aircraft.
* **Adaptive AI Competitors:** Rival airlines actively monitor their route profitability, adjust fares, scale frequency, swap airframes, and prune loss-making routes dynamically each quarter.
* **Quarterly Business Reports:** 3-tab financial statements, route P&L tables, advance aircraft releases, retirement notices, and factory manufacturer rebate deals.

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm**

### 2. Installation
```bash
git clone https://github.com/Jenovic-th/aerobiz-supersonic-clone.git
cd aerobiz-supersonic-clone
npm install
```

### 3. Development Mode
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build & Production Check
```bash
npm run build
```

### 5. Launch as Desktop App (Electron)
```bash
npm start
# or double-click launch_game.bat
```

### 6. Create / Refresh Desktop Shortcut
In PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\update_desktop_icon.ps1
```

---

## 📖 Detailed Handover & Architecture Spec

For comprehensive technical specifications, mathematical formulas, state flow diagrams, and a detailed development changelog, please refer to:
👉 **[HANDOFF.md](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/HANDOFF.md)**

---

## 📜 License
Inspired by Koei Aerobiz. Developed for educational and gaming enjoyment.
