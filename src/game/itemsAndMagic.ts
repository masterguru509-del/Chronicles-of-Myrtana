import * as THREE from 'three';

export type MagicElement = 'fire' | 'water' | 'air' | 'lightning' | 'necro';

export type ItemCategory =
  | 'trophy'
  | 'egg'
  | 'herb'
  | 'grimoire'
  | 'weapon'
  | 'bow'
  | 'quiver'
  | 'ring'
  | 'shield'
  | 'card'
  | 'booster'
  | 'artifact'
  | 'potion'
  | 'teleport'
  | 'quest';

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  icon: string;
  description: string;
  effectText: string;
  buyPrice: number;
  sellPrice: number;
  healHp?: number;
  healHpPercent?: number;
  restoreMp?: number;
  maxHpBonusPercent?: number;
  maxMpBonusPercent?: number;
  agilityBonusPercent?: number;
  damageBonusPercent?: number;
  fixedMaxHpBonus?: number;
  fixedMaxMpBonus?: number;
  fullRestoreHp?: boolean;
  fullRestoreMp?: boolean;
  fullRestoreStamina?: boolean;
  grimoireElement?: MagicElement;
  // Оружие, Луки, Колчаны со стрелами, Кольца, Щиты, Карты магии и Слияние (Stacking/Merging)
  mergeable?: boolean;
  weaponBaseAtk?: number;
  weaponStrBonusPct?: number;
  bowBaseDmg?: number;
  bowCritBonusPct?: number;
  bowZoomFov?: number;
  arrowBonusDmg?: number;
  arrowElement?: MagicElement;
  arrowType?: 'iron' | 'fire' | 'poison' | 'ice' | 'explosive';
  arrowPackCount?: number;
  quiverBundleSize?: number;
  ringHpBonus?: number;
  ringMpBonus?: number;
  ringStrPct?: number;
  ringBowPct?: number;
  ringRangedBonusPct?: number;
  ringLifestealPct?: number;
  ringDefPct?: number;
  shieldBaseDef?: number;
  shieldBlockPct?: number;
  cardElement?: MagicElement;
  cardSpellBonusPct?: number;
  summonGolemType?: 'earth' | 'stone' | 'steel';
  boosterDoubleSummon?: boolean;
  boosterSpellPowerPct?: number;
  boosterManaDiscountPct?: number;
  bonusSkillPoints?: number;
  unlockAllMagic?: boolean;
}

export const ITEM_CATALOG: Record<string, ItemDefinition> = {
  // 1. Охотничьи трофеи (Волчье сердце, Медвежье мясо, Мясо птиц разных пород)
  wolf_heart: {
    id: 'wolf_heart',
    name: 'Волчье сердце',
    category: 'trophy',
    icon: '🫀',
    description: 'Добытое в бою горячее сердце лесного волка. Ценится охотниками и алхимиками.',
    effectText: '+35 HP и +3% к силе удара навсегда',
    buyPrice: 40,
    sellPrice: 18,
    healHp: 35,
    damageBonusPercent: 3,
  },
  bear_meat: {
    id: 'bear_meat',
    name: 'Медвежья вырезка',
    category: 'trophy',
    icon: '🥩',
    description: 'Сочный и питательный кусок медвежатины. Укрепляет тело воина.',
    effectText: '+80 HP и +5% к макс. здоровью навсегда',
    buyPrice: 85,
    sellPrice: 42,
    healHp: 80,
    maxHpBonusPercent: 5,
  },
  bird_pheasant: {
    id: 'bird_pheasant',
    name: 'Мясо золотого фазана',
    category: 'trophy',
    icon: '🍗',
    description: 'Нежное диетическое мясо дикого королевского фазана.',
    effectText: '+45 HP и +2% к ловкости (скорости)',
    buyPrice: 48,
    sellPrice: 24,
    healHp: 45,
    agilityBonusPercent: 2,
  },
  bird_grouse: {
    id: 'bird_grouse',
    name: 'Грудка лесного тетерева',
    category: 'trophy',
    icon: '🍖',
    description: 'Тёмное ароматное мясо тетерева с хвойных опушек Миртаны.',
    effectText: '+50 HP и +25 Маны',
    buyPrice: 52,
    sellPrice: 26,
    healHp: 50,
    restoreMp: 25,
  },
  bird_partridge: {
    id: 'bird_partridge',
    name: 'Тушка белой куропатки',
    category: 'trophy',
    icon: '🍗',
    description: 'Лёгкое мясо быстрой горной куропатки. Придаёт ногам стремительность.',
    effectText: '+40 HP и +4% к ловкости навсегда',
    buyPrice: 58,
    sellPrice: 28,
    healHp: 40,
    agilityBonusPercent: 4,
  },

  // 2. Яйца птиц (в реальной форме яйца)
  egg_spotted: {
    id: 'egg_spotted',
    name: 'Пятнистое яйцо фазана',
    category: 'egg',
    icon: '🥚',
    description: 'Свежее птичье яйцо в крапинку из лесного гнезда.',
    effectText: '+30 HP, +20 Маны и +3% к ловкости',
    buyPrice: 36,
    sellPrice: 16,
    healHp: 30,
    restoreMp: 20,
    agilityBonusPercent: 3,
  },
  egg_golden: {
    id: 'egg_golden',
    name: 'Золотистое яйцо сокола',
    category: 'egg',
    icon: '🥚',
    description: 'Редкое яйцо хищного сокола с тёплым золотистым отливом скорлупы.',
    effectText: '+6% к макс. здоровью и +10% к макс. мане',
    buyPrice: 95,
    sellPrice: 45,
    healHp: 50,
    maxHpBonusPercent: 6,
    maxMpBonusPercent: 10,
  },

  // 3. Целебные и магические травы Миртаны
  herb_sorrel: {
    id: 'herb_sorrel',
    name: 'Царский щавель',
    category: 'herb',
    icon: '🌿',
    description: 'Легендарная королевская трава Миртаны, дарующая богатырское долголетие.',
    effectText: 'Прирост макс. здоровья +10% и +40 HP',
    buyPrice: 110,
    sellPrice: 50,
    healHp: 40,
    maxHpBonusPercent: 10,
  },
  herb_goblin: {
    id: 'herb_goblin',
    name: 'Гоблинская ягода',
    category: 'herb',
    icon: '🫐',
    description: 'Редкий кустик с сизо-фиолетовыми ягодами. Невероятно ускоряет рефлексы.',
    effectText: 'Прирост ловкости (скорости) +8%',
    buyPrice: 95,
    sellPrice: 44,
    agilityBonusPercent: 8,
  },
  herb_nettle: {
    id: 'herb_nettle',
    name: 'Огненная крапива',
    category: 'herb',
    icon: '🌺',
    description: 'Пылающее соцветие, впитавшее чистую магическую энергию эфира.',
    effectText: 'Прирост макс. маны +15% и +40 Маны',
    buyPrice: 90,
    sellPrice: 40,
    restoreMp: 40,
    maxMpBonusPercent: 15,
  },
  herb_sun_aloe: {
    id: 'herb_sun_aloe',
    name: 'Солнечное алоэ',
    category: 'herb',
    icon: '🪴',
    description: 'Золотистый мясистый лист, мгновенно затягивающий глубокие раны.',
    effectText: 'Восстанавливает +45% здоровья и +5% к макс. HP',
    buyPrice: 80,
    sellPrice: 36,
    healHpPercent: 45,
    maxHpBonusPercent: 5,
  },

  // 4. Магические Гримуары Стихий
  grimoire_fire: {
    id: 'grimoire_fire',
    name: 'Гримуар Магии Огня',
    category: 'grimoire',
    icon: '🔥',
    description: 'Древний фолиант Пиромантии Инноса. Испепеляет врагов огненным штормом.',
    effectText: 'Изучить / усилить Магию Огня (+1 Ур., клавиша [1])',
    buyPrice: 180,
    sellPrice: 85,
    grimoireElement: 'fire',
  },
  grimoire_water: {
    id: 'grimoire_water',
    name: 'Гримуар Магии Воды',
    category: 'grimoire',
    icon: '💧',
    description: 'Священный том магов Воды Аданоса. Бьёт ледяным копьём и исцеляет раны.',
    effectText: 'Изучить / усилить Магию Воды (+1 Ур., клавиша [2])',
    buyPrice: 180,
    sellPrice: 85,
    grimoireElement: 'water',
  },
  grimoire_air: {
    id: 'grimoire_air',
    name: 'Гримуар Магии Воздуха',
    category: 'grimoire',
    icon: '🌪️',
    description: 'Свиток небесных ветров. Сокрушает врагов ураганным вихрем и ускоряет шаг.',
    effectText: 'Изучить / усилить Магию Воздуха (+1 Ур., клавиша [3])',
    buyPrice: 180,
    sellPrice: 85,
    grimoireElement: 'air',
  },
  grimoire_lightning: {
    id: 'grimoire_lightning',
    name: 'Гримуар Магии Земли и Големов',
    category: 'grimoire',
    icon: '🪨',
    description:
      'Древний фолиант Ордена Магов Земли. Обрушивает каменные метеоры и открывает тайну призыва Големов.',
    effectText: 'Изучить / усилить Магию Земли (+1 Ур., клавиша [4])',
    buyPrice: 200,
    sellPrice: 95,
    grimoireElement: 'lightning',
  },
  grimoire_necro: {
    id: 'grimoire_necro',
    name: 'Гримуар Некромагии и Ядов',
    category: 'grimoire',
    icon: '☠️',
    description: 'Тёмный кодекс Белиара: окутывает врагов смертельным ядом и вытягивает их жизнь.',
    effectText: 'Изучить / усилить Некромагию и Яды (+1 Ур., клавиша [5])',
    buyPrice: 210,
    sellPrice: 100,
    grimoireElement: 'necro',
  },

  // ============================================================
  // 5. ДРОП СО СКЕЛЕТОВ: Меч скелета, Щит легионера + Магические Карты (Two Worlds)
  // ============================================================
  skeleton_sword: {
    id: 'skeleton_sword',
    name: 'Древний клинок скелета',
    category: 'weapon',
    icon: '🗡️',
    description:
      'Закалённый в древних битвах меч павшего легионера. Одинаковые клинки можно СЛИВАТЬ в кузнечном слиянии, повышая ранг ★ и урон!',
    effectText: 'Оружие: +18 к атаке, +8% к Силе (Слияние: +35% за каждый ★ ранг)',
    buyPrice: 140,
    sellPrice: 60,
    mergeable: true,
    weaponBaseAtk: 18,
    weaponStrBonusPct: 8,
  },
  skeleton_shield: {
    id: 'skeleton_shield',
    name: 'Костяной щит легионера',
    category: 'shield',
    icon: '🛡️',
    description:
      'Тяжёлый боевой щит, окованный костью и бронзой. Защищает левую руку. Дубликаты щитов можно СЛИВАТЬ для роста брони!',
    effectText: 'Щит: Блок 22% урона, +10 брони (Слияние: +35% за каждый ★ ранг)',
    buyPrice: 135,
    sellPrice: 58,
    mergeable: true,
    shieldBaseDef: 10,
    shieldBlockPct: 22,
  },

  // Рандомные Магические Карты Атакующих Шаров (Файерболов стихий) Two Worlds
  card_necro: {
    id: 'card_necro',
    name: 'Карта заклинания: Шар Чумного Яда (Некромагия)',
    category: 'card',
    icon: '🃏☠️',
    description:
      'Магическая карта школы Некромагии и Ядов. Запускает ядовитый шар смерти [5], отравляет клинок и вытягивает жизнь врагов. Сливайте дубликаты в ранг ★!',
    effectText: 'Шар Яда [5]: +30% мощи яда + вампиризм (Слияние ★ усиливает уровень шара)',
    buyPrice: 130,
    sellPrice: 55,
    mergeable: true,
    cardElement: 'necro',
    cardSpellBonusPct: 30,
    grimoireElement: 'necro',
  },
  card_lightning: {
    id: 'card_lightning',
    name: 'Карта заклинания: Каменный Шар Земли (Метеор)',
    category: 'card',
    icon: '🃏🪨',
    description:
      'Магическая карта школы Земли. Выпускает сокрушительный каменный шар-метеор [4], оглушающий врагов. Дубликаты сливаются в ранг ★!',
    effectText: 'Шар Земли [4]: +30% мощи земли + дробящий удар (Слияние ★ усиливает уровень шара)',
    buyPrice: 130,
    sellPrice: 55,
    mergeable: true,
    cardElement: 'lightning',
    cardSpellBonusPct: 30,
    grimoireElement: 'lightning',
  },
  card_fire: {
    id: 'card_fire',
    name: 'Карта заклинания: Огненный Шар (Файербол Инноса)',
    category: 'card',
    icon: '🃏🔥',
    description:
      'Магическая карта школы Огня. Выпускает пылающий Файербол [1], взрывающийся при попадании, и окутывает оружие пламенем. Сливается в ранг ★!',
    effectText: 'Файербол Огня [1]: +30% мощи огня + взрывной шар (Слияние ★ усиливает уровень шара)',
    buyPrice: 130,
    sellPrice: 55,
    mergeable: true,
    cardElement: 'fire',
    cardSpellBonusPct: 30,
    grimoireElement: 'fire',
  },
  card_water: {
    id: 'card_water',
    name: 'Карта заклинания: Ледяной Шар Воды (Морозная Сфера)',
    category: 'card',
    icon: '🃏❄️',
    description:
      'Магическая карта школы Воды. Выпускает ледяной атакующий шар [2], замораживающий врагов и исцеляющий героя. Сливается в ранг ★!',
    effectText: 'Ледяной Шар [2]: +30% мощи воды + заморозка (Слияние ★ усиливает уровень шара)',
    buyPrice: 130,
    sellPrice: 55,
    mergeable: true,
    cardElement: 'water',
    cardSpellBonusPct: 30,
    grimoireElement: 'water',
  },
  card_air: {
    id: 'card_air',
    name: 'Карта заклинания: Штормовой Шар Воздуха (Молния)',
    category: 'card',
    icon: '🃏🌪️',
    description:
      'Магическая карта школы Воздуха. Выпускает стремительный грозовой шар ветра [3], отбрасывающий врагов. Сливается в ранг ★!',
    effectText: 'Шар Воздуха [3]: +30% мощи ветра + отбрасывание (Слияние ★ усиливает уровень шара)',
    buyPrice: 130,
    sellPrice: 55,
    mergeable: true,
    cardElement: 'air',
    cardSpellBonusPct: 30,
    grimoireElement: 'air',
  },

  // ============================================================
  // 5B. КАРТОЧКИ МАГИИ ЗЕМЛИ — ПРИЗЫВ ГОЛЕМОВ И КАРТЫ-УСИЛИТЕЛИ (Как в Two Worlds!)
  // ============================================================
  card_summon_earth_golem: {
    id: 'card_summon_earth_golem',
    name: 'Карта Магии Земли: Призыв Земляного Голема',
    category: 'card',
    icon: '🪨🌿',
    description:
      'Древняя карта Магии Земли (Two Worlds)! Призывает могучего Земляного Голема [G], который сражается на вашей стороне. С Картой-Усилителем призывает СРАЗУ 2 ГОЛЕМОВ!',
    effectText: 'Призыв [G]: Земляной Голем (260 HP, 28 урон • С Усилителем: СРАЗУ 2 ГОЛЕМА!)',
    buyPrice: 190,
    sellPrice: 90,
    mergeable: true,
    cardElement: 'lightning',
    summonGolemType: 'earth',
  },
  card_summon_stone_golem: {
    id: 'card_summon_stone_golem',
    name: 'Карта Магии Земли: Призыв Каменного Голема',
    category: 'card',
    icon: '🗿💎',
    description:
      'Высшая карта Магии Земли (Two Worlds)! Призывает гранитного Каменного Голема [G] с рунической бронёй. С Картой-Усилителем призывает СРАЗУ 2 КАМЕННЫХ ГОЛЕМОВ!',
    effectText: 'Призыв [G]: Каменный Голем (420 HP, 44 урон • С Усилителем: СРАЗУ 2 ГОЛЕМА!)',
    buyPrice: 310,
    sellPrice: 145,
    mergeable: true,
    cardElement: 'lightning',
    summonGolemType: 'stone',
  },
  card_summon_steel_golem: {
    id: 'card_summon_steel_golem',
    name: 'Карта Магии Земли: Призыв Стального Голема',
    category: 'card',
    icon: '🤖⚔️',
    description:
      'Легендарная карта Магии Земли (Two Worlds)! Призывает несокрушимого Стального Голема [G] с пылающим ядром. С Картой-Усилителем призывает СРАЗУ 2 СТАЛЬНЫХ ГОЛЕМОВ!',
    effectText: 'Призыв [G]: Стальной Голем (650 HP, 68 урон • С Усилителем: СРАЗУ 2 ГОЛЕМА!)',
    buyPrice: 480,
    sellPrice: 230,
    mergeable: true,
    cardElement: 'lightning',
    summonGolemType: 'steel',
  },
  card_booster_double: {
    id: 'card_booster_double',
    name: 'Карта-Усилитель: Двойной Призыв и Двойной Шар (×2)',
    category: 'booster',
    icon: '🃏✨',
    description:
      'Магическая Карта-Усилитель (Two Worlds)! Вставьте в слот Усилителя: удваивает призыв существ (вызывает СРАЗУ 2 ГОЛЕМОВ вместо одного!) и выпускает по 2 атакующих шара стихий! Сливается в ранг ★!',
    effectText: 'УСИЛИТЕЛЬ ×2: Призывает СРАЗУ 2 Големов [G] и 2 Файербола за каст (+35% мощи за ★)',
    buyPrice: 220,
    sellPrice: 105,
    mergeable: true,
    boosterDoubleSummon: true,
    boosterSpellPowerPct: 25,
  },
  card_booster_power: {
    id: 'card_booster_power',
    name: 'Карта-Усилитель: Мощь Архимага и Близнецов (+60%)',
    category: 'booster',
    icon: '🃏🔥',
    description:
      'Карта-Усилитель (Two Worlds)! Увеличивает урон всех атакующих шаров (файерболов) и силу/здоровье Големов на +60%, а также раздваивает призыв (2 Голема сразу!). Сливается ★!',
    effectText: 'УСИЛИТЕЛЬ: +60% к урону шаров и HP Големов + Призыв 2 Големов сразу!',
    buyPrice: 280,
    sellPrice: 135,
    mergeable: true,
    boosterDoubleSummon: true,
    boosterSpellPowerPct: 60,
  },
  card_booster_mana: {
    id: 'card_booster_mana',
    name: 'Карта-Усилитель: Матрица Эфира (-50% Маны и ×2 Призыв)',
    category: 'booster',
    icon: '🃏💧',
    description:
      'Карта-Усилитель (Two Worlds)! Снижает затраты Маны на все заклинания на 50% и позволяет призывать сразу 2 Големов одновременно! Сливается ★!',
    effectText: 'УСИЛИТЕЛЬ: -50% расход Маны + Призыв 2 Големов и 2 Шаров сразу!',
    buyPrice: 250,
    sellPrice: 118,
    mergeable: true,
    boosterDoubleSummon: true,
    boosterManaDiscountPct: 50,
    boosterSpellPowerPct: 30,
  },
  cobbler_boots: {
    id: 'cobbler_boots',
    name: 'Сапоги Скорохода Мастера Криспена',
    category: 'artifact',
    icon: '👢⚡',
    description:
      'Лёгкие кожаные сапоги ручной работы деревенского сапожника Криспена с крылатой пряжкой. Навсегда повышают скорость бега и выносливость!',
    effectText: 'НАВСЕГДА: +18% к скорости бега (Ловкости) и +35 макс. HP',
    buyPrice: 210,
    sellPrice: 100,
    agilityBonusPercent: 18,
    fixedMaxHpBonus: 35,
    fullRestoreStamina: true,
  },
  royal_stew: {
    id: 'royal_stew',
    name: 'Королевское Жаркое Повара Гаспара',
    category: 'potion',
    icon: '🍲👑',
    description:
      'Ароматное горячее блюдо деревенского шеф-повара Гаспара со специями и травами. Навсегда укрепляет здоровье, силу и полностью восстанавливает героя!',
    effectText: 'НАВСЕГДА: +40 макс. HP, +10% к Силе и 100% исцеление',
    buyPrice: 165,
    sellPrice: 80,
    fixedMaxHpBonus: 40,
    damageBonusPercent: 10,
    fullRestoreHp: true,
    fullRestoreMp: true,
  },

  // ============================================================
  // 6. ДРОП С ОРКОВ: Шипастая булава Силы + Тотем ярости орков
  // ============================================================
  orc_mace: {
    id: 'orc_mace',
    name: 'Шипастая булава орка «Краш-Варрок»',
    category: 'weapon',
    icon: '🔨',
    description:
      'Сокрушительная боевая булава орочьих воевод. Требует и дарует огромную СИЛУ. При слиянии одинаковых булав становится оружием сокрушения!',
    effectText: 'Оружие Силы: +32 к атаке, +18% к Силе удара (Слияние: +35% за ★ ранг)',
    buyPrice: 240,
    sellPrice: 110,
    mergeable: true,
    weaponBaseAtk: 32,
    weaponStrBonusPct: 18,
  },
  orc_strength_totem: {
    id: 'orc_strength_totem',
    name: 'Эликсир Орочьей Силы',
    category: 'artifact',
    icon: '💪',
    description:
      'Густой боевой настой шаманов орков. Навсегда наполняет мышцы нечеловеческой мощью и даёт очко навыков (LP).',
    effectText: 'Навсегда: +10% к Силе удара, +60 HP и +1 Очко Навыков (LP)',
    buyPrice: 175,
    sellPrice: 80,
    healHp: 60,
    damageBonusPercent: 10,
    bonusSkillPoints: 1,
  },

  // ============================================================
  // 7. МЕГАБОНУС С ЧЁРНОГО ТРОЛЛЯ (Легендарные трофеи Босса!)
  // ============================================================
  troll_hammer: {
    id: 'troll_hammer',
    name: 'Молот Титана «Крушитель Троллей»',
    category: 'weapon',
    icon: '⚒️',
    description:
      'МЕГА-ОРУЖИЕ из хребта и обсидиановой породы Чёрного Тролля. Каждый удар вызывает землетрясение и сокрушает броню!',
    effectText: 'Легендарное оружие: +65 к атаке, +40% к Силе (Поддерживает слияние ★)',
    buyPrice: 650,
    sellPrice: 320,
    mergeable: true,
    weaponBaseAtk: 65,
    weaponStrBonusPct: 40,
  },
  troll_shield: {
    id: 'troll_shield',
    name: 'Бастион из шкуры Чёрного Тролля',
    category: 'shield',
    icon: '🛡️👑',
    description:
      'МЕГА-ЩИТ из непробиваемой шкуры и клыков Чёрного Тролля. Поглощает почти половину любого входящего урона!',
    effectText: 'Легендарный щит: Блок 42% урона, +28 брони (Поддерживает слияние ★)',
    buyPrice: 600,
    sellPrice: 300,
    mergeable: true,
    shieldBaseDef: 28,
    shieldBlockPct: 42,
  },
  troll_mega_heart: {
    id: 'troll_mega_heart',
    name: 'Пылающее Сердце Чёрного Тролля (МЕГАБОНУС)',
    category: 'artifact',
    icon: '💎🔥',
    description:
      'Древний реликт Великого Чёрного Тролля! Дарует исполинское здоровье, богатырскую силу, Очки Навыков Gothic 3 и пробуждает все 5 стихий магии!',
    effectText:
      'МЕГАБОНУС: +40% к макс. HP, +25% к Силе, +5 Очков Навыков (LP) и +1 Ур. КО ВСЕМ СТИХИЯМ МАГИИ!',
    buyPrice: 900,
    sellPrice: 450,
    healHpPercent: 100,
    maxHpBonusPercent: 40,
    damageBonusPercent: 25,
    bonusSkillPoints: 5,
    unlockAllMagic: true,
  },

  // ============================================================
  // 8. АЛХИМИЧЕСКИЕ ЗЕЛЬЯ ЕЛЕНЫ (TWO WORLDS: ВЫСШИЕ ЭЛИКСИРЫ >100% И ПРОСТЫЕ ЗЕЛЬЯ ДО 100%)
  // ============================================================
  potion_perm_hp: {
    id: 'potion_perm_hp',
    name: 'Высший эликсир Жизни (HP выше 100%)',
    category: 'potion',
    icon: '🧪❤️',
    description:
      'Особый эликсир Целительницы Елены из редких трав. Фиксированно повышает потолок вашего Здоровья (HP) ВЫШЕ 100% навсегда и полностью исцеляет!',
    effectText: 'НАВСЕГДА: Повышение макс. HP выше 100% (+35 HP и +15% макс. HP) + исцеление 100%',
    buyPrice: 220,
    sellPrice: 105,
    fixedMaxHpBonus: 35,
    maxHpBonusPercent: 15,
    fullRestoreHp: true,
  },
  potion_perm_str: {
    id: 'potion_perm_str',
    name: 'Высший эликсир Силы Титана (Сила выше 100%)',
    category: 'potion',
    icon: '🧪💪',
    description:
      'Концентрированный эликсир Елены по старинным рецептам Миртаны. Фиксированно повышает уровень вашей боевой СИЛЫ ВЫШЕ 100% навсегда!',
    effectText: 'НАВСЕГДА: Повышение Силы выше 100% (+18% к силе удара) + 100% выносливости',
    buyPrice: 230,
    sellPrice: 110,
    damageBonusPercent: 18,
    fullRestoreStamina: true,
  },
  potion_perm_mp: {
    id: 'potion_perm_mp',
    name: 'Высший эликсир Астральной Маны (Мана выше 100%)',
    category: 'potion',
    icon: '🧪🔮',
    description:
      'Магический эликсир Елены. Фиксированно повышает ваш запас МАНЫ ВЫШЕ 100% навсегда и полностью восполняет энергию заклинаний!',
    effectText: 'НАВСЕГДА: Повышение макс. Маны выше 100% (+30 MP и +20% макс. MP) + 100% Маны',
    buyPrice: 220,
    sellPrice: 105,
    fixedMaxMpBonus: 30,
    maxMpBonusPercent: 20,
    fullRestoreMp: true,
  },
  potion_perm_agi: {
    id: 'potion_perm_agi',
    name: 'Высший эликсир Ловкости Ветра (Ловкость выше 100%)',
    category: 'potion',
    icon: '🧪🦅',
    description:
      'Изумрудный настой Елены из Гоблинской ягоды. Фиксированно повышает вашу ЛОВКОСТЬ и скорость ВЫШЕ 100% навсегда!',
    effectText: 'НАВСЕГДА: Повышение Ловкости выше 100% (+14% к скорости и ловкости)',
    buyPrice: 225,
    sellPrice: 108,
    agilityBonusPercent: 14,
    fullRestoreStamina: true,
  },
  potion_restore_hp: {
    id: 'potion_restore_hp',
    name: 'Простое зелье Здоровья (до 100%)',
    category: 'potion',
    icon: '🍶❤️',
    description:
      'Сваренное Еленой целебное зелье. Мгновенно восстанавливает ваше Здоровье (HP) ровно до 100%.',
    effectText: 'Мгновенное восстановление Здоровья (HP) до 100%',
    buyPrice: 65,
    sellPrice: 30,
    fullRestoreHp: true,
    healHpPercent: 100,
  },
  potion_restore_mp: {
    id: 'potion_restore_mp',
    name: 'Простое зелье Маны (до 100%)',
    category: 'potion',
    icon: '🍶💧',
    description:
      'Сваренное Еленой эфирное зелье. Мгновенно восстанавливает вашу Ману (MP) до 100%.',
    effectText: 'Мгновенное восстановление Маны (MP) до 100%',
    buyPrice: 65,
    sellPrice: 30,
    fullRestoreMp: true,
  },
  potion_restore_str: {
    id: 'potion_restore_str',
    name: 'Простое зелье Боевой Силы (до 100%)',
    category: 'potion',
    icon: '🍶⚔️',
    description:
      'Тонизирующий отвар Елены. Восстанавливает боевой тонус и силы героя до 100% и укрепляет мышцы (+5% Силы).',
    effectText: 'Восстановление сил и здоровья до 100% +5% к Силе',
    buyPrice: 75,
    sellPrice: 35,
    fullRestoreHp: true,
    fullRestoreStamina: true,
    damageBonusPercent: 5,
  },
  potion_restore_agi: {
    id: 'potion_restore_agi',
    name: 'Простое зелье Ловкости (до 100%)',
    category: 'potion',
    icon: '🍶🍃',
    description:
      'Лёгкий травяной настой Елены. Восстанавливает выносливость и ловкость движений до 100% (+4% к Ловкости).',
    effectText: 'Восстановление выносливости до 100% +4% к Ловкости',
    buyPrice: 75,
    sellPrice: 35,
    fullRestoreStamina: true,
    agilityBonusPercent: 4,
  },

  // ============================================================
  // 9. КВЕСТОВЫЕ ПРЕДМЕТЫ И ДАРЫ КОСТРА (Колечко Елены, Удочка Рыбака, Дрова, Мясо с костра)
  // ============================================================
  elena_ring: {
    id: 'elena_ring',
    name: 'Золотое колечко Елены с сапфиром',
    category: 'quest',
    icon: '💍',
    description:
      'Изящное памятное колечко Целительницы Елены, потерянное в высокой траве у цветочной поляны. Верните его Елене в деревне за золотые монеты и очки опыта!',
    effectText: 'Квестовая реликвия Елены (верните Елене в диалоге за 160 💰 и +220 XP)',
    buyPrice: 200,
    sellPrice: 120,
    maxMpBonusPercent: 5,
  },
  fishing_rod: {
    id: 'fishing_rod',
    name: 'Удочка рыбака Фарима',
    category: 'quest',
    icon: '🎣',
    description:
      'Мастерская удочка с катушкой и поплавком, которую рыбак Фарим обронил у западного берега, убегая от медведей и волков. Верните её Фариму у костра!',
    effectText: 'Квестовый предмет рыбака Фарима (верните Фариму за 150 💰 и +200 XP)',
    buyPrice: 180,
    sellPrice: 100,
    agilityBonusPercent: 4,
  },
  firewood_bundle: {
    id: 'firewood_bundle',
    name: 'Связка сухих дров для костра',
    category: 'quest',
    icon: '🪵',
    description:
      'Заготовленные сухие сосновые поленья для поддержания огня, на котором путники жарят мясо у костра.',
    effectText: 'Квестовые дрова (отдайте Лесорубу Брому у костра за 130 💰 и +180 XP)',
    buyPrice: 35,
    sellPrice: 20,
    healHp: 20,
  },
  roasted_campfire_meat: {
    id: 'roasted_campfire_meat',
    name: 'Румяное мясо на вертеле с костра',
    category: 'trophy',
    icon: '🍖🔥',
    description:
      'Только что снятое с горячего угля сочное прожаренное мясо с дымком. Мгновенно возвращает все силы!',
    effectText: 'Восстанавливает 100% Здоровья (HP), Выносливости и +4% к Силе',
    buyPrice: 90,
    sellPrice: 45,
    fullRestoreHp: true,
    fullRestoreStamina: true,
    damageBonusPercent: 4,
  },

  // ============================================================
  // 10. ЛУКИ РАЗНЫХ ВИДОВ (ПКМ — Снайперский прицел с приближением + ЛКМ выстрел, сливаются ★!)
  // ============================================================
  bow_hunter: {
    id: 'bow_hunter',
    name: 'Охотничий лук следопыта из тиса',
    category: 'bow',
    icon: '🏹',
    description:
      'Надёжный длинный лук из гибкого миртанского тиса. Зажмите ПКМ для снайперского прицеливания с приближением и нажмите ЛКМ для выстрела! Одинаковые луки можно СЛИВАТЬ (★).',
    effectText: 'Лук: +28 урон стрелы, +10% крит, Зум 2.5x (Слияние ★: +35% к мощи за ранг)',
    buyPrice: 130,
    sellPrice: 60,
    mergeable: true,
    bowBaseDmg: 28,
    bowCritBonusPct: 10,
    bowZoomFov: 28,
  },
  bow_elven: {
    id: 'bow_elven',
    name: 'Эльфийский композитный лук «Сильвана»',
    category: 'bow',
    icon: '🏹🌿',
    description:
      'Изящный лук древних лесных снайперов с серебряной тетивой. Позволяет сильнее приближать цель в снайперском прицеле ПКМ. Сливается ★!',
    effectText: 'Лук: +44 урон стрелы, +22% крит, Снайперский зум 3.2x (Слияние ★: +35% за ранг)',
    buyPrice: 260,
    sellPrice: 120,
    mergeable: true,
    bowBaseDmg: 44,
    bowCritBonusPct: 22,
    bowZoomFov: 22,
  },
  bow_orc_bone: {
    id: 'bow_orc_bone',
    name: 'Орочий костяной лук «Гром-Хорн»',
    category: 'bow',
    icon: '🏹🦴',
    description:
      'Тяжёлый боевой лук из рогов и сухожилий чёрного зверя. Пробивает любую броню скелетов и орков. Поддерживает слияние дубликатов ★!',
    effectText: 'Лук: +58 урон стрелы, +28% крит, Снайперский зум 3.5x (Слияние ★: +35% за ранг)',
    buyPrice: 360,
    sellPrice: 170,
    mergeable: true,
    bowBaseDmg: 58,
    bowCritBonusPct: 28,
    bowZoomFov: 20,
  },
  bow_dragon_imperial: {
    id: 'bow_dragon_imperial',
    name: 'Имперский драконий лук «Глаз Дракона»',
    category: 'bow',
    icon: '🏹🐉',
    description:
      'Легендарный снайперский лук королевских стрелков с золотыми плечами и максимальной кратностью приближения ПКМ. Дубликаты сливаются в ранг ★!',
    effectText: 'Легендарный лук: +82 урон стрелы, +40% крит, Снайпер-зум 4.5x (Слияние ★)',
    buyPrice: 580,
    sellPrice: 280,
    mergeable: true,
    bowBaseDmg: 82,
    bowCritBonusPct: 40,
    bowZoomFov: 16,
  },

  // ============================================================
  // 11. КОЛЧАНЫ И РАЗНЫЕ ВИДЫ СТРЕЛ (Стальные, Огненные, Ледяные, Ядовитые, Грозовые — сливаются ★!)
  // ============================================================
  quiver_iron: {
    id: 'quiver_iron',
    name: 'Колчан стальных бронебойных стрел',
    category: 'quiver',
    icon: '➵🛡️',
    description:
      'Кожаный колчан с закалёнными стальными стрелами (+25 стрел при покупке/находке). Наденьте колчан для выбора типа стрел или СЛЕЙТЕ дубликаты ★ для роста урона!',
    effectText: 'Стрелы: +14 к урону выстрела (Колчан +25 стрел • Слияние ★ усиливает стрелы на +35%)',
    buyPrice: 55,
    sellPrice: 25,
    mergeable: true,
    arrowBonusDmg: 14,
    arrowPackCount: 25,
  },
  quiver_fire: {
    id: 'quiver_fire',
    name: 'Колчан огненных стрел Инноса',
    category: 'quiver',
    icon: '➵🔥',
    description:
      'Стрелы с наконечниками из пылающей смолы и серы. Взрываются огнём при попадании! Можно надеть в слот колчана и СЛИВАТЬ дубликаты ★.',
    effectText: 'Огненные стрелы: +26 урона огнём + взрыв пламени (Слияние ★: +35% за ранг)',
    buyPrice: 95,
    sellPrice: 45,
    mergeable: true,
    arrowBonusDmg: 26,
    arrowElement: 'fire',
    arrowPackCount: 20,
  },
  quiver_ice: {
    id: 'quiver_ice',
    name: 'Колчан ледяных стрел Аданоса',
    category: 'quiver',
    icon: '➵❄️',
    description:
      'Стрелы из вечного горного льда. Пронзают врагов ледяными осколками и остужают их пыл. Сливаются в ранг ★!',
    effectText: 'Ледяные стрелы: +24 урона холодом + морозный шок (Слияние ★: +35% за ранг)',
    buyPrice: 95,
    sellPrice: 45,
    mergeable: true,
    arrowBonusDmg: 24,
    arrowElement: 'water',
    arrowPackCount: 20,
  },
  quiver_poison: {
    id: 'quiver_poison',
    name: 'Колчан ядовитых стрел Белиара',
    category: 'quiver',
    icon: '➵☠️',
    description:
      'Оперение цвета болотной гадюки, наконечники смазаны концентрированным ядом и вытягивают жизнь врага при попадании. Сливаются ★!',
    effectText: 'Ядовитые стрелы: +28 урона ядом + вампиризм (Слияние ★: +35% за ранг)',
    buyPrice: 110,
    sellPrice: 50,
    mergeable: true,
    arrowBonusDmg: 28,
    arrowElement: 'necro',
    arrowPackCount: 20,
  },
  quiver_lightning: {
    id: 'quiver_lightning',
    name: 'Колчан грозовых стрел Шторма',
    category: 'quiver',
    icon: '➵⚡',
    description:
      'Наконечники заряжены небесным электричеством — при попадании бьют врага и соседние цели разрядом молнии! Сливаются ★.',
    effectText: 'Грозовые стрелы: +32 урона молнией + цепной разряд (Слияние ★: +35% за ранг)',
    buyPrice: 125,
    sellPrice: 58,
    mergeable: true,
    arrowBonusDmg: 32,
    arrowElement: 'lightning',
    arrowPackCount: 20,
  },

  // ============================================================
  // 12. МАГИЧЕСКИЕ И БОЕВЫЕ КОЛЬЦА (Надеваются на палец и сливаются ★!)
  // ============================================================
  ring_titan_strength: {
    id: 'ring_titan_strength',
    name: 'Кольцо Силы Титана',
    category: 'ring',
    icon: '💍💪',
    description:
      'Массивный золотой перстень с рубином древних королей. Усиливает физический удар и здоровье. Одинаковые кольца можно СЛИВАТЬ в ранг ★!',
    effectText: 'Кольцо: +16% к Силе удара, +45 макс. HP (Слияние ★: +35% к бонусам кольца)',
    buyPrice: 190,
    sellPrice: 90,
    mergeable: true,
    ringStrPct: 16,
    ringHpBonus: 45,
  },
  ring_eagle_eye: {
    id: 'ring_eagle_eye',
    name: 'Кольцо Соколиного Глаза (Снайпер)',
    category: 'ring',
    icon: '💍🦅',
    description:
      'Изумрудное кольцо мастеров-лучников. Резко повышает урон стрел из лука при снайперской стрельбе ПКМ. Дубликаты сливаются ★!',
    effectText: 'Кольцо: +28% к урону Лука и Стрел, +10% к Силе (Слияние ★: +35% за ранг)',
    buyPrice: 210,
    sellPrice: 98,
    mergeable: true,
    ringBowPct: 28,
    ringStrPct: 10,
  },
  ring_archmage: {
    id: 'ring_archmage',
    name: 'Кольцо Верховного Мага Стихий',
    category: 'ring',
    icon: '💍🔮',
    description:
      'Сапфировый перстень высших чародеев. Расширяет резервуар астральной Маны и мощь всех заклинаний. Сливается ★!',
    effectText: 'Кольцо: +55 макс. Маны, +14% к Силе и Магии (Слияние ★: +35% за ранг)',
    buyPrice: 210,
    sellPrice: 98,
    mergeable: true,
    ringMpBonus: 55,
    ringStrPct: 14,
  },
  ring_vampire_lord: {
    id: 'ring_vampire_lord',
    name: 'Кольцо Кровавого Вампира',
    category: 'ring',
    icon: '💍🩸',
    description:
      'Тёмное кольцо из подземных катакомб. Каждый ваш удар мечом или попадание стрелой из лука исцеляет героя! Сливается ★.',
    effectText: 'Кольцо: Вампиризм 18% от урона в HP, +12% к атаке (Слияние ★: +35% за ранг)',
    buyPrice: 250,
    sellPrice: 115,
    mergeable: true,
    ringLifestealPct: 18,
    ringStrPct: 12,
  },
  ring_royal_guardian: {
    id: 'ring_royal_guardian',
    name: 'Кольцо Королевского Бастиона',
    category: 'ring',
    icon: '💍🛡️',
    description:
      'Перстень паладинов столицы. Снижает любой получаемый урон и дарует богатырское здоровье. Сливается ★!',
    effectText: 'Кольцо: +18% защиты от урона, +75 макс. HP (Слияние ★: +35% за ранг)',
    buyPrice: 230,
    sellPrice: 108,
    mergeable: true,
    ringDefPct: 18,
    ringHpBonus: 75,
  },

  // ============================================================
  // 13. ДОПОЛНИТЕЛЬНОЕ ОРУЖИЕ БЛИЖНЕГО БОЯ ИЗ КАТАКОМБ И ЛАВКИ (Сливается ★!)
  // ============================================================
  katana_wind: {
    id: 'katana_wind',
    name: 'Клинок Мастера Ветра (Древняя Катана)',
    category: 'weapon',
    icon: '⚔️🌪️',
    description:
      'Бритвенно-острый изогнутый клинок из южных земель. Стремительные рассекающие удары. Одинаковые катаны СЛИВАЮТСЯ в ранг ★!',
    effectText: 'Оружие: +28 к атаке, +15% к Силе удара (Слияние ★: +35% за ранг)',
    buyPrice: 210,
    sellPrice: 95,
    mergeable: true,
    weaponBaseAtk: 28,
    weaponStrBonusPct: 15,
  },
  paladin_flamberge: {
    id: 'paladin_flamberge',
    name: 'Огненный Фламберг Паладина',
    category: 'weapon',
    icon: '🗡️🔥',
    description:
      'Волнистый рыцарский меч, освящённый в пламени. Наносит сокрушительные рубящие раны. Дубликаты сливаются в ранг ★!',
    effectText: 'Оружие: +44 к атаке, +25% к Силе удара (Слияние ★: +35% за ранг)',
    buyPrice: 340,
    sellPrice: 160,
    mergeable: true,
    weaponBaseAtk: 44,
    weaponStrBonusPct: 25,
  },
  halberd_sentinel: {
    id: 'halberd_sentinel',
    name: 'Алебарда Древнего Стража',
    category: 'weapon',
    icon: '🪓🛡️',
    description:
      'Длинная боевая алебарда из сокровищниц подземной пещеры. Позволяет доставать врагов с большой дистанции. Сливается ★!',
    effectText: 'Оружие: +38 к атаке, +22% к Силе удара (Слияние ★: +35% за ранг)',
    buyPrice: 290,
    sellPrice: 135,
    mergeable: true,
    weaponBaseAtk: 38,
    weaponStrBonusPct: 22,
  },
  necro_scythe: {
    id: 'necro_scythe',
    name: 'Боевая Коса «Жнец Катакомб»',
    category: 'weapon',
    icon: '⚰️⚔️',
    description:
      'Мистическое оружие Повелителя Скелетов из глубин пещеры. Наносит колоссальный урон. Одинаковые косы сливаются ★!',
    effectText: 'Редкое оружие: +54 к атаке, +32% к Силе удара (Слияние ★: +35% за ранг)',
    buyPrice: 460,
    sellPrice: 220,
    mergeable: true,
    weaponBaseAtk: 54,
    weaponStrBonusPct: 32,
  },

  // ============================================================
  // 14. ПЕРЕНОСНОЙ ТЕЛЕПОРТ И ОСОБЫЕ ЭЛИКСИРЫ КОТЛА АЛХИМИИ
  // ============================================================
  portable_teleport_stone: {
    id: 'portable_teleport_stone',
    name: 'Переносной Рунический Телепорт',
    category: 'teleport',
    icon: '🌀💎',
    description:
      'Древний портальный камень путешественника! Позволяет установить личный маяк телепортации в любой точке мира или мгновенно переместиться к любому большому стационарному телепорту карты (клавиша [T]).',
    effectText: 'Нажмите [Применить] или клавишу [T], чтобы открыть Карту Телепортов и Маяк',
    buyPrice: 150,
    sellPrice: 75,
  },
  potion_sniper_eagle: {
    id: 'potion_sniper_eagle',
    name: 'Алхимический Эликсир Соколиного Снайпера',
    category: 'potion',
    icon: '🧪🏹',
    description:
      'Сваренный в Алхимическом Котле особый настой для стрелков и охотников. Навсегда повышает Ловкость, Силу натяжения лука и исцеляет!',
    effectText: 'НАВСЕГДА: +16% к Ловкости, +12% к Силе и 100% восстановление HP и Выносливости',
    buyPrice: 260,
    sellPrice: 125,
    agilityBonusPercent: 16,
    damageBonusPercent: 12,
    fullRestoreHp: true,
    fullRestoreStamina: true,
  },
  potion_dragon_immortal: {
    id: 'potion_dragon_immortal',
    name: 'Королевский Эликсир Драконьей Крови (Котёл Алхимии)',
    category: 'potion',
    icon: '🧪🐉',
    description:
      'Вершина алхимического искусства из Котла! Навсегда поднимает Здоровье, Ману, Силу, Ловкость ВЫШЕ 100% и дарует +1 Очко Навыков (LP)!',
    effectText: 'НАВСЕГДА: +50 HP, +35 MP, +15% Силы, +12% Ловкости и +1 LP!',
    buyPrice: 420,
    sellPrice: 200,
    fixedMaxHpBonus: 50,
    fixedMaxMpBonus: 35,
    damageBonusPercent: 15,
    agilityBonusPercent: 12,
    fullRestoreHp: true,
    fullRestoreMp: true,
    bonusSkillPoints: 1,
  },
  // Дополнительные алиасы для сундуков подземных пещер, луков и колец:
  quiver_explosive: {
    id: 'quiver_explosive',
    name: 'Колчан взрывных стрел Грома',
    category: 'quiver',
    icon: '➵💥',
    description:
      'Тяжёлые алхимические стрелы, взрывающиеся при попадании и поражающие всех врагов вокруг! Сливаются ★.',
    effectText: 'Взрывные стрелы: +34 урона + взрыв по площади (Слияние ★: +35% за ранг)',
    buyPrice: 125,
    sellPrice: 58,
    mergeable: true,
    arrowBonusDmg: 34,
    arrowElement: 'fire',
    arrowType: 'explosive',
    arrowPackCount: 20,
    quiverBundleSize: 20,
  },
  paladin_claymore: {
    id: 'paladin_claymore',
    name: 'Освящённый Клеймор Паладина',
    category: 'weapon',
    icon: '🗡️✨',
    description: 'Двуручный рыцарский меч света. Дубликаты сливаются в ранг ★!',
    effectText: 'Оружие: +42 к атаке, +24% к Силе удара (Слияние ★: +35% за ранг)',
    buyPrice: 320,
    sellPrice: 150,
    mergeable: true,
    weaponBaseAtk: 42,
    weaponStrBonusPct: 24,
  },
  assassin_katana: {
    id: 'assassin_katana',
    name: 'Катана Теней Ассасина',
    category: 'weapon',
    icon: '⚔️🌙',
    description: 'Стремительный изогнутый клинок из подземных склепов. Сливается ★!',
    effectText: 'Оружие: +36 к атаке, +20% к Силе удара (Слияние ★: +35% за ранг)',
    buyPrice: 280,
    sellPrice: 130,
    mergeable: true,
    weaponBaseAtk: 36,
    weaponStrBonusPct: 20,
  },
  halberd_guardian: {
    id: 'halberd_guardian',
    name: 'Алебарда Стража Катакомб',
    category: 'weapon',
    icon: '🪓🛡️',
    description: 'Боевая алебарда древних стражей пещеры. Сливается ★!',
    effectText: 'Оружие: +40 к атаке, +22% к Силе удара (Слияние ★: +35% за ранг)',
    buyPrice: 300,
    sellPrice: 140,
    mergeable: true,
    weaponBaseAtk: 40,
    weaponStrBonusPct: 22,
  },
  executioner_axe: {
    id: 'executioner_axe',
    name: 'Секира Палача Катакомб',
    category: 'weapon',
    icon: '🪓🩸',
    description: 'Сокрушительная двуручная секира из подземного сундука. Сливается ★!',
    effectText: 'Оружие: +48 к атаке, +28% к Силе удара (Слияние ★: +35% за ранг)',
    buyPrice: 380,
    sellPrice: 180,
    mergeable: true,
    weaponBaseAtk: 48,
    weaponStrBonusPct: 28,
  },
  bow_dragonbone: {
    id: 'bow_dragonbone',
    name: 'Драконий костяной лук Снайпера',
    category: 'bow',
    icon: '🏹🐉',
    description: 'Легендарный снайперский лук из драконьей кости. Зажмите ПКМ для прицела! Сливается ★!',
    effectText: 'Легендарный лук: +82 урон стрелы, +40% крит, Снайпер-зум 4.5x (Слияние ★)',
    buyPrice: 560,
    sellPrice: 270,
    mergeable: true,
    bowBaseDmg: 82,
    bowCritBonusPct: 40,
    bowZoomFov: 16,
  },
  bow_orc_composite: {
    id: 'bow_orc_composite',
    name: 'Орочий композитный лук Вождя',
    category: 'bow',
    icon: '🏹🦴',
    description: 'Мощный орочий лук с тугой тетивой. Сливается ★!',
    effectText: 'Лук: +58 урон стрелы, +28% крит, Снайперский зум 3.5x (Слияние ★)',
    buyPrice: 360,
    sellPrice: 170,
    mergeable: true,
    bowBaseDmg: 58,
    bowCritBonusPct: 28,
    bowZoomFov: 20,
  },
  ring_precision: {
    id: 'ring_precision',
    name: 'Кольцо Снайперской Меткости',
    category: 'ring',
    icon: '💍🎯',
    description: 'Изумрудное кольцо снайпера. Усиливает выстрелы из лука и ловкость. Сливается ★!',
    effectText: 'Кольцо: +25% к урону Лука и Стрел, +10% к Силе (Слияние ★: +35% за ранг)',
    buyPrice: 190,
    sellPrice: 90,
    mergeable: true,
    ringBowPct: 25,
    ringRangedBonusPct: 25,
    ringStrPct: 10,
  },
  ring_vitality: {
    id: 'ring_vitality',
    name: 'Кольцо Богатырского Здоровья',
    category: 'ring',
    icon: '💍❤️',
    description: 'Золотое кольцо с рубином жизни. Укрепляет здоровье и защиту. Сливается ★!',
    effectText: 'Кольцо: +60 макс. HP, +12% защиты (Слияние ★: +35% за ранг)',
    buyPrice: 185,
    sellPrice: 88,
    mergeable: true,
    ringHpBonus: 60,
    ringDefPct: 12,
  },
  ring_strength: {
    id: 'ring_strength',
    name: 'Кольцо Могущества Воина',
    category: 'ring',
    icon: '💍💪',
    description: 'Перстень кузнецов и воинов Миртаны. Повышает урон оружия. Сливается ★!',
    effectText: 'Кольцо: +18% к Силе удара, +40 макс. HP (Слияние ★: +35% за ранг)',
    buyPrice: 200,
    sellPrice: 95,
    mergeable: true,
    ringStrPct: 18,
    ringHpBonus: 40,
  },
  ring_berserk: {
    id: 'ring_berserk',
    name: 'Кольцо Ярости Берсерка',
    category: 'ring',
    icon: '💍🔥',
    description: 'Древний перстень катакомб. Резко увеличивает атаку в ближнем и дальнем бою. Сливается ★!',
    effectText: 'Кольцо: +24% к Силе и урону Лука (Слияние ★: +35% за ранг)',
    buyPrice: 240,
    sellPrice: 112,
    mergeable: true,
    ringStrPct: 24,
    ringBowPct: 24,
    ringRangedBonusPct: 24,
  },
  teleport_stone_portable: {
    id: 'teleport_stone_portable',
    name: 'Переносной Рунический Телепорт',
    category: 'teleport',
    icon: '🌀💎',
    description:
      'Позволяет установить личный маяк телепортации в любой точке мира или переместиться между большими стационарными телепортами карты (клавиша [T]).',
    effectText: 'Нажмите [Применить] или клавишу [T], чтобы открыть Карту Телепортов',
    buyPrice: 150,
    sellPrice: 75,
  },
  potion_alch_titan: {
    id: 'potion_alch_titan',
    name: 'Алхимический Отвар Титана (Котёл Алхимии)',
    category: 'potion',
    icon: '🧪⚡',
    description: 'Густой золотой эликсир из Алхимического Котла. Навсегда поднимает Силу, Здоровье выше 100% и исцеляет!',
    effectText: 'НАВСЕГДА: +45 макс. HP, +14% к Силе и 100% исцеление',
    buyPrice: 280,
    sellPrice: 135,
    fixedMaxHpBonus: 45,
    damageBonusPercent: 14,
    fullRestoreHp: true,
  },
  potion_alch_shadow: {
    id: 'potion_alch_shadow',
    name: 'Алхимический Настой Снайпера и Тени',
    category: 'potion',
    icon: '🧪🏹',
    description: 'Изумрудное зелье из Котла Алхимии. Навсегда повышает Ловкость, Ману и меткость стрельбы из лука!',
    effectText: 'НАВСЕГДА: +15% к Ловкости, +30 макс. Маны и 100% восстановление',
    buyPrice: 260,
    sellPrice: 125,
    agilityBonusPercent: 15,
    fixedMaxMpBonus: 30,
    fullRestoreHp: true,
    fullRestoreMp: true,
  },
};

export interface AlchemyRecipe {
  id: string;
  name: string;
  resultItemId: string;
  resultQty: number;
  ingredients: { itemId: string; count: number; qty: number }[];
}

export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
  {
    id: 'rec_restore_hp',
    name: 'Варево Целителя (2× Огненная крапива ➔ 2× Зелье Исцеления)',
    resultItemId: 'potion_restore_hp',
    resultQty: 2,
    ingredients: [{ itemId: 'herb_nettle', count: 2, qty: 2 }],
  },
  {
    id: 'rec_sniper_eagle',
    name: 'Эликсир Соколиного Снайпера (Ягода гоблина + Мясо фазана)',
    resultItemId: 'potion_sniper_eagle',
    resultQty: 1,
    ingredients: [
      { itemId: 'herb_goblin', count: 1, qty: 1 },
      { itemId: 'bird_pheasant', count: 1, qty: 1 },
    ],
  },
  {
    id: 'rec_perm_str',
    name: 'Высший Эликсир Силы >100% (Королевский щавель + Волчье сердце)',
    resultItemId: 'potion_perm_str',
    resultQty: 1,
    ingredients: [
      { itemId: 'herb_sorrel', count: 1, qty: 1 },
      { itemId: 'wolf_heart', count: 1, qty: 1 },
    ],
  },
  {
    id: 'rec_alch_titan',
    name: 'Отвар Титана >100% (Солнечное алоэ + Медвежья вырезка)',
    resultItemId: 'potion_alch_titan',
    resultQty: 1,
    ingredients: [
      { itemId: 'herb_sun_aloe', count: 1, qty: 1 },
      { itemId: 'bear_meat', count: 1, qty: 1 },
    ],
  },
  {
    id: 'rec_dragon_immortal',
    name: 'Королевский Эликсир Драконьей Крови (+50 HP, +35 MP, +1 LP)',
    resultItemId: 'potion_dragon_immortal',
    resultQty: 1,
    ingredients: [
      { itemId: 'herb_sorrel', count: 1, qty: 1 },
      { itemId: 'egg_golden', count: 1, qty: 1 },
    ],
  },
  {
    id: 'rec_fire_arrows',
    name: 'Алхимическая пропитка: Колчан огненных стрел (Огненная крапива ×2)',
    resultItemId: 'quiver_fire',
    resultQty: 15,
    ingredients: [{ itemId: 'herb_nettle', count: 2, qty: 2 }],
  },
];

export const ELEMENT_INFO: Record<
  MagicElement,
  {
    name: string;
    spellName: string;
    hotkey: string;
    color: number;
    hex: string;
    mpCost: number;
  }
> = {
  fire: {
    name: 'Магия Огня',
    spellName: 'Огненный Файербол',
    hotkey: '1',
    color: 0xff5511,
    hex: '#ff5511',
    mpCost: 12,
  },
  water: {
    name: 'Магия Воды',
    spellName: 'Ледяной Шар Воды',
    hotkey: '2',
    color: 0x22aaff,
    hex: '#22aaff',
    mpCost: 11,
  },
  air: {
    name: 'Магия Воздуха',
    spellName: 'Штормовой Шар Ветра',
    hotkey: '3',
    color: 0x66f0dc,
    hex: '#66f0dc',
    mpCost: 11,
  },
  lightning: {
    name: 'Магия Земли',
    spellName: 'Каменный Шар Земли',
    hotkey: '4',
    color: 0x99dd33,
    hex: '#99dd33',
    mpCost: 13,
  },
  necro: {
    name: 'Некромагия и Яды',
    spellName: 'Шар Чумного Яда',
    hotkey: '5',
    color: 0x77ff22,
    hex: '#77ff22',
    mpCost: 13,
  },
};

// 3D-снаряд Атакующего Шара / Файербола разных стихий и уровней (Two Worlds)
export function createSpellOrbMesh(element: MagicElement, level = 1): THREE.Group {
  const g = new THREE.Group();
  const info = ELEMENT_INFO[element];
  const radius = Math.min(0.62, 0.26 + level * 0.045);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  g.add(core);

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.48, 12, 10),
    new THREE.MeshBasicMaterial({
      color: info.color,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  g.add(aura);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.65, 0.032, 6, 16),
    new THREE.MeshBasicMaterial({ color: info.color })
  );
  ring.rotation.x = Math.PI / 3;
  g.add(ring);

  return g;
}

// ============================================================
// 1. НАСТОЯЩАЯ ФОРМА ПТИЧЬЕГО ЯЙЦА (Овоид через LatheGeometry + гнездо)
// ============================================================
let cachedEggGeo: THREE.LatheGeometry | null = null;
function getAuthenticEggGeometry(): THREE.LatheGeometry {
  if (cachedEggGeo) return cachedEggGeo;
  // Точная математическая кривая настоящего птичьего яйца:
  // Широкое тупое основание внизу и плавно сужающийся острый кончик вверху!
  const points: THREE.Vector2[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI; // от 0 (низ) до PI (верх)
    const y = -Math.cos(t); // от -1 (низ) до +1 (верх)
    // Коэффициент асимметрии яйца (сужение к вершине y > 0)
    const taper = 1 - 0.26 * y;
    const x = Math.sin(t) * 0.72 * taper;
    points.push(new THREE.Vector2(Math.max(0.001, x), (y + 1) * 0.5));
  }
  cachedEggGeo = new THREE.LatheGeometry(points, 18);
  cachedEggGeo.computeVertexNormals();
  return cachedEggGeo;
}

export function createEggNestMesh(isGolden: boolean): THREE.Group {
  const g = new THREE.Group();

  // Плетёное гнёздышко из веточек и соломы на земле (остаётся на месте после сбора яиц!)
  const nestMat = new THREE.MeshStandardMaterial({ color: 0x5c4228, roughness: 0.95 });
  const strawMat = new THREE.MeshStandardMaterial({ color: 0xb8964c, roughness: 0.9 });

  const nestRing = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.095, 8, 16), nestMat);
  nestRing.rotation.x = Math.PI / 2;
  nestRing.position.y = 0.075;
  nestRing.castShadow = true;
  nestRing.receiveShadow = true;
  g.add(nestRing);

  const strawRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.055, 7, 14), strawMat);
  strawRing.rotation.x = Math.PI / 2;
  strawRing.position.y = 0.085;
  g.add(strawRing);

  const nestFloor = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.06, 12), strawMat);
  nestFloor.position.y = 0.035;
  nestFloor.receiveShadow = true;
  g.add(nestFloor);

  // Веточки по краям гнёздышка для естественного вида
  const twigGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.42, 5);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const twig = new THREE.Mesh(twigGeo, nestMat);
    twig.position.set(Math.cos(ang) * 0.31, 0.06, Math.sin(ang) * 0.31);
    twig.rotation.x = Math.PI / 2 + (i % 2 === 0 ? 0.12 : -0.12);
    twig.rotation.z = ang + 0.4;
    g.add(twig);
  }

  // Отдельная группа для яиц в гнезде — при подборе забираются только яйца, а само гнёздышко остаётся на земле!
  const eggsGroup = new THREE.Group();
  const eggGeo = getAuthenticEggGeometry();
  const eggMat = new THREE.MeshStandardMaterial({
    color: isGolden ? 0xf6d365 : 0xefe6d5,
    roughness: isGolden ? 0.25 : 0.42,
    metalness: isGolden ? 0.35 : 0.05,
    emissive: isGolden ? 0x553800 : 0x1a150e,
    emissiveIntensity: isGolden ? 0.35 : 0.1,
  });

  const offsets = [
    { x: 0, z: 0, rx: 0.12, rz: -0.08, s: 0.38 },
    { x: 0.14, z: 0.08, rx: -0.18, rz: 0.22, s: 0.34 },
    { x: -0.12, z: 0.09, rx: 0.15, rz: -0.25, s: 0.33 },
  ];
  for (const o of offsets) {
    const egg = new THREE.Mesh(eggGeo, eggMat);
    egg.scale.setScalar(o.s);
    egg.position.set(o.x, 0.06, o.z);
    egg.rotation.set(o.rx, Math.random() * Math.PI, o.rz);
    egg.castShadow = true;
    eggsGroup.add(egg);
  }

  g.add(eggsGroup);
  g.userData.eggsGroup = eggsGroup;

  return g;
}

// ============================================================
// 2. 3D-МОДЕЛИ ТРОФЕЕВ: ВОЛЧЬЕ СЕРДЦЕ, МЕДВЕЖЬЕ МЯСО, ТУШКА ПТИЦЫ
// ============================================================
export function createTrophyDropMesh(itemId: string): THREE.Group {
  const g = new THREE.Group();

  if (itemId === 'wolf_heart') {
    // Анатомическое багровое сердце волка из двух соединённых долей и сосудов сверху
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0x9e1b1b,
      roughness: 0.35,
      metalness: 0.1,
      emissive: 0x3a0505,
      emissiveIntensity: 0.35,
    });
    const lobeL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), heartMat);
    lobeL.scale.set(0.95, 1.35, 0.85);
    lobeL.position.set(0.06, 0.25, 0);
    lobeL.rotation.z = -0.28;
    g.add(lobeL);

    const lobeR = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), heartMat);
    lobeR.scale.set(0.9, 1.3, 0.85);
    lobeR.position.set(-0.06, 0.24, 0);
    lobeR.rotation.z = 0.28;
    g.add(lobeR);

    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.14, 7), heartMat);
    vessel.position.set(0.03, 0.44, 0);
    g.add(vessel);
    return g;
  }

  if (itemId === 'bear_meat') {
    // Сочный кусок медвежьей вырезки на косточке
    const meatMat = new THREE.MeshStandardMaterial({
      color: 0x8a281e,
      roughness: 0.55,
      emissive: 0x250805,
      emissiveIntensity: 0.2,
    });
    const fatMat = new THREE.MeshStandardMaterial({ color: 0xead8c0, roughness: 0.6 });
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.16, 12), meatMat);
    slab.scale.set(1.25, 1, 0.85);
    slab.position.y = 0.16;
    slab.castShadow = true;
    g.add(slab);

    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.2, 8), fatMat);
    bone.position.set(0.08, 0.165, 0.03);
    g.add(bone);
    return g;
  }

  // Птичье мясо / ножка дичи
  const roastMat = new THREE.MeshStandardMaterial({
    color: 0xb86b35,
    roughness: 0.5,
    emissive: 0x281205,
    emissiveIntensity: 0.2,
  });
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d2, roughness: 0.5 });
  const drum = new THREE.Mesh(new THREE.SphereGeometry(0.18, 9, 8), roastMat);
  drum.scale.set(1.3, 0.85, 0.9);
  drum.position.set(-0.04, 0.18, 0);
  g.add(drum);

  const legBone = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.24, 6), boneMat);
  legBone.rotation.z = Math.PI / 2;
  legBone.position.set(0.14, 0.18, 0);
  g.add(legBone);

  return g;
}

// ============================================================
// 3. 3D-МОДЕЛИ ЦЕЛЕБНЫХ И МАГИЧЕСКИХ ТРАВ МИРТАНЫ
// ============================================================
export function createHerbMesh(herbId: string): THREE.Group {
  const g = new THREE.Group();

  const cfg: Record<
    string,
    { leafColor: number; flowerColor: number; glowColor: number }
  > = {
    herb_sorrel: { leafColor: 0x2d8a4e, flowerColor: 0xd9383a, glowColor: 0x3a9a40 },
    herb_goblin: { leafColor: 0x2a6e58, flowerColor: 0x7b42f6, glowColor: 0x4a25aa },
    herb_nettle: { leafColor: 0x6e4a22, flowerColor: 0xff5e1a, glowColor: 0xaa3000 },
    herb_sun_aloe: { leafColor: 0x5ea832, flowerColor: 0xffd23f, glowColor: 0x886600 },
  };
  const c = cfg[herbId] || cfg.herb_sorrel;

  const leafMat = new THREE.MeshStandardMaterial({
    color: c.leafColor,
    roughness: 0.65,
    emissive: c.glowColor,
    emissiveIntensity: 0.22,
  });
  const flowerMat = new THREE.MeshStandardMaterial({
    color: c.flowerColor,
    roughness: 0.35,
    emissive: c.flowerColor,
    emissiveIntensity: 0.55,
  });

  // Розетка листьев
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 5), leafMat);
    leaf.scale.set(1, 1, 0.35);
    leaf.position.set(Math.cos(ang) * 0.16, 0.18, Math.sin(ang) * 0.16);
    leaf.rotation.x = 0.55;
    leaf.rotation.y = -ang + Math.PI / 2;
    leaf.castShadow = true;
    g.add(leaf);
  }

  // Ягоды или соцветие в центре кустика
  for (let i = 0; i < 3; i++) {
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), flowerMat);
    bud.position.set((i - 1) * 0.08, 0.34 + (i % 2) * 0.07, (i % 2 === 0 ? 1 : -1) * 0.05);
    g.add(bud);
  }

  return g;
}

// ============================================================
// 4. ЛЕВИТИРУЮЩИЕ МАГИЧЕСКИЕ ГРИМУАРЫ И ОКОВАННЫЕ СУНДУЧКИ
// ============================================================
export function createGrimoireNodeMesh(
  element: MagicElement,
  withChest: boolean
): { root: THREE.Group; floatingBook: THREE.Group; auraRing: THREE.Mesh } {
  const root = new THREE.Group();
  const elInfo = ELEMENT_INFO[element];

  if (withChest) {
    // Деревянный сундучок, окованный железом и золотом, с приоткрытой крышкой
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2c16, roughness: 0.85 });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x8a7248,
      metalness: 0.7,
      roughness: 0.35,
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.48, 0.62), woodMat);
    base.position.y = 0.24;
    base.castShadow = true;
    base.receiveShadow = true;
    root.add(base);

    const bandL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.65), ironMat);
    bandL.position.set(-0.34, 0.25, 0);
    root.add(bandL);

    const bandR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.65), ironMat);
    bandR.position.set(0.34, 0.25, 0);
    root.add(bandR);

    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.06), ironMat);
    lock.position.set(0, 0.36, 0.32);
    root.add(lock);

    // Откинутая крышка сундучка, откуда парит сияющий гримуар
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.48, -0.3);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.95, 10, 1, false, 0, Math.PI), woodMat);
    lid.rotation.z = Math.PI / 2;
    lid.position.z = 0.3;
    lidGroup.add(lid);
    lidGroup.rotation.x = -0.65;
    root.add(lidGroup);
  }

  // Сама левитирующая раскрытая книга-гримуар
  const floatingBook = new THREE.Group();
  floatingBook.position.y = withChest ? 1.15 : 0.95;

  const coverMat = new THREE.MeshStandardMaterial({
    color: elInfo.color,
    roughness: 0.4,
    metalness: 0.25,
    emissive: elInfo.color,
    emissiveIntensity: 0.35,
  });
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xfbf3dc,
    roughness: 0.6,
    emissive: elInfo.color,
    emissiveIntensity: 0.25,
  });

  // Левая и правая половинки раскрытого фолианта
  const wingL = new THREE.Group();
  const coverL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.46), coverMat);
  coverL.position.x = -0.17;
  const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.05, 0.42), pageMat);
  pageL.position.set(-0.16, 0.03, 0);
  wingL.add(coverL, pageL);
  wingL.rotation.z = 0.25;
  floatingBook.add(wingL);

  const wingR = new THREE.Group();
  const coverR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.46), coverMat);
  coverR.position.x = 0.17;
  const pageR = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.05, 0.42), pageMat);
  pageR.position.set(0.16, 0.03, 0);
  wingR.add(coverR, pageR);
  wingR.rotation.z = -0.25;
  floatingBook.add(wingR);

  // Сияющий кристалл-руна стихии над страницами книги
  const runeCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: elInfo.color })
  );
  runeCrystal.position.y = 0.24;
  floatingBook.add(runeCrystal);

  root.add(floatingBook);

  // Магическое кольцо-ореол вокруг гримуара
  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.48, 0.62, 24),
    new THREE.MeshBasicMaterial({
      color: elInfo.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    })
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = withChest ? 0.65 : 0.12;
  root.add(auraRing);

  return { root, floatingBook, auraRing };
}

// ============================================================
// 5. НАЗЕМНЫЕ ОХОТНИЧЬИ ПТИЦЫ 3 ПОРОД (Золотой фазан, Тетерев, Белая куропатка)
// ============================================================
export function createGroundBirdModel(
  breed: 'pheasant' | 'grouse' | 'partridge'
): THREE.Group {
  const g = new THREE.Group();
  const hitMeshes: THREE.Mesh[] = [];

  const colors = {
    pheasant: {
      body: 0xb85d19,
      wing: 0x8a3b10,
      head: 0x1b5e3a,
      tail: 0xd49b38,
      crest: 0xd02020,
    },
    grouse: {
      body: 0x242834,
      wing: 0x3a2c24,
      head: 0x181c26,
      tail: 0x14161d,
      crest: 0xd82828,
    },
    partridge: {
      body: 0xf0ece1,
      wing: 0xd6cfc2,
      head: 0xf7f5f0,
      tail: 0xc2b8a3,
      crest: 0xc84a32,
    },
  }[breed];

  const bodyMat = new THREE.MeshStandardMaterial({ color: colors.body, roughness: 0.8 });
  const wingMat = new THREE.MeshStandardMaterial({ color: colors.wing, roughness: 0.85 });
  const headMat = new THREE.MeshStandardMaterial({ color: colors.head, roughness: 0.75 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xe6b840, roughness: 0.5 });
  const crestMat = new THREE.MeshStandardMaterial({ color: colors.crest, roughness: 0.6 });

  const body = new THREE.Group();
  body.position.y = 0.36;
  g.add(body);

  // Округлое туловище птицы
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.24, 9, 8), bodyMat);
  torso.scale.set(0.88, 0.82, 1.35);
  torso.castShadow = true;
  body.add(torso);
  hitMeshes.push(torso);

  // Крылья по бокам
  const wingGeo = new THREE.SphereGeometry(0.18, 7, 6);
  wingGeo.scale(0.35, 0.75, 1.25);
  const wL = new THREE.Mesh(wingGeo, wingMat);
  wL.position.set(0.18, 0.02, -0.02);
  const wR = new THREE.Mesh(wingGeo, wingMat);
  wR.position.set(-0.18, 0.02, -0.02);
  body.add(wL, wR);
  hitMeshes.push(wL, wR);

  // Хвост (у фазана длинный золотистый, у тетерева лирообразный, у куропатки аккуратный)
  const tailLen = breed === 'pheasant' ? 0.55 : 0.3;
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, tailLen, 5),
    new THREE.MeshStandardMaterial({ color: colors.tail, roughness: 0.85 })
  );
  tail.rotation.x = -Math.PI * 0.38;
  tail.position.set(0, 0.08, -0.28 - tailLen * 0.3);
  body.add(tail);

  // Шея, голова, клюв и гребешок
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.22, 7), headMat);
  neck.position.set(0, 0.16, 0.22);
  neck.rotation.x = 0.25;
  body.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 8, 8), headMat);
  head.position.set(0, 0.28, 0.26);
  body.add(head);
  hitMeshes.push(head);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.27, 0.38);
  body.add(beak);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.09), crestMat);
  crest.position.set(0, 0.37, 0.26);
  body.add(crest);

  // Анатомически правильные птичьи ножки (оперённое бедро/голень + цевка + 3 пальчика вперёд и шпора назад)
  const legMat = new THREE.MeshStandardMaterial({ color: 0xd89632, roughness: 0.65 });
  const thighGeo = new THREE.ConeGeometry(0.048, 0.12, 6);
  const shankGeo = new THREE.CylinderGeometry(0.017, 0.014, 0.17, 6);
  const toeGeo = new THREE.CylinderGeometry(0.007, 0.01, 0.09, 5);
  const backToeGeo = new THREE.CylinderGeometry(0.006, 0.009, 0.05, 5);

  const buildBirdLeg = (sideX: number): THREE.Group => {
    const legGroup = new THREE.Group();
    // Крепится прямо к нижней части туловища (body.position.y = 0.34, низ туловища ~0.16..0.24)
    legGroup.position.set(sideX, 0.24, 0.01);

    // Оперённая верхняя часть ножки (бедро/голень), уходящая в перья туловища
    const thigh = new THREE.Mesh(thighGeo, bodyMat);
    thigh.rotation.x = Math.PI + 0.18;
    thigh.position.set(0, -0.04, -0.01);
    legGroup.add(thigh);

    // Сустав-пяточка и тонкая жёлто-оранжевая цевка до самой земли (y = -0.23)
    const shank = new THREE.Mesh(shankGeo, legMat);
    shank.position.set(0, -0.145, 0.005);
    shank.rotation.x = -0.08;
    shank.castShadow = true;
    legGroup.add(shank);

    // Лапка с тремя пальчиками вперёд и задним пальчиком-шпорой на земле
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -0.228, 0.012);

    // Средний пальчик вперёд
    const toeMid = new THREE.Mesh(toeGeo, legMat);
    toeMid.rotation.x = Math.PI / 2;
    toeMid.position.set(0, 0, 0.042);
    footGroup.add(toeMid);

    // Боковые пальчики веером
    const toeL = new THREE.Mesh(toeGeo, legMat);
    toeL.rotation.x = Math.PI / 2;
    toeL.rotation.z = -0.45;
    toeL.position.set(0.024, 0, 0.036);
    footGroup.add(toeL);

    const toeR = new THREE.Mesh(toeGeo, legMat);
    toeR.rotation.x = Math.PI / 2;
    toeR.rotation.z = 0.45;
    toeR.position.set(-0.024, 0, 0.036);
    footGroup.add(toeR);

    // Задний пальчик
    const toeBack = new THREE.Mesh(backToeGeo, legMat);
    toeBack.rotation.x = Math.PI / 2;
    toeBack.position.set(0, 0.004, -0.024);
    footGroup.add(toeBack);

    legGroup.add(footGroup);
    return legGroup;
  };

  body.position.y = 0.34;
  const legFL = buildBirdLeg(0.075);
  const legFR = buildBirdLeg(-0.075);
  g.add(legFL, legFR);

  g.userData = {
    kind: 'bird',
    body,
    legFL,
    legFR,
    tail,
    hitMeshes,
  };

  return g;
}

// ============================================================
// 6. 3D-МОДЕЛИ ДРОПА И ЭКИПИРОВКИ: МЕЧ И ЩИТ СКЕЛЕТА, БУЛАВА ОРКА,
//    МАГИЧЕСКИЕ КАРТЫ TWO WORLDS И МЕГАБОНУС ЧЁРНОГО ТРОЛЛЯ
// ============================================================
export function createEquipmentDropMesh(itemId: string): {
  root: THREE.Group;
  floatingPart?: THREE.Group;
  auraRing?: THREE.Mesh;
} {
  const root = new THREE.Group();
  const floatingPart = new THREE.Group();
  floatingPart.position.y = 0.55;
  root.add(floatingPart);

  let glowHex = 0xd4a862;

  if (itemId === 'skeleton_sword') {
    glowHex = 0x99ccff;
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xb8c4d0,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x1a2838,
      emissiveIntensity: 0.35,
    });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2d8c0, roughness: 0.65 });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.92, 0.025), bladeMat);
    blade.position.y = 0.22;
    floatingPart.add(blade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.07), boneMat);
    guard.position.y = -0.22;
    floatingPart.add(guard);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.24, 7), boneMat);
    grip.position.y = -0.36;
    floatingPart.add(grip);
    floatingPart.rotation.z = 0.45;
  } else if (itemId === 'skeleton_shield' || itemId === 'troll_shield') {
    const isTroll = itemId === 'troll_shield';
    glowHex = isTroll ? 0xffaa22 : 0x88b8d8;
    const shieldMat = new THREE.MeshStandardMaterial({
      color: isTroll ? 0x262030 : 0x5c4632,
      roughness: 0.55,
      metalness: isTroll ? 0.5 : 0.2,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: isTroll ? 0xffb830 : 0xd6cdb8,
      metalness: 0.7,
      roughness: 0.3,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 16), shieldMat);
    disc.rotation.x = Math.PI / 2;
    floatingPart.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 18), rimMat);
    floatingPart.add(rim);
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), rimMat);
    boss.position.z = 0.04;
    floatingPart.add(boss);
  } else if (itemId === 'orc_mace' || itemId === 'troll_hammer') {
    const isTroll = itemId === 'troll_hammer';
    glowHex = isTroll ? 0xff6600 : 0xe07020;
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.85 });
    const headMat = new THREE.MeshStandardMaterial({
      color: isTroll ? 0x221a28 : 0x555860,
      metalness: 0.85,
      roughness: 0.3,
      emissive: isTroll ? 0x661800 : 0x220800,
      emissiveIntensity: 0.4,
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.95, 8), shaftMat);
    floatingPart.add(shaft);

    if (isTroll) {
      const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.28, 0.32), headMat);
      hammerHead.position.y = 0.42;
      floatingPart.add(hammerHead);
    } else {
      const maceBall = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), headMat);
      maceBall.position.y = 0.4;
      floatingPart.add(maceBall);
      // Шипы на булаве орка
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), headMat);
        spike.position.set(Math.cos(ang) * 0.24, 0.4, Math.sin(ang) * 0.24);
        spike.rotation.z = -Math.PI / 2;
        spike.rotation.y = -ang;
        floatingPart.add(spike);
      }
    }
    floatingPart.rotation.z = -0.4;
  } else if (itemId.startsWith('bow_')) {
    glowHex = itemId === 'bow_dragon_imperial' ? 0xffaa22 : 0x66ee88;
    const bowArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.032, 8, 18, Math.PI),
      new THREE.MeshStandardMaterial({
        color: itemId === 'bow_dragon_imperial' ? 0xd4a840 : 0x6b4222,
        metalness: itemId === 'bow_dragon_imperial' ? 0.7 : 0.2,
        roughness: 0.45,
      })
    );
    bowArc.rotation.z = -Math.PI / 2;
    floatingPart.add(bowArc);
  } else if (itemId.startsWith('quiver_')) {
    glowHex = 0x55ccff;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.09, 0.55, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c381e, roughness: 0.8 })
    );
    tube.rotation.z = -0.3;
    floatingPart.add(tube);
  } else if (itemId.startsWith('ring_')) {
    glowHex = 0xffd740;
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.042, 10, 20),
      new THREE.MeshStandardMaterial({ color: 0xffd740, metalness: 0.9, roughness: 0.18 })
    );
    floatingPart.add(band);
  } else if (itemId.startsWith('card_')) {
    // Парящая Магическая Карта Two Worlds с рунической рамкой и кристаллом стихии
    const def = ITEM_CATALOG[itemId];
    const el = def?.cardElement || 'necro';
    glowHex = ELEMENT_INFO[el].color;
    const cardBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.62, 0.03),
      new THREE.MeshStandardMaterial({
        color: 0x1e1628,
        roughness: 0.3,
        metalness: 0.5,
        emissive: glowHex,
        emissiveIntensity: 0.35,
      })
    );
    floatingPart.add(cardBody);

    const runeCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13, 0),
      new THREE.MeshBasicMaterial({ color: glowHex })
    );
    runeCore.position.z = 0.03;
    floatingPart.add(runeCore);
  } else {
    // Мега-Сердце Чёрного Тролля или Тотем Силы Орка
    const isMega = itemId === 'troll_mega_heart';
    glowHex = isMega ? 0xff2266 : 0xff8811;
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(isMega ? 0.32 : 0.22, 1),
      new THREE.MeshStandardMaterial({
        color: glowHex,
        roughness: 0.2,
        metalness: 0.6,
        emissive: glowHex,
        emissiveIntensity: 0.6,
      })
    );
    floatingPart.add(gem);
  }

  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.44, 20),
    new THREE.MeshBasicMaterial({
      color: glowHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    })
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.08;
  root.add(auraRing);

  return { root, floatingPart, auraRing };
}

// 3D-модель экипированного оружия в правой руке героя (Булава орка / Молот тролля / Клинок скелета)
export function createCustomHandWeaponMesh(weaponId: string): THREE.Group {
  const g = new THREE.Group();
  if (weaponId === 'orc_mace') {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.04, 1.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a2c16, roughness: 0.85 })
    );
    shaft.position.y = 0.55;
    g.add(shaft);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x484c54,
      metalness: 0.88,
      roughness: 0.28,
      emissive: 0x331000,
      emissiveIntensity: 0.3,
    });
    const ball = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), headMat);
    ball.position.y = 1.25;
    g.add(ball);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 5), headMat);
      spike.position.set(Math.cos(a) * 0.3, 1.25, Math.sin(a) * 0.3);
      spike.rotation.z = -Math.PI / 2;
      spike.rotation.y = -a;
      g.add(spike);
    }
    return g;
  }

  if (weaponId === 'troll_hammer') {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.045, 1.55, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d1b10, roughness: 0.8 })
    );
    shaft.position.y = 0.65;
    g.add(shaft);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x221a2a,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0xff4400,
      emissiveIntensity: 0.45,
    });
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.38, 0.42), headMat);
    block.position.y = 1.42;
    g.add(block);
    return g;
  }

  if (weaponId === 'paladin_flamberge' || weaponId === 'katana_wind') {
    const isFire = weaponId === 'paladin_flamberge';
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(isFire ? 0.13 : 0.075, isFire ? 1.55 : 1.42, 0.03),
      new THREE.MeshStandardMaterial({
        color: isFire ? 0xffaa44 : 0xe8f4ff,
        metalness: 0.92,
        roughness: 0.15,
        emissive: isFire ? 0xcc3300 : 0x226688,
        emissiveIntensity: 0.5,
      })
    );
    blade.position.y = 0.82;
    g.add(blade);
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(isFire ? 0.48 : 0.24, 0.07, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xe6be55, metalness: 0.85, roughness: 0.25 })
    );
    guard.position.y = 0.12;
    g.add(guard);
    return g;
  }

  if (weaponId === 'halberd_sentinel' || weaponId === 'necro_scythe') {
    const isScythe = weaponId === 'necro_scythe';
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.038, 1.85, 8),
      new THREE.MeshStandardMaterial({ color: isScythe ? 0x1e1624 : 0x4a2f18, roughness: 0.8 })
    );
    shaft.position.y = 0.8;
    g.add(shaft);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: isScythe ? 0x88ff66 : 0xd0dce8,
      metalness: 0.88,
      roughness: 0.2,
      emissive: isScythe ? 0x228811 : 0x224466,
      emissiveIntensity: 0.45,
    });
    if (isScythe) {
      const scytheBlade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.82, 4), bladeMat);
      scytheBlade.rotation.z = Math.PI / 2 + 0.25;
      scytheBlade.position.set(0.36, 1.62, 0);
      g.add(scytheBlade);
    } else {
      const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.05), bladeMat);
      axeHead.position.set(0.16, 1.48, 0);
      g.add(axeHead);
      const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 5), bladeMat);
      spearTip.position.y = 1.85;
      g.add(spearTip);
    }
    return g;
  }

  // Древний клинок скелета
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 1.35, 0.03),
    new THREE.MeshStandardMaterial({
      color: 0xc0d4e8,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x225588,
      emissiveIntensity: 0.35,
    })
  );
  blade.position.y = 0.78;
  g.add(blade);
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.09),
    new THREE.MeshStandardMaterial({ color: 0xe5dcc5, roughness: 0.5 })
  );
  guard.position.y = 0.12;
  g.add(guard);
  return g;
}

// 3D-модель экипированного Щита на левой руке героя
export function createCustomHandShieldMesh(shieldId: string): THREE.Group {
  const g = new THREE.Group();
  const isTroll = shieldId === 'troll_shield';
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.07, 18),
    new THREE.MeshStandardMaterial({
      color: isTroll ? 0x241d2c : 0x5c4328,
      roughness: 0.5,
      metalness: isTroll ? 0.55 : 0.25,
    })
  );
  disc.rotation.z = Math.PI / 2;
  disc.position.set(-0.22, -0.18, 0.12);
  g.add(disc);

  const boss = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 10),
    new THREE.MeshStandardMaterial({
      color: isTroll ? 0xffaa22 : 0xd8ceb8,
      metalness: 0.8,
      roughness: 0.25,
      emissive: isTroll ? 0x663300 : 0x111111,
      emissiveIntensity: 0.35,
    })
  );
  boss.position.set(-0.26, -0.18, 0.12);
  g.add(boss);
  return g;
}

// ============================================================
// 7. 3D-МОДЕЛИ КВЕСТОВЫХ ПРЕДМЕТОВ:
//    - Левитирующая в воздухе Удочка Рыбака (fishing_rod)
//    - Потерянное Золотое Колечко Елены с сапфиром (elena_ring)
//    - Поленницы и связки дров для костра (firewood_bundle)
// ============================================================
export function createLevitatingFishingRodMesh(): {
  root: THREE.Group;
  floatingPart: THREE.Group;
  auraRing: THREE.Mesh;
} {
  const root = new THREE.Group();
  const floatingPart = new THREE.Group();
  // Удочка левитирует высоко в воздухе (на высоте ~1.55 м над землёй!)
  floatingPart.position.y = 1.55;
  root.add(floatingPart);

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.55,
    metalness: 0.15,
    emissive: 0x331f0a,
    emissiveIntensity: 0.25,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd255,
    metalness: 0.85,
    roughness: 0.2,
    emissive: 0x664400,
    emissiveIntensity: 0.4,
  });

  // Длинное гибкое удилище под углом
  const rodGroup = new THREE.Group();
  rodGroup.rotation.z = -0.55;
  floatingPart.add(rodGroup);

  const rodShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.042, 2.1, 8), woodMat);
  rodShaft.position.y = 0.45;
  rodGroup.add(rodShaft);

  // Рукоять с золотыми кольцами и катушкой
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.048, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.8 })
  );
  grip.position.y = -0.42;
  rodGroup.add(grip);

  const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12), goldMat);
  reel.rotation.x = Math.PI / 2;
  reel.position.set(0.09, -0.25, 0);
  rodGroup.add(reel);

  // Леска, свисающая с кончика удилища, и яркий красно-белый поплавок
  const line = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.85, 4),
    new THREE.MeshBasicMaterial({ color: 0xd8f4ff })
  );
  line.position.set(0.35, 1.05, 0);
  line.rotation.z = 0.55;
  rodGroup.add(line);

  const bobberTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0xff2a2a,
      emissive: 0xaa1111,
      emissiveIntensity: 0.6,
      roughness: 0.25,
    })
  );
  bobberTop.position.set(0.56, 0.72, 0);
  rodGroup.add(bobberTop);

  // Сияющий голубовато-золотой ореол левитации в воздухе
  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.62, 24),
    new THREE.MeshBasicMaterial({
      color: 0x44e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
    })
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.12;
  root.add(auraRing);

  const upperHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.02, 8, 24),
    new THREE.MeshBasicMaterial({
      color: 0xffd866,
      transparent: true,
      opacity: 0.65,
    })
  );
  upperHalo.rotation.x = Math.PI / 2;
  floatingPart.add(upperHalo);

  return { root, floatingPart, auraRing };
}

export function createElenaRingMesh(): {
  root: THREE.Group;
  floatingPart: THREE.Group;
  auraRing: THREE.Mesh;
} {
  const root = new THREE.Group();
  const floatingPart = new THREE.Group();
  floatingPart.position.y = 0.72;
  root.add(floatingPart);

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd740,
    metalness: 0.92,
    roughness: 0.15,
    emissive: 0x664800,
    emissiveIntensity: 0.45,
  });
  const ringBand = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 12, 24), goldMat);
  floatingPart.add(ringBand);

  const sapphire = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 1),
    new THREE.MeshStandardMaterial({
      color: 0x2299ff,
      emissive: 0x1166ff,
      emissiveIntensity: 0.85,
      roughness: 0.1,
      metalness: 0.3,
    })
  );
  sapphire.position.y = 0.25;
  floatingPart.add(sapphire);

  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.46, 20),
    new THREE.MeshBasicMaterial({
      color: 0x55bbff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    })
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.08;
  root.add(auraRing);

  return { root, floatingPart, auraRing };
}

export function createFirewoodBundleMesh(): THREE.Group {
  const g = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x4d311c, roughness: 0.92 });
  const cutWoodMat = new THREE.MeshStandardMaterial({ color: 0xd8b278, roughness: 0.75 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xa68452, roughness: 0.85 });

  const logOffsets = [
    [-0.14, 0.12, 0],
    [0.14, 0.12, 0],
    [0, 0.12, 0],
    [-0.07, 0.25, 0],
    [0.07, 0.25, 0],
  ];
  for (const [lx, ly, lz] of logOffsets) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.68, 7), barkMat);
    log.rotation.x = Math.PI / 2;
    log.position.set(lx, ly, lz);
    log.castShadow = true;
    g.add(log);

    const endCap = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.7, 7), cutWoodMat);
    endCap.rotation.x = Math.PI / 2;
    endCap.position.set(lx, ly, lz);
    g.add(endCap);
  }

  // Верёвочная перевязь вокруг связки дров
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.025, 6, 14), ropeMat);
  strap.position.set(0, 0.18, 0);
  g.add(strap);

  // Тёплое золотистое кольцо-подсказка, чтобы дрова было легко заметить в траве
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.48, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);

  return g;
}

// ============================================================
// 8. 3D-МОДЕЛИ ЛУКОВ, СТРЕЛ, АЛХИМИЧЕСКОГО КОТЛА, ТЕЛЕПОРТОВ И ПОДЗЕМНЫХ ПЕЩЕР СО СКЕЛЕТАМИ
// ============================================================
export function createCustomBowMesh(bowId: string): THREE.Group {
  const g = new THREE.Group();
  const isDragon = bowId === 'bow_dragon_imperial';
  const isOrc = bowId === 'bow_orc_bone';
  const isElven = bowId === 'bow_elven';

  const limbColor = isDragon
    ? 0xe5b842
    : isOrc
    ? 0xdcd2be
    : isElven
    ? 0x4b7a3a
    : 0x6b3e1e;
  const glowColor = isDragon
    ? 0xff5500
    : isElven
    ? 0x33ff99
    : isOrc
    ? 0xaa3300
    : 0x22150a;

  const limbMat = new THREE.MeshStandardMaterial({
    color: limbColor,
    metalness: isDragon ? 0.78 : 0.2,
    roughness: isDragon ? 0.25 : 0.65,
    emissive: glowColor,
    emissiveIntensity: isDragon || isElven ? 0.35 : 0.1,
  });

  // Изогнутая дуга лука
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.036, 8, 22, Math.PI), limbMat);
  arc.rotation.z = -Math.PI / 2;
  arc.position.set(-0.08, -0.22, 0.14);
  g.add(arc);

  // Тетива лука
  const bowString = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 1.34, 4),
    new THREE.MeshBasicMaterial({ color: isDragon ? 0xffdd88 : 0xe8e2d5 })
  );
  bowString.position.set(-0.08, -0.22, 0.14);
  g.add(bowString);

  // Наложенная на тетиву стрела, готовая к выстрелу
  const nockedArrow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.82, 5),
    new THREE.MeshStandardMaterial({ color: 0xc89e62, roughness: 0.7 })
  );
  nockedArrow.rotation.x = Math.PI / 2;
  nockedArrow.position.set(-0.08, -0.22, 0.42);
  g.add(nockedArrow);

  const arrowTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.032, 0.11, 5),
    new THREE.MeshStandardMaterial({
      color: isDragon ? 0xff6600 : 0xd0dce8,
      metalness: 0.9,
      roughness: 0.2,
    })
  );
  arrowTip.rotation.x = Math.PI / 2;
  arrowTip.position.set(-0.08, -0.22, 0.85);
  g.add(arrowTip);

  return g;
}

export function createArrowProjectileMesh(quiverId: string | null): THREE.Group {
  const g = new THREE.Group();
  const def = quiverId ? ITEM_CATALOG[quiverId] : null;
  const el = def?.arrowElement;
  const tipHex = el ? ELEMENT_INFO[el].color : 0xd8e4f0;

  // Древко стрелы вдоль оси +Z (чтобы lookAt направлял остриё точно по траектории полёта!)
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 1.15, 6),
    new THREE.MeshStandardMaterial({ color: 0xb88b4a, roughness: 0.7 })
  );
  shaft.rotation.x = Math.PI / 2;
  g.add(shaft);

  // Бронебойный или стихийный наконечник стрелы
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.18, 6),
    new THREE.MeshStandardMaterial({
      color: tipHex,
      metalness: 0.85,
      roughness: 0.2,
      emissive: el ? tipHex : 0x223344,
      emissiveIntensity: el ? 0.85 : 0.25,
    })
  );
  head.rotation.x = Math.PI / 2;
  head.position.z = 0.62;
  g.add(head);

  // Оперение стрелы на хвосте
  const featherMat = new THREE.MeshBasicMaterial({
    color: el ? tipHex : 0xe84838,
    side: THREE.DoubleSide,
  });
  const f1 = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.22), featherMat);
  f1.rotation.x = Math.PI / 2;
  f1.position.z = -0.48;
  const f2 = f1.clone();
  f2.rotation.z = Math.PI / 2;
  g.add(f1, f2);

  return g;
}

export function createAlchemyCauldronMesh(): {
  root: THREE.Group;
  liquidMesh: THREE.Mesh;
  bubbles: THREE.Mesh[];
} {
  const root = new THREE.Group();

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x23272e,
    metalness: 0.82,
    roughness: 0.38,
  });
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff5511 });

  // Чугунное пузатое тело Алхимического Котла
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.68, 16, 12), ironMat);
  pot.scale.set(1.08, 0.86, 1.08);
  pot.position.y = 0.68;
  pot.castShadow = true;
  root.add(pot);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.075, 10, 22), ironMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.12;
  root.add(rim);

  // Бурлящее изумрудно-золотое алхимическое варево внутри котла
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x22ee88,
    emissive: 0x11aa55,
    emissiveIntensity: 0.75,
    roughness: 0.2,
  });
  const liquidMesh = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), liquidMat);
  liquidMesh.rotation.x = -Math.PI / 2;
  liquidMesh.position.y = 1.08;
  root.add(liquidMesh);

  // Пузырьки кипящего зелья
  const bubbles: THREE.Mesh[] = [];
  const bubbleMat = new THREE.MeshBasicMaterial({
    color: 0x99ffcc,
    transparent: true,
    opacity: 0.85,
  });
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.055 + (i % 3) * 0.02, 8, 8), bubbleMat);
    const a = (i / 6) * Math.PI * 2;
    b.position.set(Math.cos(a) * 0.26, 1.1 + (i % 2) * 0.08, Math.sin(a) * 0.26);
    root.add(b);
    bubbles.push(b);
  }

  // Кованые ножки-тренога и пылающие угли под котлом
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.85, 6), ironMat);
    leg.position.set(Math.cos(a) * 0.52, 0.38, Math.sin(a) * 0.52);
    leg.rotation.z = -Math.cos(a) * 0.25;
    leg.rotation.x = Math.sin(a) * 0.25;
    root.add(leg);
  }

  const coalBed = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 0.14, 12), emberMat);
  coalBed.position.y = 0.07;
  root.add(coalBed);

  // Светящийся ореол вокруг котла
  const aura = new THREE.Mesh(
    new THREE.RingGeometry(0.78, 0.96, 24),
    new THREE.MeshBasicMaterial({
      color: 0x33ff99,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.05;
  root.add(aura);

  return { root, liquidMesh, bubbles };
}

export function createTeleportPlatformMesh(
  isPortable: boolean,
  runeColor = 0x33ddff
): {
  root: THREE.Group;
  runeRing: THREE.Mesh;
  vortexColumn: THREE.Mesh;
} {
  const root = new THREE.Group();
  const scale = isPortable ? 0.55 : 1.0;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x565c68,
    roughness: 0.88,
    metalness: 0.15,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x323742,
    roughness: 0.9,
  });

  // Ступенчатый круглый каменный пьедестал, встроенный в землю (как в Two Worlds!)
  const baseStep1 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.55 * scale, 2.85 * scale, 0.28 * scale, 20),
    darkStoneMat
  );
  baseStep1.position.y = 0.14 * scale;
  baseStep1.receiveShadow = true;
  root.add(baseStep1);

  const baseStep2 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.05 * scale, 2.35 * scale, 0.24 * scale, 20),
    stoneMat
  );
  baseStep2.position.y = 0.32 * scale;
  baseStep2.receiveShadow = true;
  root.add(baseStep2);

  // Для больших стационарных телепортов — 4 древние каменные арки-обелиска с парящими кристаллами!
  if (!isPortable) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const px = Math.cos(a) * 2.15;
      const pz = Math.sin(a) * 2.15;

      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.1, 0.42), stoneMat);
      pillar.position.set(px, 1.65, pz);
      pillar.rotation.y = -a;
      pillar.castShadow = true;
      root.add(pillar);

      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 0),
        new THREE.MeshBasicMaterial({ color: runeColor })
      );
      crystal.position.set(px, 3.45, pz);
      root.add(crystal);
    }
  } else {
    // Для переносного маяка — рунический кристалл в центре
    const beaconGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshBasicMaterial({ color: runeColor })
    );
    beaconGem.position.y = 0.95;
    root.add(beaconGem);
  }

  // Вращающееся светящееся руническое кольцо на платформе
  const runeRing = new THREE.Mesh(
    new THREE.RingGeometry(1.15 * scale, 1.82 * scale, 28),
    new THREE.MeshBasicMaterial({
      color: runeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
  );
  runeRing.rotation.x = -Math.PI / 2;
  runeRing.position.y = 0.46 * scale;
  root.add(runeRing);

  // Полупрозрачный энергетический столб портала
  const vortexColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35 * scale, 1.55 * scale, 3.2 * scale, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: runeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  vortexColumn.position.y = 1.8 * scale;
  root.add(vortexColumn);

  return { root, runeRing, vortexColumn };
}

export function createCaveEntranceMesh(): THREE.Group {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x454850,
    roughness: 0.95,
    flatShading: true,
  });
  const darkRockMat = new THREE.MeshStandardMaterial({
    color: 0x282a30,
    roughness: 0.98,
    flatShading: true,
  });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2f1a, roughness: 0.9 });

  // Скальный массив вокруг входа в пещеру
  const leftWall = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), rockMat);
  leftWall.position.set(-2.4, 2.0, 0);
  leftWall.scale.set(1.1, 1.4, 1.2);
  leftWall.castShadow = true;
  g.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), rockMat);
  rightWall.position.set(2.4, 2.0, 0);
  rightWall.scale.set(1.1, 1.4, 1.2);
  rightWall.castShadow = true;
  g.add(rightWall);

  const topArch = new THREE.Mesh(new THREE.DodecahedronGeometry(3.1, 1), darkRockMat);
  topArch.position.set(0, 4.1, -0.3);
  topArch.scale.set(1.6, 0.85, 1.2);
  topArch.castShadow = true;
  g.add(topArch);

  // Деревянные крепи шахты/катакомб и тёмный портал входа внутрь пещеры
  const beamL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 3.4, 0.36), woodMat);
  beamL.position.set(-1.55, 1.7, 0.6);
  const beamR = new THREE.Mesh(new THREE.BoxGeometry(0.36, 3.4, 0.36), woodMat);
  beamR.position.set(1.55, 1.7, 0.6);
  const beamTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.42), woodMat);
  beamTop.position.set(0, 3.45, 0.6);
  g.add(beamL, beamR, beamTop);

  // Тёмный мистический зев пещеры с бирюзово-фиолетовым свечением катакомб
  const portalVoid = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 3.3),
    new THREE.MeshBasicMaterial({
      color: 0x090c14,
      side: THREE.DoubleSide,
    })
  );
  portalVoid.position.set(0, 1.65, 0.45);
  g.add(portalVoid);

  const portalGlow = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.55, 20),
    new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    })
  );
  portalGlow.rotation.x = -Math.PI / 2;
  portalGlow.position.set(0, 0.08, 1.4);
  g.add(portalGlow);

  // Два горящих факела у входа в пещеру
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8822 });
  for (const sx of [-1.85, 1.85]) {
    const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.7, 6), woodMat);
    torch.position.set(sx, 2.2, 0.95);
    torch.rotation.x = 0.3;
    g.add(torch);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 6), flameMat);
    flame.position.set(sx, 2.58, 1.06);
    g.add(flame);
  }

  return g;
}

export function createDungeonTreasureChestMesh(glowHex = 0xffd040): {
  root: THREE.Group;
  lidGroup: THREE.Group;
  auraRing: THREE.Mesh;
} {
  const root = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4d2d16, roughness: 0.82 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe6be55,
    metalness: 0.85,
    roughness: 0.25,
    emissive: 0x443000,
    emissiveIntensity: 0.3,
  });

  const box = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.58, 0.76), woodMat);
  box.position.y = 0.29;
  box.castShadow = true;
  root.add(box);

  for (const bx of [-0.42, 0, 0.42]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.8), goldMat);
    strap.position.set(bx, 0.3, 0);
    root.add(strap);
  }

  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.08), goldMat);
  lock.position.set(0, 0.44, 0.4);
  root.add(lock);

  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, 0.58, -0.38);
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 1.18, 12, 1, false, 0, Math.PI),
    woodMat
  );
  lid.rotation.z = Math.PI / 2;
  lid.position.z = 0.38;
  lidGroup.add(lid);
  root.add(lidGroup);

  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.88, 24),
    new THREE.MeshBasicMaterial({
      color: glowHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    })
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.06;
  root.add(auraRing);

  return { root, lidGroup, auraRing };
}

export function createUndergroundCaveDungeon(
  centerX: number,
  floorY: number,
  centerZ: number
): THREE.Group {
  const dungeon = new THREE.Group();
  dungeon.position.set(centerX, floorY, centerZ);

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2d323e,
    emissive: 0x161a24,
    emissiveIntensity: 0.7,
    roughness: 0.94,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x222630,
    emissive: 0x10131a,
    emissiveIntensity: 0.6,
    roughness: 0.96,
    flatShading: true,
  });
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x3d4352,
    emissive: 0x181c26,
    emissiveIntensity: 0.65,
    roughness: 0.88,
  });

  // Каменный пол зала подземной пещеры (радиус 44 м)
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(44, 44, 1.2, 20), floorMat);
  floor.position.y = -0.6;
  floor.receiveShadow = true;
  dungeon.add(floor);

  // Каменный свод-купол пещеры
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(43.5, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new THREE.MeshStandardMaterial({
      color: 0x1a1e28,
      emissive: 0x0d1018,
      emissiveIntensity: 0.65,
      roughness: 0.98,
      side: THREE.BackSide,
      flatShading: true,
    })
  );
  dungeon.add(dome);

  // 8 массивных древних колонн с горящими жаровнями и сталактиты под сводом
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7722 });
  const crystalMat = new THREE.MeshBasicMaterial({ color: 0x44ddff });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const px = Math.cos(a) * 24;
    const pz = Math.sin(a) * 24;

    const col = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 16, 8), pillarMat);
    col.position.set(px, 8, pz);
    dungeon.add(col);

    // Горящая чаша-жаровня у каждой колонны
    const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.35, 1.1, 7), pillarMat);
    brazier.position.set(px * 0.82, 0.55, pz * 0.82);
    dungeon.add(brazier);

    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.95, 6), flameMat);
    fire.position.set(px * 0.82, 1.35, pz * 0.82);
    dungeon.add(fire);

    // Сталактиты со свода и светящиеся подземные кристаллы
    const stalactite = new THREE.Mesh(new THREE.ConeGeometry(1.4, 5.5, 5), wallMat);
    stalactite.rotation.x = Math.PI;
    stalactite.position.set(Math.cos(a + 0.3) * 18, 19, Math.sin(a + 0.3) * 18);
    dungeon.add(stalactite);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), crystalMat);
    crystal.position.set(Math.cos(a + 0.35) * 32, 1.2, Math.sin(a + 0.35) * 32);
    dungeon.add(crystal);
  }

  return dungeon;
}

export function createStationaryTeleporterPadMesh(_label?: string): {
  root: THREE.Group;
  innerRing: THREE.Mesh;
  portalColumn: THREE.Mesh;
  ringMesh: THREE.Mesh;
  crystalMesh: THREE.Mesh;
} {
  const built = createTeleportPlatformMesh(false, 0x33ddff);
  const crystalMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32, 0),
    new THREE.MeshBasicMaterial({ color: 0x66f0ff })
  );
  crystalMesh.position.y = 1.25;
  built.root.add(crystalMesh);
  return {
    root: built.root,
    innerRing: built.runeRing,
    portalColumn: built.vortexColumn,
    ringMesh: built.runeRing,
    crystalMesh,
  };
}

export function createCaveEntranceAndInteriorMesh(
  entrancePos: THREE.Vector3,
  interiorPos: THREE.Vector3
): {
  surfaceEntrance: THREE.Group;
  interiorGroup: THREE.Group;
  interiorSpawnPos: THREE.Vector3;
  exitPortalPos: THREE.Vector3;
  chests: {
    mesh: THREE.Group;
    lidPivot: THREE.Group;
    pos: THREE.Vector3;
    opened: boolean;
  }[];
} {
  const surfaceEntrance = createCaveEntranceMesh();
  surfaceEntrance.position.copy(entrancePos);

  const interiorGroup = createUndergroundCaveDungeon(
    interiorPos.x,
    interiorPos.y,
    interiorPos.z
  );

  // Портал выхода из пещеры наружу
  const exitPortal = createTeleportPlatformMesh(true, 0x44ccff);
  const exitPortalPos = new THREE.Vector3(interiorPos.x, interiorPos.y, interiorPos.z + 15);
  exitPortal.root.position.set(0, 0, 15);
  interiorGroup.add(exitPortal.root);

  const interiorSpawnPos = new THREE.Vector3(interiorPos.x, interiorPos.y, interiorPos.z + 11.5);

  // 3 кованых сундука с оружием, луками, кольцами, зельями и гримуарами внутри пещеры
  const chestCoords: [number, number, number][] = [
    [-9.5, 0, -10.5],
    [0, 0, -14.5],
    [9.5, 0, -10.5],
  ];
  const chests: {
    mesh: THREE.Group;
    lidPivot: THREE.Group;
    pos: THREE.Vector3;
    opened: boolean;
  }[] = [];

  for (const [cx, cy, cz] of chestCoords) {
    const ch = createDungeonTreasureChestMesh(0xffd040);
    ch.root.position.set(cx, cy, cz);
    interiorGroup.add(ch.root);
    chests.push({
      mesh: ch.root,
      lidPivot: ch.lidGroup,
      pos: new THREE.Vector3(interiorPos.x + cx, interiorPos.y + cy, interiorPos.z + cz),
      opened: false,
    });
  }

  return {
    surfaceEntrance,
    interiorGroup,
    interiorSpawnPos,
    exitPortalPos,
    chests,
  };
}

