# ✈️ Aerobiz Supersonic Clone — Comprehensive Development Handover Spec
**บันทึกสรุปรายละเอียดการพัฒนาและคู่มือส่งต่องาน (Handover Specification)**  
**วันที่บันทึก:** 28 กันยายน 2026 (September 28, 2026)  
**แรงบันดาลใจหลัก:** Koei *Aerobiz* & *Aerobiz Supersonic* (SNES / Mega Drive / PC-98)  
**เทคโนโลยีหลัก:** React 19, TypeScript, Vite, Tailwind CSS, Electron, Canvas 2D World Map  
**Repository:** `https://github.com/Jenovic-th/aerobiz-supersonic-clone.git` (Branch: `main`)

---

## 1. บริบทและสถานะปัจจุบันของโปรเจกต์ (Executive Summary)

งานทั้งหมดได้รับการพัฒนา ทดสอบแบบอัตโนมัติ (End-to-End via Electron) และ Build Production ผ่าน 100% ปราศจาก Error หรือ Warning ร้ายแรงใดๆ โดยระบบล่าสุดที่พัฒนาขึ้นครอบคลุมตั้งแต่การยกระดับ UI/UX ตลาดซื้อเครื่องบิน, ระบบสั่งซื้อแบบล็อตและสัญญาจัดซื้อ, ระบบปรับแต่งพารามิเตอร์เส้นทางบินเชิงลึก (Modify Route), การคำนวณสัดส่วนผู้โดยสารเดิมเทียบกับเครื่องบินใหม่ (Capacity & Passenger Utilization Analysis), ระบบ AI คู่แข่งปรับตัวอัตโนมัติตามกลไกตลาด (Dynamic AI Yield Management), ตลอดจนระบบ Shortcut บนหน้าจอที่ทำงานได้อย่างเสถียรและสะอาดตา

---

## 2. รายละเอียดระบบใหม่ที่พัฒนาเสร็จสมบูรณ์ในรอบนี้ (Newly Implemented Systems)

### 2.1 ระบบคำนวณและวิเคราะห์สัดส่วนที่นั่งผู้โดยสาร (Capacity & Passenger Utilization Analysis)
* **ไฟล์หลัก:** [`src/components/ManageRoutesModal.tsx`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/src/components/ManageRoutesModal.tsx)
* **โจทย์ของผู้ใช้:** เมื่อเปิดหน้าต่าง Modify Route เพื่อเปลี่ยนแบบเครื่องบิน เช่น เดิมใช้เครื่อง 160 ที่นั่ง บินอยู่ 100% แล้วนำเครื่องบินขนาดใหญ่ 290–300 ที่นั่งมาใส่แทน ต้องการทราบว่าผู้โดยสารเดิมจะคิดเป็นกี่เปอร์เซ็นต์ของลำใหม่ และประมาณการบินจริงในตลาดจะเป็นอย่างไร
* **สูตรการคำนวณและการทำงาน:**
  1. **สัดส่วนผู้โดยสารเดิมเทียบกับลำใหม่ (Baseline Load Factor):**
     $$\text{Baseline Load Factor (\%)} = \left(\frac{\text{ผู้โดยสารเฉลี่ยเดิมต่อเที่ยว}}{\text{ความจุที่นั่งลำใหม่}}\right) \times 100\%$$
     *ตัวอย่าง:* เดิมใช้ Boeing 727-200 (160 ที่นั่ง) มีผู้โดยสาร 134 คน/เที่ยว (84% LF) เมื่อสลับไปใช้ DC-10-30 (290 ที่นั่ง) ระบบจะแสดงว่าผู้โดยสารเดิมคิดเป็น **46%** ของลำใหม่ทันที
  2. **Widget วิเคราะห์ 3 มิติ (Capacity & Passenger Utilization Widget):**
     - **กล่องที่ 1: เครื่องบินเดิม (Previous Airframe):** แสดงรุ่นเดิม, ความจุเดิม (160 ที่นั่ง), ผู้โดยสารเฉลี่ยเดิม (134 คน), อัตราบรรทุกเดิม (84% LF)
     - **กล่องที่ 2: สัดส่วนผู้โดยสารเดิมเทียบกับลำใหม่ (Baseline on New Airframe):** แสดงรุ่นใหม่, ความจุใหม่ (290 ที่นั่ง), ส่วนต่างความจุ (+130 ที่นั่ง หรือ +81%), Baseline LF (46%)
     - **กล่องที่ 3: ประมาณการบินจริงในตลาด (Projected Flight Market Demand):** คำนวณด้วย Demand Model ของเส้นทาง แสดงผู้โดยสารคาดการณ์ (290 คน), กำไรสุทธิคาดการณ์ (+$6,873K), และ Proj. LF (100%)
  3. **Visual Multi-Segment Progress Bar:**
     - 🟪 **แถบสีม่วง:** ผู้โดยสารเดิมคิดเป็นกี่ % ของลำใหม่
     - 🟩 **แถบสีเขียวอมฟ้า:** อุปสงค์ในตลาดที่จะขยายเข้ามาเติมเต็มในไตรมาสถัดไป
     - ⬛ **แถบสีเทา:** ที่ว่างสำรองสำหรับรองรับการขยายตัวในอนาคต (Buffer Capacity)
  4. **Aircraft Card Badges:** แสดง Badge ส่วนต่างที่นั่งทันทีบนการ์ดเครื่องบินทุกลำในฝูงบิน เช่น `+130 seats` หรือ `-50 seats` พร้อมบรรทัดสรุป `สัดส่วนผู้โดยสารเดิม (134 คน): 46% (จากเดิม 84%)`

---

### 2.2 ระบบปรับแต่งพารามิเตอร์เส้นทางบินเชิงพาณิชย์ (Modify Commercial Route Modal)
* **ไฟล์หลัก:** [`src/components/ManageRoutesModal.tsx`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/src/components/ManageRoutesModal.tsx), [`src/simulation/engine.ts`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/src/simulation/engine.ts)
* **ความสามารถในการปรับแต่ง:**
  - **Dynamic Ticket Pricing:** ปรับค่าตั๋วโดยสารได้ตั้งแต่ $-30\%$ ถึง $+50\%$ โดยคำนวณฐานราคา (Base Fare) ตามระยะทาง Great Circle Distance:
    $$\text{Base Fare} = \max(50, \text{round}(45 + \text{distanceKm} \times 0.117))$$
    $$\text{Effective Fare} = \text{round}(\text{Base Fare} \times (1 + \text{priceModifierPct} / 100))$$
  - **Weekly Flight Frequency:** ปรับความถี่เที่ยวบินได้ตั้งแต่ $1\times$ ถึง $14\times$ ต่อสัปดาห์ (สอดคล้องกับสิทธิการบิน Airport Slots ของสนามบินต้นทางและปลายทาง):
    $$\text{Max Weekly Flights} = \max(1, \min(14, \text{originSlots}, \text{destSlots}))$$
  - **Fleet Re-assignment:** สลับเครื่องบินกับเครื่องว่างในโรงเก็บที่พิสัยบินถึงได้อย่างอิสระ
  - **3-Tier Maintenance & Service Budget:**
    - *Budget / Economy (80% cost):* ประหยัดงบซ่อมบำรุง 20% แลกกับการสึกหรอของเครื่องบินเพิ่มขึ้น +35% และความเสี่ยงเครื่องยนต์ขัดข้องสูงขึ้น
    - *Standard Certified (100% cost):* มาตรฐานโรงงานผู้ผลิต สมดุลทั้งต้นทุนและความพึงพอใจ
    - *Rigorous Premium (125% cost):* เพิ่มงบ 25% ถนอมเครื่องบิน (-40% wear), ลดโอกาสเสียลงครึ่งหนึ่ง และเพิ่มความดึงดูดผู้โดยสาร (+5% demand)
  - **Live Quarterly Performance Projection:** คำนวณ Gross Revenue, Operating Expenses (ค่าน้ำมัน, ค่าซ่อม, ค่าธรรมเนียมสนามบิน) และ Net Profit แบบเรียลไทม์ขณะปรับสไลเดอร์

---

### 2.3 ระบบ AI คู่แข่งปรับตัวอัตโนมัติตามกลไกตลาด (Dynamic AI Route Adaptation & Yield Management)
* **ไฟล์หลัก:** [`src/simulation/aiCompetitor.ts`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/src/simulation/aiCompetitor.ts), [`src/simulation/engine.ts`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/src/simulation/engine.ts)
* **พฤติกรรมการตัดสินใจของ AI ทุกสิ้นไตรมาส:**
  1. **Dynamic Pricing (Yield Management):**
     - หากเที่ยวบินมีอัตราบรรทุกสูง ($>90\%$ LF): AI จะปรับขึ้นราคาตั๋ว $+10\%$ ถึง $+20\%$ เพื่อกอบโกยกำไรสูงสุด
     - หากเที่ยวบินผู้โดยสารโหรงเหรง ($<65\%$ LF): AI จะยอมลดราคาตั๋ว $-10\%$ ถึง $-20\%$ หรือปรับระดับบริการเพื่อดึงดูดผู้โดยสารกลับมา
  2. **Frequency Scaling:** เพิ่มเที่ยวบินในเส้นทางที่ทำกำไรมหาศาลและยังมีสล็อตสนามบินเหลือ หรือลดเที่ยวบินในเส้นทางที่ขาดทุนเพื่อจำกัดการสูญเสียเงินสด
  3. **Fleet Swapping / Right-Sizing:** เปลี่ยนเครื่องบินให้เหมาะกับตลาด หากเส้นทางเติบโตจะสลับเครื่องบินลำตัวกว้าง (Widebody) มาบินแทน หากเส้นทางซบเซาจะสลับเอาเครื่องบินขนาดเล็กมาบินเพื่อประหยัดต้นทุน
  4. **Route Pruning & Liquidation:** หากเส้นทางใดขาดทุนสะสมต่อเนื่อง 3–4 ไตรมาส AI จะทำการระงับเที่ยวบิน (Suspend) หรือปิดเส้นทาง (Close Route) เพื่อนำเครื่องบินและสล็อตไปเปิดเส้นทางใหม่ที่มีศักยภาพกว่า
  5. **Maintenance Strategy:** AI จะปรับไปใช้ Budget Maintenance เมื่อเงินสดหมุนเวียนเหลือน้อยกว่า $3M และปรับเป็น Rigorous Premium เมื่อมีสถานะการเงินมั่นคง

---

### 2.4 ตลาดซื้อเครื่องบินเต็มจอและภาพถ่ายเครื่องบินจริง 4K (Full-Window Aircraft Market with Real Photos)
* **ไฟล์หลัก:** [`src/components/AircraftShopModal.tsx`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/src/components/AircraftShopModal.tsx), [`src/data/aircraftVisuals.ts`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/src/data/aircraftVisuals.ts)
* **การปรับปรุง:**
  - ขยายหน้าต่างร้านค้าเป็น Responsive Full-Window (`w-[95vw] max-w-7xl h-[92vh]`) แสดงผลเต็มตา ข้อมูลชัดเจน ไม่โดนขอบหน้าต่างบัง
  - จัดการแสดงผลแบบ Split-Pane 3 ส่วน: ฝั่งซ้าย (ตัวกรองยุคสมัยและเส้นทาง), ฝั่งกลาง (รายชื่อการ์ดเครื่องบินพร้อมภาพ Thumbnail), ฝั่งขวา (หน้าต่างพรีวิวขนาดใหญ่ 4K พร้อมสเปกทางวิศวกรรม)
  - แถบป้ายลดราคาพิเศษ (Golden Discount Badges 10%–20%) จัดวางอย่างเด่นชัด ไม่ทับซ้อนกับเนื้อหาอื่น
  - ภาพถ่าย Air-to-Air Photography สวยงามสมจริงของเครื่องบินทุกรุ่น ทุกยุคสมัย (Boeing 707, 727, 737, 747, 757, 767, 777; McDonnell Douglas DC-8, DC-9, DC-10, MD-11; Airbus A300, A310, A320, A330, A340, A380; Lockheed L-1011; Concorde, Tu-144, Il-62, Il-86, Il-96; Boom Overture SST ฯลฯ)

---

### 2.5 ระบบจัดซื้อเครื่องบินแบบล็อตและสัญญาจัดซื้อป้องกันการกดพลาด (Batch Procurement & Contract Modal)
* **ไฟล์หลัก:** [`src/components/AircraftShopModal.tsx`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/src/components/AircraftShopModal.tsx)
* **คุณสมบัติ:**
  - ตัวเลือกจำนวนสั่งซื้อแบบด่วน: `1`, `2`, `3`, `5`, `10` ลำ หรือปุ่ม `Max Afford` (คำนวณจำนวนสูงสุดที่ซื้อได้ตามเงินสดคงเหลือ)
  - ปุ่มสั่งซื้อเดิมที่เคยกดแล้วตัดเงินทันที ถูกเปลี่ยนเป็นปุ่ม **"Review & Order (ตรวจสอบและทำสัญญา)"**
  - แสดงหน้าต่างสัญญาจัดซื้อ (**Aircraft Procurement Contract Modal**) แจกแจงรายละเอียด:
    - จำนวนลำและราคารวม ($N \times \text{Unit Price}$)
    - ยอดเงินสดปัจจุบัน และยอดเงินสดที่จะเหลือหลังทำรายการ
    - เงื่อนไขการส่งมอบเข้าฝูงบินทันที
    - ปุ่ม **"Cancel (ยกเลิก)"** เพื่อเปิดโอกาสให้ผู้เล่นตรวจสอบการเงินและเปลี่ยนใจได้ตลอดเวลา
    - ปุ่มยืนยันจัดซื้อ **"Confirm & Finalize Purchase"** เพื่ออนุมัติสัญญา

---

### 2.6 ระบบ Desktop Shortcut และ Launcher อัตโนมัติ (Portable & Clean Desktop Launcher)
* **ไฟล์หลัก:** [`update_desktop_icon.ps1`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/update_desktop_icon.ps1), [`launch_game.bat`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/launch_game.bat), [`launch_game.vbs`](file:///e:/Codex%20GPT/Airobiz%20Supersonic%20Clone/launch_game.vbs)
* **คุณสมบัติ:**
  - สคริปต์ PowerShell ตรวจหาโฟลเดอร์ Desktop อัตโนมัติ (รองรับทั้ง Local Desktop และ OneDrive Redirection)
  - ทำการลบ Shortcut เก่าทั้งหมดที่เกี่ยวข้องกับเกมทิ้งอัตโนมัติ เพื่อไม่ให้มีไอคอนซ้ำซ้อนรกหน้าจอ
  - สร้างไอคอนใหม่ `Airobiz Supersonic.lnk` เพียงไอคอนเดียว พร้อมไอคอนเครื่องบินเจ็ตความละเอียดสูง
  - ไฟล์ `launch_game.vbs` รันเกมผ่าน Electron โดยไม่เปิดหน้าต่าง Command Prompt ค้างไว้

---

## 3. แผนผังโครงสร้างซอร์สโค้ด (Source Code Map)

```
Airobiz Supersonic Clone/
├── index.html                       # Entry HTML file
├── package.json                     # Dependencies & Electron Scripts
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript compiler options
├── update_desktop_icon.ps1          # สคริปต์รีเฟรช Desktop Shortcut อัตโนมัติ
├── launch_game.bat                  # Batch script สำหรับเปิดเกม
├── launch_game.vbs                  # VBScript รันเกมแบบ Silent Background
├── scripts/                         # สคริปต์ทดสอบอัตโนมัติ (Headless Electron Verification)
│   ├── verify_capacity_conversion.cjs   # ทดสอบการสลับเครื่องบินและการคำนวณ Baseline LF%
│   ├── verify_route_modification.cjs    # ทดสอบหน้าต่าง Modify Route และ Slider
│   ├── verify_batch_order.cjs           # ทดสอบการสั่งซื้อแบบล็อตและ Contract Modal
│   ├── verify_aircraft_shop.cjs         # ทดสอบหน้าร้านค้าและภาพถ่าย 4K
│   └── verify_ai_behavior.cjs           # ทดสอบ AI Dynamic Adaptation และ Yield Management
├── src/
│   ├── App.tsx                      # Root Component, Game State, Turn Cycle Controller
│   ├── types/
│   │   └── game.ts                  # Type Definitions (Airline, Route, AircraftModel, City, etc.)
│   ├── data/
│   │   ├── cities.ts                # รายชื่อเมือง 48 เมืองทั่วโลก พิกัด ประชากร GDP
│   │   ├── aircrafts.ts             # ฐานข้อมูลเครื่องบิน 30+ รุ่น (ราคา พิสัยบิน ความจุ ปีผลิต)
│   │   ├── aircraftVisuals.ts       # แหล่งรวมรูปภาพจริงความละเอียดสูง 4K ของเครื่องบินทุกลำ
│   │   ├── aircraftBlueprints.ts    # ข้อมูลเวกเตอร์ CAD Blueprint สำหรับแสดงผลในมุมมองช่าง
│   │   └── events.ts                # เหตุการณ์สำคัญระดับโลก (สงคราม, ราคาน้ำมัน, โอลิมปิก)
│   ├── simulation/
│   │   ├── engine.ts                # สูตรคณิตศาสตร์ Passenger Demand, Great Circle Fare, Fuel Burn
│   │   └── aiCompetitor.ts          # อัลกอริทึม AI ตัดสินใจเปิดเส้นทาง ปรับราคา สลับเครื่องบิน
│   └── components/
│       ├── WorldMap.tsx             # Canvas 2D Interactive Map แผนที่โลกและเส้นทางบิน
│       ├── ManageRoutesModal.tsx    # จัดการเส้นทาง, Modify Route, วิเคราะห์สัดส่วนที่นั่ง
│       ├── AircraftShopModal.tsx    # ตลาดซื้อเครื่องบินเต็มจอ + สัญญาจัดซื้อแบบล็อต
│       ├── RouteModal.tsx           # หน้าต่างเปิดเส้นทางใหม่ พร้อมระบบกรองเครื่องบินตามพิสัย
│       ├── QuarterReportModal.tsx   # รายงานผลประกอบการประจำไตรมาส 3 แท็บ
│       ├── SlotNegotiationModal.tsx # การส่งทูตเจรจาสิทธิการบิน (Airport Slots)
│       └── ExecutiveHeader.tsx      # ส่วนหัวแสดงเงินสด ไตรมาส อันดับ และจำนวนฝูงบิน
```

---

## 4. ขั้นตอนการนำไปติดตั้งและทำงานต่อที่บ้าน (Home Setup Guide)

เมื่อกลับถึงบ้านและต้องการทำงานต่อ ให้ปฏิบัติตามขั้นตอนง่ายๆ ดังนี้ครับ:

### ขั้นที่ 1: ดึงโค้ดล่าสุดจาก GitHub
```bash
# หากมีโฟลเดอร์อยู่แล้วที่บ้าน ให้ดึงอัปเดตล่าสุด
git pull origin main

# หากยังไม่มีโฟลเดอร์ ให้ Clone โปรเจกต์ลงมาใหม่
git clone https://github.com/Jenovic-th/aerobiz-supersonic-clone.git
cd aerobiz-supersonic-clone
```

### ขั้นที่ 2: ติดตั้ง Dependencies (หากเป็นการ Clone ครั้งแรก)
```bash
npm install
```

### ขั้นที่ 3: คำสั่งสำหรับการรันและทดสอบ
* **รัน Development Server (ทดสอบผ่าน Browser พร้อม Hot Reload):**
  ```bash
  npm run dev
  ```
  *(เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`)*

* **คอมไพล์และทดสอบ Build (Type Check & Production Bundle):**
  ```bash
  npm run build
  ```

* **เปิดเล่นผ่าน Electron App แบบเต็มจอ:**
  ```bash
  npm start
  # หรือดับเบิลคลิกไฟล์ launch_game.bat บนโฟลเดอร์โปรเจกต์
  ```

* **สร้าง/รีเฟรชไอคอนบนหน้าจอคอมพิวเตอร์ที่บ้าน:**
  เปิด PowerShell ในโฟลเดอร์โปรเจกต์ แล้วรัน:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\update_desktop_icon.ps1
  ```
  *(สคริปต์จะสร้างไอคอน `Airobiz Supersonic.lnk` ให้บนหน้าจอที่บ้านทันที)*

* **รันสคริปต์ทดสอบระบบการคำนวณที่นั่งอัตโนมัติ:**
  ```bash
  npx electron scripts/verify_capacity_conversion.cjs
  ```

---

## 5. แผนการพัฒนาต่อยอดที่แนะนำ (Next Steps & Roadmap)

1. **ระบบบันทึกและโหลดเกม (Save & Load Game):**
   - พัฒนาระบบ Auto-save ลง `localStorage` หรือส่งออกเป็นไฟล์ `.json` เพื่อให้ผู้เล่นสามารถเซฟเกมและนำไฟล์เซฟมาเล่นต่อระหว่างที่ทำงานกับที่บ้านได้
2. **ระบบการแข่งขันแย่งชิงสล็อตสนามบิน (Airport Slot Competition):**
   - ให้ AI ส่งทูตเจรจาแย่งชิงสล็อตในเมืองสำคัญ (เช่น ลอนดอน, โตเกียว, นิวยอร์ก) เมื่อสล็อตเต็ม สายการบินจะต้องประมูลหรือเจรจาขอซื้อสล็อตต่อจากคู่แข่ง
3. **ธุรกิจเสริมในเครือ (Subsidiary Businesses แบบ Koei Aerobiz):**
   - ลงทุนในโรงแรมประจำเมือง, บริการรถรับส่งสนามบิน (Airport Shuttle), หรือบริษัททัวร์เพื่อเพิ่มกำไรและดึงดูดผู้โดยสารเข้าสู่เส้นทางบินของตัวเอง
4. **ระบบวิกฤตการณ์โลกและอีเวนต์ประวัติศาสตร์ (Historical Crises & Global Events):**
   - เช่น โอลิมปิกปี 1984 ที่ลอสแองเจลิส, วิกฤตการณ์ราคาน้ำมันโลก, หรือการล่มสลายของสหภาพโซเวียตที่เปิดน่านฟ้าใหม่ๆ
5. **การจัดทำรูปภาพเครื่องบินเฉพาะรุ่นแบบ 1 ต่อ 1 (Dedicated Aircraft Photos 1-to-1):**
   - ปัจจุบันเกมใช้ระบบ 13 ภาพตัวแทนตระกูล (Archetypes) ซึ่งแสดงผลครบทุกรุ่นไม่มีตกหล่น ได้บันทึกเช็กลิสต์สำหรับจัดทำภาพถ่ายเฉพาะรุ่นครบทั้ง 58 รุ่นไว้ที่ [`AIRCRAFT_PHOTO_ROADMAP.md`](file:///F:/AI%20Angentic/Airobiz%20Supersonic%20Clone/AIRCRAFT_PHOTO_ROADMAP.md) เพื่อรอสร้างและทยอยใส่ในอนาคตตามลำดับ

