# ✈️ Aircraft Photo Production Roadmap (บันทึกแผนงานจัดทำภาพเครื่องบินรายรุ่น)

เอกสารฉบับนี้จัดทำขึ้นเพื่อบันทึกรายการเครื่องบินทั้งหมดในเกม **Aerobiz Supersonic Clone** สำหรับการจัดทำภาพถ่ายเฉพาะรุ่นแบบ 1 ต่อ 1 (1-to-1 Dedicated High-Resolution Air-to-Air Photography) ในอนาคต

---

## 1. สถานะปัจจุบัน (Current Implementation)
* **สถานะในเกม:** เครื่องบินทุกรุ่นในเกมมีรูปภาพแสดงผลครบ 100% ไม่มีปัญหา Missing Image หรือ Error 404
* **รูปแบบปัจจุบัน:** ใช้ระบบ **"ภาพตัวแทนตามตระกูล/ประเภท (13 Archetypes)"** โดยแต่ละตระกูลแชร์ภาพถ่ายหลัก 13 ภาพใน `public/aircrafts/`
* **เป้าหมายในอนาคต:** ผลิตรูปภาพเฉพาะรุ่น (Custom Dedicated Photo) ให้ตรงตามรุ่นจริงครบทั้ง **58 รุ่นหลัก**

---

## 2. รายการเครื่องบินและสถานะการจัดทำ (Production Checklist)

### 🌟 ERA 1: ยุคบุกเบิกและสงครามเย็น (1962 – 2000)

#### 🟢 เครื่องบินที่เปิดขายตั้งแต่เริ่มเกม (Active at 1980 Start — 11 รุ่น)
- [x] **Boeing 707-320B Intercontinental** (`B707-320B`) — 1962–1982 | Western | ปัจจุบัน: `b707.jpg` (ตรงรุ่น)
- [x] **McDonnell Douglas DC-8-62 Super** (`DC-8-62`) — 1967–1983 | Western | ปัจจุบัน: `dc8.jpg` (ตรงรุ่น)
- [x] **Boeing 747-200B** (`B747-200B`) — 1971–2002 | Western | ปัจจุบัน: `b747.jpg` (ตรงรุ่น)
- [x] **Boeing 727-200 Advanced** (`B727-200`) — 1972–1996 | Western | ปัจจุบัน: `b727.jpg` (ตรงรุ่น)
- [x] **McDonnell Douglas DC-10-30** (`DC-10-30`) — 1972–2006 | Western | ปัจจุบัน: `dc10.jpg` (ตรงรุ่น)
- [ ] **Lockheed L-1011 TriStar** (`L-1011`) — 1972–2000 | Western | ปัจจุบัน: `dc10.jpg` | *เป้าหมาย: `l1011.jpg`*
- [x] **Airbus A300B4** (`A300B4`) — 1975–2005 | Western | ปัจจุบัน: `a300.jpg` (ตรงรุ่น)
- [x] **Aérospatiale/BAC Concorde** (`CONCORDE`) — 1976–2003 | Western | ปัจจุบัน: `concorde.jpg` (ตรงรุ่น)
- [ ] **Tupolev Tu-154B Careless** (`TU-154B`) — 1977–2010 | Eastern | ปัจจุบัน: `soviet.jpg` | *เป้าหมาย: `tu154.jpg`*
- [ ] **Ilyushin Il-86 Camber** (`IL-86`) — 1980–2011 | Eastern | ปัจจุบัน: `soviet.jpg` | *เป้าหมาย: `il86.jpg`*
- [ ] **McDonnell Douglas MD-82** (`MD-82`) — 1980–2014 | Western | ปัจจุบัน: `dc10.jpg` | *เป้าหมาย: `md82.jpg`*

#### 🟡 เครื่องบินที่รอเปิดตัวตามช่วงปีใน Era 1 (Upcoming Era 1 — 16 รุ่น)
- [ ] **Boeing 767-200** (`B767-200`) — ปี 1982 | Western | ปัจจุบัน: `a300.jpg` | *เป้าหมาย: `b767_200.jpg`*
- [ ] **Boeing 757-200** (`B757-200`) — ปี 1983 | Western | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `b757_200.jpg`*
- [ ] **Boeing 747-300 SUD** (`B747-300`) — ปี 1983 | Western | ปัจจุบัน: `b747.jpg` | *เป้าหมาย: `b747_300.jpg`*
- [ ] **Boeing 737-300 Classic** (`B737-300`) — ปี 1984 | Western | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `b737_300.jpg`*
- [ ] **Airbus A300-600** (`A300-600`) — ปี 1985 | Western | ปัจจุบัน: `a300.jpg` | *เป้าหมาย: `a300_600.jpg`*
- [ ] **Airbus A310-300** (`A310-300`) — ปี 1985 | Western | ปัจจุบัน: `a300.jpg` | *เป้าหมาย: `a310_300.jpg`*
- [ ] **Airbus A320-200** (`A320-200`) — ปี 1988 | Western | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `a320_200.jpg`*
- [ ] **Boeing 767-300ER** (`B767-300ER`) — ปี 1988 | Western | ปัจจุบัน: `a300.jpg` | *เป้าหมาย: `b767_300er.jpg`*
- [ ] **Ilyushin Il-96-300** (`IL-96-300`) — ปี 1988 | Eastern | ปัจจุบัน: `soviet.jpg` | *เป้าหมาย: `il96_300.jpg`*
- [ ] **Boeing 747-400 Long-Haul** (`B747-400`) — ปี 1989 | Western | ปัจจุบัน: `b747.jpg` | *เป้าหมาย: `b747_400.jpg`*
- [ ] **McDonnell Douglas MD-11** (`MD-11`) — ปี 1990 | Western | ปัจจุบัน: `dc10.jpg` | *เป้าหมาย: `md11.jpg`*
- [ ] **Airbus A340-300** (`A340-300`) — ปี 1993 | Western | ปัจจุบัน: `a300.jpg` | *เป้าหมาย: `a340_300.jpg`*
- [ ] **Airbus A330-300** (`A330-300`) — ปี 1993 | Western | ปัจจุบัน: `a300.jpg` | *เป้าหมาย: `a330_300.jpg`*
- [ ] **Boeing 777-200** (`B777-200`) — ปี 1995 | Western | ปัจจุบัน: `b777.jpg` | *เป้าหมาย: `b777_200.jpg`*
- [ ] **Tupolev Tu-204** (`TU-204`) — ปี 1996 | Eastern | ปัจจุบัน: `soviet.jpg` | *เป้าหมาย: `tu204.jpg`*
- [ ] **Boeing 737-800 Next-Gen** (`B737-800`) — ปี 1998 | Western | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `b737_800.jpg`*

---

### 🌐 ERA 2: ยุคดิจิทัลและการปฏิวัติประสิทธิภาพ (2000 – 2020 — 11 รุ่น)
- [ ] **Boeing 777-200ER** (`B777-200ER`) — ปี 2000 | Western | ปัจจุบัน: `b777.jpg` | *เป้าหมาย: `b777_200er.jpg`*
- [ ] **Embraer E190 E-Jet** (`E190`) — ปี 2004 | Neutral | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `e190.jpg`*
- [ ] **Boeing 777-300ER** (`B777-300ER`) — ปี 2004 | Western | ปัจจุบัน: `b777.jpg` | *เป้าหมาย: `b777_300er.jpg`*
- [x] **Airbus A380-800 Superjumbo** (`A380-800`) — ปี 2007 | Western | ปัจจุบัน: `a380.jpg` (ตรงรุ่น)
- [ ] **Boeing 747-8 Intercontinental** (`B747-8I`) — ปี 2012 | Western | ปัจจุบัน: `b747.jpg` | *เป้าหมาย: `b747_8i.jpg`*
- [ ] **Boeing 787-9 Dreamliner** (`B787-9`) — ปี 2014 | Western | ปัจจุบัน: `b777.jpg` | *เป้าหมาย: `b787_9.jpg`*
- [ ] **Airbus A350-900 XWB** (`A350-900`) — ปี 2015 | Western | ปัจจุบัน: `b777.jpg` | *เป้าหมาย: `a350_900.jpg`*
- [ ] **Airbus A320neo** (`A320NEO`) — ปี 2016 | Western | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `a320neo.jpg`*
- [ ] **Boeing 737 MAX 8** (`B737-MAX8`) — ปี 2017 | Western | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `b737_max8.jpg`*
- [ ] **Airbus A220-300** (`A220-300`) — ปี 2018 | Western | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `a220_300.jpg`*
- [ ] **Airbus A350-1000 XWB** (`A350-1000`) — ปี 2020 | Western | ปัจจุบัน: `b777.jpg` | *เป้าหมาย: `a350_1000.jpg`*

---

### 🚀 ERA 3: ยุคซูเปอร์โซนิก ไฮเปอร์โซนิก และอากาศยานแห่งอนาคต (2023 – 2070 — 20 รุ่น)
- [ ] **Comac C919** (`C919`) — ปี 2023 | Eastern | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `c919.jpg`*
- [ ] **Airbus A321XLR** (`A321XLR`) — ปี 2024 | Western | ปัจจุบัน: `b737.jpg` | *เป้าหมาย: `a321xlr.jpg`*
- [ ] **Boeing 777-9X Folding Wing** (`B777-9X`) — ปี 2025 | Western | ปัจจุบัน: `b777.jpg` | *เป้าหมาย: `b777_9x.jpg`*
- [x] **Boom Overture Mach 1.7** (`BOOM-OVERTURE`) — ปี 2029 | Western | ปัจจุบัน: `boom.jpg` (ตรงรุ่น)
- [ ] **Airbus ZEROe Hydrogen Turbofan** (`AIRBUS-ZEROE`) — ปี 2035 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `airbus_zeroe.jpg`*
- [ ] **Tesla AeroStar Electric Hypersonic** (`TESLA-AEROSTAR`) — ปี 2038 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `tesla_aerostar.jpg`*
- [ ] **Boeing B797 Blended Wing Body** (`BOEING-B797-BWB`) — ปี 2040 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `b797_bwb.jpg`*
- [ ] **Lockheed Hyper-Mach 4 Sovereign** (`HYPER-MACH4`) — ปี 2043 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `hyper_mach4.jpg`*
- [ ] **SpaceX StarLiner P2P Suborbital** (`SPACEX-STARLINER`) — ปี 2046 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `spacex_starliner.jpg`*
- [ ] **Boom Overture 2 Quiet SST** (`BOOM-OVERTURE-2`) — ปี 2048 | Western | ปัจจุบัน: `boom.jpg` | *เป้าหมาย: `boom_overture_2.jpg`*
- [ ] **Airbus A390 CryoFlex LNG** (`AIRBUS-A390-CRYOFLEX`) — ปี 2050 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `a390_cryoflex.jpg`*
- [ ] **Lockheed QSST Quiet Supersonic** (`LOCKHEED-QSST`) — ปี 2052 | Western | ปัจจุบัน: `boom.jpg` | *เป้าหมาย: `lockheed_qsst.jpg`*
- [ ] **Tupolev Tu-404 Giant Flying Wing** (`TUPOLEV-TU404`) — ปี 2054 | Eastern | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `tu404.jpg`*
- [ ] **Boeing 808 Quantum Airliner** (`BOEING-808-QUANTUM`) — ปี 2056 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `boeing_808.jpg`*
- [ ] **Tesla Hyperion Plasma-Drive** (`TESLA-HYPERION`) — ปี 2058 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `tesla_hyperion.jpg`*
- [ ] **SpaceX Starship Commercial Pro** (`SPACEX-STARSHIP-PRO`) — ปี 2060 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `starship_pro.jpg`*
- [ ] **Aérospatiale Super Concorde Neo** (`AEROSPATIALE-SUPER-CONCORDE`) — ปี 2064 | Western | ปัจจุบัน: `concorde.jpg` | *เป้าหมาย: `super_concorde.jpg`*
- [ ] **McDonnell Douglas MD-2000 Tri-Fuselage** (`MCDONNELL-MD2000`) — ปี 2066 | Western | ปัจจุบัน: `dc10.jpg` | *เป้าหมาย: `md2000.jpg`*
- [ ] **Airbus Orbital-Star Stratoliner** (`AIRBUS-ORBITAL-STAR`) — ปี 2068 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `airbus_orbital.jpg`*
- [ ] **Boeing Solaris Mach 6 WaveRider** (`BOEING-SOLARIS-MACH6`) — ปี 2070 | Western | ปัจจุบัน: `future.jpg` | *เป้าหมาย: `boeing_solaris.jpg`*

---

## 3. มาตรฐานการสร้างรูปภาพ (Image Generation Guidelines)
เมื่อพร้อมดำเนินการจัดทำรูปภาพในอนาคต ให้ยึดแนวทางมาตรฐานต่อไปนี้:
1. **สัดส่วนและขนาดไฟล์:** แนวนอน 16:9 (หรือความละเอียดประมาณ 1280x720 หรือ 1920x1080), บีบอัดเป็น `.jpg` คุณภาพสูง ไม่เกิน 800 KB เพื่อประสิทธิภาพของเบราว์เซอร์และ Electron
2. **มุมมอง (Camera Angle):** Realistic Air-to-Air Photography (ถ่ายจากอากาศสู่อากาศ มุม 3/4 ด้านข้างแบบเห็นลำตัวและปีกชัดเจน)
3. **แสงและบรรยากาศ (Atmosphere):** ท้องฟ้าระดับความสูงบิน (Cruising Altitude Above Clouds), แสงธรรมชาติตอนกลางวันหรือ Golden Hour แดดยามเย็นสะท้อนตัวถัง
4. **ลวดลายสายการบิน (Livery):** ลวดลายพาณิชย์สมจริง หรือลวดลายคลาสสิกของสายการบินในยุคนั้น
