export const MAX_CAR_IMAGES = 20

export const CAR_LISTING_TYPES = [
  { value: 'SALE', label: 'للبيع' },
  { value: 'RENTAL', label: 'للإيجار' },
  { value: 'WANTED', label: 'مطلوب' },
]

export const FUEL_TYPES = [
  { value: 'PETROL', label: 'بترول' },
  { value: 'DIESEL', label: 'ديزل' },
  { value: 'HYBRID', label: 'هجين' },
  { value: 'ELECTRIC', label: 'كهربائي' },
]

export const TRANSMISSION_TYPES = [
  { value: 'AUTOMATIC', label: 'أوتوماتيك' },
  { value: 'MANUAL', label: 'عادي' },
]

export const CONDITION_TYPES = [
  { value: 'NEW', label: 'جديد' },
  { value: 'USED', label: 'مستعمل' },
  { value: 'LIKE_NEW', label: 'شبه جديد' },
]

export const CAR_FEATURE_KEYS = [
  { id: 'lfFeatureTouchscreen', label: 'شاشة لمس', icon: 'tablet-portrait-outline' },
  { id: 'lfFeatureRearCamera', label: 'كاميرا خلفية', icon: 'camera-outline' },
  { id: 'lfFeature360Camera', label: 'كاميرا 360', icon: 'aperture-outline' },
  { id: 'lfFeatureParkingSensors', label: 'حساسات اصطفاف', icon: 'radio-outline' },
  { id: 'lfFeatureGPS', label: 'نظام خرائط', icon: 'map-outline' },
  { id: 'lfFeatureSeatHeaters', label: 'تدفئة مقاعد', icon: 'flame-outline' },
  { id: 'lfFeatureSeatCooling', label: 'تبريد مقاعد', icon: 'snow-outline' },
  { id: 'lfFeatureLeatherSeats', label: 'مقاعد جلد', icon: 'shirt-outline' },
  { id: 'lfFeatureSunroof', label: 'فتحة سقف', icon: 'sunny-outline' },
  { id: 'lfFeatureBluetooth', label: 'بلوتوث', icon: 'bluetooth-outline' },
  { id: 'lfFeatureCarPlay', label: 'Apple CarPlay', icon: 'phone-portrait-outline' },
  { id: 'lfFeatureAndroidAuto', label: 'Android Auto', icon: 'logo-android' },
  { id: 'lfFeatureCruiseControl', label: 'مثبت سرعة', icon: 'speedometer-outline' },
  { id: 'lfFeatureSmartKey', label: 'دخول ذكي', icon: 'key-outline' },
  { id: 'lfFeatureRemoteStart', label: 'تشغيل عن بعد', icon: 'power-outline' },
]

export const BODY_TYPES = [
  { value: 'SEDAN', label: 'سيدان' },
  { value: 'SUV', label: 'دفع رباعي (SUV)' },
  { value: 'HATCHBACK', label: 'هاتشباك' },
  { value: 'COUPE', label: 'كوبيه' },
  { value: 'TRUCK', label: 'شاحنة' },
  { value: 'VAN', label: 'فان' },
  { value: 'WAGON', label: 'واجون' },
]

export const DRIVE_TYPES = [
  { value: 'FWD', label: 'دفع أمامي (FWD)' },
  { value: 'RWD', label: 'دفع خلفي (RWD)' },
  { value: 'AWD', label: 'دفع كلي (AWD)' },
  { value: '4WD', label: 'دفع رباعي (4WD)' },
]

export const CANCELLATION_POLICIES = [
  { value: 'FLEXIBLE', label: 'مرنة' },
  { value: 'MODERATE', label: 'متوسطة' },
  { value: 'STRICT', label: 'صارمة' },
]

export const CAR_COLORS = [
  // Whites
  { value: 'solid_white', label: 'أبيض', hex: '#FFFFFF' },
  { value: 'pearl_white', label: 'أبيض لؤلؤي', hex: '#F8F9FA' },
  { value: 'metallic_white', label: 'أبيض ميتاليك', hex: '#F5F5F5' },
  { value: 'snow_white', label: 'أبيض ثلجي', hex: '#FFFAFA' },
  { value: 'ivory', label: 'عاجي', hex: '#FFFFF0' },
  { value: 'cream', label: 'كريمي', hex: '#FFFDD0' },
  // Blacks
  { value: 'solid_black', label: 'أسود', hex: '#000000' },
  { value: 'metallic_black', label: 'أسود ميتاليك', hex: '#0E0E10' },
  { value: 'jet_black', label: 'أسود لامع', hex: '#111111' },
  { value: 'obsidian_black', label: 'أسود أوبسيديان', hex: '#222222' },
  { value: 'midnight_black', label: 'أسود ليلي', hex: '#1A1A24' },
  { value: 'matte_black', label: 'أسود مطفي', hex: '#28282B' },
  // Silvers & Grays
  { value: 'silver', label: 'فضي', hex: '#C0C0C0' },
  { value: 'metallic_silver', label: 'فضي ميتاليك', hex: '#BFC1C2' },
  { value: 'titanium', label: 'تيتانيوم', hex: '#878681' },
  { value: 'platinum', label: 'بلاتيني', hex: '#E5E4E2' },
  { value: 'quicksilver', label: 'فضي زئبقي', hex: '#A6A6A6' },
  { value: 'gray', label: 'رمادي', hex: '#808080' },
  { value: 'metallic_gray', label: 'رمادي ميتاليك', hex: '#7A7A7A' },
  { value: 'nardo_gray', label: 'ناردو غراي (إسمنتي)', hex: '#9B9B9B' },
  { value: 'gunmetal', label: 'رمادي غامق (جن ميتال)', hex: '#2A3439' },
  { value: 'charcoal', label: 'فحمي', hex: '#36454F' },
  { value: 'slate_gray', label: 'رمادي صخري', hex: '#708090' },
  { value: 'dark_gray', label: 'رمادي داكن', hex: '#A9A9A9' },
  { value: 'steel_gray', label: 'رمادي فولاذي', hex: '#71797E' },
  // Reds
  { value: 'red', label: 'أحمر', hex: '#FF0000' },
  { value: 'metallic_red', label: 'أحمر ميتاليك', hex: '#B22222' },
  { value: 'cherry_red', label: 'أحمر كرزي', hex: '#D2042D' },
  { value: 'crimson', label: 'قرمزي', hex: '#DC143C' },
  { value: 'burgundy', label: 'عنابي', hex: '#800020' },
  { value: 'maroon', label: 'مارون', hex: '#800000' },
  { value: 'candy_apple_red', label: 'أحمر كاندي', hex: '#FF0800' },
  { value: 'ruby_red', label: 'أحمر ياقوتي', hex: '#E0115F' },
  { value: 'lava_red', label: 'أحمر بركاني', hex: '#E42217' },
  // Blues
  { value: 'blue', label: 'أزرق', hex: '#0000FF' },
  { value: 'metallic_blue', label: 'أزرق ميتاليك', hex: '#318CE7' },
  { value: 'navy_blue', label: 'كحلي (أزرق داكن)', hex: '#000080' },
  { value: 'midnight_blue', label: 'أزرق ليلي', hex: '#191970' },
  { value: 'royal_blue', label: 'أزرق ملكي', hex: '#4169E1' },
  { value: 'sky_blue', label: 'أزرق سماوي', hex: '#87CEEB' },
  { value: 'ocean_blue', label: 'أزرق محيطي', hex: '#4F42B5' },
  { value: 'indigo', label: 'نيلي', hex: '#4B0082' },
  { value: 'sapphire', label: 'أزرق زفيري', hex: '#0F52BA' },
  { value: 'ice_blue', label: 'أزرق ثلجي', hex: '#A5F2F3' },
  // Browns
  { value: 'brown', label: 'بني', hex: '#A52A2A' },
  { value: 'metallic_brown', label: 'بني ميتاليك', hex: '#5C4033' },
  { value: 'mocha', label: 'موكا', hex: '#493D26' },
  { value: 'bronze', label: 'برونزي', hex: '#CD7F32' },
  { value: 'copper', label: 'نحاسي', hex: '#B87333' },
  { value: 'chocolate', label: 'شوكولاتة', hex: '#D2691E' },
  { value: 'chestnut', label: 'كستنائي', hex: '#954535' },
  { value: 'mahogany', label: 'ماهوجني', hex: '#C04000' },
  // Greens
  { value: 'green', label: 'أخضر', hex: '#008000' },
  { value: 'metallic_green', label: 'أخضر ميتاليك', hex: '#2E8B57' },
  { value: 'british_racing_green', label: 'أخضر بريطاني (زيتي)', hex: '#004225' },
  { value: 'forest_green', label: 'أخضر غابي', hex: '#228B22' },
  { value: 'emerald_green', label: 'زمردي', hex: '#50C878' },
  { value: 'olive', label: 'زيتوني', hex: '#808000' },
  { value: 'teal', label: 'تيل (أزرق مخضر)', hex: '#008080' },
  { value: 'sage_green', label: 'أخضر مريمية', hex: '#9DC183' },
  // Yellows & Golds
  { value: 'yellow', label: 'أصفر', hex: '#FFFF00' },
  { value: 'metallic_yellow', label: 'أصفر ميتاليك', hex: '#FFD700' },
  { value: 'mustard', label: 'خردلي', hex: '#FFDB58' },
  { value: 'lemon', label: 'ليموني', hex: '#FFF700' },
  { value: 'gold', label: 'ذهبي', hex: '#FFD700' },
  { value: 'rose_gold', label: 'ذهبي وردي', hex: '#B76E79' },
  { value: 'sand_gold', label: 'ذهبي رملي', hex: '#C2B280' },
  // Oranges
  { value: 'orange', label: 'برتقالي', hex: '#FFA500' },
  { value: 'metallic_orange', label: 'برتقالي ميتاليك', hex: '#FF8C00' },
  { value: 'burnt_orange', label: 'برتقالي محروق', hex: '#CC5500' },
  { value: 'tangerine', label: 'يوسفي', hex: '#F28500' },
  { value: 'sunset_orange', label: 'برتقالي غروب', hex: '#FD5E53' },
  // Purples
  { value: 'purple', label: 'بنفسجي', hex: '#800080' },
  { value: 'metallic_purple', label: 'بنفسجي ميتاليك', hex: '#9370DB' },
  { value: 'plum', label: 'برقوقي', hex: '#DDA0DD' },
  { value: 'amethyst', label: 'أرجواني', hex: '#9966CC' },
  { value: 'magenta', label: 'وردي غامق (ماجنتا)', hex: '#FF00FF' },
  // Beiges & Tans
  { value: 'beige', label: 'بيج', hex: '#F5F5DC' },
  { value: 'champagne', label: 'شامبين', hex: '#F7E7CE' },
  { value: 'sand', label: 'رملي', hex: '#C2B280' },
  { value: 'tan', label: 'تان (جملي)', hex: '#D2B48C' },
  { value: 'khaki', label: 'كاكي', hex: '#C3B091' },
  // Pinks
  { value: 'pink', label: 'وردي', hex: '#FFC0CB' },
  { value: 'metallic_pink', label: 'وردي ميتاليك', hex: '#FFB6C1' },
  { value: 'rose', label: 'روز', hex: '#FF007F' },
]