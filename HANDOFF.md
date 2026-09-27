# ✈️ Aerobiz Supersonic Clone — Project Handoff & Architecture Spec
**Date:** September 28, 2026  
**Inspiration:** Koei *Aerobiz* & *Aerobiz Supersonic* (SNES/Sega Genesis)  
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas 2D, Electron-ready  

---

## 1. Project Vision & Core Goal (จุดมุ่งหมายและที่มาของโปรเจกต์)

โปรเจกต์นี้มีเป้าหมายเพื่อสร้างเกมจำลองการบริหารสายการบินระดับโลก (**Commercial Airline Management Simulation**) โดยจำลองจิตวิญญาณและกลิ่นอายความคลาสสิกของเกมระดับตำนานยุค 90s อย่าง **Koei Aerobiz** และ **Aerobiz Supersonic** 
ผสมผสานกับการออกแบบ UI/UX ยุคใหม่ (Modern Neo-Retro Glassmorphism, 2D Canvas Interactive World Map, High-definition CAD Aircraft Blueprints) และเครื่องมือคำนวณที่แม่นยำ ลื่นไหล และปลอดภัยไร้บั๊ก

### กลิ่นอายความคลาสสิกที่สืบทอดจาก Koei Aerobiz:
- **Turn-based Quarterly Cycle (ระบบเดินเทิร์นแบบไตรมาส):** ผู้เล่นบริหารไตรมาสละครั้ง (Q1 - Q4 ในแต่ละปี) เมื่อกดจบไตรมาส ระบบจะคำนวณผลประกอบการ, การบิน, ค่าโดยสาร, น้ำมัน, และรายงานข่าวสาร
- **Historical Era Progression:** กำหนดช่วงเวลาประวัติศาสตร์ (เช่น เริ่มต้นปี 1980 ยุคสงครามเย็น ไปสู่ยุค 1990 และยุค Jet/Supersonic ศตวรรษที่ 21) เครื่องบินแต่ละรุ่นจะมีปีเปิดตัว (Intro Year) และปีที่หยุดสายการผลิต (Retire Year) อย่างสมจริง
- **Route & Fleet Strategy:** การเจรจาสิทธิการบิน (Airport Slots), การคำนวณพิสัยการบิน (Range in km), การตั้งราคาตั๋ว และการเลือกเครื่องบินที่เหมาะสมกับเส้นทาง

---

## 2. Summary of Work Completed (งานทั้งหมดที่ทำเสร็จสมบูรณ์ในเซสชันนี้)

### 2.1 ระบบสรุปผลประกอบการสิ้นไตรมาส (`QuarterReportModal.tsx`)
- **Tab 1: Financial & Airline Overview:**
  - สรุปรายได้ (Revenue), ค่าใช้จ่าย (Expenses), กำไรสุทธิ (Net Profit/Loss), และยอดผู้โดยสารรวมประจำไตรมาส
  - แสดงอันดับสายการบิน (Market Ranking) และเงินสดหมุนเวียนคงเหลือ
  - แสดงภาพรวมการขยายเครือข่ายเส้นทางบินในแต่ละทวีป (Regional Route Expansion)
- **Tab 2: Route Performance P&L:**
  - ตารางแจกแจงผลกำไร-ขาดทุนรายเส้นทางบิน อัตราส่วนบรรทุกผู้โดยสาร (Load Factor %) และต้นทุนน้ำมันตามดัชนีราคาน้ำมันโลก
- **Tab 3: World Aviation Gazette & Technical Bulletin:**
  - **Advance Aircraft Notices:** แจ้งเตือนล่วงหน้า 1 ปีก่อนเครื่องบินรุ่นใหม่จะเปิดตัว พร้อมพิมพ์เขียว CAD และสเปกทางวิศวกรรม
  - **Retirement Notices:** แจ้งเตือนเครื่องบินรุ่นที่กำลังจะหยุดสายการผลิตในปีนี้/ปีหน้า
  - **Manufacturer Rebate Deals:** โปรโมชั่นลดราคาพิเศษ 10% - 20% จากโรงงานผู้ผลิต (Boeing, Airbus, ฯลฯ) ที่สุ่มเกิดขึ้นในแต่ละปี

### 2.2 ระบบสภาพเครื่องบิน อายุการใช้งาน และสภาพอากาศ (`Fleet Aging & Incidents`)
- จำลองการเสื่อมสภาพของเครื่องบินตามจำนวนชั่วโมงบินและอายุการใช้งาน
- จำลองเหตุการณ์ไม่คาดฝันในแต่ละเที่ยวบิน เช่น พายุฝนตกหนัก มรสุม การตรวจเช็กสภาพเครื่องยนต์ และการซ่อมบำรุงในโรงเก็บ

### 2.3 ปรับปรุงแผนที่โลกและระยะห่างจากประเทศแม่ (`WorldMap.tsx`)
- จัดระเบียบหน้าต่างแสดงข้อมูลเมืองทางด้านซ้าย เลื่อนตำแหน่งลงมาให้สวยงาม ไม่ทับซ้อนกับปุ่ม `"Back To Global World Map"`
- เพิ่มการแสดง **"Distance from Home Base"** (ระยะทางเป็นกิโลเมตรคำนวณจากเมืองหลักของสายการบิน) ในหน้าต่างเมือง เพื่อให้ผู้เล่นคำนวณพิสัยบินและวางแผนเครื่องบินได้ทันที

### 2.4 ระบบคัดกรองเครื่องบินตามสไตล์ Koei Aerobiz (`RouteModal.tsx`)
- **Strict Range Filter:** เมื่อเลือกต้นทาง-ปลายทาง ระบบจะคำนวณระยะทางจริง และแสดง **เฉพาะเครื่องบินในโรงเก็บที่มีพิสัยบินถึงเท่านั้น (`rangeKm >= distance`)** เครื่องบินที่บินไม่ถึงจะไม่ปรากฏในรายชื่อ เพื่อความสะดวกรวดเร็วในการเลือก
- **Auto-Selection ปลอดภัยไร้บั๊ก:** เมื่อเปลี่ยนเส้นทาง ระบบจะเลือกเครื่องบินลำแรกที่บินถึงให้อัตโนมัติ ป้องกันปัญหาเลือกเครื่องบินที่ไม่ถูกต้อง
- **Empty-state Guidance:** หากไม่มีเครื่องบินในฝูงบินที่บินถึง จะแสดงการ์ดแจ้งเตือนอย่างชัดเจน ระบุระยะทางสูงสุดที่ฝูงบินมีอยู่ พร้อม **แนะนำเครื่องบินจากตลาดที่บินถึงระยะนี้ได้ทันที** และมีปุ่มเปิดตลาดซื้อเครื่องบิน
- **Destination Dropdown Indicators:** ในเมนูเลือกเมืองปลายทาง มีแท็กบอกล่วงหน้า เช่น `✓ Flyable` (มีเครื่องบินพร้อมบิน) หรือ `⚠️ Need Long-Range` (ระยะทางเกิน ต้องหาเครื่องบินพิสัยไกล)

### 2.5 ระบบค้นหาเครื่องบินตามเส้นทางเป้าหมายในตลาด (`AircraftShopModal.tsx`)
- เพิ่มเมนูฟิลเตอร์ **"Filter for Route from [เมืองหลัก]"** ในแถบซ้ายของหน้าร้านค้า
- ผู้เล่นสามารถเลือกเมืองปลายทางที่ต้องการเปิดบินได้ และระบบจะกรองเฉพาะเครื่องบินในตลาดที่บินถึงเส้นทางนั้น ช่วยให้ตัดสินใจซื้อเครื่องบินได้ตรงเป้าหมาย 100%

---

## 3. Project Structure & Key Files (โครงสร้างไฟล์สำคัญ)

```
Airobiz Supersonic Clone/
├── HANDOFF.md                       # เอกสาร Handoff ฉบับนี้
├── index.html                       # Entry HTML file
├── package.json                     # NPM dependencies and scripts
├── src/
│   ├── App.tsx                      # Root Controller, Game State & Turn Management
│   ├── types/
│   │   └── game.ts                  # Type definitions (Airline, Route, AircraftModel, City, etc.)
│   ├── data/
│   │   ├── cities.ts                # รายชื่อเมือง พิกัดละติจูด-ลองจิจูด ประชากร และระดับเศรษฐกิจ
│   │   └── aircrafts.ts             # ฐานข้อมูลเครื่องบิน ประวัติการผลิต พิสัยบิน ความจุ ราคา
│   ├── simulation/
│   │   └── engine.ts                # โมเดลคณิตศาสตร์จำลอง Passenger Demand, Fare, Distance, Route P&L
│   └── components/
│       ├── WorldMap.tsx             # Interactive 2D Canvas Map, Flight Paths, City Markers
│       ├── RouteModal.tsx           # หน้าต่างเปิดและจัดการเส้นทางบิน (Strict Range Filter)
│       ├── AircraftShopModal.tsx    # หน้าร้านซื้อเครื่องบินและโรงเก็บฝูงบิน (Route Filter, CAD Blueprints)
│       ├── QuarterReportModal.tsx   # หน้าสรุปผลประกอบการสิ้นไตรมาส 3 แท็บ
│       ├── AircraftBlueprintViewer.tsx # CAD Blueprint Vector Rendering
│       └── AircraftVisual.tsx       # SVG/Canvas เครื่องบินจำลองรูปทรงสมจริง
```

---

## 4. How to Run & Build (คำสั่งสำหรับเปิดและรันโปรเจกต์)

โปรเจกต์ใช้ Node.js และ Vite:

```bash
# 1. ติดตั้ง Dependencies (เมื่อนำไปเปิดที่ทำงาน)
npm install

# 2. รันใน Development Mode (Hot Reloading รวดเร็ว)
npm run dev

# 3. ตรวจสอบการ Type Check และ Build Production
npm run build
```

---

## 5. Next Steps / Recommended Roadmap (สิ่งที่สามารถพัฒนาต่อยอดได้)

1. **Save / Load Game System:**
   - เพิ่มระบบบันทึกเกมลงใน LocalStorage หรือไฟล์ JSON เพื่อให้ผู้เล่นสามารถเล่นต่อเนื่องได้
2. **AI Competitor Logic Expansion:**
   - พัฒนาอัลกอริทึมให้สายการบิน AI คู่แข่ง (Pan Am, British Airways, JAL, ฯลฯ) ทำการแย่งเปิดเส้นทางและทำสงครามราคาได้อย่างดุเดือด
3. **Sideline Businesses (ธุรกิจเสริมแบบ Aerobiz):**
   - การลงทุนในธุรกิจโรงแรม, รถบัสรับส่งสนามบิน, หรือบริการนำเที่ยวเพื่อเพิ่มกำไรให้กับสายการบิน
4. **Historical World Events:**
   - เหตุการณ์ประวัติศาสตร์ เช่น กีฬาโอลิมปิก, มหกรรม World Expo, วิกฤตการณ์ราคาน้ำมันดิบ ที่ส่งผลกระทบต่อดีมานด์การเดินทางในแต่ละภูมิภาค
