import { RegionId } from '../types/game';

export interface RegionZone {
  id: RegionId;
  name: string;
  thaiName: string;
  icon: string;
  color: string;
  glowColor: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  center: {
    lat: number;
    lon: number;
  };
  targetZoom: number;
  description: string;
  countriesAndIslands: string[];
}

export const REGION_ZONES: Record<RegionId, RegionZone> = {
  EUROPE: {
    id: 'EUROPE',
    name: 'Europe & Mediterranean',
    thaiName: 'ทวีปยุโรปและเมดิเตอร์เรเนียน',
    icon: '🏰',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    bounds: {
      minLat: 34,
      maxLat: 67,
      minLon: -25,
      maxLon: 45,
    },
    center: {
      lat: 51,
      lon: 14,
    },
    targetZoom: 3.8,
    description: 'ศูนย์กลางการบินระหว่างประเทศที่หนาแน่นที่สุดในโลก เครือข่ายการค้าและการท่องเที่ยวระดับพรีเมียม',
    countriesAndIslands: [
      'สหราชอาณาจักร (United Kingdom)',
      'ฝรั่งเศส (France)',
      'เยอรมนี (Germany)',
      'อิตาลี (Italy)',
      'สเปน (Spain)',
      'สวิตเซอร์แลนด์ (Switzerland)',
      'กรีซ (Greece)',
      'รัสเซียฝั่งยุโรป (Russia / Moscow)',
      'ไอซ์แลนด์และเรคยาวิก (Iceland / Reykjavik)',
      'หมู่เกาะแบลีแอริก (Balearic Islands)',
      'เกาะครีต (Crete)',
      'เกาะซิซิลี (Sicily)',
      'หมู่เกาะอังกฤษและไอร์แลนด์',
    ],
  },

  EAST_SOUTHEAST_ASIA: {
    id: 'EAST_SOUTHEAST_ASIA',
    name: 'East & Southeast Asia',
    thaiName: 'ทวีปเอเชียตะวันออกและเอเชียตะวันออกเฉียงใต้',
    icon: '⛩️',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    bounds: {
      minLat: -11,
      maxLat: 46,
      minLon: 94,
      maxLon: 146,
    },
    center: {
      lat: 21,
      lon: 121,
    },
    targetZoom: 2.9,
    description: 'ตลาดการบินที่เติบโตเร็วที่สุดในโลก ศูนย์กลางเศรษฐกิจอุตสาหกรรม การท่องเที่ยวและเกาะแก่งระดับโลก',
    countriesAndIslands: [
      'ไทย (Thailand / กรุงเทพฯ-ภูเก็ต)',
      'ญี่ปุ่น (Japan / หมู่เกาะฮอนชู-คิวชู-ฮอกไกโด)',
      'จีน (China)',
      'สิงคโปร์ (Singapore)',
      'ฮ่องกง (Hong Kong SAR)',
      'เกาหลีใต้ (South Korea)',
      'ฟิลิปปินส์ (Philippines / หมู่เกาะลูซอน-วิซายัส-มินดาเนา)',
      'ไต้หวัน (Taiwan)',
      'หมู่เกาะอินโดนีเซียและบาหลี (Bali / Indonesian Archipelago)',
      'หมู่เกาะโอกินาวา (Okinawa)',
    ],
  },

  NORTH_AMERICA: {
    id: 'NORTH_AMERICA',
    name: 'North America',
    thaiName: 'ทวีปอเมริกาเหนือและแคริบเบียน',
    icon: '🗽',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    bounds: {
      minLat: 14,
      maxLat: 64,
      minLon: -164,
      maxLon: -58,
    },
    center: {
      lat: 38,
      lon: -98,
    },
    targetZoom: 2.6,
    description: 'ตลาดการบินพาณิชย์ขนาดมหึมา แหล่งกำเนิดโบอิ้งและเส้นทางข้ามทวีป East-West Coast ที่คึกคักที่สุด',
    countriesAndIslands: [
      'สหรัฐอเมริกา (United States)',
      'แคนาดา (Canada)',
      'เม็กซิโกและแคนคูน (Mexico / Cancun)',
      'หมู่เกาะฮาวาย (Hawaii Islands)',
      'มลรัฐอะแลสกาและเกาะอะลูเชียน (Aleutian Islands)',
      'อ่าวเม็กซิโกและทะเลแคริบเบียน (Caribbean Sea)',
      'เกาะแวนคูเวอร์ (Vancouver Island)',
    ],
  },

  SOUTH_AMERICA: {
    id: 'SOUTH_AMERICA',
    name: 'South America',
    thaiName: 'ทวีปอเมริกาใต้',
    icon: '🏖️',
    color: '#10b981',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    bounds: {
      minLat: -56,
      maxLat: 13,
      minLon: -94,
      maxLon: -34,
    },
    center: {
      lat: -18,
      lon: -62,
    },
    targetZoom: 2.3,
    description: 'เส้นทางบินเชื่อมต่อข้ามเทือกเขาแอนดีส ลุ่มน้ำแอมะซอน และมหานครการค้าชายฝั่งแอตแลนติก',
    countriesAndIslands: [
      'บราซิล (Brazil)',
      'อาร์เจนตินา (Argentina)',
      'ชิลี (Chile)',
      'โคลอมเบีย (Colombia)',
      'เปรู (Peru)',
      'หมู่เกาะกาลาปาโกส (Galapagos Islands)',
      'หมู่เกาะฟอล์กแลนด์ (Falkland Islands)',
      'แหลมฮอร์นและเกาะเตียร์ราเดลฟวยโก',
    ],
  },

  MIDDLE_EAST_SOUTH_ASIA: {
    id: 'MIDDLE_EAST_SOUTH_ASIA',
    name: 'Middle East & South Asia',
    thaiName: 'ตะวันออกกลางและเอเชียใต้',
    icon: '🕌',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    bounds: {
      minLat: 2,
      maxLat: 42,
      minLon: 26,
      maxLon: 88,
    },
    center: {
      lat: 24,
      lon: 58,
    },
    targetZoom: 3.4,
    description: 'จุดเชื่อมต่อยุทธศาสตร์ (Global Crossroads) ระหว่างยุโรป เอเชีย และแอฟริกา พร้อมศูนย์กลางฮับน้ำมัน',
    countriesAndIslands: [
      'สหรัฐอาหรับเอมิเรตส์ / ดูไบ (UAE / Dubai)',
      'อินเดีย (India)',
      'อียิปต์ (Egypt / คาบสมุทรไซนาย)',
      'อิหร่าน (Iran)',
      'ซาอุดีอาระเบีย (Saudi Arabia)',
      'ศรีลังกา (Sri Lanka)',
      'หมู่เกาะมัลดีฟส์ (Maldives)',
      'อ่าวเปอร์เซียและคลองสุเอซ',
    ],
  },

  AFRICA: {
    id: 'AFRICA',
    name: 'African Continent',
    thaiName: 'ทวีปแอฟริกา',
    icon: '🦁',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    bounds: {
      minLat: -36,
      maxLat: 36,
      minLon: -18,
      maxLon: 52,
    },
    center: {
      lat: 1,
      lon: 18,
    },
    targetZoom: 1.95,
    description: 'ทวีปอันอุดมสมบูรณ์ด้วยการท่องเที่ยวซาฟารี เหมืองแร่ธรรมชาติ และเมืองท่าเศรษฐกิจแอฟริกาใต้',
    countriesAndIslands: [
      'แอฟริกาใต้ (South Africa)',
      'เคนยา (Kenya)',
      'ไนจีเรีย (Nigeria)',
      'เกาะมาดากัสการ์ (Madagascar)',
      'หมู่เกาะเซเชลส์ (Seychelles)',
      'เกาะมอริเชียส (Mauritius)',
      'เกาะแซนซิบาร์ (Zanzibar)',
      'หมู่เกาะคะเนรี (Canary Islands)',
    ],
  },

  OCEANIA: {
    id: 'OCEANIA',
    name: 'Oceania & Pacific',
    thaiName: 'ทวีปโอเชียเนียและแปซิฟิกใต้',
    icon: '🦘',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    bounds: {
      minLat: -48,
      maxLat: 16,
      minLon: 110,
      maxLon: 182,
    },
    center: {
      lat: -20,
      lon: 148,
    },
    targetZoom: 2.4,
    description: 'ทวีปเกาะขนาดใหญ่ เส้นทางบินเชื่อมโยงข้ามทะเลแทสมันและหมู่เกาะแปซิฟิกใต้',
    countriesAndIslands: [
      'ออสเตรเลีย (Australia)',
      'นิวซีแลนด์ (New Zealand / เกาะเหนือ-เกาะใต้)',
      'เกาะกวม (Guam)',
      'เกาะแทสเมเนีย (Tasmania)',
      'ฟิจิ (Fiji Islands)',
      'ตาฮิติและเฟรนช์โปลินีเซีย (Tahiti)',
      'ปาปัวนิวกินี (Papua New Guinea)',
      'หมู่เกาะโซโลมอนและวานูอาตู',
    ],
  },
};

export const REGION_LIST = Object.values(REGION_ZONES);
export const REGIONS = REGION_LIST;

export function getRegionByCoordinates(lat: number, lon: number): RegionZone | null {
  for (const region of REGION_LIST) {
    const { minLat, maxLat, minLon, maxLon } = region.bounds;
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      return region;
    }
  }
  return null;
}
