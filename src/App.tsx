import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { HelpCircle, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { generateProceduralTextures } from './game/textures';
import { GothicSoundEngine, MusicMood } from './game/soundEngine';
import {
  ITEM_CATALOG,
  ELEMENT_INFO,
  MagicElement,
  ALCHEMY_RECIPES,
  createEggNestMesh,
  createTrophyDropMesh,
  createHerbMesh,
  createGrimoireNodeMesh,
  createGroundBirdModel,
  createEquipmentDropMesh,
  createCustomHandWeaponMesh,
  createCustomHandShieldMesh,
  createCustomBowMesh,
  createArrowProjectileMesh,
  createAlchemyCauldronMesh,
  createStationaryTeleporterPadMesh,
  createCaveEntranceAndInteriorMesh,
  createLevitatingFishingRodMesh,
  createElenaRingMesh,
  createFirewoodBundleMesh,
  createSpellOrbMesh,
} from './game/itemsAndMagic';
import {
  createHumanoid,
  createFemaleHumanoid,
  createCharacterNPCSkin,
  createWolfModel,
  createBearModel,
  createSkeletonModel,
  createOrcModel,
  createTrollModel,
  createGolemModel,
  createMedievalHouse,
  createCampfireWithRoastingMeat,
  createForgedSword,
  createHorseModel,
  MedievalHouseInstance,
  EntityRig,
} from './game/models';

// ============================================================
// КОНСТАНТЫ (1-в-1 из Snowball Fight 3D: ACCEL=120, FRICTION=8, maxSpeed=28)
// ============================================================
const WORLD_SIZE = 800;
const WATER_LEVEL = 2.2;
const ACCEL = 120;
const FRICTION = 8;
const WALK_SPEED = 28;
const RUN_SPEED = 40;
const HORSE_WALK = 34;
const HORSE_RUN = 50;
const JUMP_VELOCITY = 11.5;
const GRAVITY = 25;
const COYOTE_TIME = 0.12;
const JUMP_BUFFER = 0.15;

// ============================================================
// МАТЕМАТИКА ЛАНДШАФТА
// ============================================================
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, scale: number): number {
  const sx = x / scale;
  const sy = y / scale;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const fx = sx - x0;
  const fy = sy - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const n00 = noise2D(x0, y0);
  const n10 = noise2D(x0 + 1, y0);
  const n01 = noise2D(x0, y0 + 1);
  const n11 = noise2D(x0 + 1, y0 + 1);
  return (n00 * (1 - ux) + n10 * ux) * (1 - uy) + (n01 * (1 - ux) + n11 * ux) * uy;
}

function getHeight(x: number, z: number): number {
  let h = 0;
  h += smoothNoise(x, z, 220) * 22;
  h += smoothNoise(x, z, 90) * 10;
  h += smoothNoise(x, z, 35) * 4;
  h += smoothNoise(x, z, 12) * 1.2;
  const dc = Math.hypot(x, z);
  h *= Math.min(1, dc / 60);
  if (h < 2) h = 2 - (2 - h) * 0.6;
  return h;
}

// ============================================================
// ДИАЛОГИ И КВЕСТЫ
// ============================================================
interface DialogChoice {
  text: string;
  reply: string;
  quest?: string;
  action?:
    | 'turn_in_ring'
    | 'elena_herb_quest'
    | 'turn_in_firewood'
    | 'turn_in_fishing_rod'
    | 'train_mage_fire'
    | 'train_mage_water'
    | 'train_mage_air'
    | 'train_mage_earth'
    | 'train_mage_necro'
    | 'cobbler_craft'
    | 'cook_feast'
    | 'stablehand_train'
    | 'worker_reward';
}

interface DialogEntry {
  name: string;
  role: string;
  text: string;
  choices: DialogChoice[];
}

const DIALOGS: Record<string, DialogEntry> = {
  elder: {
    name: 'Старейшина Горн',
    role: 'Хранитель деревни',
    text: 'Приветствую тебя, странник. Миртана страдает под гнётом орков и диких тварей.',
    choices: [
      {
        text: 'Кто ты?',
        reply: 'Я старейшина этой деревни. Веду летопись приграничных земель уже сорок зим и помню времена до Великой Войны.',
      },
      {
        text: 'Что происходит в Миртане?',
        reply: 'Орки спустились с горных перевалов, а в лесах расплодились матёрые волки и древние скелеты с проклятыми клинками.',
      },
      {
        text: 'Расскажи о древних гримуарах и магии.',
        reply: 'В сундуках вокруг долины покоятся левитирующие Гримуары пяти стихий. Кто изучит их, обретёт мощь Инноса, Аданоса и Белиара.',
      },
      {
        text: 'Что слышно о Чёрном тролле?',
        reply: 'На дальних скалах бродит исполинский Чёрный тролль. Его шкура крепче стали, но за победу над ним ты прославишься на всю Миртану.',
        quest: 'troll',
      },
      {
        text: '🕳️ Расскажи о подземных пещерах со скелетами и телепортах.',
        reply:
          'В скалах открылись входы в древние Подземные Пещеры Скелетов (Склеп Короля Черепов на севере X:-24, Z:-76 и Катакомбы Теней на юго-востоке X:112, Z:48). Внутри полно скелетов и сундуков с луками, кольцами и гримуарами! А перемещаться между точками карты можно через большие Стационарные Телепорты или Переносимый камень телепортации [T]!',
        quest: 'cave_skeletons',
      },
      {
        text: 'Мне нужна работа.',
        reply: 'Убей пятерых волков в окрестных лесах. Деревня щедро заплатит золотом за безопасность наших пастбищ.',
        quest: 'wolves',
      },
    ],
  },
  smith: {
    name: 'Кузнец Торус',
    role: 'Мастер-оружейник',
    text: 'А, новый боец. Вижу за спиной парные клинки тонкой ковки и охотничий лук. Умеешь обращаться со сталью и тетивой?',
    choices: [
      {
        text: 'Что у тебя в кузнице?',
        reply: 'Рудная сталь из Долины Рудников! Клейморы паладинов, ассасинские катаны, боевые алебарды, луки разных видов и колчаны со стрелами!',
      },
      {
        text: '⚒️ Как сливать однотипное оружие, луки и кольца в одно?',
        reply:
          'Когда у тебя в сумочке [I] есть два одинаковых меча, два однотипных лука, два щита или два магических кольца — нажми «⚒️ Слить ★»! Оружия сольются в одно и прокачаются до ранга ★+1, ★+2 и выше (+35% мощи за каждый ранг)! Попробуй объединить два предмета по моему заданию!',
        quest: 'forge_master',
      },
      {
        text: 'Расскажи о своём ремесле.',
        reply: 'Кую оружие двадцать лет. Пока горит мой горн и звенит наковальня, наша застава не сдастся.',
      },
      {
        text: 'Какое оружие хранится в подземных пещерах со скелетами?',
        reply: 'В подземных пещерах стоят кованые сундуки! В них можно найти Костяной лук Черепов, Эльфийский лук, Орочий роговой лук, редкие кольца и гримуары.',
      },
      {
        text: 'Береги огонь в горне, мастер.',
        reply: 'И ты береги клинок от ржавчины, странник. Пусть твоя сталь всегда будет острой!',
      },
    ],
  },
  trader: {
    name: 'Торговец Хакон',
    role: 'Караванщик из Варанта',
    text: 'Редкие товары с южных берегов! Луки, колчаны стрел, кольца, эликсиры, переносимые телепорты и породистые скакуны!',
    choices: [
      {
        text: 'Откуда держишь путь?',
        reply: 'Из-за золотых песков Варанта через перевалы Миртаны. Дорога опасная, зато товар чистейший.',
      },
      {
        text: 'Чьи это лошади на лугах?',
        reply: 'Вольные скакуны нашего каравана! Можешь оседлать любую клавишей [E], а в их седельные сумки [B] складывать всю военную добычу.',
      },
      {
        text: 'Как работают седельные сумки лошадей?',
        reply: 'У каждой лошади свой собственный багаж до пятисот килограммов! Складывай туда трофеи, мечи, луки и травы, а по свисту [H] скакун примчится к тебе.',
      },
      {
        text: 'Что нового в твоей лавке [M]?',
        reply: 'Привёз охотничьи, эльфийские, орочьи и драконьи луки, колчаны с огненными, ледяными, ядовитыми и взрывными стрелами, магические кольца и Переносимый камень телепортации!',
      },
      {
        text: 'Удачи в торговле, Хакон.',
        reply: 'Да хранит тебя Иннос в пути, и пусть твой кошель всегда полнится золотом!',
      },
    ],
  },
  hunter: {
    name: 'Охотник Ларс',
    role: 'Следопыт и мастер лука',
    text: 'Ступай тише! Видишь цель вдалеке? С хорошим луком и снайперским прицелом ни один хищник или скелет не подойдёт близко.',
    choices: [
      {
        text: '🏹 Как стрелять из лука со снайперским приближением (ПКМ)?',
        reply:
          'Зажми ПРАВУЮ КНОПКУ МЫШИ (ПКМ) — камера приблизится как снайперский прицел с кратностью 2.5x, а время слегка замедлится для точного выстрела! Наведи перекрестие на врага и нажми ЛЕВУЮ КНОПКУ МЫШИ (ЛКМ), чтобы выпустить стрелу! Порази троих врагов из лука по моему заданию!',
        quest: 'archery',
      },
      {
        text: 'Какие виды луков и стрел бывают в Миртане?',
        reply:
          'Четыре вида луков: Охотничий тисовый, Эльфийский, Орочий роговой и Костяной лук Черепов. И пять видов колчанов: Стальные, Огненные, Ядовитые, Ледяные и Взрывные стрелы! Менять их можно в сумочке [I] или клавишей [R].',
      },
      {
        text: 'Какая дичь водится в этих лугах?',
        reply: 'В траве гнездятся золотые фазаны, тетерева и куропатки. Собирай их пятнистые и золотые яйца в гнёздах — они дают огромную силу и ловкость.',
      },
      {
        text: 'Я помогу очистить лес от волков.',
        reply: 'Доброе слово! Истреби пятерых волков — разделим охотничью награду, а их сердца сможешь выгодно продать или сварить в алхимическом котле.',
        quest: 'wolves',
      },
      {
        text: 'Чистой тропы тебе, следопыт.',
        reply: 'Смотри в оба, брат. Держи колчан полным, а тетиву сухой.',
      },
    ],
  },
  guard: {
    name: 'Стражник Диего',
    role: 'Начальник караула',
    text: 'Стой! Кто идёт?.. А, вольный охотник. Проходи, но в деревне сталь без дела не обнажай.',
    choices: [
      {
        text: 'Где стоят орки?',
        reply: 'Разведчики видели их отряды за холмами и у старой тропы. По ночам они подходят к самым сторожевым огням.',
      },
      {
        text: 'Кто ещё угрожает деревне?',
        reply: 'У древних руин поднялись скелеты со щитами. Против них держи дистанцию или используй огненные и молниеносные заклинания.',
      },
      {
        text: 'Я возьмусь за орочьих воинов.',
        reply: 'Смело! Срази троих орков — получишь полновесный мешок золота из казны ополчения и очки обучения.',
        quest: 'orcs',
      },
      {
        text: 'Как лучше подготовиться к бою?',
        reply: 'Не забывай распределять очки навыков в сумочке [I] — прокачивай Силу, Мастерство щита и Высшую регенерацию.',
      },
      {
        text: 'Спокойного дежурства, Диего.',
        reply: 'И тебе не хворать. Держи факелы в виду, когда стемнеет.',
      },
    ],
  },
  healer: {
    name: 'Целительница Елена',
    role: 'Травница и ведунья деревни',
    text: 'Здравствуй, путник. Я собираю целебные травы Миртаны и варю эликсиры по старинным рецептам ордена травников для защитников деревни.',
    choices: [
      {
        text: 'Ты выглядишь встревоженной. Что-то потеряла?',
        reply:
          'Ох, беда! Когда я собирала цветы на южной поляне у деревни, с пальца соскользнуло моё памятное золотое колечко с сапфиром! Найди и верни его мне — щедро награжу монетками и опытом!',
        quest: 'elena_ring',
      },
      {
        text: '💍 [Вернуть колечко] Я нашёл твоё золотое колечко с сапфиром, Елена!',
        reply:
          'Свет Инноса! Моё колечко! Спасибо тебе от всего сердца! Держи обещанные золотые монеты, опыт и мой особый эликсир!',
        action: 'turn_in_ring',
      },
      {
        text: '🌿 [Случайный квест на сбор трав] Какие травы тебе нужны для варки зелий?',
        reply:
          'Для моих алхимических котлов всегда нужны свежие травы! Приноси мне нужный сбор — часть сваренных зелий (как простых до 100%, так и высших эликсиров выше 100%) и звонкие монеты будут твоими!',
        action: 'elena_herb_quest',
      },
      {
        text: 'Чем отличаются твои Высшие эликсиры от Простых зелий?',
        reply:
          'Простые зелья мгновенно пополняют Здоровье, Ману, Силу или Ловкость ровно до 100%. А Высшие эликсиры древних травников фиксированно и НАВСЕГДА поднимают предел ХП, Силы, Маны и Ловкости ВЫШЕ 100%!',
      },
      {
        text: 'Благодарю за мудрый совет, Елена.',
        reply: 'Береги себя в дороге, странник. Пусть свет Инноса согревает твой путь!',
      },
    ],
  },
  woodcutter: {
    name: 'Лесоруб Бром',
    role: 'Мастер костра и лесной повар',
    text: 'Подсаживайся к огню, путник! Чуешь, как шкварчит на вертеле дичь с дымком? Жаль только, сухие поленья почти прогорели.',
    choices: [
      {
        text: 'Тебе помочь с дровами для костра?',
        reply:
          'Вот это по-братски! Собери вокруг костра и опушки леса 3 связки сухих дров, чтобы жар не угас. Щедро отблагодарю звонкими монетами и сочным мясом с вертела!',
        quest: 'firewood',
      },
      {
        text: '🪵 [Отдать дрова для костра] Я принёс сухие дрова для твоего очага, Бром!',
        reply:
          'Ай да выручил! Теперь костёр будет пылать до самого рассвета! Держи заслуженные золотые монетки и горячее мясо прямо с вертела!',
        action: 'turn_in_firewood',
      },
      {
        text: 'Откуда такое сочное мясо на вертеле?',
        reply:
          'Охотник Ларс и путники приносят добычу из чащи. Мы сидим у костра, жарим мясо, беседуем, а иногда прогуливаемся по лесу и снова возвращаемся к огню.',
      },
      {
        text: 'Тёплого огня тебе, Бром.',
        reply: 'Возвращайся к нашему костру в любое время, странник!',
      },
    ],
  },
  fisherman: {
    name: 'Рыбак Фарим',
    role: 'Старый рыболов у костра',
    text: 'Эх, славно потрескивает костёр... Да только без моей любимой удочки мне и рыбалка не в радость!',
    choices: [
      {
        text: 'Что случилось с твоей удочкой, Фарим?',
        reply:
          'Рыбачил я на западном берегу у озера (к западу от лагеря, неподалёку от воды), как вдруг из чащи выскочили медведь и стая волков! Я еле ноги унёс к костру, а свою любимую удочку там обронил!',
        quest: 'fishing_rod',
      },
      {
        text: 'Где именно искать твою удочку?',
        reply:
          'Иди от нашего костра на запад к берегу воды (координаты около X: 14, Z: -18). Там у берега я её и потерял, когда убегал от зверей! Подбери удочку и принеси мне.',
        quest: 'fishing_rod',
      },
      {
        text: '🎣 [Вернуть удочку] Держи свою удочку, Фарим! Я забрал её у зверей!',
        reply:
          'Глазам не верю! Моя родная удочка цела и невредима! Вот тебе кошель золотых монет и почёт за храбрость!',
        action: 'turn_in_fishing_rod',
      },
      {
        text: 'Удачного клёва, Фарим.',
        reply: 'Спасибо, друг! Погреюсь ещё немного у огня и прогуляюсь вдоль опушки.',
      },
    ],
  },
  mage_fire: {
    name: 'Верховный Маг Огня Пирокар',
    role: '🔥 Сообщество Магов Огня • Наставник',
    text: 'Да озарит тебя пламя Инноса, путник! Наше Сообщество Магов Огня хранит карточки Огненных Шаров (Файерболов) и усилители стихий.',
    choices: [
      {
        text: '🔥 [Обучение за 80 монет + Опыт] Обучи меня Магии Огня и дай Карточку Файербола!',
        reply:
          'Прими благословение Огня! Твой уровень Магии Огня повышен, максимальная Мана выросла, а в сумочку добавлена Карточка заклинания «Огненный Шар (Файербол)» и Карта-Усилитель (×2)! Нажми клавишу [1], чтобы метать огненные шары во врагов!',
        action: 'train_mage_fire',
      },
      {
        text: '🃏 Как работают карточки заклинаний атакующих шаров и карточки-усилители?',
        reply:
          'Клавиши [1]–[5] выпускают летящие атакующие шары разных стихий! Одинаковые карточки в сумочке [I] можно СЛИВАТЬ (★), повышая уровень и мощь шара. А если вставить в слот Усилителя «Карту-Усилитель ×2» — ты будешь выпускать сразу по 2 атакующих шара и призывать сразу 2 Големов!',
        quest: 'mage_fireballs',
      },
      {
        text: 'Где найти наставников других сообществ магов?',
        reply:
          'Маг Воды Сатурас живёт в Озёрной деревне «Тихая Заводь» на западе. Маг Земли Торгалор обучает призыву Големов в «Крае Големов» на юго-востоке. А Маг Воздуха Аэрион и Маг Некромагии Ксардас обитают в «Ветреном Приюте» на северо-западе! Ко всем деревням ведут Стационарные Телепорты [T]!',
      },
      {
        text: 'Да не угаснет пламя, мастер Пирокар.',
        reply: 'Ступай с огнём в сердце, ученик!',
      },
    ],
  },
  mage_water: {
    name: 'Верховный Маг Воды Сатурас',
    role: '💧 Круг Магов Воды • Наставник',
    text: 'Равновесие Аданоса хранит нашу Озёрную деревню «Тихая Заводь». Вода исцеляет друзей и сокрушает врагов ледяными шарами.',
    choices: [
      {
        text: '💧 [Обучение за 80 монет + Опыт] Обучи меня Магии Воды и дай Карточку Ледяного Шара!',
        reply:
          'Поток Аданоса наполняет твой дух! Уровень Магии Воды [2] и запас Маны повышены, а в сумочку передана Карточка «Ледяной Шар Воды»!',
        action: 'train_mage_water',
      },
      {
        text: 'Кто живёт в вашей Озёрной деревне?',
        reply:
          'Здесь трудятся мастера Гильдии Ремесленников: Сапожник Криспен шьёт скоростные охотничьи сапоги, а наш Повар Гаспар варит царское жаркое, повышающее здоровье и силу!',
      },
      {
        text: 'Мира твоим водам, Сатурас.',
        reply: 'Пусть течение всегда несёт тебя к победе, странник.',
      },
    ],
  },
  mage_air: {
    name: 'Маг Воздуха Аэрион',
    role: '🌪️ Братство Магов Воздуха • Наставник',
    text: 'Слышишь песнь горных ветров? В «Ветреном Приюте» мы укрощаем ураганы и грозовые сферы небес.',
    choices: [
      {
        text: '🌪️ [Обучение за 80 монет + Опыт] Обучи меня Магии Воздуха и дай Карточку Штормового Шара!',
        reply:
          'Дыхание бури теперь в твоих руках! Магия Воздуха [3] и Ловкость усилены, а в сумочку добавлена Карточка «Штормовой Шар Воздуха» и Карта-Усилитель!',
        action: 'train_mage_air',
      },
      {
        text: 'Чем сильна школа Магии Воздуха?',
        reply:
          'Штормовой шар [3] стремительно летит во врага, взрывается вихрем, отбрасывает противников назад и мгновенно восстанавливает твою выносливость!',
      },
      {
        text: 'Попутного ветра, наставник Аэрион.',
        reply: 'Лети быстрее стрелы, друг мой!',
      },
    ],
  },
  mage_earth: {
    name: 'Маг Земли Торгалор',
    role: '🪨 Орден Магов Земли • Наставник Големов',
    text: 'Приветствую в Каменном Посаде «Край Големов»! Наш Орден Земли владеет древней магией призыва Земляных, Каменных и Стальных Големов!',
    choices: [
      {
        text: '🪨 [Обучение за 90 монет + Опыт] Обучи Магии Земли и дай Карточки Призыва Големов!',
        reply:
          'Мощь земных недр пробудилась в тебе! Ты изучил Магию Земли [4] и получил Карточки Призыва Земляного, Каменного и Стального Големов + Карту-Усилитель ×2! Нажми клавишу [G], чтобы призвать Големов в бой!',
        action: 'train_mage_earth',
        quest: 'summon_golems',
      },
      {
        text: '🗿 Как призвать сразу 2 Големов (Земляного, Каменного или Стального)?',
        reply:
          'Выбери в Сумочке [I] карточку Земляного, Каменного или Стального Голема, а в слот Усилителя вставь «Карту-Усилитель: Двойной Призыв ×2»! Тогда при нажатии клавиши [G] из-под земли поднимутся СРАЗУ 2 МОГУЧИХ ГОЛЕМА и будут крушить всех твоих врагов!',
        quest: 'summon_golems',
      },
      {
        text: 'Крепкой породы тебе, Торгалор.',
        reply: 'Пусть твоя броня будет крепче гранита, а Големы — верными стражами!',
      },
    ],
  },
  mage_necro: {
    name: 'Верховный Некромант Ксардас',
    role: '☠️ Ковен Некромагии и Магии Ядов',
    text: 'Ты не побоялся войти в обитель Некромагии и Ядов... Тьма и яд — грозное оружие в руках того, кто ищет истинную силу.',
    choices: [
      {
        text: '☠️ [Обучение за 90 монет + Опыт] Обучи меня Некромагии и Магии Ядов [5]!',
        reply:
          'Тайны Ковена Некромагии открыты тебе! Твой уровень Магии Ядов [5] и Мана возросли, а в сумочку добавлена Карточка «Шар Чумного Яда» и Карта Призыва Стального Голема!',
        action: 'train_mage_necro',
      },
      {
        text: 'В чём секрет Шара Чумного Яда [5]?',
        reply:
          'Ядовитый шар поражает врагов разъедающим облаком чумы и вытягивает их жизненную силу, исцеляя тебя прямо в разгар битвы!',
      },
      {
        text: 'До встречи в сумерках, Ксардас.',
        reply: 'Иди своим путём, странник. Знание превыше всего.',
      },
    ],
  },
  cobbler: {
    name: 'Сапожник Криспен',
    role: '👢 Гильдия Ремесленников • Мастер обуви',
    text: 'Добро пожаловать в мою мастерскую! Хорошему путнику и следопыту нужны крепкие сапоги, чтобы ноги не знали усталости.',
    choices: [
      {
        text: '👢 [Заказать Сапоги Скорохода] Сшей мне свои лучшие охотничьи сапоги (60 монет или 1 сердце волка)!',
        reply:
          'Вот это заказ по мне! Держи «Сапоги Скорохода Мастера Криспена» — в них твоя скорость бега, ловкость и здоровье сразу вырастут навсегда!',
        action: 'cobbler_craft',
        quest: 'village_artisans',
      },
      {
        text: 'Как живётся ремесленникам в Озёрной деревне?',
        reply:
          'Славно живём под защитой Мага Воды Сатураса! Повар Гаспар кормит всю слободу, а я тачаю сапоги для охотников и магов.',
      },
      {
        text: 'Ровной строчки тебе, мастер Криспен.',
        reply: 'Носи на здоровье, друг! Пусть дороги будут лёгкими!',
      },
    ],
  },
  cook: {
    name: 'Шеф-повар Гаспар',
    role: '🍲 Гильдия Поваров и Тавернщиков',
    text: 'Ух, какой аромат идёт от моего котла! Заходи, путник, отведай настоящего деревенского угощения с пряными травами!',
    choices: [
      {
        text: '🍲 [Отведать Королевское Жаркое] Угости своим фирменным блюдом, шеф Гаспар!',
        reply:
          'Кушай на здоровье, дорогой гость! Моё Королевское Жаркое мгновенно исцеляет все раны и НАВСЕГДА прибавляет богатырское здоровье и силу удара!',
        action: 'cook_feast',
        quest: 'village_artisans',
      },
      {
        text: 'Из чего ты готовишь свои блюда?',
        reply:
          'Из свежей дичи, медвежьей вырезки, лесных яиц и солнечного алоэ! Заглядывай ко мне в любое время.',
      },
      {
        text: 'Спасибо за угощение, Гаспар!',
        reply: 'Всегда рад накормить доброго героя!',
      },
    ],
  },
  stablehand: {
    name: 'Конюх Гюнтер',
    role: '🐴 Гильдия Конюхов и Всадников',
    text: 'Тпру, залётные! Я присматриваю за всеми скакунами заставы и снаряжаю всадников в дальние походы.',
    choices: [
      {
        text: '🐴 [Урок верховой езды и припасы] Подкуй моего скакуна и дай походный запас стрел!',
        reply:
          'Сделано в лучшем виде! Я укрепил твою выносливость, выдал свежий колчан стрел и передал опыт нашей Гильдии Всадников!',
        action: 'stablehand_train',
        quest: 'village_artisans',
      },
      {
        text: 'Как быстро позвать свою лошадь в любой точке карты?',
        reply:
          'Просто свистни клавишей [H] — твой верный скакун тут же примчится к тебе вместе со всеми вещами в седельных сумках [B]!',
      },
      {
        text: 'Добрых скакунов тебе, Гюнтер.',
        reply: 'Держись крепче в седле, всадник!',
      },
    ],
  },
  worker: {
    name: 'Работяга-каменотёс Борк',
    role: '⛏️ Артель Вольных Работяг и Шахтёров',
    text: 'Ух, тяжёлая сегодня смена у скал! Мы добываем гранитные глыбы и железную руду для кузницы и для Големов Мага Торгалора.',
    choices: [
      {
        text: '⛏️ [Помочь работягам] Держи подмогу, Борк! Что интересного находили в породе?',
        reply:
          'Спасибо за уважение к трудовому люду, брат! Вчера в рудной жиле мы откопали древнюю Карту Призыва Каменного Голема и Карту-Усилитель ×2 — забирай их себе по праву защитника!',
        action: 'worker_reward',
        quest: 'village_artisans',
      },
      {
        text: 'Трудно работать рядом с логовом орков и скелетов?',
        reply:
          'Бывало непросто, но когда Маг Земли Торгалор выставил у деревни каменных големов, твари обходят наш Каменный Посад стороной!',
      },
      {
        text: 'Лёгкой кирки тебе, Борк.',
        reply: 'Благодарствую, странник! Заходи к нашему костру после смены.',
      },
    ],
  },
};

// 8 фаз Луны на ночном небе Миртаны
const MOON_PHASES = [
  { id: 0, name: 'Полная луна (Полнолуние)', icon: '🌕', phase: 0.5 },
  { id: 1, name: 'Убывающая луна', icon: '🌖', phase: 0.64 },
  { id: 2, name: 'Последняя четверть', icon: '🌗', phase: 0.75 },
  { id: 3, name: 'Старый серп (Убывающий месяц)', icon: '🌘', phase: 0.86 },
  { id: 4, name: 'Молодой месяц (Растущий серп)', icon: '🌒', phase: 0.14 },
  { id: 5, name: 'Первая четверть (Полумесяц)', icon: '🌓', phase: 0.25 },
  { id: 6, name: 'Растущая луна (Прибывающая)', icon: '🌔', phase: 0.36 },
  { id: 7, name: 'Золотая Мистическая Луна', icon: '🌕✨', phase: 0.5 },
] as const;

interface ElenaProceduralHerbQuest {
  questNum: number;
  herbId: 'herb_sorrel' | 'herb_goblin' | 'herb_nettle' | 'herb_sun_aloe';
  herbName: string;
  herbIcon: string;
  requiredQty: number;
  rewardGold: number;
  rewardXp: number;
  permPotionId: string;
  restorePotionId: string;
}

function generateNextElenaHerbQuest(questNum: number): ElenaProceduralHerbQuest {
  const herbOptions = [
    {
      herbId: 'herb_sorrel' as const,
      herbName: 'Царский щавель',
      herbIcon: '🌺',
      permPotionId: 'potion_perm_hp',
      restorePotionId: 'potion_restore_hp',
    },
    {
      herbId: 'herb_goblin' as const,
      herbName: 'Гоблинская ягода',
      herbIcon: '🫐',
      permPotionId: 'potion_perm_agi',
      restorePotionId: 'potion_restore_agi',
    },
    {
      herbId: 'herb_nettle' as const,
      herbName: 'Огненная крапива',
      herbIcon: '🍁',
      permPotionId: 'potion_perm_mp',
      restorePotionId: 'potion_restore_mp',
    },
    {
      herbId: 'herb_sun_aloe' as const,
      herbName: 'Солнечный алоэ',
      herbIcon: '🌵',
      permPotionId: 'potion_perm_str',
      restorePotionId: 'potion_restore_str',
    },
  ];
  const pick = herbOptions[(questNum - 1 + Math.floor(Math.random() * herbOptions.length)) % herbOptions.length];
  const requiredQty = 1 + (questNum % 2); // 1 или 2 шт. для быстрого и увлекательного выполнения
  const rewardGold = 110 + (questNum % 4) * 25;
  const rewardXp = 140 + (questNum % 3) * 35;
  return {
    questNum,
    herbId: pick.herbId,
    herbName: pick.herbName,
    herbIcon: pick.herbIcon,
    requiredQty,
    rewardGold,
    rewardXp,
    permPotionId: pick.permPotionId,
    restorePotionId: pick.restorePotionId,
  };
}

interface QuestItem {
  id: string;
  text: string;
  target: number;
  current: number;
  done: boolean;
}

interface FloatingDamage {
  id: number;
  value: number;
  x: number;
  y: number;
  isCrit: boolean;
  comboLabel?: string;
}

interface GraphicsSettings {
  presetTime: 'auto' | 'dawn' | 'noon' | 'sunset' | 'night';
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showControlsHelp, setShowControlsHelp] = useState(false);

  // HUD React State
  const [hud, setHud] = useState({
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    stamina: 100,
    maxStamina: 100,
    level: 1,
    xp: 0,
    xpNext: 100,
    gold: 0,
    region: 'Миртана',
    timeString: 'День 1, 06:00',
    comboStep: 0,
    ridingHorseName: null as string | null,
    weaponsDrawn: false,
    musicMood: 'dawn' as MusicMood,
    musicLabel: '🌅 Музыка Утра • Птицы',
    hpBonusPct: 0,
    mpBonusPct: 0,
    agilityBonusPct: 0,
    dmgBonusPct: 0,
    moonPhaseName: '🌕 Полная луна (Полнолуние)',
    sniperAiming: false,
    bowModeActive: false,
    inCaveName: null as string | null,
    arrowCount: 35,
    activeGolemsCount: 0,
  });
  const [levelUpBanner, setLevelUpBanner] = useState<{ level: number; title: string } | null>(null);
  const [elenaHerbQuest, setElenaHerbQuest] = useState<ElenaProceduralHerbQuest>(() =>
    generateNextElenaHerbQuest(1)
  );
  const elenaHerbQuestRef = useRef<ElenaProceduralHerbQuest>(elenaHerbQuest);
  useEffect(() => {
    elenaHerbQuestRef.current = elenaHerbQuest;
  }, [elenaHerbQuest]);
  const inventoryRef = useRef<Record<string, number>>({});
  const handleDialogActionRef = useRef<(action: NonNullable<DialogChoice['action']>) => string | null>(
    () => null
  );
  const cycleMoonPhaseRef = useRef<() => void>(() => {});
  const [soundMuted, setSoundMuted] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.75);
  const [questsCollapsed, setQuestsCollapsed] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [bagTab, setBagTab] = useState<'items' | 'cauldron' | 'teleports' | 'horse' | 'skills'>('items');
  const [bagFilter, setBagFilter] = useState<'all' | 'gear' | 'bows' | 'rings' | 'magic' | 'nature'>('all');
  const [shopOpen, setShopOpen] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({
    herb_sorrel: 2,
    herb_goblin: 2,
    herb_nettle: 1,
    herb_sun_aloe: 1,
    egg_spotted: 1,
    skeleton_sword: 2,
    bow_hunter: 2,
    quiver_iron: 35,
    quiver_fire: 15,
    quiver_ice: 12,
    ring_precision: 1,
    ring_vitality: 1,
    teleport_stone_portable: 1,
    card_fire: 2,
    card_summon_earth_golem: 2,
    card_summon_stone_golem: 1,
    card_summon_steel_golem: 1,
    card_booster_double: 2,
  });
  // Two Worlds: Индивидуальные седельные сумки для КАЖДОЙ лошади (horseId -> { itemId: qty })
  const [selectedHorseId, setSelectedHorseId] = useState<string>('horse_1');
  const [horseBags, setHorseBags] = useState<Record<string, Record<string, number>>>({
    horse_1: {
      herb_sun_aloe: 1,
      egg_golden: 1,
    },
    horse_2: {},
    horse_3: {},
    horse_4: {},
    horse_5: {},
    horse_6: {},
  });
  const [horsesStatus, setHorsesStatus] = useState<
    {
      id: string;
      name: string;
      coatHex: string;
      dist: number;
      isRiding: boolean;
      canAccess: boolean;
    }[]
  >([
    {
      id: 'horse_1',
      name: 'Гнедая (Личный скакун)',
      coatHex: '#8a4a20',
      dist: 0,
      isRiding: false,
      canAccess: true,
    },
    {
      id: 'horse_2',
      name: 'Полевая гнедая',
      coatHex: '#7a4018',
      dist: 45,
      isRiding: false,
      canAccess: false,
    },
    {
      id: 'horse_3',
      name: 'Вороная',
      coatHex: '#1a1015',
      dist: 60,
      isRiding: false,
      canAccess: false,
    },
    {
      id: 'horse_4',
      name: 'Белая',
      coatHex: '#e0d8c8',
      dist: 70,
      isRiding: false,
      canAccess: false,
    },
    {
      id: 'horse_5',
      name: 'Тёмно-гнедая',
      coatHex: '#3a2515',
      dist: 85,
      isRiding: false,
      canAccess: false,
    },
    {
      id: 'horse_6',
      name: 'Серая',
      coatHex: '#707070',
      dist: 95,
      isRiding: false,
      canAccess: false,
    },
  ]);
  const summonSpecificHorseRef = useRef<(horseId: string) => void>(() => {});
  const openHorseBagQuickRef = useRef<() => void>(() => {});
  // Two Worlds: Ранги слияния предметов и магических карт (★ Ур. 1, 2, 3...)
  const [itemRanks, setItemRanks] = useState<Record<string, number>>({});
  const [equippedWeapon, setEquippedWeapon] = useState<string | null>(null);
  const [equippedShield, setEquippedShield] = useState<string | null>(null);
  const [equippedCard, setEquippedCard] = useState<string | null>('card_summon_earth_golem');
  const [equippedBooster, setEquippedBooster] = useState<string | null>('card_booster_double');
  const [equippedBow, setEquippedBow] = useState<string | null>('bow_hunter');
  const [equippedQuiver, setEquippedQuiver] = useState<string | null>('quiver_iron');
  const [equippedRing, setEquippedRing] = useState<string | null>('ring_precision');
  const [bowModeActive, setBowModeActive] = useState<boolean>(false);
  const [sniperAiming, setSniperAiming] = useState<boolean>(false);
  const [bowDrawPower, setBowDrawPower] = useState<number>(0);
  const [insideCaveName, setInsideCaveName] = useState<string | null>(null);
  const [portableBeaconCoords, setPortableBeaconCoords] = useState<{ x: number; z: number } | null>(null);

  // Gothic 3: Очки обучения (LP) и прокачанные навыки
  const [skillPoints, setSkillPoints] = useState(3);
  const [skills, setSkills] = useState({
    strength: 0, // +12% урона в ближнем бою за ранг
    dexterity: 0, // +8% скорости и +7% крит. удара за ранг
    ancientKnowledge: 0, // +20% мощи магии и +25 маны за ранг
    shieldMastery: 0, // +30 HP и +6% блока урона за ранг
    regeneration: 0, // регенерация HP и Маны в бою
  });

  const [magicLevels, setMagicLevels] = useState<Record<MagicElement, number>>({
    fire: 1,
    water: 1,
    air: 1,
    lightning: 1,
    necro: 1,
  });
  const summonGolemRef = useRef<(golemType?: 'earth' | 'stone' | 'steel') => void>(() => {});
  const soundRef = useRef<GothicSoundEngine | null>(null);
  const useItemRef = useRef<(itemId: string) => void>(() => {});
  const mergeItemRef = useRef<(itemId: string) => void>(() => {});
  const mergeAllRef = useRef<() => void>(() => {});
  const equipItemRef = useRef<(itemId: string) => void>(() => {});
  const brewRecipeRef = useRef<(recipeId: string) => void>(() => {});
  const teleportToPadRef = useRef<(padId: string) => void>(() => {});
  const placePortableBeaconRef = useRef<() => void>(() => {});
  const toggleBowModeRef = useRef<() => void>(() => {});
  const cycleQuiverRef = useRef<() => void>(() => {});
  const upgradeSkillRef = useRef<
    (key: 'strength' | 'dexterity' | 'ancientKnowledge' | 'shieldMastery' | 'regeneration') => void
  >(() => {});
  const buyItemRef = useRef<(itemId: string) => void>(() => {});
  const sellItemRef = useRef<(itemId: string) => void>(() => {});
  const castSpellRef = useRef<(el: MagicElement) => void>(() => {});

  const [quests, setQuests] = useState<QuestItem[]>([
    { id: 'firewood', text: '🪵 Дрова для костра Брома', target: 3, current: 0, done: false },
    { id: 'fishing_rod', text: '🎣 Найти удочку рыбака', target: 1, current: 0, done: false },
    { id: 'elena_ring', text: '💍 Найти колечко Елены', target: 1, current: 0, done: false },
    { id: 'elena_herbs', text: '🌿 Сбор трав для зелий Елены (#1)', target: 2, current: 0, done: false },
    { id: 'archery', text: '🏹 Снайпер (ПКМ): поразить 3 врагов из лука', target: 3, current: 0, done: false },
    { id: 'summon_golems', text: '🪨 Магия Земли: призвать 2 Големов с Усилителем [G]', target: 2, current: 0, done: false },
    { id: 'mage_fireballs', text: '🔥 Магия Шаров [1-5]: поразить 3 врагов файерболами', target: 3, current: 0, done: false },
    { id: 'village_artisans', text: '🏘️ Гильдии деревень: посетить магов и мастеров', target: 2, current: 0, done: false },
    { id: 'forge_master', text: '⚒️ Слить 2 одинаковых оружия/лука/карты', target: 1, current: 0, done: false },
    { id: 'alchemy_brew', text: '⚗️ Сварить эликсир в Котле Алхимии [C]', target: 1, current: 0, done: false },
    { id: 'cave_skeletons', text: '🕳️ Скелеты в Подземной Пещере (Ур. 3)', target: 4, current: 0, done: false },
    { id: 'wolves', text: 'Убить 5 волков (Ур. 1)', target: 5, current: 0, done: false },
    { id: 'orcs', text: 'Убить 3 орков (Ур. 3)', target: 3, current: 0, done: false },
    { id: 'troll', text: 'Победить чёрного тролля (Ур. 5)', target: 1, current: 0, done: false },
  ]);

  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  const [logs, setLogs] = useState<string[]>([
    '🌍 Добро пожаловать в Миртану, странник!',
    '⚔️ [F] — достать/убрать мечи в ножны • 🐴 [H] — свистнуть лошади!',
    'WASD — движение, ЛКМ — атака/камера, [E] — сесть на лошадь / говорить.',
  ]);

  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [targetEnemy, setTargetEnemy] = useState<{
    name: string;
    hp: number;
    maxHp: number;
  } | null>(null);
  const [activeDialog, setActiveDialog] = useState<{
    key: string;
    name: string;
    role: string;
    text: string;
    heroPhrase?: string;
    choices: DialogChoice[];
    replied: boolean;
    stepIndex: number;
    visitedIndices: number[];
  } | null>(null);
  const [dialogSpeaker, setDialogSpeaker] = useState<'hero' | 'npc' | 'idle'>('idle');
  const [voiceStatus, setVoiceStatus] = useState<string>(
    '🎙️ Студийный нейро-голос Google Gemini 3.8 (24 кГц)'
  );
  const [damageHitFlash, setDamageHitFlash] = useState(false);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);

  const [gfx, setGfx] = useState<GraphicsSettings>({
    presetTime: 'auto',
  });

  const gfxRef = useRef<GraphicsSettings>(gfx);
  useEffect(() => {
    gfxRef.current = gfx;
  }, [gfx]);

  const dialogOpenRef = useRef(false);
  const bagOpenRef = useRef(false);
  const activeDialogKeyRef = useRef<string | null>(null);
  useEffect(() => {
    dialogOpenRef.current = activeDialog !== null || bagOpen || shopOpen;
    bagOpenRef.current = bagOpen;
    activeDialogKeyRef.current = activeDialog ? activeDialog.key : null;
    if (!activeDialog) {
      soundRef.current?.stopDialogVoice();
    }
  }, [activeDialog, bagOpen, shopOpen]);

  const gameStartedRef = useRef(false);
  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  const isPausedRef = useRef(false);
  useEffect(() => {
    isPausedRef.current = isPaused;
    soundRef.current?.setPaused(isPaused);
  }, [isPaused]);

  const triggerInteractRef = useRef<() => void>(() => {});
  const healPotionRef = useRef<() => void>(() => {});
  const resetToCampRef = useRef<() => void>(() => {});
  const toggleWeaponRef = useRef<() => void>(() => {});
  const whistleHorseRef = useRef<() => void>(() => {});

  const addLogMessage = (msg: string) => {
    setLogs((prev) => [msg, ...prev.slice(0, 2)]);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const textures = generateProceduralTextures();
    const sound = new GothicSoundEngine();
    soundRef.current = sound;

    // ============================================================
    // 1. СЦЕНА, КАМЕРА (FOV 70), ПРЯМОЙ ЧИСТЫЙ WEBGL-РЕНДЕР КАК В v9
    // ============================================================
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1400
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ============================================================
    // 2. НЕБО И ОБЛАКА (Точные цвета и параметры из оригинальной v9)
    // ============================================================
    const skyUniforms = {
      topColor: { value: new THREE.Color(0x3a5a8a) },
      bottomColor: { value: new THREE.Color(0xc0b090) },
      offset: { value: 50 },
      exponent: { value: 0.7 },
    };
    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1200, 32, 16),
        new THREE.ShaderMaterial({
          uniforms: skyUniforms,
          side: THREE.BackSide,
          depthWrite: false,
          vertexShader: `
            varying vec3 vW;
            void main() {
              vec4 wp = modelMatrix * vec4(position, 1.0);
              vW = wp.xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vW;
            void main() {
              float h = normalize(vW + vec3(0.0, offset, 0.0)).y;
              gl_FragColor = vec4(mix(bottomColor, topColor, pow(max(h, 0.0), exponent)), 1.0);
            }
          `,
        })
      )
    );

    const clouds: { mesh: THREE.Mesh; speed: number }[] = [];
    const sharedCloudGeo = new THREE.PlaneGeometry(1, 0.5);
    const sharedCloudMat = new THREE.MeshBasicMaterial({
      map: textures.cloud,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      fog: false,
    });
    for (let i = 0; i < 20; i++) {
      const size = 65 + Math.random() * 80;
      const cloud = new THREE.Mesh(sharedCloudGeo, sharedCloudMat);
      cloud.scale.set(size, size, 1);
      cloud.position.set(
        (Math.random() - 0.5) * 900,
        130 + Math.random() * 40,
        (Math.random() - 0.5) * 900
      );
      cloud.rotation.x = -Math.PI / 2;
      cloud.rotation.z = Math.random() * Math.PI;
      scene.add(cloud);
      clouds.push({ mesh: cloud, speed: 1 + Math.random() * 1.5 });
    }

    // ============================================================
    // 2B. НОЧНОЕ НЕБО: ЗВЁЗДЫ СЛУЧАЙНОГО РАЗМЕРА НА РАЗНЫХ РАССТОЯНИЯХ + ЛУНА В 8 ФАЗАХ
    // ============================================================
    const nightSkyGroup = new THREE.Group();
    scene.add(nightSkyGroup);

    // 4 батч-слоя звёзд разного размера на случайных 3D-расстояниях (4 draw-вызова вместо 360 мешей!)
    interface StarLayer {
      points: THREE.Points;
      mat: THREE.PointsMaterial;
      twinkleSpeed: number;
      twinklePhase: number;
    }
    const starLayers: StarLayer[] = [];
    const starLayerConfigs = [
      { count: 180, size: 1.8, color: 0xffffff, speed: 1.7, phase: 0.0 },
      { count: 120, size: 2.8, color: 0xfff4d8, speed: 2.3, phase: 1.6 },
      { count: 75, size: 3.9, color: 0xd8ecff, speed: 3.1, phase: 3.1 },
      { count: 40, size: 5.2, color: 0xffe4b8, speed: 2.6, phase: 4.7 },
    ];

    for (const cfg of starLayerConfigs) {
      const sGeo = new THREE.BufferGeometry();
      const sPos = new Float32Array(cfg.count * 3);
      for (let i = 0; i < cfg.count; i++) {
        // Случайное расстояние до каждой звезды (от 175 м до 430 м)
        const dist = 175 + Math.random() * 255;
        const az = Math.random() * Math.PI * 2;
        const el = 0.14 + Math.random() * 1.38;
        sPos[i * 3] = Math.cos(el) * Math.cos(az) * dist;
        sPos[i * 3 + 1] = Math.sin(el) * dist;
        sPos[i * 3 + 2] = Math.cos(el) * Math.sin(az) * dist;
      }
      sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
      const mat = new THREE.PointsMaterial({
        color: cfg.color,
        size: cfg.size,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
      });
      const pts = new THREE.Points(sGeo, mat);
      nightSkyGroup.add(pts);
      starLayers.push({
        points: pts,
        mat,
        twinkleSpeed: cfg.speed,
        twinklePhase: cfg.phase,
      });
    }

    // 🌙 ЛУНА С ПРОЦЕДУРНОЙ ОТРИСОВКОЙ ФАЗ (Предрасчёт кратеров 96x96 — мгновенный старт!)
    const moonCanvas = document.createElement('canvas');
    const moonW = 96;
    const moonCx = 48;
    const moonCy = 48;
    const moonR = 32;
    moonCanvas.width = moonW;
    moonCanvas.height = moonW;
    const moonCtx = moonCanvas.getContext('2d')!;
    const moonTexture = new THREE.CanvasTexture(moonCanvas);
    let currentMoonPhaseIdx = 0;
    let moonPhaseAutoTimer = 0;

    // Предварительно вычисляем карту кратеров Луны один раз при старте
    const moonCraterMap = new Float32Array(moonW * moonW);
    for (let py = moonCy - moonR; py <= moonCy + moonR; py++) {
      for (let px = moonCx - moonR; px <= moonCx + moonR; px++) {
        const dx = (px - moonCx) / moonR;
        const dy = (py - moonCy) / moonR;
        if (dx * dx + dy * dy <= 1) {
          const n1 = smoothNoise(px * 2 + 40, py * 2 + 20, 26);
          const n2 = smoothNoise(px * 4.2, py * 4.2, 12);
          moonCraterMap[py * moonW + px] = 0.84 + n1 * 0.14 + n2 * 0.08;
        }
      }
    }

    function renderMoonPhaseToCanvas(phaseIdx: number) {
      const pInfo = MOON_PHASES[phaseIdx % MOON_PHASES.length];
      const phase = pInfo.phase;
      const isMysticGold = pInfo.id === 7;

      moonCtx.clearRect(0, 0, moonW, moonW);

      // Мягкий лунный ореол вокруг диска
      const haloGrad = moonCtx.createRadialGradient(
        moonCx,
        moonCy,
        moonR * 0.65,
        moonCx,
        moonCy,
        moonR * 1.48
      );
      haloGrad.addColorStop(
        0,
        isMysticGold ? 'rgba(255,215,120,0.42)' : 'rgba(220,235,255,0.38)'
      );
      haloGrad.addColorStop(
        0.55,
        isMysticGold ? 'rgba(255,190,80,0.14)' : 'rgba(180,210,255,0.12)'
      );
      haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      moonCtx.fillStyle = haloGrad;
      moonCtx.beginPath();
      moonCtx.arc(moonCx, moonCy, moonR * 1.48, 0, Math.PI * 2);
      moonCtx.fill();

      // Быстрая сферическая модель освещения Луны по готовой карте кратеров
      const imgData = moonCtx.getImageData(0, 0, moonW, moonW);
      const data = imgData.data;
      const theta = (phase - 0.5) * Math.PI * 2;
      const sunDirX = Math.sin(theta);
      const sunDirZ = Math.cos(theta);

      for (let py = moonCy - moonR; py <= moonCy + moonR; py++) {
        for (let px = moonCx - moonR; px <= moonCx + moonR; px++) {
          const dx = (px - moonCx) / moonR;
          const dy = (py - moonCy) / moonR;
          const r2 = dx * dx + dy * dy;
          if (r2 > 1) continue;
          const dz = Math.sqrt(1 - r2);
          const crater = moonCraterMap[py * moonW + px];

          const dot = dx * sunDirX + dz * sunDirZ;
          const terminator = Math.max(0, Math.min(1, (dot + 0.06) / 0.14));
          const limb = 0.72 + 0.28 * Math.pow(dz, 0.45);

          const idx = (py * moonW + px) * 4;
          if (terminator > 0.01) {
            const lit = terminator * crater * limb;
            const baseR = isMysticGold ? 255 : 248;
            const baseG = isMysticGold ? 222 : 242;
            const baseB = isMysticGold ? 155 : 222;
            data[idx] = Math.min(255, Math.round(24 + baseR * lit));
            data[idx + 1] = Math.min(255, Math.round(30 + baseG * lit));
            data[idx + 2] = Math.min(255, Math.round(46 + baseB * lit));
            data[idx + 3] = 255;
          } else {
            data[idx] = Math.round(22 * crater);
            data[idx + 1] = Math.round(30 * crater);
            data[idx + 2] = Math.round(48 * crater);
            data[idx + 3] = 135;
          }
        }
      }
      moonCtx.putImageData(imgData, 0, 0);
      moonTexture.needsUpdate = true;
    }

    renderMoonPhaseToCanvas(currentMoonPhaseIdx);

    const moonMat = new THREE.SpriteMaterial({
      map: moonTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    const moonSprite = new THREE.Sprite(moonMat);
    moonSprite.scale.set(46, 46, 1);
    nightSkyGroup.add(moonSprite);

    cycleMoonPhaseRef.current = () => {
      currentMoonPhaseIdx = (currentMoonPhaseIdx + 1) % MOON_PHASES.length;
      renderMoonPhaseToCanvas(currentMoonPhaseIdx);
      const pInfo = MOON_PHASES[currentMoonPhaseIdx];
      addLogMessage(`🌙 Фаза луны на небе: ${pInfo.icon} ${pInfo.name}`);
    };

    // 🐦 ПТИЦЫ В НЕБЕ (Общие геометрии как в Снеговичках — нулевая нагрузка на память)
    interface SkyBird {
      group: THREE.Group;
      wingL: THREE.Group;
      wingR: THREE.Group;
      centerX: number;
      centerZ: number;
      radius: number;
      alt: number;
      angle: number;
      speed: number;
      flapPhase: number;
    }
    const birds: SkyBird[] = [];
    const birdMat = new THREE.MeshStandardMaterial({ color: 0x2c241d, roughness: 0.85 });
    const birdBellyMat = new THREE.MeshStandardMaterial({ color: 0xd8cbb8, roughness: 0.9 });
    const sharedBirdBodyGeo = new THREE.ConeGeometry(0.18, 0.75, 5);
    const sharedBirdBellyGeo = new THREE.SphereGeometry(0.15, 5, 4);
    const sharedBirdTailGeo = new THREE.ConeGeometry(0.22, 0.35, 3);
    const sharedBirdWingGeo = new THREE.BoxGeometry(0.75, 0.04, 0.28);

    for (let i = 0; i < 16; i++) {
      const bg = new THREE.Group();
      const body = new THREE.Mesh(sharedBirdBodyGeo, birdMat);
      body.rotation.x = Math.PI / 2;
      bg.add(body);

      const belly = new THREE.Mesh(sharedBirdBellyGeo, birdBellyMat);
      belly.scale.set(0.9, 0.6, 1.6);
      belly.position.y = -0.05;
      bg.add(belly);

      const tail = new THREE.Mesh(sharedBirdTailGeo, birdMat);
      tail.rotation.x = -Math.PI / 2;
      tail.scale.y = 0.25;
      tail.position.z = -0.45;
      bg.add(tail);

      const wingL = new THREE.Group();
      const wingLMesh = new THREE.Mesh(sharedBirdWingGeo, birdMat);
      wingLMesh.position.x = 0.36;
      wingL.add(wingLMesh);
      bg.add(wingL);

      const wingR = new THREE.Group();
      const wingRMesh = new THREE.Mesh(sharedBirdWingGeo, birdMat);
      wingRMesh.position.x = -0.36;
      wingR.add(wingRMesh);
      bg.add(wingR);

      const flockCenterX = i < 8 ? 65 + (Math.random() - 0.5) * 90 : (Math.random() - 0.5) * 280;
      const flockCenterZ = i < 8 ? -45 + (Math.random() - 0.5) * 90 : (Math.random() - 0.5) * 280;
      const radius = 14 + Math.random() * 28;
      const alt = Math.max(WATER_LEVEL + 12, getHeight(flockCenterX, flockCenterZ) + 12 + Math.random() * 14);
      const angle = Math.random() * Math.PI * 2;

      bg.position.set(
        flockCenterX + Math.cos(angle) * radius,
        alt,
        flockCenterZ + Math.sin(angle) * radius
      );
      scene.add(bg);
      birds.push({
        group: bg,
        wingL,
        wingR,
        centerX: flockCenterX,
        centerZ: flockCenterZ,
        radius,
        alt,
        angle,
        speed: 0.45 + Math.random() * 0.35,
        flapPhase: Math.random() * Math.PI * 2,
      });
    }

    // ============================================================
    // 3. СВЕТ (Оптимизированная карта теней 1024x1024 как в Снеговичках — в 4 раза быстрее!)
    // ============================================================
    const ambient = new THREE.AmbientLight(0xa89878, 0.5);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0xc0d0e0, 0x504030, 0.5);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0d0, 1.2);
    sun.position.set(100, 200, 100);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 360;
    sun.shadow.camera.left = -55;
    sun.shadow.camera.right = 55;
    sun.shadow.camera.top = 55;
    sun.shadow.camera.bottom = -55;
    sun.shadow.bias = -0.0006;
    scene.add(sun);
    scene.add(sun.target);

    // ============================================================
    // 4. ЛАНДШАФТ, РАЗНООБРАЗНАЯ ПОВЕРХНОСТЬ ЗЕМЛИ И РАЗНОРАЗМЕРНАЯ 3D-ТРАВА (InstancedMesh — 60 FPS и мгновенная загрузка!)
    // ============================================================
    const seg = 72;
    const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, seg, seg);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    const uvAttr = terrainGeo.attributes.uv;
    for (let i = 0; i < uvAttr.count; i++) {
      uvAttr.setXY(i, uvAttr.getX(i) * 55, uvAttr.getY(i) * 55);
    }
    const colors = new Float32Array(pos.count * 3);

    const cG = new THREE.Color(0x4e7a34); // Сочная луговая трава
    const cG2 = new THREE.Color(0x6c9042); // Солнечная золотисто-зелёная поляна
    const cClover = new THREE.Color(0x3b682c); // Клевер и густой дёрн
    const cPath = new THREE.Color(0x8c7656); // Утоптанная лесная тропинка и деревенская земля
    const cR = new THREE.Color(0x6e6c5e); // Каменистый склон
    const cS = new THREE.Color(0xc8b080); // Песчаный берег
    const cF = new THREE.Color(0x2d4e22); // Тёмный лесной мох и хвоя
    const cM = new THREE.Color(0x8e8c7e); // Горная порода
    const tmpColor = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = getHeight(x, z);
      pos.setY(i, h);

      const distVillage = Math.hypot(x - 80, z - -60);
      const distCamp = Math.hypot(x - 56, z - -40);
      const microPatch = smoothNoise(x + 120, z - 85, 7);
      const medPatch = smoothNoise(x, z, 18);

      if (h < 3.1) {
        tmpColor.copy(cS).lerp(cPath, microPatch * 0.35);
      } else if (h > 30) {
        tmpColor.copy(cM);
      } else if (h > 21) {
        tmpColor.copy(cR).lerp(cM, (h - 21) / 9);
      } else if (distVillage < 25 || distCamp < 9) {
        // Уютные утоптанные тропинки и площадки в деревне и у костра, перемежающиеся травой
        const pathBlend = Math.max(
          0,
          Math.min(1, (1 - distVillage / 25) * 0.65 + (1 - Math.min(1, distCamp / 9)) * 0.7)
        );
        tmpColor.copy(cG).lerp(cPath, pathBlend * (0.55 + microPatch * 0.45));
      } else {
        const fn = smoothNoise(x, z, 40);
        if (fn > 0.56) {
          tmpColor.copy(cF).lerp(cClover, microPatch * 0.45);
        } else if (microPatch > 0.66) {
          tmpColor.copy(cG2).lerp(cPath, (microPatch - 0.66) * 0.65);
        } else if (microPatch < 0.32) {
          tmpColor.copy(cClover).lerp(cG, medPatch);
        } else {
          tmpColor.copy(cG).lerp(cG2, medPatch);
        }
      }
      tmpColor.multiplyScalar(0.84 + noise2D(x * 1.3, z * 1.3) * 0.32);
      const idx = i * 3;
      colors[idx] = tmpColor.r;
      colors[idx] = Math.min(1, Math.max(0, colors[idx]));
      colors[idx + 1] = Math.min(1, Math.max(0, tmpColor.g));
      colors[idx + 2] = Math.min(1, Math.max(0, tmpColor.b));
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMesh = new THREE.Mesh(
      terrainGeo,
      new THREE.MeshStandardMaterial({
        map: textures.terrainGround,
        bumpMap: textures.terrainBump,
        bumpScale: 0.28,
        vertexColors: true,
        roughness: 0.94,
      })
    );
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 🌿 ЖИВАЯ ПОВЕРХНОСТЬ ЗЕМЛИ: 4 слоя разноразмерных травинок, клевера, папоротника и полевых цветов!
    // Используем InstancedMesh (всего 4 draw-вызова на видеокарту для 4200 пучков — 0 нагрузки на FPS и мгновенная загрузка!)
    {
      const dummy = new THREE.Object3D();
      const instColor = new THREE.Color();

      // 1) Скрещенные пучки низкой и средней луговой травы разного размера
      const shortBlade1 = new THREE.ConeGeometry(0.16, 0.52, 3);
      shortBlade1.translate(0, 0.24, 0);
      const shortGrassMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        flatShading: true,
      });
      const shortGrassCount = 650;
      const shortGrassInst = new THREE.InstancedMesh(shortBlade1, shortGrassMat, shortGrassCount);
      shortGrassInst.receiveShadow = true;

      const grassPalette = [
        0x3d6e28, 0x4e8232, 0x62943a, 0x769a3e, 0x345e24, 0x869844, 0x44762e,
      ];
      let placedShort = 0;
      for (let i = 0; i < shortGrassCount * 1.6 && placedShort < shortGrassCount; i++) {
        const r = 8 + Math.pow(Math.random(), 0.72) * 320;
        const a = Math.random() * Math.PI * 2;
        const gx = Math.cos(a) * r;
        const gz = Math.sin(a) * r;
        const gh = getHeight(gx, gz);
        if (gh < WATER_LEVEL + 0.6 || gh > 24) continue;
        // Разный размер каждой травинки (и по ширине, и по высоте!)
        const sx = 0.55 + Math.random() * 1.35;
        const sy = 0.4 + Math.random() * 1.65;
        const sz = 0.55 + Math.random() * 1.35;
        dummy.position.set(gx, gh - 0.03, gz);
        dummy.rotation.set(
          (Math.random() - 0.5) * 0.32,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.32
        );
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        shortGrassInst.setMatrixAt(placedShort, dummy.matrix);
        instColor
          .setHex(grassPalette[placedShort % grassPalette.length])
          .multiplyScalar(0.82 + Math.random() * 0.34);
        shortGrassInst.setColorAt(placedShort, instColor);
        placedShort++;
      }
      shortGrassInst.count = placedShort;
      shortGrassInst.instanceMatrix.needsUpdate = true;
      if (shortGrassInst.instanceColor) shortGrassInst.instanceColor.needsUpdate = true;
      scene.add(shortGrassInst);

      // 2) Высокие стебли дикой степной травы и камыша (тонкие, изогнутые, разной высоты)
      const tallStalkGeo = new THREE.ConeGeometry(0.11, 0.95, 4);
      tallStalkGeo.translate(0, 0.45, 0);
      const tallGrassMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.88,
        flatShading: true,
      });
      const tallGrassCount = 320;
      const tallGrassInst = new THREE.InstancedMesh(tallStalkGeo, tallGrassMat, tallGrassCount);
      let placedTall = 0;
      const tallPalette = [0x588834, 0x7c9c44, 0x98a44c, 0x42722a, 0x6a903a];
      for (let i = 0; i < tallGrassCount * 1.6 && placedTall < tallGrassCount; i++) {
        const r = 10 + Math.pow(Math.random(), 0.75) * 310;
        const a = Math.random() * Math.PI * 2;
        const gx = Math.cos(a) * r;
        const gz = Math.sin(a) * r;
        const gh = getHeight(gx, gz);
        if (gh < WATER_LEVEL + 0.35 || gh > 21) continue;
        const sy = 0.65 + Math.random() * 1.55;
        const sxz = 0.6 + Math.random() * 1.1;
        dummy.position.set(gx, gh - 0.04, gz);
        dummy.rotation.set(
          (Math.random() - 0.5) * 0.42,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.42
        );
        dummy.scale.set(sxz, sy, sxz);
        dummy.updateMatrix();
        tallGrassInst.setMatrixAt(placedTall, dummy.matrix);
        instColor
          .setHex(tallPalette[placedTall % tallPalette.length])
          .multiplyScalar(0.85 + Math.random() * 0.3);
        tallGrassInst.setColorAt(placedTall, instColor);
        placedTall++;
      }
      tallGrassInst.count = placedTall;
      tallGrassInst.instanceMatrix.needsUpdate = true;
      if (tallGrassInst.instanceColor) tallGrassInst.instanceColor.needsUpdate = true;
      scene.add(tallGrassInst);

      // 3) Приземистые кочки клевера, лесного мха и широких листьев папоротника
      const cloverGeo = new THREE.DodecahedronGeometry(0.26, 0);
      cloverGeo.scale(1.4, 0.36, 1.4);
      const cloverMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.95,
        flatShading: true,
      });
      const cloverCount = 240;
      const cloverInst = new THREE.InstancedMesh(cloverGeo, cloverMat, cloverCount);
      let placedClover = 0;
      const cloverPalette = [0x2e5c20, 0x3e702a, 0x4f7e32, 0x5c6e34, 0x366428];
      for (let i = 0; i < cloverCount * 1.6 && placedClover < cloverCount; i++) {
        const r = 6 + Math.pow(Math.random(), 0.72) * 300;
        const a = Math.random() * Math.PI * 2;
        const gx = Math.cos(a) * r;
        const gz = Math.sin(a) * r;
        const gh = getHeight(gx, gz);
        if (gh < WATER_LEVEL + 0.5 || gh > 26) continue;
        const sc = 0.55 + Math.random() * 1.55;
        dummy.position.set(gx, gh + 0.02, gz);
        dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
        dummy.scale.set(sc, 0.65 + Math.random() * 0.9, sc * (0.8 + Math.random() * 0.4));
        dummy.updateMatrix();
        cloverInst.setMatrixAt(placedClover, dummy.matrix);
        instColor
          .setHex(cloverPalette[placedClover % cloverPalette.length])
          .multiplyScalar(0.84 + Math.random() * 0.32);
        cloverInst.setColorAt(placedClover, instColor);
        placedClover++;
      }
      cloverInst.count = placedClover;
      cloverInst.instanceMatrix.needsUpdate = true;
      if (cloverInst.instanceColor) cloverInst.instanceColor.needsUpdate = true;
      scene.add(cloverInst);

      // 4) Полевые цветы, вереск и мелкие камешки-галька на земле
      const flowerGeo = new THREE.OctahedronGeometry(0.11, 0);
      const flowerMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.75,
        flatShading: true,
      });
      const flowerCount = 180;
      const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
      let placedFlower = 0;
      const flowerPalette = [
        0xffdc48, // Лютики золотистые
        0x68a8ff, // Васильки лазурные
        0xf2789f, // Дикий клевер розовый
        0xb878f0, // Лесной вереск фиолетовый
        0xfff2d6, // Ромашки луговые
        0x8a867c, // Светлый полевой голыш
        0x6c685e, // Тёмный речной камень
      ];
      for (let i = 0; i < flowerCount * 1.6 && placedFlower < flowerCount; i++) {
        const r = 6 + Math.pow(Math.random(), 0.72) * 290;
        const a = Math.random() * Math.PI * 2;
        const gx = Math.cos(a) * r;
        const gz = Math.sin(a) * r;
        const gh = getHeight(gx, gz);
        if (gh < WATER_LEVEL + 0.5 || gh > 25) continue;
        const isPebble = placedFlower % 7 >= 5;
        const sc = isPebble ? 0.9 + Math.random() * 1.4 : 0.65 + Math.random() * 1.15;
        dummy.position.set(gx, gh + (isPebble ? 0.04 : 0.18 + Math.random() * 0.22), gz);
        dummy.rotation.set(Math.random() * 2, Math.random() * 3, Math.random() * 2);
        dummy.scale.set(sc, isPebble ? sc * 0.55 : sc, sc);
        dummy.updateMatrix();
        flowerInst.setMatrixAt(placedFlower, dummy.matrix);
        instColor.setHex(flowerPalette[placedFlower % flowerPalette.length]);
        flowerInst.setColorAt(placedFlower, instColor);
        placedFlower++;
      }
      flowerInst.count = placedFlower;
      flowerInst.instanceMatrix.needsUpdate = true;
      if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
      scene.add(flowerInst);
    }

    const wGeo = new THREE.PlaneGeometry(WORLD_SIZE * 1.4, WORLD_SIZE * 1.4, 16, 16);
    wGeo.rotateX(-Math.PI / 2);
    const wMat = new THREE.MeshStandardMaterial({
      color: 0x2a5a8a,
      transparent: true,
      opacity: 0.7,
      roughness: 0.15,
      metalness: 0.4,
    });
    const waterMesh = new THREE.Mesh(wGeo, wMat);
    waterMesh.position.y = WATER_LEVEL;
    scene.add(waterMesh);

    // ============================================================
    // 5. РАСТИТЕЛЬНОСТЬ (4 породы деревьев, 4 типа скал/камней, 3 вида кустов — общие геометрии, 60 FPS!)
    // ============================================================
    const obstacles: { x: number; z: number; r: number }[] = [];
    const torchLights: THREE.PointLight[] = [];

    // 🌳 Общие геометрии и материалы для 4 разных видов деревьев (Дуб, Сосна/Ель, Берёза, Древний Бук)
    const sharedOakTrunkGeo = new THREE.CylinderGeometry(0.38, 0.68, 4.2, 7);
    const sharedPineTrunkGeo = new THREE.CylinderGeometry(0.24, 0.48, 5.4, 6);
    const sharedBirchTrunkGeo = new THREE.CylinderGeometry(0.2, 0.34, 4.8, 6);
    const sharedBranchGeo = new THREE.CylinderGeometry(0.08, 0.16, 1.8, 5);
    const sharedRootGeo = new THREE.ConeGeometry(0.28, 1.2, 5);

    const sharedDarkBarkMat = new THREE.MeshStandardMaterial({
      color: 0x3b2616,
      map: textures.bark,
      roughness: 0.98,
    });
    const sharedPineBarkMat = new THREE.MeshStandardMaterial({
      color: 0x4c2e1b,
      map: textures.bark,
      roughness: 0.96,
    });
    const sharedBirchBarkMat = new THREE.MeshStandardMaterial({
      color: 0xdcd6c8,
      map: textures.bark,
      roughness: 0.85,
    });
    const sharedMossBarkMat = new THREE.MeshStandardMaterial({
      color: 0x343822,
      map: textures.bark,
      roughness: 0.98,
    });

    const sharedOakLeafMat = new THREE.MeshStandardMaterial({
      color: 0x2e5822,
      roughness: 0.95,
      flatShading: true,
    });
    const sharedPineLeafMat = new THREE.MeshStandardMaterial({
      color: 0x1d4020,
      roughness: 0.92,
      flatShading: true,
    });
    const sharedBirchLeafMat = new THREE.MeshStandardMaterial({
      color: 0x688c2e,
      roughness: 0.9,
      flatShading: true,
    });
    const sharedAutumnLeafMat = new THREE.MeshStandardMaterial({
      color: 0x8c6424,
      roughness: 0.92,
      flatShading: true,
    });

    const sharedOakLeafGeos = [
      new THREE.DodecahedronGeometry(2.15, 1),
      new THREE.DodecahedronGeometry(2.55, 1),
      new THREE.DodecahedronGeometry(1.85, 1),
    ];
    const sharedPineConeGeos = [
      new THREE.ConeGeometry(2.55, 3.2, 7),
      new THREE.ConeGeometry(2.05, 2.8, 7),
      new THREE.ConeGeometry(1.45, 2.3, 7),
    ];
    const sharedBirchLeafGeo = new THREE.IcosahedronGeometry(1.55, 1);

    // 🪨 Общие геометрии и материалы для 4 разных типов камней и валунов
    const sharedGraniteGeo = new THREE.DodecahedronGeometry(1.55, 0);
    const sharedMonolithGeo = new THREE.OctahedronGeometry(1.4, 0);
    const sharedSlateGeo = new THREE.BoxGeometry(2.3, 0.85, 1.75);
    const sharedCobbleGeo = new THREE.IcosahedronGeometry(0.95, 0);

    const sharedGraniteMat = new THREE.MeshStandardMaterial({
      color: 0x767468,
      roughness: 0.96,
      flatShading: true,
    });
    const sharedDarkBasaltMat = new THREE.MeshStandardMaterial({
      color: 0x4c5056,
      roughness: 0.92,
      flatShading: true,
    });
    const sharedSandstoneMat = new THREE.MeshStandardMaterial({
      color: 0x8e7c62,
      roughness: 0.95,
      flatShading: true,
    });
    const sharedMossCapMat = new THREE.MeshStandardMaterial({
      color: 0x3b6228,
      roughness: 0.98,
      flatShading: true,
    });

    const sharedBushGeo = new THREE.DodecahedronGeometry(0.95, 1);
    const sharedBushMat1 = new THREE.MeshStandardMaterial({
      color: 0x386226,
      roughness: 0.95,
      flatShading: true,
    });
    const sharedBushMat2 = new THREE.MeshStandardMaterial({
      color: 0x4c742c,
      roughness: 0.95,
      flatShading: true,
    });
    const sharedBerryGeo = new THREE.SphereGeometry(0.11, 5, 4);
    const sharedBerryMat = new THREE.MeshStandardMaterial({ color: 0xc82828, roughness: 0.5 });

    let treeCounter = 0;
    function createTree(x: number, z: number) {
      const g = new THREE.Group();
      const h = getHeight(x, z);
      const species = treeCounter++ % 4;

      if (species === 0) {
        // 1) Могучий раскидистый миртанский дуб с корнями и сучьями
        const trunk = new THREE.Mesh(sharedOakTrunkGeo, sharedDarkBarkMat);
        trunk.position.y = 2.0;
        trunk.castShadow = true;
        g.add(trunk);

        for (let r = 0; r < 3; r++) {
          const root = new THREE.Mesh(sharedRootGeo, sharedDarkBarkMat);
          const ra = (r / 3) * Math.PI * 2 + 0.4;
          root.position.set(Math.cos(ra) * 0.48, 0.42, Math.sin(ra) * 0.48);
          root.rotation.z = -Math.cos(ra) * 0.45;
          root.rotation.x = Math.sin(ra) * 0.45;
          g.add(root);
        }

        const b1 = new THREE.Mesh(sharedBranchGeo, sharedDarkBarkMat);
        b1.position.set(0.65, 3.4, 0.2);
        b1.rotation.z = -0.65;
        g.add(b1);

        for (let i = 0; i < 3; i++) {
          const leaf = new THREE.Mesh(sharedOakLeafGeos[i], sharedOakLeafMat);
          leaf.position.set(
            (i === 1 ? 0.9 : i === 2 ? -0.8 : 0) + (Math.random() - 0.5) * 0.6,
            4.3 + i * 0.72,
            (Math.random() - 0.5) * 0.9
          );
          leaf.scale.set(1.15, 0.85, 1.12);
          if (i === 0) leaf.castShadow = true;
          g.add(leaf);
        }
      } else if (species === 1) {
        // 2) Высокая северная ель / сосна с многоярусной конической хвоей
        const trunk = new THREE.Mesh(sharedPineTrunkGeo, sharedPineBarkMat);
        trunk.position.y = 2.6;
        trunk.castShadow = true;
        g.add(trunk);

        for (let i = 0; i < 3; i++) {
          const cone = new THREE.Mesh(sharedPineConeGeos[i], sharedPineLeafMat);
          cone.position.y = 3.2 + i * 1.65;
          cone.rotation.y = i * 1.1;
          if (i === 0) cone.castShadow = true;
          g.add(cone);
        }
      } else if (species === 2) {
        // 3) Стройная белая берёза с раздвоенной вершиной и светло-изумрудной листвой
        const trunk = new THREE.Mesh(sharedBirchTrunkGeo, sharedBirchBarkMat);
        trunk.position.y = 2.35;
        trunk.rotation.z = 0.05;
        trunk.castShadow = true;
        g.add(trunk);

        const twig = new THREE.Mesh(sharedBranchGeo, sharedBirchBarkMat);
        twig.position.set(-0.42, 3.6, 0.15);
        twig.rotation.z = 0.52;
        g.add(twig);

        for (let i = 0; i < 3; i++) {
          const leaf = new THREE.Mesh(sharedBirchLeafGeo, sharedBirchLeafMat);
          leaf.position.set(
            (i - 1) * 0.75,
            4.2 + (i % 2) * 0.85,
            (Math.random() - 0.5) * 0.7
          );
          leaf.scale.set(0.95, 1.18, 0.95);
          if (i === 0) leaf.castShadow = true;
          g.add(leaf);
        }
      } else {
        // 4) Древний кряжистый золотисто-зелёный бук со мшистым стволом
        const trunk = new THREE.Mesh(sharedOakTrunkGeo, sharedMossBarkMat);
        trunk.position.y = 1.9;
        trunk.scale.set(1.22, 0.92, 1.15);
        trunk.castShadow = true;
        g.add(trunk);

        for (let i = 0; i < 3; i++) {
          const mat = i === 2 ? sharedAutumnLeafMat : sharedOakLeafMat;
          const leaf = new THREE.Mesh(sharedOakLeafGeos[i], mat);
          leaf.position.set(
            (Math.random() - 0.5) * 1.6,
            4.1 + i * 0.65,
            (Math.random() - 0.5) * 1.6
          );
          leaf.scale.set(1.25, 0.76, 1.25);
          if (i === 0) leaf.castShadow = true;
          g.add(leaf);
        }
      }

      g.position.set(x, h, z);
      g.rotation.y = Math.random() * Math.PI * 2;
      const s = 0.75 + Math.random() * 0.72;
      g.scale.setScalar(s);
      scene.add(g);
      obstacles.push({ x, z, r: 0.9 * s });
    }

    let rockCounter = 0;
    function createRock(x: number, z: number) {
      const h = getHeight(x, z);
      const rg = new THREE.Group();
      const rockType = rockCounter++ % 4;
      const rs = 0.75 + Math.random() * 0.75;

      if (rockType === 0) {
        // 1) Крупный гранитный валун с шапкой лесного мха и малым камнем рядом
        const mainRock = new THREE.Mesh(sharedGraniteGeo, sharedGraniteMat);
        mainRock.position.y = 0.45;
        mainRock.scale.set(1.15, 0.82, 1.05);
        mainRock.rotation.set(0.3, 0.8, 0.2);
        mainRock.castShadow = true;
        rg.add(mainRock);

        const mossCap = new THREE.Mesh(sharedCobbleGeo, sharedMossCapMat);
        mossCap.position.set(0.08, 0.95, -0.05);
        mossCap.scale.set(1.05, 0.35, 0.95);
        rg.add(mossCap);

        const sideStone = new THREE.Mesh(sharedCobbleGeo, sharedGraniteMat);
        sideStone.position.set(1.25, 0.22, 0.45);
        sideStone.scale.set(0.65, 0.5, 0.6);
        rg.add(sideStone);
      } else if (rockType === 1) {
        // 2) Остроконечный тёмный базальтовый монолит (менгир) из двух скальных зубцов
        const spire1 = new THREE.Mesh(sharedMonolithGeo, sharedDarkBasaltMat);
        spire1.position.y = 1.05;
        spire1.scale.set(0.78, 1.65, 0.72);
        spire1.rotation.z = 0.12;
        spire1.castShadow = true;
        rg.add(spire1);

        const spire2 = new THREE.Mesh(sharedMonolithGeo, sharedDarkBasaltMat);
        spire2.position.set(-0.75, 0.58, 0.35);
        spire2.scale.set(0.58, 0.95, 0.55);
        spire2.rotation.z = -0.22;
        rg.add(spire2);
      } else if (rockType === 2) {
        // 3) Слоистый ступенчатый известняк / песчаник
        const slab1 = new THREE.Mesh(sharedSlateGeo, sharedSandstoneMat);
        slab1.position.y = 0.32;
        slab1.rotation.set(0.08, 0.4, -0.06);
        slab1.castShadow = true;
        rg.add(slab1);

        const slab2 = new THREE.Mesh(sharedSlateGeo, sharedSandstoneMat);
        slab2.position.set(-0.18, 0.78, 0.12);
        slab2.scale.set(0.72, 0.75, 0.76);
        slab2.rotation.set(-0.05, 0.9, 0.08);
        rg.add(slab2);
      } else {
        // 4) Группа из трёх замшелых лесных валунов разного размера
        const b1 = new THREE.Mesh(sharedGraniteGeo, sharedDarkBasaltMat);
        b1.position.set(0, 0.38, 0);
        b1.scale.set(0.95, 0.68, 1.15);
        b1.castShadow = true;
        rg.add(b1);

        const b2 = new THREE.Mesh(sharedCobbleGeo, sharedGraniteMat);
        b2.position.set(-1.05, 0.28, 0.55);
        b2.scale.set(0.85, 0.55, 0.75);
        rg.add(b2);

        const b3 = new THREE.Mesh(sharedCobbleGeo, sharedMossCapMat);
        b3.position.set(0.88, 0.24, -0.52);
        b3.scale.set(0.7, 0.45, 0.7);
        rg.add(b3);
      }

      rg.position.set(x, h, z);
      rg.rotation.y = Math.random() * Math.PI * 2;
      rg.scale.setScalar(rs);
      scene.add(rg);
      obstacles.push({ x, z, r: 1.25 * rs });
    }

    let bushCounter = 0;
    function createBush(x: number, z: number) {
      const h = getHeight(x, z);
      const bType = bushCounter++ % 3;
      const bg = new THREE.Group();
      const bs = 0.75 + Math.random() * 0.55;

      const mainFoliage = new THREE.Mesh(
        sharedBushGeo,
        bType === 0 ? sharedBushMat1 : sharedBushMat2
      );
      mainFoliage.position.y = 0.38;
      mainFoliage.scale.set(1.15, 0.68, 1.1);
      bg.add(mainFoliage);

      const subFoliage = new THREE.Mesh(
        sharedBushGeo,
        bType === 1 ? sharedBushMat1 : sharedBushMat2
      );
      subFoliage.position.set(0.52, 0.28, 0.28);
      subFoliage.scale.set(0.78, 0.55, 0.78);
      bg.add(subFoliage);

      if (bType === 0) {
        // Лесной ягодный куст с красными ягодами
        for (let k = 0; k < 4; k++) {
          const berry = new THREE.Mesh(sharedBerryGeo, sharedBerryMat);
          const ba = (k / 4) * Math.PI * 2 + 0.3;
          berry.position.set(Math.cos(ba) * 0.68, 0.48 + (k % 2) * 0.14, Math.sin(ba) * 0.68);
          bg.add(berry);
        }
      }

      bg.position.set(x, h, z);
      bg.rotation.y = Math.random() * Math.PI * 2;
      bg.scale.setScalar(bs);
      scene.add(bg);
    }

    for (let i = 0; i < 130; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 15 + Math.random() * 375;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = getHeight(x, z);
      if (
        Math.hypot(x - 80, z - -60) < 38 ||
        Math.hypot(x - -85, z - 25) < 32 ||
        Math.hypot(x - 25, z - 95) < 32 ||
        Math.hypot(x - -80, z - -95) < 32
      )
        continue;
      if (h < WATER_LEVEL + 1 || h > 28) continue;
      const fn = smoothNoise(x, z, 40);
      if (fn > 0.5 && Math.random() < 0.85) createTree(x, z);
      else if (Math.random() < 0.15) createRock(x, z);
      else if (Math.random() < 0.35) createBush(x, z);
    }

    // ============================================================
    // 6. ГЛАВНЫЙ ГЕРОЙ И БОЕВЫЕ КЛИНКИ
    // ============================================================
    const playerMesh = createHumanoid(0x6a4a30, textures, 0xe8c090, 1.0, false);
    const pu = playerMesh.userData as EntityRig;

    // Crossed twin swords on back (X-pattern)
    const swordBackR = createForgedSword(textures);
    swordBackR.position.set(0.32, 1.7, -0.5);
    swordBackR.rotation.set(0, 0, Math.PI * 0.75);
    swordBackR.scale.setScalar(0.9);
    playerMesh.add(swordBackR);

    const swordBackL = createForgedSword(textures);
    swordBackL.position.set(-0.32, 1.7, -0.52);
    swordBackL.rotation.set(0, 0, -Math.PI * 0.75);
    swordBackL.scale.setScalar(0.9);
    playerMesh.add(swordBackL);

    const strapMat = new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 1 });
    const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.7, 0.04), strapMat);
    strap1.position.set(0, 1.35, -0.48);
    strap1.rotation.set(0, 0, Math.PI * 0.25);
    playerMesh.add(strap1);
    const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.7, 0.04), strapMat);
    strap2.position.set(0, 1.35, -0.49);
    strap2.rotation.set(0, 0, -Math.PI * 0.25);
    playerMesh.add(strap2);

    // Active combat swords in hands (v10 orientation)
    const handSwordR = createForgedSword(textures);
    handSwordR.position.set(0, -0.38, 0);
    handSwordR.rotation.set(0, 0, Math.PI);
    handSwordR.scale.setScalar(0.78);
    handSwordR.visible = false;
    pu.elbowR?.add(handSwordR);

    const handSwordL = createForgedSword(textures);
    handSwordL.position.set(0, -0.38, 0);
    handSwordL.rotation.set(0, 0, Math.PI);
    handSwordL.scale.setScalar(0.78);
    handSwordL.visible = false;
    pu.elbowL?.add(handSwordL);

    // Слоты 3D-оружия и 3D-щита на руках героя (Меч скелета, Булава орка, Молот Тролля, Щиты)
    const customHandWeaponHolder = new THREE.Group();
    customHandWeaponHolder.position.set(0, -0.38, 0);
    customHandWeaponHolder.rotation.set(0, 0, Math.PI);
    customHandWeaponHolder.scale.setScalar(0.84);
    customHandWeaponHolder.visible = false;
    pu.elbowR?.add(customHandWeaponHolder);

    const customHandShieldHolder = new THREE.Group();
    customHandShieldHolder.visible = false;
    pu.elbowL?.add(customHandShieldHolder);

    // 🏹 3D-ЛУК В ЛЕВОЙ РУКЕ ГЕРОЯ (Охотничий, Эльфийский, Орочий или Костяной лук)
    const customHandBowHolder = new THREE.Group();
    customHandBowHolder.position.set(0.06, -0.34, 0.12);
    customHandBowHolder.rotation.set(Math.PI * 0.5, 0, 0);
    customHandBowHolder.add(createCustomBowMesh('bow_hunter'));
    customHandBowHolder.visible = false;
    pu.elbowL?.add(customHandBowHolder);

    // Стартуем на сухой возвышенности (38, -28), а не в озере (0, 0)!
    const startX = 38;
    const startZ = -28;
    const startH = getHeight(startX, startZ);
    playerMesh.position.set(startX, startH, startZ);
    // Отключаем frustumCulled на всех частях героя и его оружия, чтобы персонаж НИКОГДА не исчезал!
    playerMesh.traverse((obj) => {
      obj.frustumCulled = false;
    });
    scene.add(playerMesh);

    // Curved Sword Slash Arcs
    const slashGeo = new THREE.RingGeometry(1.25, 2.75, 24, 1, -Math.PI * 0.5, Math.PI);
    slashGeo.rotateX(-Math.PI / 2);
    const slashMat1 = new THREE.MeshBasicMaterial({
      map: textures.slashArc,
      color: 0xfff0c0,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const weaponTrail1 = new THREE.Mesh(slashGeo, slashMat1);
    weaponTrail1.visible = false;
    scene.add(weaponTrail1);

    const slashMat2 = new THREE.MeshBasicMaterial({
      map: textures.slashArc,
      color: 0xffd280,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const weaponTrail2 = new THREE.Mesh(slashGeo, slashMat2);
    weaponTrail2.visible = false;
    scene.add(weaponTrail2);

    // ============================================================
    // 7. NPC, ВРАГИ (ВОЛКИ, МЕДВЕДИ, СКЕЛЕТЫ, ОРКИ, ТРОЛЛИ) И 🐴 ЛОШАДИ
    // ============================================================
    interface GameEntity {
      type:
        | 'npc'
        | 'wolf'
        | 'bear'
        | 'orc'
        | 'skeleton'
        | 'troll'
        | 'golem'
        | 'horse'
        | 'pheasant'
        | 'grouse'
        | 'partridge';
      golemType?: 'earth' | 'stone' | 'steel';
      isFriendlySummon?: boolean;
      horseId?: string;
      coatHex?: string;
      mesh: THREE.Group;
      name: string;
      dialogKey?: string;
      x: number;
      y: number;
      z: number;
      vx?: number;
      vz?: number;
      facingAngle?: number;
      moving?: boolean;
      hp: number;
      maxHp: number;
      dmg: number;
      speed: number;
      xp: number;
      aggro: number;
      atkRange: number;
      windupTime: number;
      dead: boolean;
      attackCd: number;
      hitFlash: number;
      wanderAngle: number;
      wanderTimer: number;
      state: 'idle' | 'chase' | 'windup' | 'recover' | 'mounted' | 'called';
      stateTimer: number;
      walkCycle: number;
      moveBlend: number;
      // Специальное поле для NPC у костра (сидят, жарят мясо, встают при диалоге, гуляют по лесу)
      campfireSeat?: { x: number; z: number; rotY: number };
      npcActivity?: 'sitting' | 'talking' | 'forest_walk' | 'returning';
      activityTimer?: number;
      // Для пещерных скелетов в подземном мире и замедления от ледяных стрел
      inCaveId?: string;
      slowTimer?: number;
      poisonTimer?: number;
    }

    const entities: GameEntity[] = [];

    // ✨ Небесный луч Просветления при повышении уровня (Two Worlds / Gothic Level-Up Beam!)
    const levelUpBeamGroup = new THREE.Group();
    levelUpBeamGroup.visible = false;
    const beamOuterMat = new THREE.MeshBasicMaterial({
      color: 0x66e8ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beamInnerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beamRingMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beamOuterMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.85, 28, 20, 1, true),
      beamOuterMat
    );
    beamOuterMesh.position.y = 14;
    levelUpBeamGroup.add(beamOuterMesh);

    const beamInnerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.85, 28, 16, 1, true),
      beamInnerMat
    );
    beamInnerMesh.position.y = 14;
    levelUpBeamGroup.add(beamInnerMesh);

    const beamGroundHalo = new THREE.Mesh(new THREE.RingGeometry(0.8, 2.4, 28), beamRingMat);
    beamGroundHalo.rotation.x = -Math.PI / 2;
    beamGroundHalo.position.y = 0.12;
    levelUpBeamGroup.add(beamGroundHalo);
    scene.add(levelUpBeamGroup);
    let levelUpEffectTimer = 0;

    const player = {
      mesh: playerMesh,
      handSwordR,
      handSwordL,
      swordBackR,
      swordBackL,
      riding: null as GameEntity | null,
      ownedHorse: null as GameEntity | null,
      weaponsDrawn: false,
      x: startX,
      y: startH,
      z: startZ,
      vx: 0,
      vy: 0,
      vz: 0,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      stamina: 100,
      maxStamina: 100,
      level: 1,
      xp: 0,
      xpNext: 100,
      gold: 0,
      onGround: true,
      isSwimming: false,
      attackCd: 0,
      attackAnim: 0,
      comboStep: 0,
      comboResetTimer: 0,
      invuln: 0,
      rollCd: 0,
      rolling: false,
      rollTimer: 0,
      rollDir: { x: 0, z: 0 },
      lastDamageTime: 0,
      walkCycle: 0,
      moveBlend: 0,
      bodyLean: 0,
      facingAngle: 0,
      lastGroundTime: 0,
      jumpBuffered: 0,
      hpBonusPct: 0,
      mpBonusPct: 0,
      agilityBonusPct: 0,
      dmgBonusPct: 0,
      magicLevels: {
        fire: 1,
        water: 1,
        air: 1,
        lightning: 1,
        necro: 1,
      } as Record<MagicElement, number>,
      spellCd: 0,
      // Two Worlds & Gothic 3: Экипировка, Луки, Стрелы, Кольца, Телепорты, Пещеры, Ранги слияния и Очки обучения (LP)
      customWeaponHolder: customHandWeaponHolder,
      customShieldHolder: customHandShieldHolder,
      customBowHolder: customHandBowHolder,
      equippedWeapon: null as string | null,
      equippedShield: null as string | null,
      equippedCard: 'card_summon_earth_golem' as string | null,
      equippedBooster: 'card_booster_double' as string | null,
      equippedBow: 'bow_hunter' as string | null,
      equippedQuiver: 'quiver_iron' as string | null,
      equippedRing: 'ring_precision' as string | null,
      bowMode: false,
      sniperAiming: false,
      bowDrawCharge: 0,
      inCaveId: null as string | null,
      portableBeacon: null as { x: number; y: number; z: number; mesh: THREE.Group } | null,
      itemRanks: {} as Record<string, number>,
      skillPoints: 3,
      skills: {
        strength: 0,
        dexterity: 0,
        ancientKnowledge: 0,
        shieldMastery: 0,
        regeneration: 0,
      },
    };

    function spawnNPC(
      x: number,
      z: number,
      name: string,
      dialogKey: string,
      color: number,
      campfireSeat?: { x: number; z: number; rotY: number }
    ) {
      // У каждого персонажа деревни и лагеря — свой индивидуальный проработанный 3D-облик (как у Елены)!
      const g = createCharacterNPCSkin(dialogKey, color, textures);
      const h = getHeight(x, z);
      g.position.set(x, h, z);
      if (campfireSeat) {
        g.rotation.y = campfireSeat.rotY;
      }
      scene.add(g);
      entities.push({
        type: 'npc',
        mesh: g,
        name,
        dialogKey,
        x,
        y: h,
        z,
        hp: 100,
        maxHp: 100,
        dmg: 0,
        speed: 4.4,
        xp: 0,
        aggro: 0,
        atkRange: 0,
        windupTime: 0,
        dead: false,
        attackCd: 0,
        hitFlash: 0,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 3,
        state: 'idle',
        stateTimer: 0,
        walkCycle: Math.random() * 10,
        moveBlend: 0,
        campfireSeat,
        npcActivity: campfireSeat ? 'sitting' : undefined,
        activityTimer: campfireSeat ? 16 + Math.random() * 14 : undefined,
      });
    }

    function spawnHorse(
      horseId: string,
      initX: number,
      initZ: number,
      bodyColor: number,
      maneColor: number,
      name: string,
      coatHex: string
    ): GameEntity {
      // Гарантируем спавн лошади строго на суше (выше уровня воды + 1.2 м)
      let x = initX;
      let z = initZ;
      let h = getHeight(x, z);
      let radiusSearch = 5;
      while (h < WATER_LEVEL + 1.2 && radiusSearch < 160) {
        for (let step = 0; step < 16; step++) {
          const ang = (step / 16) * Math.PI * 2;
          const tx = initX + Math.cos(ang) * radiusSearch;
          const tz = initZ + Math.sin(ang) * radiusSearch;
          const th = getHeight(tx, tz);
          if (th >= WATER_LEVEL + 1.2) {
            x = tx;
            z = tz;
            h = th;
            break;
          }
        }
        radiusSearch += 6;
      }

      const g = createHorseModel(bodyColor, maneColor, textures);
      const initialYaw = Math.random() * Math.PI * 2;
      g.position.set(x, h, z);
      g.rotation.y = initialYaw;
      scene.add(g);

      const horse: GameEntity = {
        type: 'horse',
        horseId,
        coatHex,
        mesh: g,
        name,
        x,
        y: h,
        z,
        vx: 0,
        vz: 0,
        facingAngle: initialYaw,
        moving: false,
        hp: 200,
        maxHp: 200,
        dmg: 0,
        speed: 4,
        xp: 0,
        aggro: 0,
        atkRange: 0,
        windupTime: 0,
        dead: false,
        attackCd: 0,
        hitFlash: 0,
        wanderAngle: initialYaw,
        wanderTimer: 0,
        state: 'idle',
        stateTimer: 0,
        walkCycle: 0,
        moveBlend: 0,
      };
      entities.push(horse);
      return horse;
    }

    let orcSpawnVariantCounter = 0;
    function spawnEnemy(
      x: number,
      z: number,
      kind:
        | 'wolf'
        | 'bear'
        | 'orc'
        | 'skeleton'
        | 'troll'
        | 'pheasant'
        | 'grouse'
        | 'partridge'
    ) {
      const cfg = {
        wolf: {
          hp: 40,
          dmg: 8,
          speed: 7.5,
          xp: 25,
          aggro: 18,
          name: 'Волк',
          atkRange: 2.0,
          windupTime: 0.35,
        },
        bear: {
          hp: 130,
          dmg: 20,
          speed: 6.2,
          xp: 85,
          aggro: 21,
          name: 'Медведь',
          atkRange: 2.6,
          windupTime: 0.5,
        },
        orc: {
          hp: 90,
          dmg: 16,
          speed: 5.5,
          xp: 60,
          aggro: 22,
          name: 'Орк-воин',
          atkRange: 2.4,
          windupTime: 0.55,
        },
        skeleton: {
          hp: 60,
          dmg: 12,
          speed: 6.5,
          xp: 45,
          aggro: 20,
          name: 'Скелет',
          atkRange: 2.2,
          windupTime: 0.45,
        },
        troll: {
          hp: 300,
          dmg: 30,
          speed: 4.2,
          xp: 250,
          aggro: 28,
          name: 'Чёрный тролль',
          atkRange: 3.4,
          windupTime: 0.8,
        },
        pheasant: {
          hp: 20,
          dmg: 0,
          speed: 5.2,
          xp: 15,
          aggro: 0,
          name: 'Золотой фазан',
          atkRange: 0,
          windupTime: 1,
        },
        grouse: {
          hp: 22,
          dmg: 0,
          speed: 4.8,
          xp: 15,
          aggro: 0,
          name: 'Лесной тетерев',
          atkRange: 0,
          windupTime: 1,
        },
        partridge: {
          hp: 18,
          dmg: 0,
          speed: 5.6,
          xp: 15,
          aggro: 0,
          name: 'Белая куропатка',
          atkRange: 0,
          windupTime: 1,
        },
      }[kind];

      let g: THREE.Group;
      let customEnemyName = cfg.name;
      if (kind === 'wolf') g = createWolfModel(textures);
      else if (kind === 'bear') g = createBearModel(textures);
      else if (kind === 'skeleton') g = createSkeletonModel(textures);
      else if (kind === 'orc') {
        const vIdx = orcSpawnVariantCounter++;
        g = createOrcModel(textures, vIdx);
        const orcNames = ['Орк-крушитель', 'Орк-берсерк', 'Орк-вожак клана'];
        customEnemyName = orcNames[vIdx % 3];
      } else if (kind === 'pheasant' || kind === 'grouse' || kind === 'partridge')
        g = createGroundBirdModel(kind);
      else g = createTrollModel(textures);

      const h = getHeight(x, z);
      g.position.set(x, h, z);
      scene.add(g);

      entities.push({
        type: kind,
        mesh: g,
        ...cfg,
        name: customEnemyName,
        x,
        y: h,
        z,
        maxHp: cfg.hp,
        dead: false,
        attackCd: 0,
        hitFlash: 0,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
        state: 'idle',
        stateTimer: 0,
        walkCycle: 0,
        moveBlend: 0,
      });
    }

    const vx = 80;
    const vz = -60;
    // 🏘️ ДЕРЕВНЯ 1: Деревня Горна «Солнечная Застава» (Маг Огня Пирокар + Конюх Гюнтер + Елена + Кузнец + Хакон)
    spawnNPC(vx, vz, 'Старейшина Горн', 'elder', 0x8a5a4a);
    spawnNPC(vx + 15, vz + 10, 'Кузнец Торус', 'smith', 0x5a3a2a);
    spawnNPC(vx - 15, vz + 12, 'Торговец Хакон', 'trader', 0x8a6a4a);
    spawnNPC(vx - 20, vz - 10, 'Стражник Диего', 'guard', 0x3a3a5a);
    spawnNPC(vx + 16, vz - 12, 'Целительница Елена', 'healer', 0x7a3858);
    spawnNPC(vx + 7, vz + 16, 'Верховный Маг Огня Пирокар', 'mage_fire', 0x9c1818);
    spawnNPC(vx - 24, vz + 19, 'Конюх Гюнтер', 'stablehand', 0x5c4428);

    // 🏘️ ДЕРЕВНЯ 2: Озёрная деревня «Тихая Заводь» (Запад: Маг Воды Сатурас + Сапожник Криспен + Шеф-повар Гаспар)
    const v2x = -85;
    const v2z = 25;
    spawnNPC(v2x, v2z, 'Верховный Маг Воды Сатурас', 'mage_water', 0x164e8a);
    spawnNPC(v2x + 12, v2z - 8, 'Сапожник Криспен', 'cobbler', 0x6e4224);
    spawnNPC(v2x - 10, v2z + 9, 'Шеф-повар Гаспар', 'cook', 0xdcd6c8);

    // 🏘️ ДЕРЕВНЯ 3: Каменный Посад «Край Големов» (Юго-Восток: Маг Земли Торгалор + Работяга-каменотёс Борк)
    const v3x = 25;
    const v3z = 95;
    spawnNPC(v3x, v3z, 'Маг Земли Торгалор', 'mage_earth', 0x3b5824);
    spawnNPC(v3x - 12, v3z + 8, 'Работяга-каменотёс Борк', 'worker', 0x54585c);

    // 🏘️ ДЕРЕВНЯ 4: Горное поселение «Ветреный Приют» (Северо-Запад: Маг Воздуха Аэрион + Маг Некромагии Ксардас)
    const v4x = -80;
    const v4z = -95;
    spawnNPC(v4x, v4z, 'Маг Воздуха Аэрион', 'mage_air', 0x247a74);
    spawnNPC(v4x + 14, v4z - 9, 'Верховный Некромант Ксардас', 'mage_necro', 0x261438);

    // 🔥 КОСТЁР С ЖАРЯЩИМСЯ НА ВЕРТЕЛЕ МЯСОМ (между стартовой поляной и деревней Горна)
    const campX = 56;
    const campZ = -40;
    const campH = getHeight(campX, campZ);
    const mainCampfire = createCampfireWithRoastingMeat(campX, campZ, campH, textures, scene);
    obstacles.push({ x: campX, z: campZ, r: 1.25 });

    // Уютные костры с мясом на площадях деревень
    const villageCampX = vx + 4;
    const villageCampZ = vz - 8;
    const villageCampfire = createCampfireWithRoastingMeat(
      villageCampX,
      villageCampZ,
      getHeight(villageCampX, villageCampZ),
      textures,
      scene
    );
    obstacles.push({ x: villageCampX, z: villageCampZ, r: 1.25 });

    // Персонажи у костра: сидят на брёвнах-лавках и жарят мясо, встают при диалоге, иногда гуляют по лесу и возвращаются!
    spawnNPC(campX, campZ - 2.25, 'Лесоруб Бром', 'woodcutter', 0x6b4428, {
      x: campX,
      z: campZ - 2.25,
      rotY: 0,
    });
    spawnNPC(campX - 2.25, campZ, 'Рыбак Фарим', 'fisherman', 0x3b586c, {
      x: campX - 2.25,
      z: campZ,
      rotY: Math.PI / 2,
    });
    spawnNPC(campX + 2.25, campZ, 'Охотник Ларс', 'hunter', 0x4a5a3a, {
      x: campX + 2.25,
      z: campZ,
      rotY: -Math.PI / 2,
    });

    // 🏡 ДОМИКИ ВО ВСЕХ 4 ДЕРЕВНЯХ С ПЕЧНОЙ ТРУБОЙ, ИНДИВИДУАЛЬНОЙ АРХИТЕКТУРОЙ, ДЫМОМ И СВЕТОМ В ОКНАХ
    const villageHouses: MedievalHouseInstance[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const hx = vx + Math.cos(a) * 30;
      const hz = vz + Math.sin(a) * 30;
      const hh = getHeight(hx, hz);
      const houseInst = createMedievalHouse(hx, hz, hh, textures, scene, torchLights, i);
      houseInst.isSmoking = i === 0 || i === 2;
      houseInst.setWindowLit(i !== 3);
      villageHouses.push(houseInst);
      obstacles.push({ x: hx, z: hz, r: 4.3 });
    }
    const extraVillages: [number, number][] = [
      [v2x, v2z],
      [v3x, v3z],
      [v4x, v4z],
    ];
    for (let vIdx = 0; vIdx < extraVillages.length; vIdx++) {
      const [evx, evz] = extraVillages[vIdx];
      for (let hIdx = 0; hIdx < 2; hIdx++) {
        const a = (hIdx / 2) * Math.PI * 2 + vIdx * 0.7;
        const hx = evx + Math.cos(a) * 21;
        const hz = evz + Math.sin(a) * 21;
        const hh = getHeight(hx, hz);
        if (hh < WATER_LEVEL + 0.8) continue;
        const houseInst = createMedievalHouse(
          hx,
          hz,
          hh,
          textures,
          scene,
          torchLights,
          (vIdx + hIdx + 1) % 5
        );
        houseInst.isSmoking = hIdx === 0;
        houseInst.setWindowLit(true);
        villageHouses.push(houseInst);
        obstacles.push({ x: hx, z: hz, r: 4.3 });
      }
    }

    // Пул реалистичных клубов печного дыма из труб домиков
    interface ChimneySmokePuff {
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      age: number;
      maxAge: number;
      seed: number;
      active: boolean;
    }
    const smokePuffs: ChimneySmokePuff[] = [];
    const sharedSmokeGeo = new THREE.IcosahedronGeometry(0.45, 0);
    for (let i = 0; i < 28; i++) {
      const smMat = new THREE.MeshBasicMaterial({
        color: 0xd8dde4,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const smMesh = new THREE.Mesh(sharedSmokeGeo, smMat);
      smMesh.visible = false;
      scene.add(smMesh);
      smokePuffs.push({
        mesh: smMesh,
        mat: smMat,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        maxAge: 4.6,
        seed: Math.random() * 100,
        active: false,
      });
    }
    let smokeSpawnAccum = 0;
    let houseSwitchTimer = 11;

    // 🐴 ЛОШАДИ — у каждой лошади свой ID и своя собственная седельная сумочка Two Worlds!
    player.ownedHorse = spawnHorse(
      'horse_1',
      vx - 26,
      vz + 22,
      0x8a4a20,
      0x2a1a10,
      'Гнедая (Личный скакун)',
      '#8a4a20'
    );
    spawnHorse('horse_2', vx + 55, vz + 15, 0x8a4a20, 0x2a1a10, 'Полевая гнедая', '#7a4018');
    spawnHorse('horse_3', vx - 55, vz - 25, 0x1a1015, 0x000000, 'Вороная', '#1a1015');
    spawnHorse('horse_4', vx + 30, vz - 70, 0xe0d8c8, 0xc0b8a8, 'Белая', '#e0d8c8');
    spawnHorse('horse_5', 55, 65, 0x3a2515, 0x000000, 'Тёмно-гнедая', '#3a2515');
    spawnHorse('horse_6', -65, -55, 0x707070, 0x404040, 'Серая', '#707070');

    // Спавним наглядных существ неподалёку от деревни/тропы (Скелет, Орк, Медведь, Чёрный Тролль)
    spawnEnemy(54, -42, 'skeleton');
    spawnEnemy(22, -48, 'skeleton');
    spawnEnemy(18, -16, 'orc');
    spawnEnemy(-55, 45, 'bear');
    spawnEnemy(-75, -55, 'troll');

    const spawnCounts: [
      'wolf' | 'bear' | 'orc' | 'skeleton' | 'troll' | 'pheasant' | 'grouse' | 'partridge',
      number
    ][] = [
      ['wolf', 24],
      ['bear', 16],
      ['orc', 18],
      ['skeleton', 18],
      ['troll', 4],
      ['pheasant', 10],
      ['grouse', 8],
      ['partridge', 8],
    ];
    // Несколько охотничьих птиц разных пород прямо на стартовых лугах около деревни + их гнёздышки с яйцами рядом на земле!
    spawnEnemy(46, -24, 'pheasant');
    spawnEnemy(32, -36, 'grouse');
    spawnEnemy(52, -38, 'partridge');
    for (const [kind, count] of spawnCounts) {
      for (let i = 0; i < count; i++) {
        let x = 0;
        let z = 0;
        let tries = 0;
        do {
          const a = Math.random() * Math.PI * 2;
          const r = 80 + Math.random() * 280;
          x = Math.cos(a) * r;
          z = Math.sin(a) * r;
          tries++;
        } while (
          (Math.hypot(x - vx, z - vz) < 60 || getHeight(x, z) < WATER_LEVEL + 1) &&
          tries < 30
        );
        if (tries < 30) {
          spawnEnemy(x, z, kind);
        }
      }
    }

    // ============================================================
    // 🐴 СИСТЕМА ЛОШАДЕЙ
    // ============================================================
    function findNearestHorse(): GameEntity | null {
      let nearest: GameEntity | null = null;
      let nd = 4.5;
      for (const e of entities) {
        if (e.dead || e.type !== 'horse' || e.state === 'mounted') continue;
        const d = Math.hypot(e.x - player.x, e.z - player.z);
        if (d < nd) {
          nd = d;
          nearest = e;
        }
      }
      return nearest;
    }

    function mountHorse(horse: GameEntity) {
      player.riding = horse;
      player.ownedHorse = horse;
      if (horse.horseId) {
        setSelectedHorseId(horse.horseId);
      }
      player.rolling = false;
      player.rollTimer = 0;
      horse.state = 'mounted';
      horse.vx = 0;
      horse.vz = 0;

      scene.remove(player.mesh);
      horse.mesh.add(player.mesh);
      player.mesh.position.set(0, 1.15, -0.15);
      player.mesh.rotation.set(0, 0, 0);
      player.mesh.scale.set(1, 1, 1);
      player.mesh.visible = true;

      sound.playHorseNeigh();
      addLogMessage(`🐴 Вы в седле (${horse.name}). [B] — открыть седельную сумочку лошади!`);
    }

    function toggleWeapons() {
      if (dialogOpenRef.current || !gameStartedRef.current || isPausedRef.current) return;
      player.weaponsDrawn = !player.weaponsDrawn;
      if (player.weaponsDrawn) {
        sound.playSwordDraw(false);
        addLogMessage('⚔️ Вы обнажили парные клинки!');
        spawnParticles(player.x, player.y + 1.5, player.z, 0xd8e4f0, 6);
      } else {
        sound.playSwordDraw(true);
        player.attackAnim = 0;
        player.comboStep = 0;
        addLogMessage('🗡️ Вы убрали мечи в ножны за спину.');
      }
    }
    toggleWeaponRef.current = toggleWeapons;

    function whistleForHorse() {
      if (dialogOpenRef.current || !gameStartedRef.current || isPausedRef.current) return;
      if (player.riding) {
        addLogMessage('🐴 Вы уже в седле!');
        return;
      }

      // Ищем личную лошадь игрока (или ближайшую свободную)
      let targetHorse = player.ownedHorse;
      if (!targetHorse || targetHorse.dead) {
        let bestDist = Infinity;
        for (const e of entities) {
          if (!e.dead && e.type === 'horse') {
            const d = Math.hypot(e.x - player.x, e.z - player.z);
            if (d < bestDist) {
              bestDist = d;
              targetHorse = e;
            }
          }
        }
      }

      if (!targetHorse) return;
      player.ownedHorse = targetHorse;

      const dist = Math.hypot(targetHorse.x - player.x, targetHorse.z - player.z);
      // Если лошадь слишком далеко (> 90 м), телепортируем её поближе за спину камеры (на сушу), чтобы она быстро прискакала
      if (dist > 90) {
        const behindAngle = camControl.yaw;
        const spawnX = player.x + Math.sin(behindAngle) * 32;
        const spawnZ = player.z + Math.cos(behindAngle) * 32;
        const sh = getHeight(spawnX, spawnZ);
        if (sh > WATER_LEVEL + 0.8) {
          targetHorse.x = spawnX;
          targetHorse.z = spawnZ;
          targetHorse.y = sh;
          targetHorse.mesh.position.set(spawnX, sh, spawnZ);
        }
      }

      targetHorse.state = 'called';
      if (targetHorse.horseId) {
        setSelectedHorseId(targetHorse.horseId);
      }
      sound.playWhistle();
      spawnParticles(player.x, player.y + 2.1, player.z, 0xf5d76e, 14);
      addLogMessage(`🎵 Вы свистнули! ${targetHorse.name} мчится к вам со своей поклажей!`);
    }
    whistleHorseRef.current = whistleForHorse;

    summonSpecificHorseRef.current = (horseId: string) => {
      const targetHorse = entities.find((e) => e.type === 'horse' && e.horseId === horseId);
      if (!targetHorse || targetHorse.dead) return;
      player.ownedHorse = targetHorse;
      setSelectedHorseId(horseId);
      if (player.riding === targetHorse) {
        addLogMessage(`🐴 Вы уже сидите на лошади «${targetHorse.name}»!`);
        return;
      }
      const behindAngle = camControl.yaw;
      const spawnX = player.x + Math.sin(behindAngle) * 5.5;
      const spawnZ = player.z + Math.cos(behindAngle) * 5.5;
      const sh = getHeight(spawnX, spawnZ);
      if (sh > WATER_LEVEL + 0.6) {
        targetHorse.x = spawnX;
        targetHorse.z = spawnZ;
        targetHorse.y = sh;
        targetHorse.mesh.position.set(spawnX, sh, spawnZ);
      }
      targetHorse.state = 'called';
      sound.playWhistle();
      sound.playHorseNeigh();
      spawnParticles(player.x, player.y + 2.0, player.z, 0xf5d76e, 16);
      addLogMessage(
        `🎵 Лошадь «${targetHorse.name}» прискакала к вам! Её седельные сумки теперь доступны.`
      );
    };

    function openHorseBagQuick() {
      if (!gameStartedRef.current || isPausedRef.current) return;
      setShopOpen(false);
      // Автоматически выбираем лошадь под седлом, ближайшую лошадь или личную лошадь
      if (player.riding?.horseId) {
        setSelectedHorseId(player.riding.horseId);
      } else {
        const nearH = findNearestHorse();
        if (nearH?.horseId) {
          setSelectedHorseId(nearH.horseId);
        } else if (player.ownedHorse?.horseId) {
          setSelectedHorseId(player.ownedHorse.horseId);
        }
      }
      setBagTab('horse');
      setBagOpen(true);
    }
    openHorseBagQuickRef.current = openHorseBagQuick;

    function dismountHorse() {
      const horse = player.riding;
      if (!horse) return;

      const hFacing = horse.facingAngle || 0;
      const leftAngle = hFacing + Math.PI / 2;
      const newX = horse.x + Math.sin(leftAngle) * 2.5;
      const newZ = horse.z + Math.cos(leftAngle) * 2.5;

      horse.mesh.remove(player.mesh);
      scene.add(player.mesh);

      player.x = newX;
      player.z = newZ;
      player.y = getHeight(newX, newZ);
      player.vx = 0;
      player.vz = 0;
      player.facingAngle = hFacing;
      player.mesh.rotation.set(0, player.facingAngle, 0);
      player.mesh.position.set(player.x, player.y, player.z);
      player.mesh.visible = true;

      horse.state = 'idle';
      horse.wanderTimer = 1;
      horse.moving = false;
      player.riding = null;

      addLogMessage('🐴 Вы слезли с лошади');
    }

    resetToCampRef.current = () => {
      if (player.riding) dismountHorse();
      player.x = startX;
      player.z = startZ;
      player.y = getHeight(startX, startZ);
      player.vx = 0;
      player.vz = 0;
      setIsPaused(false);
      addLogMessage('Вы вернулись на стартовую поляну.');
    };

    // ============================================================
    // 8. ДРОПЫ И ЧАСТИЦЫ
    // ============================================================
    interface DropCoin {
      mesh: THREE.Mesh;
      amount: number;
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      life: number;
      attracted: boolean;
    }
    const drops: DropCoin[] = [];

    const sharedCoinGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 12);
    const sharedCoinMat = new THREE.MeshStandardMaterial({
      color: 0xffd040,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x604000,
      emissiveIntensity: 0.4,
    });
    const sharedParticleGeo = new THREE.SphereGeometry(0.1, 4, 4);

    function spawnDrop(x: number, y: number, z: number, amount: number) {
      const coin = new THREE.Mesh(sharedCoinGeo, sharedCoinMat);
      coin.rotation.x = Math.PI / 2;
      coin.position.set(x, y + 0.5, z);
      coin.castShadow = true;
      scene.add(coin);
      drops.push({
        mesh: coin,
        amount,
        x,
        y: y + 0.5,
        z,
        vx: (Math.random() - 0.5) * 3,
        vy: 4 + Math.random() * 2,
        vz: (Math.random() - 0.5) * 3,
        life: 30,
        attracted: false,
      });
    }

    interface Particle {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
      maxLife: number;
    }
    const particles: Particle[] = [];

    function spawnParticles(x: number, y: number, z: number, color: number, count: number) {
      for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(
          sharedParticleGeo,
          new THREE.MeshBasicMaterial({ color, transparent: true })
        );
        p.position.set(x, y, z);
        const vx = (Math.random() - 0.5) * 8;
        const vy = Math.random() * 5 + 2;
        const vz = (Math.random() - 0.5) * 8;
        scene.add(p);
        particles.push({ mesh: p, vx, vy, vz, life: 0.6, maxLife: 0.6 });
      }
    }

    function pushFloatingDamage(
      worldX: number,
      worldY: number,
      worldZ: number,
      dmg: number,
      comboLabel?: string
    ) {
      const vec = new THREE.Vector3(worldX, worldY, worldZ);
      vec.project(camera);
      if (vec.z > 1) return;
      const sx = (vec.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-vec.y * 0.5 + 0.5) * window.innerHeight;
      const id = Date.now() + Math.random();
      setFloatingDamages((prev) => [
        ...prev.slice(-8),
        { id, value: dmg, x: sx, y: sy, isCrit: dmg >= 36 || Boolean(comboLabel), comboLabel },
      ]);
      setTimeout(() => {
        setFloatingDamages((prev) => prev.filter((item) => item.id !== id));
      }, 950);
    }

    // ============================================================
    // 8b. ТРАВЫ, ПТИЧЬИ ГНЁЗДА С ЯЙЦАМИ, ТРОФЕИ И ЛЕВИТИРУЮЩИЕ ГРИМУАРЫ
    // ============================================================
    interface WorldCollectible {
      id: number;
      itemId: string;
      mesh: THREE.Group;
      floatingPart?: THREE.Group;
      auraRing?: THREE.Mesh;
      eggsGroup?: THREE.Group;
      respawnTimer?: number;
      x: number;
      y: number;
      z: number;
      collected: boolean;
      phase: number;
    }
    const worldCollectibles: WorldCollectible[] = [];
    let collectibleIdSeq = 1;

    function addItemToBag(itemId: string, qty = 1) {
      setInventory((prev) => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + qty,
      }));
    }

    function spawnCollectibleNode(x: number, z: number, itemId: string, withChest = false) {
      const def = ITEM_CATALOG[itemId];
      if (!def) return;
      const y = getHeight(x, z);
      if (y < WATER_LEVEL + 0.4) return;

      let mesh: THREE.Group;
      let floatingPart: THREE.Group | undefined;
      let auraRing: THREE.Mesh | undefined;
      let eggsGroup: THREE.Group | undefined;

      if (itemId === 'fishing_rod') {
        const rodNode = createLevitatingFishingRodMesh();
        mesh = rodNode.root;
        floatingPart = rodNode.floatingPart;
        auraRing = rodNode.auraRing;
      } else if (itemId === 'elena_ring') {
        const ringNode = createElenaRingMesh();
        mesh = ringNode.root;
        floatingPart = ringNode.floatingPart;
        auraRing = ringNode.auraRing;
      } else if (itemId === 'firewood_bundle') {
        mesh = createFirewoodBundleMesh();
      } else if (def.category === 'egg') {
        mesh = createEggNestMesh(itemId === 'egg_golden');
        eggsGroup = mesh.userData.eggsGroup as THREE.Group | undefined;
      } else if (def.category === 'herb') {
        mesh = createHerbMesh(itemId);
      } else if (def.category === 'grimoire' && def.grimoireElement) {
        const gNode = createGrimoireNodeMesh(def.grimoireElement, withChest);
        mesh = gNode.root;
        floatingPart = gNode.floatingBook;
        auraRing = gNode.auraRing;
      } else if (
        def.category === 'weapon' ||
        def.category === 'bow' ||
        def.category === 'quiver' ||
        def.category === 'ring' ||
        def.category === 'teleport' ||
        def.category === 'shield' ||
        def.category === 'card' ||
        def.category === 'booster' ||
        def.category === 'artifact'
      ) {
        const eqNode = createEquipmentDropMesh(itemId);
        mesh = eqNode.root;
        floatingPart = eqNode.floatingPart;
        auraRing = eqNode.auraRing;
      } else {
        mesh = createTrophyDropMesh(itemId);
      }

      mesh.position.set(x, y, z);
      scene.add(mesh);
      worldCollectibles.push({
        id: collectibleIdSeq++,
        itemId,
        mesh,
        floatingPart,
        auraRing,
        eggsGroup,
        x,
        y,
        z,
        collected: false,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Спавним наглядные сундучки с левитирующими Гримуарами всех 5 стихий, гнезда с яйцами и травы рядом со стартом и по всему миру
    spawnCollectibleNode(44, -20, 'grimoire_fire', true);
    spawnCollectibleNode(30, -18, 'grimoire_water', false);
    spawnCollectibleNode(54, -30, 'grimoire_air', true);
    spawnCollectibleNode(64, -44, 'grimoire_lightning', true);
    spawnCollectibleNode(26, -34, 'grimoire_necro', false);

    spawnCollectibleNode(41, -25, 'egg_spotted');
    spawnCollectibleNode(35, -24, 'egg_golden');
    spawnCollectibleNode(47, -23, 'egg_spotted');
    spawnCollectibleNode(33, -35, 'egg_spotted');
    spawnCollectibleNode(51, -37, 'egg_golden');
    spawnCollectibleNode(42, -31, 'herb_sorrel');
    spawnCollectibleNode(34, -30, 'herb_goblin');
    spawnCollectibleNode(46, -29, 'herb_nettle');
    spawnCollectibleNode(39, -22, 'herb_sun_aloe');

    // 🎣 ЛЕВИТИРУЮЩАЯ УДОЧКА РЫБАКА ФАРИМА (парит в воздухе у западного берега, где бродят медведи и волки!)
    spawnCollectibleNode(14, -18, 'fishing_rod');
    spawnCollectibleNode(-12, -26, 'fishing_rod');

    // 💍 ПОТЕРЯННОЕ ЗОЛОТОЕ КОЛЕЧКО ЕЛЕНЫ С САПФИРОМ (на цветочной поляне к югу от деревни)
    spawnCollectibleNode(68, -74, 'elena_ring');
    spawnCollectibleNode(52, -62, 'elena_ring');

    // 🪵 СВЯЗКИ СУХИХ ДРОВ ДЛЯ КОСТРА ЛЕСОРУБА БРОМА (вокруг костра и лесной опушки)
    const firewoodSpots: [number, number][] = [
      [50, -35],
      [62, -36],
      [52, -46],
      [63, -45],
      [46, -42],
      [67, -39],
      [48, -52],
      [72, -48],
    ];
    for (const [fx, fz] of firewoodSpots) {
      spawnCollectibleNode(fx, fz, 'firewood_bundle');
    }

    const herbIds = ['herb_sorrel', 'herb_goblin', 'herb_nettle', 'herb_sun_aloe'];
    const grimoireIds = [
      'grimoire_fire',
      'grimoire_water',
      'grimoire_air',
      'grimoire_lightning',
      'grimoire_necro',
    ];

    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 330;
      const hx = Math.cos(a) * r;
      const hz = Math.sin(a) * r;
      if (getHeight(hx, hz) > WATER_LEVEL + 0.8) {
        spawnCollectibleNode(hx, hz, herbIds[i % herbIds.length]);
      }
    }

    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 22 + Math.random() * 320;
      const ex = Math.cos(a) * r;
      const ez = Math.sin(a) * r;
      if (getHeight(ex, ez) > WATER_LEVEL + 0.8) {
        spawnCollectibleNode(ex, ez, i % 4 === 0 ? 'egg_golden' : 'egg_spotted');
      }
    }

    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 35 + Math.random() * 310;
      const gx = Math.cos(a) * r;
      const gz = Math.sin(a) * r;
      if (getHeight(gx, gz) > WATER_LEVEL + 1.0) {
        spawnCollectibleNode(gx, gz, grimoireIds[i % grimoireIds.length], i % 2 === 0);
      }
    }

    // Спавним наглядные Луки, Колчаны стрел, Кольца, Карты Призыва Големов и Усилители рядом со стартовым лагерем и деревней!
    spawnCollectibleNode(45, -26, 'bow_elven');
    spawnCollectibleNode(49, -27, 'quiver_fire');
    spawnCollectibleNode(36, -27, 'quiver_explosive');
    spawnCollectibleNode(76, -54, 'paladin_claymore');
    spawnCollectibleNode(74, -56, 'ring_strength');
    spawnCollectibleNode(41, -33, 'card_summon_stone_golem');
    spawnCollectibleNode(43, -33, 'card_booster_double');
    spawnCollectibleNode(29, 91, 'card_summon_steel_golem');

    // ============================================================
    // 8c. ⚗️ КОТЛЫ ДЛЯ АЛХИМИИ, 🔮 ТЕЛЕПОРТЫ И 🕳️ ПОДЗЕМНЫЕ ПЕЩЕРЫ СО СКЕЛЕТАМИ (TWO WORLDS)
    // ============================================================
    interface WorldCauldron {
      x: number;
      y: number;
      z: number;
      name: string;
      root: THREE.Group;
      liquidMesh: THREE.Mesh;
      bubbles: THREE.Mesh[];
    }
    const worldCauldrons: WorldCauldron[] = [];
    const cauldronSpots: [number, number, string][] = [
      [campX + 3.2, campZ - 2.6, 'Походный Алхимический Котёл у Костра'],
      [vx + 13.5, vz - 9.5, 'Алхимический Котёл Целительницы Елены'],
    ];
    for (const [cx, cz, cName] of cauldronSpots) {
      const cy = getHeight(cx, cz);
      const cInst = createAlchemyCauldronMesh();
      cInst.root.position.set(cx, cy, cz);
      scene.add(cInst.root);
      worldCauldrons.push({ x: cx, y: cy, z: cz, name: cName, ...cInst });
      obstacles.push({ x: cx, z: cz, r: 1.05 });
    }

    // 🔮 СТАЦИОНАРНЫЕ БОЛЬШИЕ ТЕЛЕПОРТЫ В ЗЕМЛЕ (По всем деревням Магов, Гильдий и Пещерам Миртаны!)
    interface StationaryTeleporter {
      id: string;
      name: string;
      x: number;
      y: number;
      z: number;
      root: THREE.Group;
      innerRing: THREE.Mesh;
      portalColumn: THREE.Mesh;
    }
    const stationaryTeleporters: StationaryTeleporter[] = [];
    const tpConfigs: [string, string, number, number][] = [
      ['tp_camp', '🔮 Телепорт: Лагерь у Костра', 44, -34],
      ['tp_village', '🔮 Телепорт: Деревня Горна (Маг Огня Пирокар и Конюх)', 88, -52],
      ['tp_lake_village', '🔮 Телепорт: Озёрная деревня (Маг Воды, Сапожник и Повар)', -76, 20],
      ['tp_earth_village', '🔮 Телепорт: Край Големов (Маг Земли Торгалор и Работяги)', 33, 88],
      ['tp_wind_village', '🔮 Телепорт: Ветреный Приют (Маг Воздуха и Некромант Ксардас)', -72, -88],
      ['tp_cave_skulls', '🔮 Телепорт: Пещера «Склеп Черепов» (Север)', -18, -74],
      ['tp_cave_shadows', '🔮 Телепорт: Пещера «Катакомбы Теней» (Юго-Восток)', 106, 46],
    ];
    for (const [id, name, tx, tz] of tpConfigs) {
      const ty = getHeight(tx, tz);
      const tpMesh = createStationaryTeleporterPadMesh(name);
      tpMesh.root.position.set(tx, ty, tz);
      scene.add(tpMesh.root);
      stationaryTeleporters.push({ id, name, x: tx, y: ty, z: tz, ...tpMesh });
    }

    // 🕳️ ПОДЗЕМНЫЕ ПЕЩЕРЫ СО СКЕЛЕТАМИ, СУНДУКАМИ С ОРУЖИЕМ, ЛУКАМИ, КОЛЬЦАМИ И ГРИМУАРАМИ
    interface CaveDungeon {
      id: string;
      name: string;
      entranceX: number;
      entranceY: number;
      entranceZ: number;
      interiorGroup: THREE.Group;
      interiorCenter: THREE.Vector3;
      interiorSpawnPos: THREE.Vector3;
      exitPortalPos: THREE.Vector3;
      chests: {
        mesh: THREE.Group;
        lidPivot: THREE.Group;
        pos: THREE.Vector3;
        opened: boolean;
        lootTable: string[];
      }[];
    }
    const caveDungeons: CaveDungeon[] = [];
    const caveDefinitions: {
      id: string;
      name: string;
      ex: number;
      ez: number;
      ix: number;
      iz: number;
      chestLoots: [string[], string[], string[]];
    }[] = [
      {
        id: 'cave_skulls',
        name: 'Подземная Пещера «Склеп Короля Черепов»',
        ex: -24,
        ez: -76,
        ix: -24,
        iz: -180,
        chestLoots: [
          ['bow_dragonbone', 'quiver_fire', 'ring_precision', 'potion_alch_titan'],
          ['paladin_claymore', 'ring_archmage', 'grimoire_fire', 'quiver_explosive'],
          ['assassin_katana', 'ring_berserk', 'grimoire_necro', 'potion_perm_hp'],
        ],
      },
      {
        id: 'cave_shadows',
        name: 'Подземная Пещера «Катакомбы Древних Теней»',
        ex: 112,
        ez: 48,
        ix: 112,
        iz: 160,
        chestLoots: [
          ['bow_orc_composite', 'quiver_poison', 'ring_vitality', 'potion_alch_shadow'],
          ['halberd_guardian', 'bow_elven', 'quiver_ice', 'grimoire_lightning'],
          ['executioner_axe', 'ring_berserk', 'grimoire_water', 'potion_perm_str'],
        ],
      },
    ];

    for (const cDef of caveDefinitions) {
      const ey = getHeight(cDef.ex, cDef.ez);
      const interiorPos = new THREE.Vector3(cDef.ix, -55, cDef.iz);
      const built = createCaveEntranceAndInteriorMesh(
        new THREE.Vector3(cDef.ex, ey, cDef.ez),
        interiorPos
      );
      built.interiorGroup.visible = false; // Скрываем подземный зал, пока игрок на поверхности!
      scene.add(built.surfaceEntrance);
      scene.add(built.interiorGroup);
      obstacles.push({ x: cDef.ex - 3.2, z: cDef.ez, r: 1.5 });
      obstacles.push({ x: cDef.ex + 3.2, z: cDef.ez, r: 1.5 });

      const dungeonChests = built.chests.map((ch, idx) => ({
        ...ch,
        lootTable: cDef.chestLoots[idx % cDef.chestLoots.length],
      }));

      caveDungeons.push({
        id: cDef.id,
        name: cDef.name,
        entranceX: cDef.ex,
        entranceY: ey,
        entranceZ: cDef.ez,
        interiorGroup: built.interiorGroup,
        interiorCenter: interiorPos,
        interiorSpawnPos: built.interiorSpawnPos,
        exitPortalPos: built.exitPortalPos,
        chests: dungeonChests,
      });

      // Спавним 3 подземных пещерных скелета-стража внутри каждой пещеры!
      const skelOffsets: [number, number, string][] = [
        [-5.0, -3.5, 'Пещерный скелет-страж'],
        [5.0, -3.5, 'Древний скелет-чемпион'],
        [0, -10.5, 'Повелитель костей склепа'],
      ];
      for (const [ox, oz, sName] of skelOffsets) {
        const sx = cDef.ix + ox;
        const sz = cDef.iz + oz;
        const sy = -55;
        const sg = createSkeletonModel(textures);
        sg.position.set(sx, sy, sz);
        sg.visible = false;
        scene.add(sg);
        entities.push({
          type: 'skeleton',
          mesh: sg,
          name: sName,
          x: sx,
          y: sy,
          z: sz,
          hp: 85,
          maxHp: 85,
          dmg: 15,
          speed: 6.6,
          xp: 75,
          aggro: 18,
          atkRange: 2.2,
          windupTime: 0.45,
          dead: false,
          attackCd: 0,
          hitFlash: 0,
          wanderAngle: Math.random() * Math.PI * 2,
          wanderTimer: 2,
          state: 'idle',
          stateTimer: 0,
          walkCycle: 0,
          moveBlend: 0,
          inCaveId: cDef.id,
        });
      }
    }

    function getSurfaceOrCaveY(x: number, z: number, inCaveId?: string | null): number {
      if (inCaveId) return -55;
      return getHeight(x, z);
    }

    function applyItemEffect(itemId: string, fromBag = true) {
      const def = ITEM_CATALOG[itemId];
      if (!def) return;

      // Фиксированное повышение характеристик ВЫШЕ 100% (Высшие эликсиры Елены Two Worlds!)
      if (def.fixedMaxHpBonus) {
        player.maxHp += def.fixedMaxHpBonus;
        player.hp = player.maxHp;
      }
      if (def.fixedMaxMpBonus) {
        player.maxMp += def.fixedMaxMpBonus;
        player.mp = player.maxMp;
      }
      if (def.maxHpBonusPercent) {
        player.hpBonusPct += def.maxHpBonusPercent;
        const gain = Math.max(4, Math.round((player.maxHp * def.maxHpBonusPercent) / 100));
        player.maxHp += gain;
        player.hp = Math.min(player.maxHp, player.hp + gain);
      }
      if (def.maxMpBonusPercent) {
        player.mpBonusPct += def.maxMpBonusPercent;
        const gainMp = Math.max(4, Math.round((player.maxMp * def.maxMpBonusPercent) / 100));
        player.maxMp += gainMp;
        player.mp = Math.min(player.maxMp, player.mp + gainMp);
      }
      if (def.agilityBonusPercent) {
        player.agilityBonusPct += def.agilityBonusPercent;
      }
      if (def.damageBonusPercent) {
        player.dmgBonusPct += def.damageBonusPercent;
      }
      if (def.healHp) {
        player.hp = Math.min(player.maxHp, player.hp + def.healHp);
      }
      if (def.healHpPercent) {
        const healAmt = Math.round((player.maxHp * def.healHpPercent) / 100);
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
      }
      if (def.restoreMp) {
        player.mp = Math.min(player.maxMp, player.mp + def.restoreMp);
      }
      // Простые зелья Елены: пополнение Здоровья, Маны и Выносливости ровно до 100%!
      if (def.fullRestoreHp) {
        player.hp = player.maxHp;
      }
      if (def.fullRestoreMp) {
        player.mp = player.maxMp;
      }
      if (def.fullRestoreStamina) {
        player.stamina = player.maxStamina;
      }
      if (def.bonusSkillPoints) {
        player.skillPoints += def.bonusSkillPoints;
        setSkillPoints(player.skillPoints);
      }
      if (def.unlockAllMagic) {
        (['fire', 'water', 'air', 'lightning', 'necro'] as MagicElement[]).forEach((el) => {
          player.magicLevels[el] = (player.magicLevels[el] || 0) + 1;
        });
        setMagicLevels({ ...player.magicLevels });
        spawnParticles(player.x, player.y + 1.8, player.z, 0xffd700, 35);
      }
      if (def.grimoireElement) {
        const el = def.grimoireElement;
        const rankBonus = player.itemRanks[itemId] || 0;
        player.magicLevels[el] = (player.magicLevels[el] || 0) + 1 + rankBonus;
        setMagicLevels({ ...player.magicLevels });
        const elMeta = ELEMENT_INFO[el];
        spawnParticles(player.x, player.y + 1.5, player.z, elMeta.color, 22);
        addLogMessage(
          `📖 ${elMeta.name} прокачана до Ур. ${player.magicLevels[el]}! Нажмите [${elMeta.hotkey}] для заклинания.`
        );
      } else {
        spawnParticles(player.x, player.y + 1.3, player.z, 0x66ff99, 14);
        addLogMessage(`${def.icon} Использовано: ${def.name} (${def.effectText})`);
      }

      sound.playItemPickup(Boolean(def.grimoireElement || def.unlockAllMagic));

      if (fromBag) {
        setInventory((prev) => {
          const cur = prev[itemId] || 0;
          if (cur <= 1) {
            const copy = { ...prev };
            delete copy[itemId];
            return copy;
          }
          return { ...prev, [itemId]: cur - 1 };
        });
      }
    }

    // ⚔️🛡️ ЭКИПИРОВКА ОРУЖИЯ, ЩИТА И КАРТ МАГИИ (Two Worlds / Gothic 3)
    function equipOrUnequipItem(itemId: string) {
      const def = ITEM_CATALOG[itemId];
      if (!def) return;

      if (def.category === 'weapon') {
        if (player.equippedWeapon === itemId) {
          player.equippedWeapon = null;
          setEquippedWeapon(null);
          player.customWeaponHolder.clear();
          addLogMessage(`🗡️ Снято оружие: ${def.name} (Возврат к парным клинкам)`);
        } else {
          player.equippedWeapon = itemId;
          setEquippedWeapon(itemId);
          player.customWeaponHolder.clear();
          player.customWeaponHolder.add(createCustomHandWeaponMesh(itemId));
          player.weaponsDrawn = true;
          sound.playSwordDraw(false);
          const rnk = player.itemRanks[itemId] || 0;
          addLogMessage(
            `⚔️ В правой руке: ${def.icon} ${def.name}${rnk > 0 ? ` [★+${rnk}]` : ''}!`
          );
        }
      } else if (def.category === 'shield') {
        if (player.equippedShield === itemId) {
          player.equippedShield = null;
          setEquippedShield(null);
          player.customShieldHolder.clear();
          addLogMessage(`🛡️ Снят щит: ${def.name}`);
        } else {
          player.equippedShield = itemId;
          setEquippedShield(itemId);
          player.customShieldHolder.clear();
          player.customShieldHolder.add(createCustomHandShieldMesh(itemId));
          player.weaponsDrawn = true;
          sound.playSwordDraw(false);
          const rnk = player.itemRanks[itemId] || 0;
          addLogMessage(
            `🛡️ В левой руке: ${def.icon} ${def.name}${rnk > 0 ? ` [★+${rnk}]` : ''}!`
          );
        }
      } else if (def.category === 'card') {
        if (player.equippedCard === itemId) {
          player.equippedCard = null;
          setEquippedCard(null);
          addLogMessage(`🃏 Снята магическая карта: ${def.name}`);
        } else {
          player.equippedCard = itemId;
          setEquippedCard(itemId);
          if (def.cardElement && (player.magicLevels[def.cardElement] || 0) === 0) {
            player.magicLevels[def.cardElement] = 1;
            setMagicLevels({ ...player.magicLevels });
          }
          sound.playItemPickup(true);
          const rnk = player.itemRanks[itemId] || 0;
          if (def.summonGolemType) {
            addLogMessage(
              `🪨 Выбрана карта призыва: ${def.name}${rnk > 0 ? ` [★+${rnk}]` : ''}! Нажмите [G] для вызова Големов!`
            );
          } else {
            addLogMessage(
              `🃏 Активна магическая карта: ${def.name}${rnk > 0 ? ` [★+${rnk}]` : ''} (Усиливает шары магии и клинок!)`
            );
          }
        }
      } else if (def.category === 'booster') {
        if (player.equippedBooster === itemId) {
          player.equippedBooster = null;
          setEquippedBooster(null);
          addLogMessage(`✨ Снята Карта-Усилитель: ${def.name}`);
        } else {
          player.equippedBooster = itemId;
          setEquippedBooster(itemId);
          sound.playItemPickup(true);
          const rnk = player.itemRanks[itemId] || 0;
          addLogMessage(
            `🃏✨ В слоте Усилителя: ${def.name}${rnk > 0 ? ` [★+${rnk}]` : ''}! Теперь призывается СРАЗУ 2 ГОЛЕМА [G] и 2 ШАРА!`
          );
        }
      } else if (def.category === 'bow') {
        player.equippedBow = itemId;
        setEquippedBow(itemId);
        player.customBowHolder.clear();
        player.customBowHolder.add(createCustomBowMesh(itemId));
        player.bowMode = true;
        setBowModeActive(true);
        player.weaponsDrawn = true;
        sound.playBowDraw();
        const rnk = player.itemRanks[itemId] || 0;
        addLogMessage(
          `🏹 Экипирован лук: ${def.icon} ${def.name}${rnk > 0 ? ` [★+${rnk}]` : ''}! Зажмите ПКМ для снайперского прицела!`
        );
      } else if (def.category === 'quiver') {
        player.equippedQuiver = itemId;
        setEquippedQuiver(itemId);
        sound.playItemPickup(false);
        const rnk = player.itemRanks[itemId] || 0;
        addLogMessage(
          `🎯 Выбран колчан стрел: ${def.icon} ${def.name}${rnk > 0 ? ` [★+${rnk}]` : ''}!`
        );
      } else if (def.category === 'ring') {
        if (player.equippedRing === itemId) {
          player.equippedRing = null;
          setEquippedRing(null);
          addLogMessage(`💍 Снято кольцо: ${def.name}`);
        } else {
          player.equippedRing = itemId;
          setEquippedRing(itemId);
          sound.playItemPickup(true);
          const rnk = player.itemRanks[itemId] || 0;
          addLogMessage(
            `💍 Надето магическое кольцо: ${def.icon} ${def.name}${rnk > 0 ? ` [★+${rnk}]` : ''} (${def.effectText})!`
          );
        }
      } else if (def.category === 'teleport') {
        setBagTab('teleports');
        setBagOpen(true);
      }
    }
    equipItemRef.current = equipOrUnequipItem;

    // 🏹 ПЕРЕКЛЮЧЕНИЕ МЕЖДУ МЕЧАМИ И ЛУКОМ [V] И СМЕНА СТРЕЛ [R]
    toggleBowModeRef.current = () => {
      if (!player.equippedBow) {
        const firstBow = Object.keys(inventoryRef.current).find(
          (k) => (inventoryRef.current[k] || 0) > 0 && ITEM_CATALOG[k]?.category === 'bow'
        );
        if (firstBow) {
          equipOrUnequipItem(firstBow);
          return;
        }
        addLogMessage('🏹 У вас пока нет лука в сумочке!');
        return;
      }
      player.bowMode = !player.bowMode;
      setBowModeActive(player.bowMode);
      if (player.bowMode) {
        player.weaponsDrawn = true;
        sound.playBowDraw();
        addLogMessage(
          `🏹 Режим стрельбы из лука (${ITEM_CATALOG[player.equippedBow]?.name || 'Лук'})! Зажмите ПКМ для снайперского прицела + ЛКМ выстрел!`
        );
      } else {
        player.sniperAiming = false;
        setSniperAiming(false);
        sound.playSwordDraw(false);
        addLogMessage('⚔️ Переключено на оружие ближнего боя!');
      }
    };

    cycleQuiverRef.current = () => {
      const quiverOrder = [
        'quiver_iron',
        'quiver_fire',
        'quiver_poison',
        'quiver_ice',
        'quiver_explosive',
      ];
      const available = quiverOrder.filter((q) => (inventoryRef.current[q] || 0) > 0);
      if (available.length === 0) {
        addLogMessage('🎯 Колчаны со стрелами закончились! Купите в лавке [M] или найдите в пещерах.');
        return;
      }
      const curIdx = player.equippedQuiver ? available.indexOf(player.equippedQuiver) : -1;
      const nextQ = available[(curIdx + 1) % available.length];
      player.equippedQuiver = nextQ;
      setEquippedQuiver(nextQ);
      sound.playItemPickup(false);
      const qDef = ITEM_CATALOG[nextQ];
      addLogMessage(
        `🎯 Выбраны стрелы: ${qDef?.icon} ${qDef?.name} (Осталось: ${inventoryRef.current[nextQ] || 0} шт.)`
      );
    };

    // ⚗️ ВАРКА ЗЕЛИЙ И ЭЛИКСИРОВ В КОТЛЕ ДЛЯ АЛХИМИИ (TWO WORLDS)
    brewRecipeRef.current = (recipeId: string) => {
      const recipe = ALCHEMY_RECIPES.find((r) => r.id === recipeId);
      if (!recipe) return;
      const inv = inventoryRef.current;
      for (const ing of recipe.ingredients) {
        if ((inv[ing.itemId] || 0) < ing.qty) {
          const ingDef = ITEM_CATALOG[ing.itemId];
          addLogMessage(
            `⚗️ Не хватает ингредиента: ${ingDef?.icon || ''} ${ingDef?.name || ing.itemId} (нужно ${ing.qty} шт.)`
          );
          return;
        }
      }
      setInventory((prev) => {
        const next = { ...prev };
        for (const ing of recipe.ingredients) {
          const rem = (next[ing.itemId] || 0) - ing.qty;
          if (rem <= 0) delete next[ing.itemId];
          else next[ing.itemId] = rem;
        }
        next[recipe.resultItemId] = (next[recipe.resultItemId] || 0) + recipe.resultQty;
        return next;
      });
      sound.playCauldronBubble();
      spawnParticles(player.x, player.y + 1.5, player.z, 0x33ff88, 28);
      progressQuest('alchemy_brew', 1);
      player.xp += 65;
      checkAndTriggerLevelUp();
      const resDef = ITEM_CATALOG[recipe.resultItemId];
      addLogMessage(
        `⚗️ Сварено в Котле Алхимии: ${resDef?.icon || '🧪'} ${recipe.name} ×${recipe.resultQty}! (+65 XP)`
      );
    };

    // 🔮 СТАЦИОНАРНЫЕ И ПЕРЕНОСИМЫЕ ТЕЛЕПОРТЫ (TWO WORLDS)
    placePortableBeaconRef.current = () => {
      if ((inventoryRef.current['teleport_stone_portable'] || 0) <= 0) {
        addLogMessage('🔮 У вас нет Переносимого камня телепортации в сумочке!');
        return;
      }
      if (player.inCaveId) {
        addLogMessage('🔮 Переносимый маяк можно устанавливать только под открытым небом!');
        return;
      }
      if (player.portableBeacon) {
        scene.remove(player.portableBeacon.mesh);
      }
      const beaconGroup = new THREE.Group();
      const ringM = new THREE.Mesh(
        new THREE.RingGeometry(0.65, 0.95, 24),
        new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        })
      );
      ringM.rotation.x = -Math.PI / 2;
      ringM.position.y = 0.08;
      beaconGroup.add(ringM);
      const crystalM = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({
          color: 0x33f0ff,
          emissive: 0x00aaff,
          emissiveIntensity: 1.4,
        })
      );
      crystalM.position.y = 0.95;
      beaconGroup.add(crystalM);
      beaconGroup.position.set(player.x, player.y, player.z);
      scene.add(beaconGroup);

      player.portableBeacon = {
        x: Math.round(player.x),
        y: player.y,
        z: Math.round(player.z),
        mesh: beaconGroup,
      };
      setPortableBeaconCoords({ x: Math.round(player.x), z: Math.round(player.z) });
      sound.playTeleportWhoosh();
      spawnParticles(player.x, player.y + 1.2, player.z, 0x00f0ff, 26);
      addLogMessage(
        `🔮 Установлен личный Переносимый Телепорт-Маяк в точке (X: ${Math.round(player.x)}, Z: ${Math.round(player.z)})!`
      );
    };

    teleportToPadRef.current = (padId: string) => {
      if (player.riding) dismountHorse();
      for (const cv of caveDungeons) cv.interiorGroup.visible = false;
      if (padId === 'portable_beacon') {
        if (!player.portableBeacon) {
          addLogMessage('🔮 Сначала установите Переносимый маяк на карте!');
          return;
        }
        player.inCaveId = null;
        setInsideCaveName(null);
        player.x = player.portableBeacon.x;
        player.z = player.portableBeacon.z;
        player.y = getHeight(player.x, player.z);
        player.vx = 0;
        player.vz = 0;
        player.mesh.position.set(player.x, player.y, player.z);
        sound.playTeleportWhoosh();
        spawnParticles(player.x, player.y + 1.5, player.z, 0x00f0ff, 34);
        setBagOpen(false);
        addLogMessage(
          `🔮 Телепортация к вашему Переносимому маяку (X: ${player.portableBeacon.x}, Z: ${player.portableBeacon.z})!`
        );
        return;
      }
      const targetPad = stationaryTeleporters.find((tp) => tp.id === padId);
      if (!targetPad) return;
      player.inCaveId = null;
      setInsideCaveName(null);
      player.x = targetPad.x;
      player.z = targetPad.z + 1.5;
      player.y = getHeight(player.x, player.z);
      player.vx = 0;
      player.vz = 0;
      player.mesh.position.set(player.x, player.y, player.z);
      sound.playTeleportWhoosh();
      spawnParticles(player.x, player.y + 1.5, player.z, 0x00f0ff, 34);
      setBagOpen(false);
      addLogMessage(`🔮 Вы телепортировались: ${targetPad.name}!`);
    };

    // ⚒️ СЛИЯНИЕ ОДИНАКОВЫХ ПРЕДМЕТОВ И КАРТ МАГИИ
    function mergeItem(itemId: string) {
      const def = ITEM_CATALOG[itemId];
      if (!def || !def.mergeable) return;
      setInventory((prev) => {
        const cur = prev[itemId] || 0;
        if (cur < 2) {
          addLogMessage(`Для слияния нужно минимум 2 одинаковых предмета «${def.name}»!`);
          return prev;
        }
        const nextRank = (player.itemRanks[itemId] || 0) + 1;
        player.itemRanks[itemId] = nextRank;
        setItemRanks({ ...player.itemRanks });
        sound.playWeaponUpgradeClang();
        sound.playItemPickup(true);
        spawnParticles(player.x, player.y + 1.5, player.z, 0xffd700, 24);
        progressQuest('forge_master', 1);
        addLogMessage(
          `⚒️ СЛИЯНИЕ TWO WORLDS: ${def.icon} ${def.name} прокачан до ранга ★+${nextRank} (+${
            nextRank * 35
          }% к мощи)!`
        );
        return { ...prev, [itemId]: cur - 1 };
      });
    }
    mergeItemRef.current = mergeItem;

    function mergeAllDuplicates() {
      setInventory((prev) => {
        let mergedCount = 0;
        const nextInv = { ...prev };
        for (const [id, qty] of Object.entries(nextInv)) {
          const def = ITEM_CATALOG[id];
          if (def?.mergeable && qty >= 2) {
            const extra = qty - 1;
            player.itemRanks[id] = (player.itemRanks[id] || 0) + extra;
            nextInv[id] = 1;
            mergedCount += extra;
          }
        }
        if (mergedCount > 0) {
          setItemRanks({ ...player.itemRanks });
          sound.playWeaponUpgradeClang();
          sound.playItemPickup(true);
          spawnParticles(player.x, player.y + 1.6, player.z, 0xffd700, 32);
          progressQuest('forge_master', mergedCount);
          addLogMessage(
            `⚒️ Авто-слияние Two Worlds: объединено однотипных оружий, луков, колец и карт: ${mergedCount}!`
          );
        } else {
          addLogMessage('Нет парных мечей, луков, колец, щитов или карт для слияния.');
        }
        return nextInv;
      });
    }
    mergeAllRef.current = mergeAllDuplicates;

    // ⭐ ПРОКАЧКА НАВЫКОВ ЗА ОЧКИ ОБУЧЕНИЯ (LP — как в Gothic 3!)
    upgradeSkillRef.current = (key) => {
      if (player.skillPoints <= 0) {
        addLogMessage('Недостаточно Очков Навыков (LP)! Повышайте уровень или выполняйте миссии.');
        return;
      }
      player.skillPoints -= 1;
      player.skills[key] += 1;
      setSkillPoints(player.skillPoints);
      setSkills({ ...player.skills });

      if (key === 'strength') {
        player.dmgBonusPct += 12;
        addLogMessage(`💪 Сила (Gothic 3) прокачана до Ур.${player.skills.strength}! (+12% к урону)`);
      } else if (key === 'dexterity') {
        player.agilityBonusPct += 8;
        addLogMessage(
          `🏹 Ловкость прокачана до Ур.${player.skills.dexterity}! (+8% скорость, +7% шанс крита)`
        );
      } else if (key === 'ancientKnowledge') {
        player.maxMp += 25;
        player.mp = player.maxMp;
        player.mpBonusPct += 20;
        addLogMessage(
          `🔮 Древнее Знание Ур.${player.skills.ancientKnowledge}! (+25 Маны, +20% урон заклинаний)`
        );
      } else if (key === 'shieldMastery') {
        player.maxHp += 30;
        player.hp = Math.min(player.maxHp, player.hp + 30);
        addLogMessage(
          `🛡️ Живучесть и Мастер щита Ур.${player.skills.shieldMastery}! (+30 HP и +6% защиты)`
        );
      } else if (key === 'regeneration') {
        addLogMessage(
          `🌿 Регенерация Мастера Ур.${player.skills.regeneration}! (Постоянное восстановление HP и Маны)`
        );
      }
      sound.playItemPickup(true);
      spawnParticles(player.x, player.y + 1.6, player.z, 0xffd700, 24);
    };

    useItemRef.current = (itemId: string) => {
      const def = ITEM_CATALOG[itemId];
      if (!def) return;
      if (
        def.category === 'weapon' ||
        def.category === 'shield' ||
        def.category === 'bow' ||
        def.category === 'quiver' ||
        def.category === 'ring' ||
        def.category === 'booster' ||
        def.category === 'teleport'
      ) {
        equipOrUnequipItem(itemId);
        return;
      }
      if (def.category === 'card' && def.summonGolemType) {
        player.equippedCard = itemId;
        setEquippedCard(itemId);
        summonGolemRef.current(def.summonGolemType);
        return;
      }
      applyItemEffect(itemId, true);
    };

    buyItemRef.current = (itemId: string) => {
      const def = ITEM_CATALOG[itemId];
      if (!def) return;
      if (player.gold < def.buyPrice) {
        addLogMessage(`Недостаточно золота для покупки ${def.name} (${def.buyPrice} зол.)`);
        return;
      }
      player.gold -= def.buyPrice;
      sound.playCoinPickup();
      const qtyToGive = def.category === 'quiver' ? def.quiverBundleSize || 20 : 1;
      addItemToBag(itemId, qtyToGive);
      addLogMessage(`🛒 Куплено в сумочку: ${def.icon} ${def.name} (×${qtyToGive})`);
    };

    sellItemRef.current = (itemId: string) => {
      const def = ITEM_CATALOG[itemId];
      if (!def) return;
      setInventory((prev) => {
        const cur = prev[itemId] || 0;
        if (cur <= 0) return prev;
        player.gold += def.sellPrice;
        sound.playCoinPickup();
        progressQuest('gold', def.sellPrice);
        addLogMessage(`💰 Продано: ${def.icon} ${def.name} (+${def.sellPrice} золота)`);
        if (cur === 1) {
          const copy = { ...prev };
          delete copy[itemId];
          return copy;
        }
        return { ...prev, [itemId]: cur - 1 };
      });
    };

    // 🔥❄️🌪️🪨☠️ ЛЕТЯЩИЕ 3D-ШАРЫ ЗАКЛИНАНИЙ (ФАЙЕРБОЛЫ ВСЕХ 5 СТИХИЙ РАЗНЫХ УРОВНЕЙ) + ПРИЗЫВ ГОЛЕМОВ (TWO WORLDS)
    interface FlyingSpellOrb {
      mesh: THREE.Group;
      element: MagicElement;
      level: number;
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      dmg: number;
      inCaveId: string | null;
      life: number;
    }
    const activeSpellOrbs: FlyingSpellOrb[] = [];

    function summonFriendlyGolems(explicitType?: 'earth' | 'stone' | 'steel') {
      if (dialogOpenRef.current || !gameStartedRef.current || isPausedRef.current) return;

      // Определяем тип Голема из выбранной Карточки Магии Земли или инвентаря
      let golemType: 'earth' | 'stone' | 'steel' = explicitType || 'earth';
      let cardId = 'card_summon_earth_golem';
      const eqCardDef = player.equippedCard ? ITEM_CATALOG[player.equippedCard] : undefined;
      if (!explicitType && eqCardDef?.summonGolemType) {
        golemType = eqCardDef.summonGolemType;
        cardId = eqCardDef.id;
      } else if (!explicitType) {
        if ((inventoryRef.current['card_summon_steel_golem'] || 0) > 0) {
          golemType = 'steel';
          cardId = 'card_summon_steel_golem';
        } else if ((inventoryRef.current['card_summon_stone_golem'] || 0) > 0) {
          golemType = 'stone';
          cardId = 'card_summon_stone_golem';
        }
      }

      // Проверяем активную Карту-Усилитель (Two Worlds Booster Card — удваивает призыв до 2 Големов сразу!)
      let hasDoubleBooster = Boolean(
        player.equippedBooster && ITEM_CATALOG[player.equippedBooster]?.boosterDoubleSummon
      );
      if (!hasDoubleBooster) {
        const invBooster = ['card_booster_double', 'card_booster_power', 'card_booster_mana'].find(
          (bId) => (inventoryRef.current[bId] || 0) > 0
        );
        if (invBooster) {
          player.equippedBooster = invBooster;
          setEquippedBooster(invBooster);
          hasDoubleBooster = true;
        }
      }

      const summonCount = hasDoubleBooster ? 2 : 1;
      const cardRank = player.itemRanks[cardId] || 0;
      const boosterRank = player.equippedBooster ? player.itemRanks[player.equippedBooster] || 0 : 0;
      const boosterPowerPct = player.equippedBooster
        ? (ITEM_CATALOG[player.equippedBooster]?.boosterSpellPowerPct || 25) + boosterRank * 35
        : 0;
      const powerMul =
        (1 + cardRank * 0.35 + boosterPowerPct / 100) *
        (1 + player.skills.ancientKnowledge * 0.2);

      // Удаляем старых призванных големов перед призывом новой пары, чтобы они всегда были рядом со свежими силами
      for (let i = entities.length - 1; i >= 0; i--) {
        if (entities[i].type === 'golem' && entities[i].isFriendlySummon) {
          scene.remove(entities[i].mesh);
          entities.splice(i, 1);
        }
      }

      const golemSpecs = {
        earth: { name: 'Земляной Голем', hp: 260, dmg: 30, speed: 6.8, color: 0x88ff33 },
        stone: { name: 'Каменный Голем', hp: 420, dmg: 46, speed: 6.4, color: 0x33ddff },
        steel: { name: 'Стальной Голем', hp: 650, dmg: 70, speed: 7.2, color: 0xff6600 },
      }[golemType];

      for (let idx = 0; idx < summonCount; idx++) {
        const sideOffset = summonCount === 2 ? (idx === 0 ? -2.4 : 2.4) : 0;
        const fwdAngle = camControl.yaw + Math.PI;
        const rightX = Math.cos(fwdAngle);
        const rightZ = -Math.sin(fwdAngle);
        const gx = player.x + Math.sin(fwdAngle) * 3.6 + rightX * sideOffset;
        const gz = player.z + Math.cos(fwdAngle) * 3.6 + rightZ * sideOffset;
        const gy = player.inCaveId ? -55 : getHeight(gx, gz);

        const gMesh = createGolemModel(golemType, textures);
        gMesh.position.set(gx, gy, gz);
        gMesh.rotation.y = fwdAngle;
        scene.add(gMesh);

        const finalHp = Math.round(golemSpecs.hp * powerMul);
        const finalDmg = Math.round(golemSpecs.dmg * powerMul);
        const rankSuffix = cardRank > 0 ? ` ★+${cardRank}` : '';

        entities.push({
          type: 'golem',
          golemType,
          isFriendlySummon: true,
          mesh: gMesh,
          name: `🗿 ${golemSpecs.name}${summonCount === 2 ? ` #${idx + 1}` : ''}${rankSuffix}`,
          x: gx,
          y: gy,
          z: gz,
          hp: finalHp,
          maxHp: finalHp,
          dmg: finalDmg,
          speed: golemSpecs.speed,
          xp: 0,
          aggro: 38,
          atkRange: 3.1,
          windupTime: 0.48,
          dead: false,
          attackCd: 0,
          hitFlash: 0,
          wanderAngle: fwdAngle,
          wanderTimer: 2,
          state: 'idle',
          stateTimer: 0,
          walkCycle: idx * 1.5,
          moveBlend: 0,
          inCaveId: player.inCaveId || undefined,
        });

        spawnParticles(gx, gy + 1.5, gz, golemSpecs.color, 26);
      }

      sound.playSpellCast('lightning');
      progressQuest('summon_golems', summonCount);
      addLogMessage(
        hasDoubleBooster
          ? `🪨✨ КАРТА-УСИЛИТЕЛЬ ×2: Призваны СРАЗУ 2 ${golemSpecs.name}а (${Math.round(
              golemSpecs.hp * powerMul
            )} HP, ${Math.round(golemSpecs.dmg * powerMul)} урон)!`
          : `🪨 Призван защитник: ${golemSpecs.name}!`
      );
    }
    summonGolemRef.current = summonFriendlyGolems;

    function castElementalSpell(el: MagicElement) {
      if (dialogOpenRef.current || !gameStartedRef.current || isPausedRef.current) return;
      const lvl = Math.max(1, player.magicLevels[el] || 1);
      const meta = ELEMENT_INFO[el];
      if (player.spellCd > 0) return;

      const boosterDef = player.equippedBooster ? ITEM_CATALOG[player.equippedBooster] : undefined;
      const manaDiscount = boosterDef?.boosterManaDiscountPct || 0;
      const actualMpCost = Math.max(4, Math.round(meta.mpCost * (1 - manaDiscount / 100)));

      if (player.mp < actualMpCost) {
        addLogMessage(`💧 Недостаточно маны для заклинания «${meta.spellName}» (${actualMpCost} MP)`);
        return;
      }

      player.mp -= actualMpCost;
      player.spellCd = 0.52;
      player.attackAnim = 1;
      sound.playSpellCast(el);

      if (!player.riding) {
        player.facingAngle = camControl.yaw + Math.PI;
        player.mesh.rotation.y = player.facingAngle;
      }

      if (el === 'water') {
        const healAmt = 18 + lvl * 10;
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
      } else if (el === 'air') {
        player.stamina = player.maxStamina;
      }

      const cardIdByEl: Record<MagicElement, string> = {
        fire: 'card_fire',
        water: 'card_water',
        air: 'card_air',
        lightning: 'card_lightning',
        necro: 'card_necro',
      };
      const matchingCardId = cardIdByEl[el];
      const cardRank = player.itemRanks[matchingCardId] || 0;
      const effectiveOrbLevel = lvl + cardRank;
      const boosterRank = player.equippedBooster ? player.itemRanks[player.equippedBooster] || 0 : 0;
      const boosterPct = boosterDef
        ? (boosterDef.boosterSpellPowerPct || 25) + boosterRank * 35
        : 0;
      const knowledgeBonus = player.skills.ancientKnowledge * 0.22;

      const orbDmg = Math.round(
        (32 + effectiveOrbLevel * 20 + player.level * 6) *
          (1 + player.dmgBonusPct / 100 + boosterPct / 100 + knowledgeBonus)
      );

      // Если активна Карта-Усилитель ×2 — выпускаем СРАЗУ 2 АТАКУЮЩИХ ШАРА (ФАЙЕРБОЛА)!
      const isDoubleCast = Boolean(boosterDef?.boosterDoubleSummon);
      const orbCount = isDoubleCast ? 2 : 1;

      const cp = Math.cos(camControl.pitch);
      const dirX = -Math.sin(camControl.yaw) * cp;
      const dirY = -Math.sin(camControl.pitch) + 0.02;
      const dirZ = -Math.cos(camControl.yaw) * cp;
      const len = Math.hypot(dirX, dirY, dirZ) || 1;
      const speed = 56;
      const rightX = Math.cos(camControl.yaw);
      const rightZ = -Math.sin(camControl.yaw);

      for (let i = 0; i < orbCount; i++) {
        const sideShift = orbCount === 2 ? (i === 0 ? -0.55 : 0.55) : 0;
        const orbMesh = createSpellOrbMesh(el, effectiveOrbLevel);
        const sx = player.x + (dirX / len) * 1.35 + rightX * sideShift;
        const sy = player.y + (player.riding ? 2.5 : 1.65);
        const sz = player.z + (dirZ / len) * 1.35 + rightZ * sideShift;
        orbMesh.position.set(sx, sy, sz);
        scene.add(orbMesh);

        activeSpellOrbs.push({
          mesh: orbMesh,
          element: el,
          level: effectiveOrbLevel,
          x: sx,
          y: sy,
          z: sz,
          vx: (dirX / len) * speed,
          vy: (dirY / len) * speed,
          vz: (dirZ / len) * speed,
          dmg: orbDmg,
          inCaveId: player.inCaveId,
          life: 2.4,
        });
      }

      spawnParticles(player.x, player.y + 1.6, player.z, meta.color, 18);
      addLogMessage(
        `🔥 ${meta.spellName} (Ур.${effectiveOrbLevel})${
          isDoubleCast ? ' [×2 Двойной Шар Усилителя!]' : ''
        } — Урон: ${orbDmg}!`
      );
    }
    castSpellRef.current = castElementalSpell;

    // ============================================================
    // 9. БОЙ И КВЕСТЫ (С бонусным дождём монет и охотничьими трофеями!)
    // ============================================================
    function handleEntityDeath(e: GameEntity) {
      if (e.dead) return;
      e.dead = true;
      scene.remove(e.mesh);
      player.xp += e.xp;
      addLogMessage(`💀 Побеждён ${e.name}! +${e.xp} опыта`);
      spawnDrop(e.x, e.y, e.z, Math.floor(Math.random() * 15) + 5);

      // Оставляем охотничьи трофеи, оружие, щиты и магические карты на земле!
      if (e.type === 'wolf') {
        spawnCollectibleNode(e.x, e.z, 'wolf_heart');
        progressQuest('wolves', 1);
      } else if (e.type === 'bear') {
        spawnCollectibleNode(e.x, e.z, 'bear_meat');
      } else if (e.type === 'pheasant') {
        spawnCollectibleNode(e.x, e.z, 'bird_pheasant');
      } else if (e.type === 'grouse') {
        spawnCollectibleNode(e.x, e.z, 'bird_grouse');
      } else if (e.type === 'partridge') {
        spawnCollectibleNode(e.x, e.z, 'bird_partridge');
      } else if (e.type === 'skeleton') {
        if (e.inCaveId) {
          progressQuest('cave_skeletons', 1);
        }
        // 💀 СО СКЕЛЕТА ВЫПАДАЕТ: Его Меч + Его Щит + Рандомная Магическая Карта или Кольцо/Стрелы!
        if (!e.inCaveId) {
          spawnCollectibleNode(e.x - 0.65, e.z - 0.3, 'skeleton_sword');
          spawnCollectibleNode(e.x + 0.65, e.z - 0.3, 'skeleton_shield');
          const magicCards = ['card_necro', 'card_lightning', 'card_fire', 'card_water', 'card_air'];
          const randomCard = magicCards[Math.floor(Math.random() * magicCards.length)];
          spawnCollectibleNode(e.x, e.z + 0.65, randomCard);
          addLogMessage(
            `💀 Со скелета выпали: Древний клинок, Костяной щит и ${ITEM_CATALOG[randomCard].name}!`
          );
        } else {
          // В подземной пещере трофеи сразу попадают в сумочку или выпадают монетами, чтобы удобно собирать на каменном полу!
          const caveDrops = ['skeleton_sword', 'quiver_iron', 'ring_precision', 'card_necro'];
          const pickDrop = caveDrops[Math.floor(Math.random() * caveDrops.length)];
          addItemToBag(pickDrop, 1);
          spawnDrop(e.x, e.y + 0.5, e.z, 35);
          addLogMessage(
            `💀 Пещерный скелет повержен! В сумочку: ${ITEM_CATALOG[pickDrop]?.icon} ${ITEM_CATALOG[pickDrop]?.name} и +35 💰!`
          );
        }
      } else if (e.type === 'orc') {
        // 👹 С ОРКА ВЫПАДАЕТ: Шипастая булава Силы «Краш-Варрок» + Эликсир Орочьей Силы!
        spawnCollectibleNode(e.x - 0.5, e.z, 'orc_mace');
        if (Math.random() < 0.65) {
          spawnCollectibleNode(e.x + 0.55, e.z + 0.3, 'orc_strength_totem');
        }
        addLogMessage('🔨 С орка выпала Шипастая булава Силы «Краш-Варрок»!');
        progressQuest('orcs', 1);
      } else if (e.type === 'troll') {
        // 👑 С ЧЁРНОГО ТРОЛЛЯ ВЫПАДАЕТ МЕГАБОНУС: Молот Титана + Бастион Тролля + Пылающее Сердце Тролля + Дождь золота!
        spawnCollectibleNode(e.x - 0.9, e.z, 'troll_hammer');
        spawnCollectibleNode(e.x + 0.9, e.z, 'troll_shield');
        spawnCollectibleNode(e.x, e.z + 0.9, 'troll_mega_heart');
        for (let c = 0; c < 16; c++) {
          spawnDrop(
            e.x + (Math.random() - 0.5) * 2.2,
            e.y + 1.5,
            e.z + (Math.random() - 0.5) * 2.2,
            25
          );
        }
        sound.playCoinPickup();
        addLogMessage(
          '👑 МЕГАБОНУС ЧЁРНОГО ТРОЛЛЯ: Молот Титана, Бастион Тролля, Пылающее Сердце (+5 LP) и 400 золота!'
        );
        progressQuest('troll', 1);
      }

      checkAndTriggerLevelUp();
    }

    // ✨🌟 ЭФФЕКТ ПРОСВЕТЛЕНИЯ ПРИ ПОВЫШЕНИИ УРОВНЯ (Луч света с небес + частицы + звук озарения Two Worlds!)
    function triggerLevelUpEnlightenment(newLevel: number) {
      levelUpEffectTimer = 3.2;
      levelUpBeamGroup.visible = true;
      levelUpBeamGroup.position.set(player.x, player.y, player.z);
      sound.playEnlightenmentLevelUp();
      spawnParticles(player.x, player.y + 1.8, player.z, 0x88f4ff, 36);
      spawnParticles(player.x, player.y + 1.2, player.z, 0xffea70, 28);
      setLevelUpBanner({
        level: newLevel,
        title: `✨ ПРОСВЕТЛЕНИЕ! УРОВЕНЬ ${newLevel} (+2 LP • Сила и Дух возросли)`,
      });
      setTimeout(() => {
        setLevelUpBanner(null);
      }, 4200);
    }

    function checkAndTriggerLevelUp() {
      while (player.xp >= player.xpNext) {
        player.level++;
        player.xp -= player.xpNext;
        player.xpNext = Math.floor(player.xpNext * 1.45);
        player.maxHp += 25;
        player.hp = player.maxHp;
        player.maxMp += 15;
        player.mp = player.maxMp;
        player.maxStamina += 12;
        player.stamina = player.maxStamina;
        player.skillPoints += 2;
        setSkillPoints(player.skillPoints);
        addLogMessage(
          `✨ ПРОСВЕТЛЕНИЕ: УРОВЕНЬ ${player.level}! +2 Очка Навыков (LP) в Сумочке [I]!`
        );
        triggerLevelUpEnlightenment(player.level);
      }
    }

    // Обработчик квестовых действий в диалогах (Колечко Елены, Бесконечные сборы трав Елены, Дрова Брома, Удочка Фарима)
    handleDialogActionRef.current = (action) => {
      const inv = inventoryRef.current;

      if (action === 'turn_in_ring') {
        if ((inv['elena_ring'] || 0) <= 0) {
          return 'Путешественник, у тебя в сумочке пока нет моего золотого колечка с сапфиром. Поищи его в высокой траве на южной поляне у деревни (координаты около X: 52..68, Z: -62..-74)!';
        }
        setInventory((prev) => {
          const next = { ...prev };
          if ((next['elena_ring'] || 0) <= 1) delete next['elena_ring'];
          else next['elena_ring'] -= 1;
          next['potion_perm_hp'] = (next['potion_perm_hp'] || 0) + 1;
          return next;
        });
        player.gold += 180;
        player.xp += 220;
        player.skillPoints += 1;
        setSkillPoints(player.skillPoints);
        progressQuest('elena_ring', 1);
        for (let c = 0; c < 10; c++) {
          spawnDrop(
            player.x + (Math.random() - 0.5) * 1.8,
            player.y + 1.4,
            player.z + (Math.random() - 0.5) * 1.8,
            18
          );
        }
        sound.playCoinPickup();
        checkAndTriggerLevelUp();
        addLogMessage(
          '💍 Вы вернули колечко Елене! Награда: +180 💰, +220 XP, +1 LP и Высший эликсир Жизни (ХП выше 100%)!'
        );
        return 'Свет Инноса, ты нашёл моё золотое колечко с сапфиром! Прими эти 180 золотых монет, мой Высший эликсир Жизни (повышает ХП выше 100% навсегда) и благословение!';
      }

      if (action === 'turn_in_fishing_rod') {
        if ((inv['fishing_rod'] || 0) <= 0) {
          return 'Друг, ты ещё не нашёл мою удочку! Ступай на запад от нашего костра к берегу озера (X: 14, Z: -18) — я обронил её там, когда убегал от зверей!';
        }
        setInventory((prev) => {
          const next = { ...prev };
          if ((next['fishing_rod'] || 0) <= 1) delete next['fishing_rod'];
          else next['fishing_rod'] -= 1;
          return next;
        });
        player.gold += 170;
        player.xp += 210;
        player.skillPoints += 1;
        setSkillPoints(player.skillPoints);
        progressQuest('fishing_rod', 1);
        for (let c = 0; c < 9; c++) {
          spawnDrop(
            player.x + (Math.random() - 0.5) * 1.8,
            player.y + 1.4,
            player.z + (Math.random() - 0.5) * 1.8,
            16
          );
        }
        sound.playCoinPickup();
        checkAndTriggerLevelUp();
        addLogMessage(
          '🎣 Вы вернули удочку рыбаку Фариму! Награда: +170 💰, +210 XP и +1 LP!'
        );
        return 'Глазам не верю — моя родная удочка! Спасибо, что отбил её у медведей и волков! Держи 170 золотых монет!';
      }

      if (action === 'turn_in_firewood') {
        const haveWood = inv['firewood_bundle'] || 0;
        if (haveWood <= 0) {
          return 'Путник, собери сначала сухие дрова вокруг нашей поляны и опушки леса! Связки дров лежат прямо у деревьев неподалёку от костра.';
        }
        const giveCount = Math.min(haveWood, 3);
        setInventory((prev) => {
          const next = { ...prev };
          if ((next['firewood_bundle'] || 0) <= giveCount) delete next['firewood_bundle'];
          else next['firewood_bundle'] -= giveCount;
          next['roasted_campfire_meat'] = (next['roasted_campfire_meat'] || 0) + 2;
          return next;
        });
        const goldReward = giveCount * 55;
        const xpReward = giveCount * 75;
        player.gold += goldReward;
        player.xp += xpReward;
        progressQuest('firewood', 3);
        // Подбрасываем свежие связки дров в лесу для следующих походов к костру
        spawnCollectibleNode(
          campX + (Math.random() - 0.5) * 26,
          campZ + (Math.random() - 0.5) * 26,
          'firewood_bundle'
        );
        for (let c = 0; c < 8; c++) {
          spawnDrop(
            player.x + (Math.random() - 0.5) * 1.6,
            player.y + 1.3,
            player.z + (Math.random() - 0.5) * 1.6,
            15
          );
        }
        sound.playCoinPickup();
        checkAndTriggerLevelUp();
        addLogMessage(
          `🪵 Вы отдали дрова Брому! Награда: +${goldReward} 💰, +${xpReward} XP и 2 порции румяного мяса с костра!`
        );
        return `Отличные сухие поленья! Смотри, как ярко вспыхнул наш костёр! Держи ${goldReward} золотых монет и две сочные порции прожаренного мяса прямо с вертела!`;
      }

      if (action === 'elena_herb_quest') {
        const curQ = elenaHerbQuestRef.current;
        const haveHerb = inv[curQ.herbId] || 0;

        if (haveHerb >= curQ.requiredQty) {
          // Игрок принёс нужные травы! Елена варит зелья Two Worlds (1 Высший эликсир >100% + 1 Простое зелье до 100%) + даёт монеты и генерирует НОВЫЙ бесконечный квест!
          const permDef = ITEM_CATALOG[curQ.permPotionId];
          const restDef = ITEM_CATALOG[curQ.restorePotionId];

          setInventory((prev) => {
            const next = { ...prev };
            const rem = (next[curQ.herbId] || 0) - curQ.requiredQty;
            if (rem <= 0) delete next[curQ.herbId];
            else next[curQ.herbId] = rem;
            next[curQ.permPotionId] = (next[curQ.permPotionId] || 0) + 1;
            next[curQ.restorePotionId] = (next[curQ.restorePotionId] || 0) + 1;
            return next;
          });

          player.gold += curQ.rewardGold;
          player.xp += curQ.rewardXp;
          sound.playCoinPickup();
          for (let c = 0; c < 7; c++) {
            spawnDrop(
              player.x + (Math.random() - 0.5) * 1.6,
              player.y + 1.3,
              player.z + (Math.random() - 0.5) * 1.6,
              15
            );
          }

          // Спавним новые кустики трав на лугах, чтобы бесконечные квесты Елены всегда были обеспечены травами!
          for (let s = 0; s < 3; s++) {
            const a = Math.random() * Math.PI * 2;
            const r = 18 + Math.random() * 85;
            spawnCollectibleNode(player.x + Math.cos(a) * r, player.z + Math.sin(a) * r, curQ.herbId);
          }

          const nextQ = generateNextElenaHerbQuest(curQ.questNum + 1);
          elenaHerbQuestRef.current = nextQ;
          setElenaHerbQuest(nextQ);

          setQuests((prev) =>
            prev.map((q) =>
              q.id === 'elena_herbs'
                ? {
                    ...q,
                    text: `🌿 Елена (#${nextQ.questNum}): ${nextQ.herbName}`,
                    target: nextQ.requiredQty,
                    current: 0,
                    done: false,
                  }
                : q
            )
          );

          checkAndTriggerLevelUp();
          addLogMessage(
            `🧪 Елена сварила зелья из сбора «${curQ.herbName}»! Получено: ${permDef?.name}, ${restDef?.name}, +${curQ.rewardGold} 💰 и +${curQ.rewardXp} XP!`
          );

          return `Чудесный сбор! Из травы «${curQ.herbName}» (×${curQ.requiredQty}) я сварила эликсиры! Твоя доля в сумочке [I]: «${permDef?.name}» (повышает выше 100% навсегда!), «${restDef?.name}» (пополняет до 100%) и ${curQ.rewardGold} золотых монет! А вот следующее задание #${nextQ.questNum}: принеси мне ${nextQ.herbIcon} ${nextQ.herbName} ×${nextQ.requiredQty}!`;
        } else {
          // Сообщаем игроку текущее процедурное задание Елены
          const permDef = ITEM_CATALOG[curQ.permPotionId];
          const restDef = ITEM_CATALOG[curQ.restorePotionId];
          setQuests((prev) =>
            prev.map((q) =>
              q.id === 'elena_herbs'
                ? {
                    ...q,
                    text: `🌿 Елена (#${curQ.questNum}): ${curQ.herbName}`,
                    target: curQ.requiredQty,
                    current: haveHerb,
                    done: false,
                  }
                : q
            )
          );
          addLogMessage(
            `🌿 Задание Елены #${curQ.questNum}: принесите ${curQ.herbIcon} ${curQ.herbName} (${haveHerb}/${curQ.requiredQty} шт.)`
          );
          return `Сейчас для алхимического заказа #${curQ.questNum} мне требуется ${curQ.herbName} в количестве ${curQ.requiredQty} штук (у тебя в сумочке сейчас: ${haveHerb}). Как принесёшь — сварим «${permDef?.name}» (повышает характеристику выше 100%!) и «${restDef?.name}» (восполняет до 100%), плюс заплачу ${curQ.rewardGold} золотых монет!`;
        }
      }

      // 🔮 ОБУЧЕНИЕ У 5 МАГОВ-НАСТАВНИКОВ СООБЩЕСТВ (За монеты и очки опыта!)
      if (
        action === 'train_mage_fire' ||
        action === 'train_mage_water' ||
        action === 'train_mage_air' ||
        action === 'train_mage_earth' ||
        action === 'train_mage_necro'
      ) {
        const mageMap: Record<
          string,
          { el: MagicElement; costGold: number; cardReward: string; extraReward?: string; title: string }
        > = {
          train_mage_fire: {
            el: 'fire',
            costGold: 80,
            cardReward: 'card_fire',
            extraReward: 'card_booster_double',
            title: 'Магия Огня и Файербола [1]',
          },
          train_mage_water: {
            el: 'water',
            costGold: 80,
            cardReward: 'card_water',
            title: 'Магия Воды и Ледяного Шара [2]',
          },
          train_mage_air: {
            el: 'air',
            costGold: 80,
            cardReward: 'card_air',
            extraReward: 'card_booster_mana',
            title: 'Магия Воздуха и Штормового Шара [3]',
          },
          train_mage_earth: {
            el: 'lightning',
            costGold: 90,
            cardReward: 'card_summon_stone_golem',
            extraReward: 'card_booster_double',
            title: 'Магия Земли и Призыв Големов [4 / G]',
          },
          train_mage_necro: {
            el: 'necro',
            costGold: 90,
            cardReward: 'card_necro',
            extraReward: 'card_summon_steel_golem',
            title: 'Некромагия и Магия Ядов [5]',
          },
        };
        const mCfg = mageMap[action];
        if (player.gold < mCfg.costGold && player.xp < 50 && player.skillPoints <= 0) {
          // Даже если у игрока мало монет в начале, наставник дарит первое посвящение за храбрость!
          player.gold = 0;
        } else if (player.gold >= mCfg.costGold) {
          player.gold -= mCfg.costGold;
        } else if (player.xp >= 50) {
          player.xp -= 50;
        }

        player.magicLevels[mCfg.el] = (player.magicLevels[mCfg.el] || 1) + 1;
        setMagicLevels({ ...player.magicLevels });
        player.maxMp += 25;
        player.mp = player.maxMp;
        player.mpBonusPct += 15;
        player.skills.ancientKnowledge += 1;
        setSkills({ ...player.skills });

        addItemToBag(mCfg.cardReward, 1);
        if (mCfg.extraReward) {
          addItemToBag(mCfg.extraReward, 1);
        }
        if (action === 'train_mage_earth') {
          addItemToBag('card_summon_earth_golem', 1);
          addItemToBag('card_summon_steel_golem', 1);
          player.equippedCard = 'card_summon_stone_golem';
          setEquippedCard('card_summon_stone_golem');
          player.equippedBooster = 'card_booster_double';
          setEquippedBooster('card_booster_double');
        }

        sound.playEnlightenmentLevelUp();
        spawnParticles(player.x, player.y + 1.8, player.z, ELEMENT_INFO[mCfg.el].color, 34);
        progressQuest('village_artisans', 1);
        addLogMessage(
          `🔮 Изучено у Наставника: ${mCfg.title} (Ур.${player.magicLevels[mCfg.el]})! +25 Маны и магические карточки в сумочке [I]!`
        );
        return null;
      }

      // 👢 ГИЛЬДИЯ САПОЖНИКОВ: Сапожник Криспен
      if (action === 'cobbler_craft') {
        if (player.gold >= 60) {
          player.gold -= 60;
        }
        addItemToBag('cobbler_boots', 1);
        player.agilityBonusPct += 18;
        player.maxHp += 35;
        player.hp = player.maxHp;
        sound.playItemPickup(true);
        spawnParticles(player.x, player.y + 1.4, player.z, 0xffd066, 26);
        progressQuest('village_artisans', 1);
        addLogMessage(
          '👢 Мастер Криспен сшил вам «Сапоги Скорохода»! Скорость бега +18% и +35 макс. HP навсегда!'
        );
        return null;
      }

      // 🍲 ГИЛЬДИЯ ПОВАРОВ: Шеф-повар Гаспар
      if (action === 'cook_feast') {
        addItemToBag('royal_stew', 2);
        player.maxHp += 40;
        player.hp = player.maxHp;
        player.mp = player.maxMp;
        player.dmgBonusPct += 10;
        sound.playItemPickup(true);
        spawnParticles(player.x, player.y + 1.5, player.z, 0xff8844, 26);
        progressQuest('village_artisans', 1);
        addLogMessage(
          '🍲 Шеф-повар Гаспар угостил Королевским Жарким! +40 макс. HP, +10% к Силе и 2 порции в сумочку!'
        );
        return null;
      }

      // 🐴 ГИЛЬДИЯ КОНЮХОВ: Конюх Гюнтер
      if (action === 'stablehand_train') {
        addItemToBag('quiver_fire', 20);
        addItemToBag('quiver_iron', 25);
        player.maxStamina += 30;
        player.stamina = player.maxStamina;
        player.xp += 120;
        sound.playHorseNeigh();
        checkAndTriggerLevelUp();
        progressQuest('village_artisans', 1);
        addLogMessage(
          '🐴 Конюх Гюнтер укрепил вашу выносливость (+30), выдал колчаны стрел и +120 опыта!'
        );
        return null;
      }

      // ⛏️ АРТЕЛЬ РАБОТЯГ: Каменотёс Борк
      if (action === 'worker_reward') {
        addItemToBag('card_summon_stone_golem', 1);
        addItemToBag('card_booster_double', 1);
        player.xp += 140;
        sound.playItemPickup(true);
        checkAndTriggerLevelUp();
        progressQuest('village_artisans', 1);
        addLogMessage(
          '⛏️ Работяга Борк подарил вам Карту Призыва Каменного Голема и Карту-Усилитель ×2 (+140 XP)!'
        );
        return null;
      }

      return null;
    };

    function progressQuest(id: string, amount = 1) {
      setQuests((prev) =>
        prev.map((q) => {
          if (q.id !== id || q.done) return q;
          const nextCur = Math.min(q.target, q.current + amount);
          const nowDone = nextCur >= q.target;
          if (nowDone && !q.done) {
            player.gold += 150;
            player.skillPoints += 1;
            setSkillPoints(player.skillPoints);
            sound.playCoinPickup();
            // Бонусный фонтан золотых монет в конце прохождения миссии!
            for (let c = 0; c < 8; c++) {
              spawnDrop(
                player.x + (Math.random() - 0.5) * 1.5,
                player.y + 1.2,
                player.z + (Math.random() - 0.5) * 1.5,
                15
              );
            }
            addLogMessage(
              `🏆 Миссия выполнена: ${q.text}! Бонус +150 золота, +1 Очко Навыков (LP) и дождь монет!`
            );
          }
          return { ...q, current: nextCur, done: nowDone };
        })
      );
    }

    let shakeAmount = 0;
    let trailTime = 0;

    // 🏹 ЛЕТЯЩИЕ 3D-СТРЕЛЫ ИЗ ЛУКА (Стальные, Огненные, Ядовитые, Ледяные, Взрывные)
    interface FlyingArrow {
      mesh: THREE.Group;
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      dmg: number;
      arrowType: 'iron' | 'fire' | 'poison' | 'ice' | 'explosive';
      isSniperShot: boolean;
      inCaveId: string | null;
      life: number;
    }
    const activeArrows: FlyingArrow[] = [];

    function shootBowArrow() {
      if (player.attackCd > 0 || dialogOpenRef.current || isPausedRef.current) return;
      const bowId = player.equippedBow || 'bow_hunter';
      const bowDef = ITEM_CATALOG[bowId];
      if (!bowDef) {
        addLogMessage('🏹 Сначала экипируйте лук в сумочке [I]!');
        return;
      }

      // Проверяем наличие стрел в выбранном колчане (или автоматически переключаем на доступный колчан)
      let quiverId = player.equippedQuiver || 'quiver_iron';
      const inv = inventoryRef.current;
      if ((inv[quiverId] || 0) <= 0) {
        const fallbackQuiver = [
          'quiver_iron',
          'quiver_fire',
          'quiver_poison',
          'quiver_ice',
          'quiver_explosive',
        ].find((q) => (inv[q] || 0) > 0);
        if (!fallbackQuiver) {
          addLogMessage('🎯 Стрелы закончились! Купите колчан у Хакона [M] или найдите в сундуках пещер.');
          return;
        }
        quiverId = fallbackQuiver;
        player.equippedQuiver = quiverId;
        setEquippedQuiver(quiverId);
      }

      const quiverDef = ITEM_CATALOG[quiverId];
      const arrowType = quiverDef?.arrowType || 'iron';

      // Списываем 1 стрелу из колчана
      setInventory((prev) => {
        const cur = prev[quiverId] || 0;
        if (cur <= 1) {
          const next = { ...prev };
          delete next[quiverId];
          return next;
        }
        return { ...prev, [quiverId]: cur - 1 };
      });

      player.weaponsDrawn = true;
      player.bowMode = true;
      setBowModeActive(true);
      player.attackCd = 0.42;
      player.attackAnim = 1;
      sound.playBowRelease();

      // Поворачиваем героя строго по линии прицеливания камеры
      if (!player.riding) {
        player.facingAngle = camControl.yaw + Math.PI;
        player.mesh.rotation.y = player.facingAngle;
      }

      const bowRank = player.itemRanks[bowId] || 0;
      const quiverRank = player.itemRanks[quiverId] || 0;
      const ringId = player.equippedRing;
      const ringDef = ringId ? ITEM_CATALOG[ringId] : undefined;
      const ringRank = ringId ? player.itemRanks[ringId] || 0 : 0;

      const bowAtk = Math.round((bowDef.bowBaseDmg || 28) * (1 + bowRank * 0.35));
      const arrowAtk = Math.round((quiverDef?.arrowBonusDmg || 12) * (1 + quiverRank * 0.35));
      const ringRangedBonusPct = (ringDef?.ringRangedBonusPct || 0) * (1 + ringRank * 0.35);
      const dexBonusPct = player.skills.dexterity * 12;
      const chargeBonus = player.sniperAiming ? 1.35 + (player.bowDrawCharge / 100) * 0.45 : 1.0;

      const totalArrowDmg = Math.round(
        (bowAtk + arrowAtk + player.level * 5) *
          (1 + (player.dmgBonusPct + ringRangedBonusPct + dexBonusPct) / 100) *
          chargeBonus
      );

      // Направление полёта стрелы — точно по перекрестию прицела (с учётом вертикального угла pitch!)
      const cp = Math.cos(camControl.pitch);
      const dirX = -Math.sin(camControl.yaw) * cp;
      const dirY = -Math.sin(camControl.pitch) + 0.04;
      const dirZ = -Math.cos(camControl.yaw) * cp;
      const len = Math.hypot(dirX, dirY, dirZ) || 1;
      const speed = 72;

      const arrowMesh = createArrowProjectileMesh(arrowType);
      const spawnX = player.x + (dirX / len) * 1.1;
      const spawnY = player.y + (player.riding ? 2.5 : 1.65);
      const spawnZ = player.z + (dirZ / len) * 1.1;
      arrowMesh.position.set(spawnX, spawnY, spawnZ);
      arrowMesh.lookAt(spawnX + dirX * 10, spawnY + dirY * 10, spawnZ + dirZ * 10);
      scene.add(arrowMesh);

      activeArrows.push({
        mesh: arrowMesh,
        x: spawnX,
        y: spawnY,
        z: spawnZ,
        vx: (dirX / len) * speed,
        vy: (dirY / len) * speed,
        vz: (dirZ / len) * speed,
        dmg: totalArrowDmg,
        arrowType,
        isSniperShot: player.sniperAiming,
        inCaveId: player.inCaveId,
        life: 2.6,
      });

      player.bowDrawCharge = 25;
      setBowDrawPower(25);
    }

    function playerAttack() {
      if (
        player.attackCd > 0 ||
        player.rolling ||
        dialogOpenRef.current ||
        isPausedRef.current
      )
        return;

      // Если мы прицеливаемся через ПКМ (как в Skyrim) или включён режим лука [V] — стреляем из лука!
      if (player.sniperAiming || player.bowMode) {
        shootBowArrow();
        return;
      }

      if (!player.weaponsDrawn) {
        player.weaponsDrawn = true;
      }

      if (player.comboResetTimer > 0) {
        player.comboStep = (player.comboStep % 3) + 1;
      } else {
        player.comboStep = 1;
      }

      const step = player.comboStep;
      player.comboResetTimer = 1.1;
      player.attackCd = 0.45;
      player.attackAnim = 1;
      trailTime = 0.3;
      sound.playSwordSwing();

      if (!player.riding) {
        player.facingAngle = camControl.yaw + Math.PI;
      }

      const attackDir = new THREE.Vector3(-Math.sin(camControl.yaw), 0, -Math.cos(camControl.yaw));
      const reach = player.riding ? 6 : 5.5;
      const dmgMultiplier = step === 3 ? 1.45 : step === 2 ? 1.15 : 1.0;

      let hitAny = false;
      for (const e of entities) {
        if (e.dead || e.type === 'npc' || e.type === 'horse' || e.isFriendlySummon) continue;
        const dx = e.x - player.x;
        const dz = e.z - player.z;
        const dist = Math.hypot(dx, dz);
        if (dist > reach) continue;
        const toE = new THREE.Vector3(dx, 0, dz).normalize();
        if (toE.dot(attackDir) < -0.17) continue;

        // Расчёт урона с учётом надетого оружия (Клинок скелета / Булава орка / Молот Тролля), ранга слияния Two Worlds (★) и навыков Gothic 3!
        let wepAtk = 0;
        let wepStrPct = 0;
        if (player.equippedWeapon && ITEM_CATALOG[player.equippedWeapon]) {
          const wDef = ITEM_CATALOG[player.equippedWeapon];
          const wRank = player.itemRanks[player.equippedWeapon] || 0;
          const rankMul = 1 + wRank * 0.35;
          wepAtk = Math.round((wDef.weaponBaseAtk || 0) * rankMul);
          wepStrPct = Math.round((wDef.weaponStrBonusPct || 0) * rankMul);
        }

        // Бонус стихийного зачарования от активной Магической Карты Two Worlds
        let cardElemDmg = 0;
        let cardColor = 0xaa0000;
        if (player.equippedCard && ITEM_CATALOG[player.equippedCard]?.cardElement) {
          const cDef = ITEM_CATALOG[player.equippedCard];
          const cRank = player.itemRanks[player.equippedCard] || 0;
          cardElemDmg = Math.round((12 + cRank * 8) * (1 + player.skills.ancientKnowledge * 0.15));
          cardColor = ELEMENT_INFO[cDef.cardElement!].color;
        }

        const critChance = player.skills.dexterity * 0.07;
        const isSkillCrit = Math.random() < critChance;
        const critMul = isSkillCrit ? 1.85 : 1.0;

        const baseDmg =
          (22 + wepAtk + Math.floor(Math.random() * 16) + player.level * 4) *
            (1 + (player.dmgBonusPct + wepStrPct) / 100) +
          cardElemDmg;
        const dmg = Math.round(baseDmg * dmgMultiplier * critMul);
        e.hp -= dmg;
        e.hitFlash = 0.25;
        e.x += toE.x * (player.equippedWeapon === 'troll_hammer' ? 1.3 : 0.6);
        e.z += toE.z * (player.equippedWeapon === 'troll_hammer' ? 1.3 : 0.6);
        e.mesh.position.x = e.x;
        e.mesh.position.z = e.z;
        spawnParticles(e.x, e.y + 1.5, e.z, cardElemDmg > 0 ? cardColor : 0xaa0000, 14);
        pushFloatingDamage(
          e.x,
          e.y + 2.1,
          e.z,
          dmg,
          isSkillCrit
            ? 'КРИТИЧЕСКИЙ УДАР!'
            : step === 3
            ? 'КРЕСТОВОЙ УДАР!'
            : undefined
        );
        addLogMessage(`⚔️ Удар по ${e.name}! -${dmg}`);
        sound.playSwordHit();
        hitAny = true;

        if (e.hp <= 0) {
          handleEntityDeath(e);
        }
      }
      if (!hitAny) addLogMessage('⚔️ Удар по воздуху');
    }

    function playerTakeDamage(dmg: number) {
      if (player.invuln > 0 || player.rolling) return;

      // Защита от надетого Щита (Костяной щит скелета / Бастион Чёрного Тролля) + Ранг слияния ★ + Навык щита Gothic 3
      let blockPct = player.skills.shieldMastery * 6;
      let flatArmor = player.skills.shieldMastery * 2;
      if (player.equippedShield && ITEM_CATALOG[player.equippedShield]) {
        const sDef = ITEM_CATALOG[player.equippedShield];
        const sRank = player.itemRanks[player.equippedShield] || 0;
        const rankMul = 1 + sRank * 0.35;
        blockPct += Math.round((sDef.shieldBlockPct || 0) * (1 + sRank * 0.2));
        flatArmor += Math.round((sDef.shieldBaseDef || 0) * rankMul);
      }
      blockPct = Math.min(75, blockPct);
      const reducedDmg = Math.max(2, Math.round(dmg * (1 - blockPct / 100) - flatArmor * 0.35));

      player.hp -= reducedDmg;
      player.invuln = 0.7;
      player.lastDamageTime = performance.now() / 1000;
      shakeAmount = 0.4;
      setDamageHitFlash(true);
      setTimeout(() => setDamageHitFlash(false), 150);

      if (player.hp <= 0) {
        player.hp = player.maxHp * 0.5;
        if (player.riding) dismountHorse();
        player.x = 0;
        player.z = 0;
        player.vx = 0;
        player.vz = 0;
        addLogMessage('💀 Вы потеряли сознание... Очнулись в центре мира.');
      }
    }

    healPotionRef.current = () => {
      if (player.gold < 25) {
        addLogMessage('Недостаточно золота для зелья лечения (нужно 25)');
        return;
      }
      if (player.hp >= player.maxHp) {
        addLogMessage('Здоровье уже полное');
        return;
      }
      player.gold -= 25;
      player.hp = Math.min(player.maxHp, player.hp + 60);
      spawnParticles(player.x, player.y + 1.2, player.z, 0xff3355, 16);
      addLogMessage('Выпито зелье лечения (+60 HP)');
    };

    // ============================================================
    // 10. УПРАВЛЕНИЕ (Точно как в оригинальной v9/v10)
    // ============================================================
    const keys: Record<string, boolean> = {};
    const camControl = {
      yaw: 0,
      pitch: 0.35,
      distance: 9,
      minDist: 3,
      maxDist: 22,
      minPitch: -0.15,
      maxPitch: 1.35,
      dragging: false,
      lastX: 0,
      lastY: 0,
      dragStartX: 0,
      dragStartY: 0,
      dragged: false,
      sensitivity: 0.005,
    };

    function findNearestNPC(): GameEntity | null {
      let nearest: GameEntity | null = null;
      let nd = 4.5;
      for (const e of entities) {
        if (e.dead || e.type !== 'npc') continue;
        const d = Math.hypot(e.x - player.x, e.z - player.z);
        if (d < nd) {
          nd = d;
          nearest = e;
        }
      }
      return nearest;
    }

    function tryInteract() {
      if (dialogOpenRef.current || !gameStartedRef.current || isPausedRef.current) return;

      if (player. riding) {
        dismountHorse();
        return;
      }

      // 1. Проверяем вход в Подземную Пещеру со скелетами или выход из неё!
      if (player.inCaveId) {
        const curCave = caveDungeons.find((c) => c.id === player.inCaveId);
        if (curCave) {
          // Проверяем сундуки с сокровищами внутри пещеры
          for (const ch of curCave.chests) {
            if (!ch.opened && Math.hypot(player.x - ch.pos.x, player.z - ch.pos.z) < 3.4) {
              ch.opened = true;
              ch.lidPivot.rotation.x = -Math.PI * 0.62;
              sound.playCoinPickup();
              sound.playItemPickup(true);
              spawnParticles(ch.pos.x, ch.pos.y + 0.9, ch.pos.z, 0xffd700, 32);
              for (const lootId of ch.lootTable) {
                const lDef = ITEM_CATALOG[lootId];
                const giveQty = lDef?.category === 'quiver' ? lDef.quiverBundleSize || 20 : 1;
                addItemToBag(lootId, giveQty);
                if (lDef?.category === 'grimoire' && lDef.grimoireElement) {
                  player.magicLevels[lDef.grimoireElement] =
                    (player.magicLevels[lDef.grimoireElement] || 0) + 1;
                  setMagicLevels({ ...player.magicLevels });
                }
              }
              player.gold += 140;
              progressQuest('gold', 140);
              const lootNames = ch.lootTable
                .map((id) => `${ITEM_CATALOG[id]?.icon || ''} ${ITEM_CATALOG[id]?.name || id}`)
                .join(', ');
              addLogMessage(
                `🗝️ Открыт подземный сундук древних! Получено: ${lootNames} и +140 💰!`
              );
              return;
            }
          }

          // Проверяем портал выхода из подземной пещеры наружу
          const distExit = Math.hypot(
            player.x - curCave.exitPortalPos.x,
            player.z - curCave.exitPortalPos.z
          );
          if (distExit < 4.2) {
            curCave.interiorGroup.visible = false;
            player.inCaveId = null;
            setInsideCaveName(null);
            player.x = curCave.entranceX;
            player.z = curCave.entranceZ + 3.6;
            player.y = getHeight(player.x, player.z);
            player.vx = 0;
            player.vz = 0;
            player.mesh.position.set(player.x, player.y, player.z);
            sound.playTeleportWhoosh();
            spawnParticles(player.x, player.y + 1.5, player.z, 0x44ccff, 28);
            addLogMessage(`🏔️ Вы вышли из пещеры «${curCave.name}» на поверхность Миртаны!`);
            return;
          }
        }
      } else {
        // Проверяем вход в любую из подземных пещер с поверхности
        for (const cave of caveDungeons) {
          const dCave = Math.hypot(player.x - cave.entranceX, player.z - cave.entranceZ);
          if (dCave < 4.5) {
            for (const cv of caveDungeons) cv.interiorGroup.visible = cv.id === cave.id;
            player.inCaveId = cave.id;
            setInsideCaveName(cave.name);
            player.x = cave.interiorSpawnPos.x;
            player.y = cave.interiorSpawnPos.y;
            player.z = cave.interiorSpawnPos.z;
            player.vx = 0;
            player.vz = 0;
            player.mesh.position.set(player.x, player.y, player.z);
            sound.playTeleportWhoosh();
            spawnParticles(player.x, player.y + 1.5, player.z, 0xaa66ff, 30);
            addLogMessage(
              `🕳️ Вы вошли в подземный мир: ${cave.name}! Сразите скелетов и откройте сундуки [E]!`
            );
            return;
          }
        }

        // 2. Проверяем Алхимический Котёл рядом с игроком
        for (const cauld of worldCauldrons) {
          if (Math.hypot(player.x - cauld.x, player.z - cauld.z) < 3.6) {
            sound.playCauldronBubble();
            setShopOpen(false);
            setBagTab('cauldron');
            setBagOpen(true);
            addLogMessage(`⚗️ Открыт ${cauld.name}! Смешивайте травы и трофеи в эликсиры.`);
            return;
          }
        }

        // 3. Проверяем Стационарный Телепорт рядом с игроком
        for (const tp of stationaryTeleporters) {
          if (Math.hypot(player.x - tp.x, player.z - tp.z) < 4.0) {
            sound.playTeleportWhoosh();
            setShopOpen(false);
            setBagTab('teleports');
            setBagOpen(true);
            addLogMessage(`🔮 Активирован ${tp.name}! Выберите точку перемещения на карте.`);
            return;
          }
        }
      }

      const npc = findNearestNPC();
      if (npc && npc.dialogKey) {
        // Если персонаж сидел у костра — он сразу ВСТАЁТ и поворачивается к нашему герою для разговора!
        if (npc.campfireSeat) {
          npc.npcActivity = 'talking';
          npc.mesh.position.y = getHeight(npc.x, npc.z);
          const dx = player.x - npc.x;
          const dz = player.z - npc.z;
          npc.mesh.rotation.y = Math.atan2(dx, dz);
        }
        const d = DIALOGS[npc.dialogKey];
        if (d) {
          setDialogSpeaker('npc');
          sound.speakDialog(npc.dialogKey, d.text, setVoiceStatus, `💬 ${d.name}`);
          // Предзагружаем только первую реплику в фоне, чтобы не забивать оперативную память!
          if (d.choices.length > 0) {
            sound.prefetchDialog('hero', d.choices[0].text);
            sound.prefetchDialog(npc.dialogKey, d.choices[0].reply);
          }
          setActiveDialog({
            key: npc.dialogKey,
            name: d.name,
            role: d.role,
            text: d.text,
            heroPhrase: undefined,
            choices: d.choices,
            replied: false,
            stepIndex: -1,
            visitedIndices: [],
          });
          return;
        }
      }

      const horse = findNearestHorse();
      if (horse) {
        mountHorse(horse);
      }
    }
    triggerInteractRef.current = tryInteract;

    function tryRoll() {
      if (player.riding) return;
      if (
        player.rollCd > 0 ||
        player.rolling ||
        player.isSwimming ||
        dialogOpenRef.current ||
        !gameStartedRef.current ||
        isPausedRef.current
      )
        return;
      let dirX: number;
      let dirZ: number;
      const curSpeed = Math.hypot(player.vx, player.vz);
      if (curSpeed > 1) {
        dirX = player.vx / curSpeed;
        dirZ = player.vz / curSpeed;
      } else {
        dirX = Math.sin(player.facingAngle);
        dirZ = Math.cos(player.facingAngle);
      }
      player.rolling = true;
      player.rollTimer = 0.45;
      player.rollCd = 0.9;
      player.rollDir = { x: dirX, z: dirZ };
      player.invuln = Math.max(player.invuln, 0.45);
      player.stamina = Math.max(0, player.stamina - 25);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (!gameStartedRef.current) return;
        if (dialogOpenRef.current) {
          setActiveDialog(null);
          setBagOpen(false);
          setShopOpen(false);
          return;
        }
        setIsPaused((prev) => !prev);
        return;
      }

      if (e.code === 'KeyI') {
        if (!gameStartedRef.current || isPausedRef.current) return;
        setShopOpen(false);
        setBagOpen((prev) => !prev);
        return;
      }
      if (e.code === 'KeyB') {
        if (!gameStartedRef.current || isPausedRef.current) return;
        setShopOpen(false);
        if (bagOpen && bagTab === 'horse') {
          setBagOpen(false);
        } else {
          openHorseBagQuick();
        }
        return;
      }
      if (e.code === 'KeyM') {
        if (!gameStartedRef.current || isPausedRef.current) return;
        setBagOpen(false);
        setShopOpen((prev) => !prev);
        return;
      }

      if (isPausedRef.current) return;
      keys[e.code] = true;
      if (e.code === 'KeyE') tryInteract();
      if (e.code === 'KeyF') toggleWeapons();
      if (e.code === 'KeyV') toggleBowModeRef.current();
      if (e.code === 'KeyR') cycleQuiverRef.current();
      if (e.code === 'KeyC') {
        setShopOpen(false);
        setBagTab('cauldron');
        setBagOpen((prev) => (bagTab === 'cauldron' ? !prev : true));
      }
      if (e.code === 'KeyT') {
        setShopOpen(false);
        setBagTab('teleports');
        setBagOpen((prev) => (bagTab === 'teleports' ? !prev : true));
      }
      if (e.code === 'KeyH') whistleForHorse();
      if (e.code === 'KeyG') summonGolemRef.current();
      if (e.code === 'KeyQ') healPotionRef.current();
      if (e.code === 'Digit1') castElementalSpell('fire');
      if (e.code === 'Digit2') castElementalSpell('water');
      if (e.code === 'Digit3') castElementalSpell('air');
      if (e.code === 'Digit4') castElementalSpell('lightning');
      if (e.code === 'Digit5') castElementalSpell('necro');
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') tryRoll();
      if (e.code === 'Space') {
        player.jumpBuffered = JUMP_BUFFER;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!gameStartedRef.current || dialogOpenRef.current || isPausedRef.current) return;
      if (e.button === 2) {
        // 🎯 ПРАВАЯ КНОПКА МЫШИ (ПКМ) — Снайперский прицел из лука с приближением как в Skyrim!
        e.preventDefault();
        if (!player.equippedBow) {
          player.equippedBow = 'bow_hunter';
          setEquippedBow('bow_hunter');
        }
        player.bowMode = true;
        setBowModeActive(true);
        player.weaponsDrawn = true;
        player.sniperAiming = true;
        setSniperAiming(true);
        player.bowDrawCharge = 35;
        setBowDrawPower(35);
        camControl.lastX = e.clientX;
        camControl.lastY = e.clientY;
        sound.playBowDraw();
        return;
      }
      if (e.button === 0) {
        if (player.sniperAiming) {
          // В режиме снайперского прицела (ПКМ зажат) клик ЛКМ мгновенно выпускает стрелу в перекрестие!
          shootBowArrow();
          return;
        }
        camControl.dragging = true;
        camControl.lastX = e.clientX;
        camControl.lastY = e.clientY;
        camControl.dragStartX = e.clientX;
        camControl.dragStartY = e.clientY;
        camControl.dragged = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!gameStartedRef.current || dialogOpenRef.current || isPausedRef.current) return;
      if (camControl.dragging || player.sniperAiming) {
        const dx = e.clientX - camControl.lastX;
        const dy = e.clientY - camControl.lastY;
        camControl.lastX = e.clientX;
        camControl.lastY = e.clientY;
        if (camControl.dragging) {
          const totalDist =
            Math.abs(e.clientX - camControl.dragStartX) +
            Math.abs(e.clientY - camControl.dragStartY);
          if (totalDist > 5) camControl.dragged = true;
        }
        const sens = player.sniperAiming ? 0.0028 : 0.0055;
        camControl.yaw -= dx * sens;
        camControl.pitch += dy * sens;
        camControl.pitch = Math.max(
          player.sniperAiming ? -0.45 : camControl.minPitch,
          Math.min(camControl.maxPitch, camControl.pitch)
        );
        if (player.sniperAiming && !player.riding) {
          player.facingAngle = camControl.yaw + Math.PI;
          player.mesh.rotation.y = player.facingAngle;
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        player.sniperAiming = false;
        setSniperAiming(false);
        player.bowDrawCharge = 0;
        setBowDrawPower(0);
        return;
      }
      if (e.button === 0) {
        if (
          camControl.dragging &&
          !camControl.dragged &&
          gameStartedRef.current &&
          !dialogOpenRef.current &&
          !isPausedRef.current
        ) {
          playerAttack();
        }
        camControl.dragging = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!gameStartedRef.current || dialogOpenRef.current || isPausedRef.current) return;
      camControl.distance += e.deltaY * 0.025;
      camControl.distance = Math.max(
        camControl.minDist,
        Math.min(camControl.maxDist, camControl.distance)
      );
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onWheel, { passive: true });

    // ============================================================
    // 11. АНИМАЦИЯ ПЕРСОНАЖА И СУЩЕСТВ (Волки, Медведи, Скелеты, Орки, Тролли)
    // ============================================================
    function animateCharacter(
      mesh: THREE.Group,
      cycle: number,
      blend: number,
      isSwimming: boolean,
      isRolling: boolean,
      isRiding = false
    ) {
      const u = mesh.userData as EntityRig;
      if (!u) return;

      if (u.kind === 'bird') {
        const s = Math.sin(cycle * 2.2);
        const c = Math.cos(cycle * 2.2);
        if (u.legFL && u.legFR) {
          u.legFL.rotation.x = s * 0.58 * blend;
          u.legFR.rotation.x = -s * 0.58 * blend;
        }
        // Туловище птицы всегда плотно сидит на ножках (y = 0.34) с лёгким покачиванием при ходьбе
        u.body.position.y = 0.34 + Math.abs(c) * 0.022 * blend;
        u.body.rotation.x = Math.sin(cycle * 4.4) * 0.055 * blend;
        if (u.tail) u.tail.rotation.z = Math.sin(cycle * 2.2) * 0.12;
        return;
      }

      if (u.kind === 'wolf' || u.kind === 'bear') {
        const rate = u.kind === 'bear' ? 1.05 : 1.35;
        const amp = u.kind === 'bear' ? 0.55 : 0.65;
        const baseH = u.kind === 'bear' ? 1.25 : 0.85;
        const s = Math.sin(cycle * rate);
        const c = Math.cos(cycle * rate);
        if (u.legFL && u.legFR && u.legBL && u.legBR) {
          u.legFL.rotation.x = s * amp * blend;
          u.legBR.rotation.x = s * amp * blend;
          u.legFR.rotation.x = -s * amp * blend;
          u.legBL.rotation.x = -s * amp * blend;
        }
        u.body.position.y = baseH + Math.abs(c) * 0.06 * blend;
        if (u.tail) u.tail.rotation.z = Math.sin(cycle * 1.8) * 0.25;
        return;
      }

      if (u.kind === 'troll') {
        const s = Math.sin(cycle * 0.75);
        const c = Math.cos(cycle * 0.75);
        if (u.hipL && u.hipR && u.kneeL && u.kneeR && u.shoulderL && u.shoulderR) {
          u.hipL.rotation.x = s * 0.45 * blend;
          u.hipR.rotation.x = -s * 0.45 * blend;
          u.kneeL.rotation.x = Math.max(0, -s) * 0.5 * blend;
          u.kneeR.rotation.x = Math.max(0, s) * 0.5 * blend;
          u.shoulderL.rotation.x = -0.25 - s * 0.5 * blend;
          u.shoulderR.rotation.x = -0.25 + s * 0.5 * blend;
        }
        u.body.position.y = 2.25 + Math.abs(s) * 0.1 * blend;
        u.body.rotation.z = c * 0.06 * blend;
        return;
      }

      if (u.kind === 'orc') {
        // Тяжёлая хищная сгорбленная походка орка-зверя (широко расставленные лапы и плечи)
        const s = Math.sin(cycle * 0.92);
        const c = Math.cos(cycle * 0.92);
        if (
          u.hipL &&
          u.hipR &&
          u.kneeL &&
          u.kneeR &&
          u.shoulderL &&
          u.shoulderR &&
          u.elbowL &&
          u.elbowR
        ) {
          u.hipL.rotation.x = -0.22 + s * 0.58 * blend;
          u.hipR.rotation.x = -0.22 - s * 0.58 * blend;
          u.hipL.rotation.z = 0.08;
          u.hipR.rotation.z = -0.08;
          u.kneeL.rotation.x = 0.28 + Math.max(0, -s) * 0.65 * blend;
          u.kneeR.rotation.x = 0.28 + Math.max(0, s) * 0.65 * blend;

          u.shoulderL.rotation.x = -0.18 - s * 0.55 * blend;
          u.shoulderR.rotation.x = -0.18 + s * 0.55 * blend;
          u.shoulderL.rotation.z = 0.18;
          u.shoulderR.rotation.z = -0.18;
          u.elbowL.rotation.x = -0.45 - Math.max(0, -s) * 0.35 * blend;
          u.elbowR.rotation.x = -0.45 - Math.max(0, s) * 0.35 * blend;
        }
        u.body.position.y = 1.56 + Math.abs(s) * 0.075 * blend + Math.sin(cycle * 0.7) * 0.02;
        u.body.rotation.x = 0.24 + Math.abs(s) * 0.04 * blend;
        u.body.rotation.z = c * 0.065 * blend;
        if (u.headGroup) {
          u.headGroup.rotation.y = c * 0.08 * blend;
        }
        return;
      }

      if (
        !u.hipL ||
        !u.hipR ||
        !u.kneeL ||
        !u.kneeR ||
        !u.shoulderL ||
        !u.shoulderR ||
        !u.elbowL ||
        !u.elbowR
      )
        return;

      const s = Math.sin(cycle);
      const c = Math.cos(cycle);

      // Поза на лошади (из v10)
      if (isRiding) {
        u.hipL.rotation.set(-0.55, 0, 0.55);
        u.hipR.rotation.set(-0.55, 0, -0.55);
        u.kneeL.rotation.set(0.9, 0, 0);
        u.kneeR.rotation.set(0.9, 0, 0);
        u.shoulderL.rotation.set(-0.35, 0, 0.15);
        u.shoulderR.rotation.set(-0.35, 0, -0.15);
        u.elbowL.rotation.set(-0.5, 0, 0);
        u.elbowR.rotation.set(-0.5, 0, 0);
        u.body.position.y = 1.35;
        u.body.rotation.set(0.15, 0, 0);
        if (u.headGroup) u.headGroup.rotation.set(0, 0, 0);

        if (player.attackAnim > 0 && mesh === player.mesh) {
          const atk = 1 - player.attackAnim;
          let shX = 0,
            shY = 0,
            shZ = 0,
            elX = -0.3;
          if (atk < 0.3) {
            const t = atk / 0.3;
            const e = t * t;
            shX = 2.5 * e;
            shY = -0.2 * e;
            shZ = 0.3 * e;
            elX = -0.3 - 0.55 * e;
          } else if (atk < 0.6) {
            const t = (atk - 0.3) / 0.3;
            const e = t * t * (3 - 2 * t);
            shX = 2.5 + 2.2 * e;
            shY = -0.2 + 0.5 * e;
            shZ = 0.3 - 0.55 * e;
            elX = -0.85 + 0.75 * e;
          } else {
            const t = (atk - 0.6) / 0.4;
            const e = 1 - (1 - t) * (1 - t);
            shX = 4.7 - 4.7 * e;
            shY = 0.3 - 0.3 * e;
            shZ = -0.25 + 0.25 * e;
            elX = -0.1 - 0.2 * e;
          }
          u.shoulderR.rotation.set(shX, shY, shZ);
          u.elbowR.rotation.x = elX;
        }
        return;
      }

      u.hipL.rotation.y = 0;
      u.hipL.rotation.z = 0;
      u.hipR.rotation.y = 0;
      u.hipR.rotation.z = 0;
      u.body.rotation.x = 0;
      u.body.rotation.y = 0;

      if (isRolling) {
        const t = 1 - Math.min(1, (player.rollTimer || 0) * 2);
        u.hipL.rotation.x = -1.4 * t;
        u.hipR.rotation.x = -1.4 * t;
        u.kneeL.rotation.x = 1.6 * t;
        u.kneeR.rotation.x = 1.6 * t;
        u.shoulderL.rotation.x = 1.5 * t;
        u.shoulderR.rotation.x = 1.5 * t;
        u.elbowL.rotation.x = -0.8 * t;
        u.elbowR.rotation.x = -0.8 * t;
        return;
      }

      if (isSwimming) {
        u.hipL.rotation.x = Math.sin(cycle * 0.6) * 0.5;
        u.hipR.rotation.x = Math.sin(cycle * 0.6 + Math.PI) * 0.5;
        u.kneeL.rotation.x = 0.3;
        u.kneeR.rotation.x = 0.3;
        u.shoulderL.rotation.x = -1.2 + Math.sin(cycle * 0.8) * 0.6;
        u.shoulderR.rotation.x = -1.2 + Math.sin(cycle * 0.8 + Math.PI) * 0.6;
        u.elbowL.rotation.x = -0.6;
        u.elbowR.rotation.x = -0.6;
        u.body.rotation.x = -0.4;
        return;
      }

      const strideAmp = 0.55 + blend * 0.25;

      // Exact v9/v10 walking gait
      u.hipL.rotation.x = s * strideAmp * blend;
      u.hipR.rotation.x = -s * strideAmp * blend;
      u.kneeL.rotation.x = Math.max(0, -s) * 0.9 * blend;
      u.kneeR.rotation.x = Math.max(0, s) * 0.9 * blend;

      u.shoulderL.rotation.x = -s * strideAmp * blend * 0.9;
      u.shoulderR.rotation.x = s * strideAmp * blend * 0.9;
      u.shoulderL.rotation.y = 0;
      u.shoulderL.rotation.z = 0;
      u.shoulderR.rotation.y = 0;
      u.shoulderR.rotation.z = 0;

      const leftArmForward = Math.max(0, -s) * blend;
      const rightArmForward = Math.max(0, s) * blend;
      u.elbowL.rotation.x = -0.2 - leftArmForward * 0.55 - blend * 0.15;
      u.elbowR.rotation.x = -0.2 - rightArmForward * 0.55 - blend * 0.15;

      u.body.position.y = 1.4 + Math.abs(s) * 0.04 * blend;
      u.body.rotation.z = c * 0.03 * blend;
      if (u.headGroup) u.headGroup.rotation.y = c * 0.05 * blend;
      if (u.cloak) u.cloak.rotation.x = -0.05 - Math.sin(cycle * 1.5) * 0.08 * blend - blend * 0.15;

      if (blend < 0.05) {
        const breath = Math.sin(cycle * 0.7) * 0.015;
        u.body.position.y = 1.4 + breath;
        u.hipL.rotation.x = Math.sin(cycle * 0.7) * 0.03;
        u.hipR.rotation.x = Math.sin(cycle * 0.7 + 0.5) * 0.03;
        u.kneeL.rotation.x = 0;
        u.kneeR.rotation.x = 0;
        u.shoulderL.rotation.x = Math.sin(cycle * 0.7) * 0.06 - 0.08;
        u.shoulderR.rotation.x = Math.sin(cycle * 0.7 + 1) * 0.06 - 0.08;
        u.elbowL.rotation.x = -0.25 + Math.sin(cycle * 0.7 + 0.3) * 0.03;
        u.elbowR.rotation.x = -0.25 + Math.sin(cycle * 0.7 + 1.3) * 0.03;
        if (u.headGroup) u.headGroup.rotation.y = Math.sin(cycle * 0.5) * 0.08;
      }

      // Атака мечом из v10 (только на руки, никогда не мешает шагу!)
      if (player.attackAnim > 0 && mesh === player.mesh) {
        const atk = 1 - player.attackAnim;
        let shX = 0,
          shY = 0,
          shZ = 0,
          elX = -0.3;

        if (atk < 0.3) {
          const t = atk / 0.3;
          const e = t * t;
          shX = 2.5 * e;
          shY = -0.2 * e;
          shZ = 0.3 * e;
          elX = -0.3 - 0.55 * e;
        } else if (atk < 0.6) {
          const t = (atk - 0.3) / 0.3;
          const e = t * t * (3 - 2 * t);
          shX = 2.5 + 2.2 * e;
          shY = -0.2 + 0.5 * e;
          shZ = 0.3 - 0.55 * e;
          elX = -0.85 + 0.75 * e;
        } else {
          const t = (atk - 0.6) / 0.4;
          const e = 1 - (1 - t) * (1 - t);
          shX = 4.7 - 4.7 * e;
          shY = 0.3 - 0.3 * e;
          shZ = -0.25 + 0.25 * e;
          elX = -0.1 - 0.2 * e;
        }

        if (player.comboStep === 1) {
          u.shoulderR.rotation.set(shX, shY, shZ);
          u.elbowR.rotation.x = elX;
          u.shoulderL.rotation.x = shX * 0.15;
          u.shoulderL.rotation.z = -shZ * 0.4;
          u.elbowL.rotation.x = -0.4;
        } else if (player.comboStep === 2) {
          u.shoulderL.rotation.set(shX, -shY, -shZ);
          u.elbowL.rotation.x = elX;
          u.shoulderR.rotation.x = shX * 0.15;
          u.shoulderR.rotation.z = shZ * 0.4;
          u.elbowR.rotation.x = -0.4;
        } else {
          u.shoulderR.rotation.set(shX, shY, shZ);
          u.elbowR.rotation.x = elX;
          u.shoulderL.rotation.set(shX, -shY, -shZ);
          u.elbowL.rotation.x = elX;
        }
      } else if (player.weaponsDrawn && mesh === player.mesh) {
        // Боевая стойка с обнажёнными мечами в руках (когда мечи вынуты клавишей F)
        u.shoulderR.rotation.z = -0.18;
        u.shoulderL.rotation.z = 0.18;
        u.elbowR.rotation.x = -0.55;
        u.elbowL.rotation.x = -0.55;
      }
    }

    // ============================================================
    // 12. КАМЕРА И ГЛАВНЫЙ ЦИКЛ (Точно как в оригинальной v9/v10)
    // ============================================================
    const camPos = new THREE.Vector3();
    const camLookAt = new THREE.Vector3();
    let camInitialized = false;
    let gameTime = 6 * 60;
    let gameDay = 1;
    let hudTimer = 0;
    let lastTime = performance.now();
    let animFrameId = 0;

    function updateCamera(dt: number) {
      const targetY = player.riding ? player.y + 3.0 : player.y + 2.2;
      const dist = player.riding ? Math.max(11, camControl.distance + 2) : camControl.distance;
      const cp = Math.cos(camControl.pitch);
      const camX = player.x + Math.sin(camControl.yaw) * cp * dist;
      const camY = targetY + Math.sin(camControl.pitch) * dist;
      const camZ = player.z + Math.cos(camControl.yaw) * cp * dist;

      const minY = Math.max(getHeight(camX, camZ) + 0.5, WATER_LEVEL + 0.3);
      const finalY = Math.max(camY, minY);

      if (!camInitialized) {
        camPos.set(camX, finalY, camZ);
        camInitialized = true;
      } else {
        // Быстрый и лёгкий отклик позиции камеры как в Snowball Fight 3D (lerp 0.25)
        camPos.lerp(new THREE.Vector3(camX, finalY, camZ), 0.25);
      }

      let sx = 0;
      let sy = 0;
      let sz = 0;
      if (shakeAmount > 0) {
        sx = (Math.random() - 0.5) * shakeAmount;
        sy = (Math.random() - 0.5) * shakeAmount;
        sz = (Math.random() - 0.5) * shakeAmount;
        shakeAmount *= 0.88;
        if (shakeAmount < 0.02) shakeAmount = 0;
      }

      camera.position.set(camPos.x + sx, camPos.y + sy, camPos.z + sz);
      // Мгновенный фокус взгляда на персонаже без «резиновой» задержки camLookAt!
      camera.lookAt(player.x, targetY, player.z);

      // Персонаж ВСЕГДА видим (убрано мигание/исчезновение при уроне, кувырке и зуме камеры!)
      player.mesh.visible = true;
    }

    function drawMinimap() {
      const canvas = minimapRef.current;
      if (!canvas) return;
      const mctx = canvas.getContext('2d');
      if (!mctx) return;

      const size = 124;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 3;

      mctx.clearRect(0, 0, size, size);
      mctx.save();

      // Круглая маска для карты-компаса
      mctx.beginPath();
      mctx.arc(cx, cy, radius, 0, Math.PI * 2);
      mctx.clip();

      mctx.fillStyle = 'rgba(10,8,5,0.88)';
      mctx.fillRect(0, 0, size, size);

      const view = 210;
      const scale = size / view;

      for (let py = 0; py < size; py += 5) {
        for (let px = 0; px < size; px += 5) {
          if (Math.hypot(px - cx, py - cy) > radius + 4) continue;
          const wx = player.x + (px - cx) / scale;
          const wz = player.z + (py - cy) / scale;
          const h = getHeight(wx, wz);
          let col: string;
          if (h < WATER_LEVEL) col = 'rgba(30,60,110,0.75)';
          else if (h < 4) col = 'rgba(180,160,110,0.7)';
          else if (h > 25) col = 'rgba(120,110,100,0.7)';
          else col = 'rgba(58,88,38,0.72)';
          mctx.fillStyle = col;
          mctx.fillRect(px, py, 5, 5);
        }
      }

      for (const e of entities) {
        if (e.dead) continue;
        const dx = (e.x - player.x) * scale + cx;
        const dz = (e.z - player.z) * scale + cy;
        if (Math.hypot(dx - cx, dz - cy) > radius - 3) continue;
        if (e.type === 'npc') mctx.fillStyle = '#f5d078';
        else if (e.type === 'golem' && e.isFriendlySummon) mctx.fillStyle = '#44ffff';
        else if (e.type === 'horse') mctx.fillStyle = '#c89850';
        else if (e.type === 'troll') mctx.fillStyle = '#d050d0';
        else mctx.fillStyle = '#e03030';
        mctx.beginPath();
        mctx.arc(dx, dz, e.type === 'troll' || e.type === 'golem' ? 3 : 2, 0, Math.PI * 2);
        mctx.fill();
      }

      for (const d of drops) {
        const dx = (d.x - player.x) * scale + cx;
        const dz = (d.z - player.z) * scale + cy;
        if (Math.hypot(dx - cx, dz - cy) > radius - 3) continue;
        mctx.fillStyle = '#ffd040';
        mctx.fillRect(dx - 1, dz - 1, 2, 2);
      }

      // Отображаем на мини-карте квестовые реликвии (Удочку рыбака, Колечко Елены и Дрова для костра)
      for (const col of worldCollectibles) {
        if (col.collected) continue;
        if (
          col.itemId !== 'fishing_rod' &&
          col.itemId !== 'elena_ring' &&
          col.itemId !== 'firewood_bundle'
        )
          continue;
        const dx = (col.x - player.x) * scale + cx;
        const dz = (col.z - player.z) * scale + cy;
        if (Math.hypot(dx - cx, dz - cy) > radius - 4) continue;
        mctx.fillStyle =
          col.itemId === 'fishing_rod'
            ? '#38e8ff'
            : col.itemId === 'elena_ring'
            ? '#ff66cc'
            : '#ffaa33';
        mctx.beginPath();
        mctx.arc(dx, dz, 3, 0, Math.PI * 2);
        mctx.fill();
      }

      // Стрелка героя в центре круга
      mctx.save();
      mctx.translate(cx, cy);
      mctx.rotate(-player.facingAngle);
      mctx.fillStyle = '#00ff88';
      mctx.beginPath();
      mctx.moveTo(0, 5.5);
      mctx.lineTo(-3.5, -4.5);
      mctx.lineTo(3.5, -4.5);
      mctx.closePath();
      mctx.fill();
      mctx.restore();

      mctx.restore();

      // Круглая бронзово-золотая оправа компаса
      mctx.strokeStyle = '#8b6a3a';
      mctx.lineWidth = 2.5;
      mctx.beginPath();
      mctx.arc(cx, cy, radius, 0, Math.PI * 2);
      mctx.stroke();

      // Метка Севера «С» сверху круга
      mctx.fillStyle = '#f0d090';
      mctx.font = 'bold 9px serif';
      mctx.textAlign = 'center';
      mctx.fillText('С', cx, 10);
    }

    // ============================================================
    // ЖЁСТКИЙ РЕШАТЕЛЬ КОЛЛИЗИЙ (Непрерывная защита от прохождения сквозь скелетов, орков и любых существ!)
    // ============================================================
    function getEntitySolidRadius(e: GameEntity, mounted = false): number {
      const base =
        e.type === 'troll'
          ? 2.15
          : e.type === 'horse'
          ? 1.65
          : e.type === 'bear'
          ? 1.6
          : e.type === 'pheasant' || e.type === 'grouse' || e.type === 'partridge'
          ? 0.75
          : 1.38; // Скелеты, орки, волки и NPC — плотный непроходимый цилиндр 1.38 м!
      return mounted ? base + 0.35 : base;
    }

    // Выталкивает точку (px, pz) из всех препятствий и живых существ и гасит нормальную скорость
    function enforceHardCollisions(
      px: number,
      pz: number,
      vx: number,
      vz: number,
      mountedHorse: GameEntity | null
    ): { x: number; z: number; vx: number; vz: number } {
      let x = px;
      let z = pz;
      let nvx = vx;
      let nvz = vz;
      const obsPad = mountedHorse ? 0.8 : 0.52;

      // 2 итерации проекции для идеального скольжения вдоль группы скелетов и деревьев
      for (let iter = 0; iter < 2; iter++) {
        if (!player.inCaveId) {
          for (const o of obstacles) {
            const dx = x - o.x;
            const dz = z - o.z;
            if (Math.abs(dx) > 7 || Math.abs(dz) > 7) continue;
            const minR = o.r + obsPad;
            const d = Math.hypot(dx, dz);
            if (d < minR) {
              const nx = d > 0.0001 ? dx / d : -Math.sin(player.facingAngle);
              const nz = d > 0.0001 ? dz / d : -Math.cos(player.facingAngle);
              x = o.x + nx * minR;
              z = o.z + nz * minR;
              const vn = nvx * nx + nvz * nz;
              if (vn < 0) {
                nvx -= vn * nx;
                nvz -= vn * nz;
              }
            }
          }
        }

        for (const e of entities) {
          if (
            e.dead ||
            e === mountedHorse ||
            e.isFriendlySummon ||
            (e.inCaveId || null) !== (player.inCaveId || null)
          )
            continue;
          const dx = x - e.x;
          const dz = z - e.z;
          if (Math.abs(dx) > 6 || Math.abs(dz) > 6) continue;
          const minR = getEntitySolidRadius(e, Boolean(mountedHorse));
          const d = Math.hypot(dx, dz);
          if (d < minR) {
            const nx = d > 0.0001 ? dx / d : -Math.sin(player.facingAngle);
            const nz = d > 0.0001 ? dz / d : -Math.cos(player.facingAngle);
            x = e.x + nx * minR;
            z = e.z + nz * minR;
            const vn = nvx * nx + nvz * nz;
            if (vn < 0) {
              nvx -= vn * nx;
              nvz -= vn * nz;
            }
          }
        }
      }

      return { x, z, vx: nvx, vz: nvz };
    }

    let minimapTimer = 0;
    function animate() {
      animFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (isPausedRef.current) {
        renderer.render(scene, camera);
        return;
      }

      for (const c of clouds) {
        c.mesh.position.x += c.speed * dt;
        if (c.mesh.position.x > 700) c.mesh.position.x = -700;
      }

      // 🔥 Анимация костров с вращающимся на вертеле мясом
      for (const cf of [mainCampfire, villageCampfire]) {
        cf.spitMeatGroup.rotation.x += dt * 1.45;
        const flicker = 0.92 + Math.sin(now * 0.014) * 0.12 + Math.cos(now * 0.023) * 0.08;
        cf.flameMesh.scale.set(flicker, 0.9 + Math.sin(now * 0.018) * 0.16, flicker);
        cf.fireGlow.scale.setScalar(0.92 + flicker * 0.14);
      }

      // 🏡 Реалистичный дым из печных труб домиков + периодическое переключение дыма и света в окнах!
      houseSwitchTimer -= dt;
      if (houseSwitchTimer <= 0) {
        houseSwitchTimer = 11 + Math.random() * 7;
        if (villageHouses.length > 1) {
          // В одном домике печной дым прекращается, а в другом домике включается!
          const smokingIndices = villageHouses
            .map((h, idx) => (h.isSmoking ? idx : -1))
            .filter((idx) => idx >= 0);
          const nonSmokingIndices = villageHouses
            .map((h, idx) => (!h.isSmoking ? idx : -1))
            .filter((idx) => idx >= 0);

          if (smokingIndices.length > 0 && nonSmokingIndices.length > 0) {
            const stopIdx = smokingIndices[Math.floor(Math.random() * smokingIndices.length)];
            const startIdx =
              nonSmokingIndices[Math.floor(Math.random() * nonSmokingIndices.length)];
            villageHouses[stopIdx].isSmoking = false;
            villageHouses[startIdx].isSmoking = true;
          }

          // Иногда в домиках выключается свет в окнах, а иногда включается!
          const randHouse = villageHouses[Math.floor(Math.random() * villageHouses.length)];
          randHouse.setWindowLit(!randHouse.isWindowLit);
        }
      }

      smokeSpawnAccum += dt;
      if (smokeSpawnAccum >= 0.22) {
        smokeSpawnAccum = 0;
        for (const hInst of villageHouses) {
          if (!hInst.isSmoking) continue;
          const freePuff = smokePuffs.find((p) => !p.active);
          if (!freePuff) break;
          freePuff.active = true;
          freePuff.age = 0;
          freePuff.maxAge = 4.2 + Math.random() * 1.4;
          freePuff.x = hInst.chimneyWorldPos.x + (Math.random() - 0.5) * 0.18;
          freePuff.y = hInst.chimneyWorldPos.y;
          freePuff.z = hInst.chimneyWorldPos.z + (Math.random() - 0.5) * 0.18;
          freePuff.vx = 0.55 + Math.random() * 0.35;
          freePuff.vy = 1.65 + Math.random() * 0.55;
          freePuff.vz = -0.25 + (Math.random() - 0.5) * 0.35;
          freePuff.mesh.position.set(freePuff.x, freePuff.y, freePuff.z);
          freePuff.mesh.scale.setScalar(0.38);
          freePuff.mat.opacity = 0.01;
          freePuff.mesh.visible = true;
        }
      }

      for (const puff of smokePuffs) {
        if (!puff.active) continue;
        puff.age += dt;
        if (puff.age >= puff.maxAge) {
          puff.active = false;
          puff.mesh.visible = false;
          continue;
        }
        const t = puff.age / puff.maxAge;
        const curlX = Math.sin(now * 0.002 + puff.seed + puff.age * 1.8) * 0.45;
        const curlZ = Math.cos(now * 0.0018 + puff.seed + puff.age * 1.5) * 0.45;
        puff.x += (puff.vx + curlX) * dt;
        puff.y += puff.vy * (1 - t * 0.28) * dt;
        puff.z += (puff.vz + curlZ) * dt;
        puff.mesh.position.set(puff.x, puff.y, puff.z);
        puff.mesh.rotation.y += dt * 0.6;
        puff.mesh.rotation.z += dt * 0.4;
        // Клубы дыма плавно расширяются по мере подъёма и рассеиваются в воздухе
        const sc = 0.38 + t * 2.15;
        puff.mesh.scale.set(sc, sc * 0.86, sc);
        const fadeIn = Math.min(1, t / 0.18);
        const fadeOut = Math.pow(1 - t, 1.35);
        puff.mat.opacity = fadeIn * fadeOut * 0.46;
      }

      // ✨ Анимация небесного луча Просветления при повышении уровня
      if (levelUpEffectTimer > 0) {
        levelUpEffectTimer = Math.max(0, levelUpEffectTimer - dt);
        levelUpBeamGroup.position.set(player.x, player.y, player.z);
        const fade = Math.min(1, levelUpEffectTimer / 0.8);
        const pulse = 0.85 + Math.sin(now * 0.015) * 0.15;
        beamOuterMat.opacity = 0.38 * fade * pulse;
        beamInnerMat.opacity = 0.68 * fade * pulse;
        beamRingMat.opacity = 0.75 * fade;
        beamOuterMesh.rotation.y += dt * 2.2;
        const ringScale = 1 + (1 - levelUpEffectTimer / 3.2) * 2.2;
        beamGroundHalo.scale.setScalar(ringScale);
        if (levelUpEffectTimer <= 0) {
          levelUpBeamGroup.visible = false;
        }
      }

      // ⚗️ Анимация Алхимических Котлов и 🌀 Стационарных Телепортов Two Worlds
      for (const c of worldCauldrons) {
        if (Math.hypot(c.x - player.x, c.z - player.z) < 65) {
          for (let bi = 0; bi < c.bubbles.length; bi++) {
            c.bubbles[bi].position.y = 1.1 + Math.sin(now * 0.005 + bi) * 0.04;
          }
        }
      }
      for (const pad of stationaryTeleporters) {
        if (Math.hypot(pad.x - player.x, pad.z - player.z) < 85) {
          pad.innerRing.rotation.z += dt * 1.5;
        }
      }

      // Полет 3D-птиц в небе (с плавными взмахами крыльев)
      for (const b of birds) {
        b.angle += b.speed * dt;
        b.flapPhase += dt * 11;
        const bx = b.centerX + Math.cos(b.angle) * b.radius;
        const bz = b.centerZ + Math.sin(b.angle) * b.radius;
        const by = b.alt + Math.sin(b.angle * 2) * 1.5;
        b.group.position.set(bx, by, bz);
        // Направляем птицу по касательной к кругу полёта
        b.group.rotation.y = -b.angle;
        const flap = Math.sin(b.flapPhase) * 0.55;
        b.wingL.rotation.z = flap;
        b.wingR.rotation.z = -flap;
      }

      if (gameStartedRef.current) {
        if (!dialogOpenRef.current) {
          const camForward = new THREE.Vector3(
            -Math.sin(camControl.yaw),
            0,
            -Math.cos(camControl.yaw)
          );
          const camRight = new THREE.Vector3(
            Math.cos(camControl.yaw),
            0,
            -Math.sin(camControl.yaw)
          );

          const moveDir = new THREE.Vector3();
          if (keys['KeyW']) moveDir.add(camForward);
          if (keys['KeyS']) moveDir.sub(camForward);
          if (keys['KeyA']) moveDir.sub(camRight);
          if (keys['KeyD']) moveDir.add(camRight);

          const hasInput = moveDir.lengthSq() > 0.001;
          if (hasInput) moveDir.normalize();

          if (player.comboResetTimer > 0) {
            player.comboResetTimer = Math.max(0, player.comboResetTimer - dt);
            if (player.comboResetTimer === 0) player.comboStep = 0;
          }

          // ============================================================
          // 🐴 ЕЗДА НА ЛОШАДИ (Точно как в v10)
          // ============================================================
          if (player.riding) {
            const horse = player.riding;
            const sprinting =
              (keys['ShiftLeft'] || keys['ShiftRight']) && player.stamina > 5 && hasInput;
            const maxSpeed = sprinting ? HORSE_RUN : HORSE_WALK;

            let hvx = horse.vx || 0;
            let hvz = horse.vz || 0;
            if (hasInput) {
              hvx += moveDir.x * ACCEL * dt;
              hvz += moveDir.z * ACCEL * dt;
            } else {
              hvx -= hvx * FRICTION * dt;
              hvz -= hvz * FRICTION * dt;
              if (Math.abs(hvx) < 0.05) hvx = 0;
              if (Math.abs(hvz) < 0.05) hvz = 0;
            }

            const curSpeed = Math.hypot(hvx, hvz);
            if (curSpeed > maxSpeed) {
              hvx = (hvx / curSpeed) * maxSpeed;
              hvz = (hvz / curSpeed) * maxSpeed;
            }
            horse.vx = hvx;
            horse.vz = hvz;

            // 4 подшага за кадр (Continuous Sub-Stepping) — исключает проскок сквозь скелетов даже на полном галопе!
            const horseSteps = 4;
            const hSubDt = dt / horseSteps;
            for (let s = 0; s < horseSteps; s++) {
              const nextHX = horse.x + (horse.vx || 0) * hSubDt;
              const nextHZ = horse.z + (horse.vz || 0) * hSubDt;
              const solved = enforceHardCollisions(
                nextHX,
                nextHZ,
                horse.vx || 0,
                horse.vz || 0,
                horse
              );
              horse.x = solved.x;
              horse.z = solved.z;
              horse.vx = solved.vx;
              horse.vz = solved.vz;
            }

            const lim = WORLD_SIZE / 2 - 10;
            horse.x = Math.max(-lim, Math.min(lim, horse.x));
            horse.z = Math.max(-lim, Math.min(lim, horse.z));
            horse.y = getHeight(horse.x, horse.z);

            let hFacing = horse.facingAngle || 0;
            if (curSpeed > 0.5) {
              const targetAngle = Math.atan2(horse.vx, horse.vz);
              let diff = targetAngle - hFacing;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              hFacing += diff * Math.min(1, dt * 6);
              horse.facingAngle = hFacing;
            }

            const hRig = horse.mesh.userData as EntityRig;
            if (curSpeed > 0.5 && hRig.legs) {
              horse.walkCycle += dt * (3 + curSpeed * 0.4);
              const s = Math.sin(horse.walkCycle);
              hRig.legs[0].rotation.x = s * 0.6;
              hRig.legs[1].rotation.x = -s * 0.6;
              hRig.legs[2].rotation.x = -s * 0.6;
              hRig.legs[3].rotation.x = s * 0.6;
              horse.mesh.position.y = horse.y + Math.abs(s) * 0.08;
            } else if (hRig.legs) {
              hRig.legs.forEach((l) => {
                l.rotation.x *= 0.9;
              });
              horse.mesh.position.y = horse.y;
            }

            horse.mesh.position.x = horse.x;
            horse.mesh.position.z = horse.z;
            horse.mesh.rotation.y = hFacing;

            player.x = horse.x;
            player.y = horse.y;
            player.z = horse.z;
            player.facingAngle = hFacing;

            if (sprinting) player.stamina = Math.max(0, player.stamina - dt * 12);
            else player.stamina = Math.min(player.maxStamina, player.stamina + dt * 15);

            if (player.attackCd > 0) player.attackCd -= dt;
            if (player.attackAnim > 0) {
              player.attackAnim = Math.max(0, player.attackAnim - dt * 3);
            }
            const showMountedBlades = player.weaponsDrawn || player.attackAnim > 0;
            const hasCustomWep = Boolean(player.equippedWeapon);
            const hasCustomShd = Boolean(player.equippedShield);
            player.handSwordR.visible = showMountedBlades && !hasCustomWep;
            player.customWeaponHolder.visible = showMountedBlades && hasCustomWep;
            player.swordBackR.visible = !showMountedBlades;
            player.handSwordL.visible = false;
            player.customShieldHolder.visible = showMountedBlades && hasCustomShd;
            player.swordBackL.visible = !hasCustomShd;
            weaponTrail1.visible = false;
            weaponTrail2.visible = false;

            animateCharacter(player.mesh, 0, 0, false, false, true);
          } else {
            // ============================================================
            // 🚶 ПЕШКОМ — 1-в-1 физика и отзывчивость + поддержка Подземных Пещер!
            // ============================================================
            const activeCave = player.inCaveId
              ? caveDungeons.find((c) => c.id === player.inCaveId) || null
              : null;
            const groundHere = activeCave ? activeCave.interiorCenter.y : getHeight(player.x, player.z);
            const inWater = !activeCave && groundHere < WATER_LEVEL - 0.3;
            player.isSwimming = inWater;

            const sprinting =
              (keys['ShiftLeft'] || keys['ShiftRight']) &&
              player.stamina > 5 &&
              hasInput &&
              !player.rolling &&
              !player.sniperAiming;
            const agilityMul = 1 + player.agilityBonusPct / 100;
            let maxSpeed = (sprinting ? RUN_SPEED : WALK_SPEED) * agilityMul;
            if (player.sniperAiming) maxSpeed *= 0.55; // Плавный шаг лучника при снайперском прицеливании (как в Skyrim)
            if (player.rolling) maxSpeed = 42 * agilityMul;

            if (player.rolling) {
              player.rollTimer -= dt;
              if (player.rollTimer <= 0) player.rolling = false;
              player.vx = player.rollDir.x * maxSpeed;
              player.vz = player.rollDir.z * maxSpeed;
            } else if (hasInput) {
              player.vx += moveDir.x * ACCEL * dt;
              player.vz += moveDir.z * ACCEL * dt;
            } else {
              player.vx -= player.vx * FRICTION * dt;
              player.vz -= player.vz * FRICTION * dt;
              if (Math.abs(player.vx) < 0.05) player.vx = 0;
              if (Math.abs(player.vz) < 0.05) player.vz = 0;
            }

            const curSpeed = Math.hypot(player.vx, player.vz);
            if (curSpeed > maxSpeed) {
              player.vx = (player.vx / curSpeed) * maxSpeed;
              player.vz = (player.vz / curSpeed) * maxSpeed;
            }

            // 4 подшага за кадр (Continuous Sub-Stepping) + жёсткое выталкивание из радиуса скелетов и всех существ!
            const moveSteps = 4;
            const subDt = dt / moveSteps;
            for (let s = 0; s < moveSteps; s++) {
              const nextPX = player.x + player.vx * subDt;
              const nextPZ = player.z + player.vz * subDt;
              const solved = enforceHardCollisions(nextPX, nextPZ, player.vx, player.vz, null);
              player.x = solved.x;
              player.z = solved.z;
              player.vx = solved.vx;
              player.vz = solved.vz;
            }

            if (activeCave) {
              // Удерживаем героя внутри подземного зала пещеры
              const dxC = player.x - activeCave.interiorCenter.x;
              const dzC = player.z - activeCave.interiorCenter.z;
              const distC = Math.hypot(dxC, dzC);
              if (distC > 22.5) {
                player.x = activeCave.interiorCenter.x + (dxC / distC) * 22.5;
                player.z = activeCave.interiorCenter.z + (dzC / distC) * 22.5;
              }
            } else {
              const lim = WORLD_SIZE / 2 - 10;
              player.x = Math.max(-lim, Math.min(lim, player.x));
              player.z = Math.max(-lim, Math.min(lim, player.z));
            }

            if (inWater) {
              player.onGround = false;
              player.y += (WATER_LEVEL + 0.2 - player.y) * Math.min(1, dt * 4);
              player.vy = 0;
              player.lastGroundTime = 0;
            } else {
              player.vy -= GRAVITY * dt;
              player.y += player.vy * dt;
              const gY = activeCave ? activeCave.interiorCenter.y : getHeight(player.x, player.z);
              if (player.y <= gY) {
                player.y = gY;
                player.vy = 0;
                if (!player.onGround) player.lastGroundTime = 0;
                player.onGround = true;
              } else {
                player.onGround = false;
                player.lastGroundTime += dt;
              }
            }

            if (player.jumpBuffered > 0) player.jumpBuffered -= dt;
            const canJump = player.onGround || player.lastGroundTime < COYOTE_TIME;
            if (player.jumpBuffered > 0 && canJump && !player.rolling && !inWater) {
              if (keys['ShiftLeft'] || keys['ShiftRight']) {
                tryRoll();
              } else {
                player.vy = JUMP_VELOCITY;
                player.onGround = false;
                player.lastGroundTime = 1;
              }
              player.jumpBuffered = 0;
            }

            if (sprinting && !player.rolling)
              player.stamina = Math.max(0, player.stamina - dt * 18);
            else
              player.stamina = Math.min(
                player.maxStamina,
                player.stamina + dt * (player.rolling ? 0 : 12)
              );

            // Поворот персонажа: в режиме снайперского прицела (ПКМ) герой всегда смотрит точно по прицелу!
            if (player.sniperAiming) {
              player.facingAngle = camControl.yaw + Math.PI;
              player.bodyLean = 0;
            } else if (curSpeed > 0.3 && !player.rolling) {
              const targetAngle = Math.atan2(player.vx, player.vz);
              let diff = targetAngle - player.facingAngle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              player.facingAngle += diff * Math.min(1, dt * 14);

              const leanTarget = Math.max(-0.15, Math.min(0.15, -diff * 0.3));
              player.bodyLean += (leanTarget - player.bodyLean) * Math.min(1, dt * 8);
            } else {
              player.bodyLean += (0 - player.bodyLean) * Math.min(1, dt * 6);
            }
            player.mesh.rotation.y = player.facingAngle;
            player.mesh.position.set(player.x, player.y, player.z);

            const speedRatio = Math.min(1, curSpeed / RUN_SPEED);
            const blendTarget = curSpeed > 0.3 ? speedRatio : 0;
            player.moveBlend += (blendTarget - player.moveBlend) * Math.min(1, dt * 14);

            if (curSpeed > 0.3) player.walkCycle += dt * (7 + speedRatio * 10);
            else player.walkCycle += dt * 1.5;

            animateCharacter(
              player.mesh,
              player.walkCycle,
              player.moveBlend,
              player.isSwimming,
              player.rolling,
              false
            );
            pu.body.rotation.z = player.bodyLean;

            // Если герой в режиме лука или прицеливается (ПКМ) — поднимаем руки с луком в стойку лучника Skyrim!
            if (player.bowMode && (player.sniperAiming || player.attackAnim > 0)) {
              if (pu.shoulderL && pu.elbowL && pu.shoulderR && pu.elbowR) {
                pu.shoulderL.rotation.set(-1.45 + camControl.pitch * 0.65, 0.22, 0);
                pu.elbowL.rotation.set(-0.15, 0, 0);
                pu.shoulderR.rotation.set(-1.42 + camControl.pitch * 0.65, -0.35, 0);
                pu.elbowR.rotation.set(-1.15, 0, 0);
              }
            }

            if (player.attackCd > 0) player.attackCd -= dt;
            if (player.rollCd > 0) player.rollCd -= dt;

            // Видимость мечей / лука / булавы / молота и щита в руках или за спиной (клавиши F и V!)
            const showBladesInHand = player.weaponsDrawn || player.attackAnim > 0 || player.sniperAiming;
            const hasCustomWep = Boolean(player.equippedWeapon);
            const hasCustomShd = Boolean(player.equippedShield);
            const isHoldingBow = showBladesInHand && player.bowMode && Boolean(player.equippedBow);

            player.customBowHolder.visible = isHoldingBow;
            player.handSwordR.visible = showBladesInHand && !isHoldingBow && !hasCustomWep;
            player.customWeaponHolder.visible = showBladesInHand && !isHoldingBow && hasCustomWep;
            player.handSwordL.visible = showBladesInHand && !isHoldingBow && !hasCustomShd;
            player.customShieldHolder.visible = showBladesInHand && !isHoldingBow && hasCustomShd;
            player.swordBackR.visible = !showBladesInHand || isHoldingBow;
            player.swordBackL.visible = (!showBladesInHand || isHoldingBow) && !hasCustomShd;

            if (player.attackAnim > 0) {
              player.attackAnim = Math.max(0, player.attackAnim - dt * 3.2);

              if (trailTime > 0) {
                trailTime -= dt;
                const maxT = 0.3;
                const progress = 1 - trailTime / maxT;
                const a = Math.max(0, trailTime / maxT) * 0.8;

                weaponTrail1.position.set(player.x, player.y + 1.5, player.z);
                slashMat1.opacity = a;
                weaponTrail1.visible = a > 0.02;

                if (player.comboStep === 1) {
                  weaponTrail1.rotation.set(0.55, player.facingAngle - 0.5 + progress * 2.0, -0.35);
                  weaponTrail2.visible = false;
                } else if (player.comboStep === 2) {
                  weaponTrail1.rotation.set(-0.45, player.facingAngle + 1.7 - progress * 2.0, 0.35);
                  weaponTrail2.visible = false;
                } else {
                  weaponTrail1.rotation.set(0.45, player.facingAngle + progress * 2.5, -0.45);
                  weaponTrail2.position.set(player.x, player.y + 1.54, player.z);
                  weaponTrail2.rotation.set(-0.45, player.facingAngle - progress * 2.5, 0.45);
                  slashMat2.opacity = a * 0.85;
                  weaponTrail2.visible = a > 0.02;
                }
              } else {
                weaponTrail1.visible = false;
                weaponTrail2.visible = false;
              }
            } else {
              weaponTrail1.visible = false;
              weaponTrail2.visible = false;
            }

            if (player.rolling) {
              player.mesh.rotation.x = player.rollTimer * 6;
            } else {
              player.mesh.rotation.x *= 0.85;
            }
          }

          if (player.invuln > 0) player.invuln -= dt;
          if (player.spellCd > 0) player.spellCd = Math.max(0, player.spellCd - dt);
          const regenSkill = player.skills.regeneration;
          if (player.mp < player.maxMp) {
            player.mp = Math.min(player.maxMp, player.mp + dt * (2.5 + regenSkill * 2.2));
          }
          if (
            (now / 1000 - player.lastDamageTime > 5 || regenSkill > 0) &&
            player.hp < player.maxHp
          ) {
            player.hp = Math.min(player.maxHp, player.hp + dt * (2 + regenSkill * 2.5));
          }
        }

        updateCamera(dt);

        // 2. Update Entities (Лошади, NPC, Враги + коллизии между ними)
        for (const e of entities) {
          if (e.dead) continue;
          const rig = e.mesh.userData as EntityRig;

          if (e.type === 'horse') {
            if (e.state === 'mounted') continue;
            if (player.inCaveId) {
              if (e.mesh.visible) e.mesh.visible = false;
              continue;
            }
            const hDistToPlayer = Math.hypot(player.x - e.x, player.z - e.z);
            if (e.state !== 'called' && hDistToPlayer > 95) {
              if (e.mesh.visible) e.mesh.visible = false;
              continue;
            }
            if (!e.mesh.visible) e.mesh.visible = true;

            // 🎵 Если лошадь позвали свистом [H] — она галопом бежит к игроку!
            if (e.state === 'called') {
              const dx = player.x - e.x;
              const dz = player.z - e.z;
              const dist = Math.hypot(dx, dz);

              if (dist > 3.2) {
                const callSpeed = 28;
                const nx = (dx / dist) * callSpeed * dt;
                const nz = (dz / dist) * callSpeed * dt;
                e.x += nx;
                e.z += nz;
                e.y = getHeight(e.x, e.z);

                const targetFacing = Math.atan2(dx, dz);
                let hFacing = e.facingAngle || 0;
                let diff = targetFacing - hFacing;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                hFacing += diff * Math.min(1, dt * 10);
                e.facingAngle = hFacing;

                e.walkCycle += dt * 14;
                const s = Math.sin(e.walkCycle);
                if (rig.legs) {
                  rig.legs[0].rotation.x = s * 0.65;
                  rig.legs[1].rotation.x = -s * 0.65;
                  rig.legs[2].rotation.x = -s * 0.65;
                  rig.legs[3].rotation.x = s * 0.65;
                }
                e.mesh.position.set(e.x, e.y + Math.abs(s) * 0.08, e.z);
                e.mesh.rotation.y = hFacing;
              } else {
                // Прибежала и остановилась рядом с игроком!
                e.state = 'idle';
                e.moving = false;
                e.wanderTimer = 8; // Ждёт спокойно 8 секунд, чтобы игрок сел
                if (rig.legs) {
                  rig.legs.forEach((l) => {
                    l.rotation.x = 0;
                  });
                }
                e.mesh.position.set(e.x, e.y, e.z);
                sound.playHorseNeigh();
                addLogMessage(`🐴 ${e.name} лошадь прибежала! Нажмите [E], чтобы сесть.`);
              }
              continue;
            }

            e.wanderTimer -= dt;
            if (e.wanderTimer <= 0) {
              e.wanderTimer = 3 + Math.random() * 4;
              e.wanderAngle = Math.random() * Math.PI * 2;
              e.moving = Math.random() > 0.4;
            }

            if (e.moving) {
              const nx = Math.cos(e.wanderAngle) * e.speed * dt;
              const nz = Math.sin(e.wanderAngle) * e.speed * dt;
              const targetX = e.x + nx;
              const targetZ = e.z + nz;

              let blockedH = false;
              for (const o of obstacles) {
                if (Math.hypot(targetX - o.x, targetZ - o.z) < o.r + 0.6) {
                  blockedH = true;
                  break;
                }
              }

              if (
                !blockedH &&
                getHeight(targetX, targetZ) > WATER_LEVEL &&
                Math.abs(targetX) < 380 &&
                Math.abs(targetZ) < 380
              ) {
                e.x = targetX;
                e.z = targetZ;
                e.y = getHeight(e.x, e.z);

                const targetFacing = Math.atan2(nx, nz);
                let hFacing = e.facingAngle || 0;
                let diff = targetFacing - hFacing;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                hFacing += diff * Math.min(1, dt * 3);
                e.facingAngle = hFacing;

                e.walkCycle += dt * 4;
                const s = Math.sin(e.walkCycle);
                if (rig.legs) {
                  rig.legs[0].rotation.x = s * 0.4;
                  rig.legs[1].rotation.x = -s * 0.4;
                  rig.legs[2].rotation.x = -s * 0.4;
                  rig.legs[3].rotation.x = s * 0.4;
                }
              } else {
                e.wanderAngle += Math.PI;
              }
            } else if (rig.legs) {
              rig.legs.forEach((l) => {
                l.rotation.x *= 0.9;
              });
            }

            e.mesh.position.set(e.x, e.y, e.z);
            e.mesh.rotation.y = e.facingAngle || 0;
            continue;
          }

          if (e.hitFlash > 0) {
            e.hitFlash = Math.max(0, e.hitFlash - dt);
            const flashPower = e.hitFlash / 0.25;
            for (const m of rig.hitMeshes) {
              const mat = m.material as THREE.MeshStandardMaterial;
              if (mat.emissive) {
                mat.emissive.setHex(e.hitFlash > 0 ? 0xb82810 : 0x000000);
                mat.emissiveIntensity = e.hitFlash > 0 ? flashPower * 0.9 : 0;
              }
            }
          }

          if (e.type === 'npc') {
            if (player.inCaveId) {
              if (e.mesh.visible) e.mesh.visible = false;
              continue;
            }
            const dx = player.x - e.x;
            const dz = player.z - e.z;
            const d = Math.hypot(dx, dz);
            if (d > 85) {
              if (e.mesh.visible) e.mesh.visible = false;
              continue;
            }
            if (!e.mesh.visible) e.mesh.visible = true;
            const isTalkingWithMe =
              dialogOpenRef.current && e.dialogKey && activeDialogKeyRef.current === e.dialogKey;

            // Если это персонаж у костра (Лесоруб Бром, Рыбак Фарим, Охотник Ларс):
            // 1) При диалоге — ВСТАЁТ и общается со мной стоя
            // 2) По завершении диалога — ВОЗВРАЩАЕТСЯ к костру и садится жарить мясо
            // 3) Иногда рандомно встаёт, гуляет по лесу и снова возвращается к костру!
            if (e.campfireSeat) {
              if (isTalkingWithMe) {
                e.npcActivity = 'talking';
              } else if (e.npcActivity === 'talking') {
                e.npcActivity = 'returning';
              }

              if (e.npcActivity === 'talking') {
                e.y = getHeight(e.x, e.z);
                e.mesh.position.set(e.x, e.y, e.z);
                const ty = Math.atan2(dx, dz);
                let diff = ty - e.mesh.rotation.y;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                e.mesh.rotation.y += diff * Math.min(1, dt * 7);
                e.walkCycle += dt * 1.6;
                animateCharacter(e.mesh, e.walkCycle, 0, false, false, false);
                continue;
              }

              if (e.npcActivity === 'sitting') {
                e.activityTimer = (e.activityTimer ?? 18) - dt;
                // Присаживаем персонажа на бревно у костра и поворачиваем к огню и вертелу с мясом
                e.x = e.campfireSeat.x;
                e.z = e.campfireSeat.z;
                e.y = getHeight(e.x, e.z);
                e.mesh.position.set(e.x, e.y - 0.34, e.z);
                e.mesh.rotation.y = e.campfireSeat.rotY;
                e.walkCycle += dt * 2.2;

                // Поза сидения у костра + движения руками (переворачивает вертел с мясом / греет руки у огня)
                if (
                  rig.hipL &&
                  rig.hipR &&
                  rig.kneeL &&
                  rig.kneeR &&
                  rig.shoulderL &&
                  rig.shoulderR &&
                  rig.elbowL &&
                  rig.elbowR
                ) {
                  rig.hipL.rotation.set(-1.32, 0.08, 0);
                  rig.hipR.rotation.set(-1.32, -0.08, 0);
                  rig.kneeL.rotation.set(1.38, 0, 0);
                  rig.kneeR.rotation.set(1.38, 0, 0);
                  rig.body.position.y = 1.38 + Math.sin(e.walkCycle * 0.8) * 0.015;
                  rig.body.rotation.x = 0.14;
                  const roastWave = Math.sin(e.walkCycle * 1.4) * 0.18;
                  rig.shoulderL.rotation.set(-0.78 + roastWave, 0.18, 0);
                  rig.shoulderR.rotation.set(-0.78 - roastWave, -0.18, 0);
                  rig.elbowL.rotation.set(-0.48, 0, 0);
                  rig.elbowR.rotation.set(-0.48, 0, 0);
                  if (rig.headGroup) {
                    rig.headGroup.rotation.y = Math.sin(e.walkCycle * 0.45) * 0.14;
                  }
                }

                // Периодически персонаж встаёт от костра и отправляется погулять по лесу!
                if ((e.activityTimer ?? 0) <= 0 && d > 5.5) {
                  e.npcActivity = 'forest_walk';
                  e.activityTimer = 14 + Math.random() * 10;
                  e.wanderAngle = e.campfireSeat.rotY + Math.PI + (Math.random() - 0.5) * 1.4;
                  e.wanderTimer = 3.5;
                }
                continue;
              }

              if (e.npcActivity === 'forest_walk') {
                e.activityTimer = (e.activityTimer ?? 12) - dt;
                e.wanderTimer -= dt;
                if (e.wanderTimer <= 0) {
                  e.wanderTimer = 2.8 + Math.random() * 3.2;
                  e.wanderAngle += (Math.random() - 0.5) * 1.8;
                }
                const walkSpd = 3.8;
                const nx = Math.sin(e.wanderAngle) * walkSpd * dt;
                const nz = Math.cos(e.wanderAngle) * walkSpd * dt;
                const distFromCamp = Math.hypot(
                  e.x + nx - e.campfireSeat.x,
                  e.z + nz - e.campfireSeat.z
                );
                if (
                  distFromCamp < 24 &&
                  getHeight(e.x + nx, e.z + nz) > WATER_LEVEL + 0.8 &&
                  Math.hypot(e.x + nx - player.x, e.z + nz - player.z) > 1.8
                ) {
                  e.x += nx;
                  e.z += nz;
                } else {
                  e.wanderAngle += Math.PI * 0.8;
                }
                e.y = getHeight(e.x, e.z);
                e.mesh.position.set(e.x, e.y, e.z);
                e.mesh.rotation.y = e.wanderAngle;
                e.walkCycle += dt * 5.8;
                animateCharacter(e.mesh, e.walkCycle, 0.55, false, false, false);

                if ((e.activityTimer ?? 0) <= 0) {
                  e.npcActivity = 'returning';
                }
                continue;
              }

              if (e.npcActivity === 'returning') {
                const toSeatX = e.campfireSeat.x - e.x;
                const toSeatZ = e.campfireSeat.z - e.z;
                const seatDist = Math.hypot(toSeatX, toSeatZ);
                if (seatDist > 0.45) {
                  const retSpd = 4.2;
                  e.x += (toSeatX / seatDist) * retSpd * dt;
                  e.z += (toSeatZ / seatDist) * retSpd * dt;
                  e.y = getHeight(e.x, e.z);
                  e.mesh.position.set(e.x, e.y, e.z);
                  e.mesh.rotation.y = Math.atan2(toSeatX, toSeatZ);
                  e.walkCycle += dt * 6.0;
                  animateCharacter(e.mesh, e.walkCycle, 0.6, false, false, false);
                } else {
                  e.npcActivity = 'sitting';
                  e.activityTimer = 18 + Math.random() * 14;
                }
                continue;
              }
            }

            if (d < 8) {
              const ty = Math.atan2(dx, dz);
              let diff = ty - e.mesh.rotation.y;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              e.mesh.rotation.y += diff * Math.min(1, dt * 5);
            }
            e.walkCycle += dt * 1.5;
            animateCharacter(e.mesh, e.walkCycle, 0, false, false, false);
            continue;
          }

          const dx = player.x - e.x;
          const dz = player.z - e.z;
          const dist = Math.hypot(dx, dz);
          if (e.attackCd > 0) e.attackCd -= dt;

          // Если скелет находится в подземной пещере, а игрок снаружи (или наоборот) — не агрится сквозь землю
          const sameRealm = (e.inCaveId || null) === (player.inCaveId || null);
          const entityCave = e.inCaveId
            ? caveDungeons.find((c) => c.id === e.inCaveId) || null
            : null;
          const getEntityFloorY = (ex: number, ez: number) =>
            entityCave ? entityCave.interiorCenter.y : getHeight(ex, ez);

          // Distance Culling & AI/Animation Sleep (дальние объекты > 88м не грузят процессор и видеокарту)
          if (!sameRealm || dist > 88) {
            if (e.mesh.visible) e.mesh.visible = false;
            continue;
          }
          if (!e.mesh.visible) e.mesh.visible = true;

          // 🗿 ИИ дружественных призванных Големов (крушат ближайших врагов или сопровождают героя!)
          if (e.type === 'golem' && e.isFriendlySummon) {
            let nearestFoe: GameEntity | null = null;
            let bestFoeDist = 28;
            for (const foe of entities) {
              if (
                foe.dead ||
                foe.type === 'npc' ||
                foe.type === 'horse' ||
                foe.isFriendlySummon ||
                (foe.inCaveId || null) !== (e.inCaveId || null)
              )
                continue;
              const fd = Math.hypot(foe.x - e.x, foe.z - e.z);
              if (fd < bestFoeDist) {
                bestFoeDist = fd;
                nearestFoe = foe;
              }
            }

            if (nearestFoe) {
              const fdx = nearestFoe.x - e.x;
              const fdz = nearestFoe.z - e.z;
              const fd = Math.hypot(fdx, fdz) || 1;
              e.mesh.rotation.y = Math.atan2(fdx, fdz);
              if (fd > 2.4) {
                e.x += (fdx / fd) * e.speed * dt;
                e.z += (fdz / fd) * e.speed * dt;
                e.y = getEntityFloorY(e.x, e.z);
                e.mesh.position.set(e.x, e.y, e.z);
                e.walkCycle += dt * 7;
                animateCharacter(e.mesh, e.walkCycle, 0.9, false, false, false);
              } else if (e.attackCd <= 0) {
                e.attackCd = 1.1;
                nearestFoe.hp -= e.dmg;
                nearestFoe.hitFlash = 0.25;
                sound.playSwordHit();
                spawnParticles(nearestFoe.x, nearestFoe.y + 1.4, nearestFoe.z, 0x88ff44, 10);
                pushFloatingDamage(
                  nearestFoe.x,
                  nearestFoe.y + 2.1,
                  nearestFoe.z,
                  e.dmg,
                  '🗿 УДАР ГОЛЕМА!'
                );
                if (nearestFoe.hp <= 0) handleEntityDeath(nearestFoe);
              }
            } else if (dist > 4.5) {
              e.x += (dx / dist) * e.speed * 0.85 * dt;
              e.z += (dz / dist) * e.speed * 0.85 * dt;
              e.y = getEntityFloorY(e.x, e.z);
              e.mesh.position.set(e.x, e.y, e.z);
              e.mesh.rotation.y = Math.atan2(dx, dz);
              e.walkCycle += dt * 6;
              animateCharacter(e.mesh, e.walkCycle, 0.75, false, false, false);
            } else {
              animateCharacter(e.mesh, e.walkCycle, 0, false, false, false);
            }
            continue;
          }

          if (e.state === 'windup') {
            e.stateTimer -= dt;
            const t = 1 - e.stateTimer / e.windupTime;
            if (e.type === 'troll') {
              if (rig.shoulderL && rig.shoulderR) {
                rig.shoulderL.rotation.x = -2.0 * t;
                rig.shoulderR.rotation.x = -2.0 * t;
              }
            } else if (rig.shoulderR) {
              rig.shoulderR.rotation.x = -1.5 * t;
            }
            if (e.stateTimer <= 0) {
              if (dist < e.atkRange + 0.8) playerTakeDamage(e.dmg);
              e.state = 'recover';
              e.stateTimer = 0.4;
              if (rig.shoulderR) rig.shoulderR.rotation.x = 0.4;
              if (e.type === 'troll' && rig.shoulderL) rig.shoulderL.rotation.x = 0.4;
            }
          } else if (e.state === 'recover') {
            e.stateTimer -= dt;
            if (e.stateTimer <= 0) {
              e.state = dist < e.aggro ? 'chase' : 'idle';
              if (rig.shoulderR) rig.shoulderR.rotation.x = 0;
              if (rig.shoulderL) rig.shoulderL.rotation.x = 0;
            }
          } else if (dist < e.aggro) {
            e.state = 'chase';
            const minPlayerDist =
              e.type === 'troll' ? 2.2 : e.type === 'bear' ? 1.7 : 1.35;
            if (dist > Math.max(e.atkRange - 0.2, minPlayerDist)) {
              const nx = (dx / dist) * e.speed * dt;
              const nz = (dz / dist) * e.speed * dt;
              let blocked = false;
              if (!entityCave) {
                for (const o of obstacles) {
                  if (Math.hypot(e.x + nx - o.x, e.z + nz - o.z) < o.r + 0.5) {
                    blocked = true;
                    break;
                  }
                }
              }
              // Не позволяем врагам проходить сквозь других персонажей/существ
              if (!blocked) {
                for (const other of entities) {
                  if (other === e || other.dead || other.inCaveId !== e.inCaveId) continue;
                  if (Math.hypot(e.x + nx - other.x, e.z + nz - other.z) < 1.1) {
                    blocked = true;
                    break;
                  }
                }
              }
              if (!blocked) {
                e.x += nx;
                e.z += nz;
              }
              e.y = getEntityFloorY(e.x, e.z);
              e.mesh.position.set(e.x, e.y, e.z);
            }
            const ty = Math.atan2(dx, dz);
            let diff = ty - e.mesh.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            e.mesh.rotation.y += diff * Math.min(1, dt * 8);
            if (dist < e.atkRange && e.attackCd <= 0) {
              e.state = 'windup';
              e.stateTimer = e.windupTime;
              e.attackCd = 1.6 + Math.random() * 0.4;
              if (e.type === 'wolf') sound.playWolfBark(dist);
              else if (e.type === 'bear') sound.playBearGrowl(dist);
            }
            e.walkCycle += dt * 8;
            e.moveBlend = 1;
          } else {
            e.state = 'idle';
            // Существа дальше 55 м спокойно стоят на месте без лишних расчетов физики и костей каждый кадр
            if (dist > 55) {
              continue;
            }
            e.wanderTimer -= dt;
            if (e.wanderTimer <= 0) {
              e.wanderTimer = 2 + Math.random() * 3;
              e.wanderAngle = Math.random() * Math.PI * 2;
            }
            const nx = Math.cos(e.wanderAngle) * e.speed * 0.3 * dt;
            const nz = Math.sin(e.wanderAngle) * e.speed * 0.3 * dt;
            const minPlayerDistIdle = getEntitySolidRadius(e, Boolean(player.riding));
            const nextDistToPlayer = Math.hypot(e.x + nx - player.x, e.z + nz - player.z);
            const allowedMove = entityCave
              ? Math.hypot(e.x + nx - entityCave.interiorCenter.x, e.z + nz - entityCave.interiorCenter.z) < 20
              : getHeight(e.x + nx, e.z + nz) > WATER_LEVEL;
            if (allowedMove && nextDistToPlayer >= minPlayerDistIdle) {
              e.x += nx;
              e.z += nz;
            } else {
              e.wanderAngle += Math.PI;
            }
            e.y = getEntityFloorY(e.x, e.z);
            e.mesh.position.set(e.x, e.y, e.z);
            e.mesh.rotation.y = Math.atan2(Math.cos(e.wanderAngle), Math.sin(e.wanderAngle));
            e.walkCycle += dt * 4;
            e.moveBlend = 0.5;
          }
          if (e.state !== 'windup') {
            animateCharacter(e.mesh, e.walkCycle, e.moveBlend, false, false, false);
          }
        }

        // Дополнительный финальный проход разделения после шага всех скелетов и врагов,
        // чтобы ни один скелет при атаке или отбрасывании не оказался внутри игрока!
        if (!player.riding) {
          const postSolve = enforceHardCollisions(
            player.x,
            player.z,
            player.vx,
            player.vz,
            null
          );
          player.x = postSolve.x;
          player.z = postSolve.z;
          player.mesh.position.set(player.x, player.y, player.z);
        }

        // Гарантия целостности и видимости 3D-модели главного героя в каждом кадре
        if (!Number.isFinite(player.x) || !Number.isFinite(player.y) || !Number.isFinite(player.z)) {
          player.x = startX;
          player.z = startZ;
          player.y = getHeight(startX, startZ);
          player.vx = 0;
          player.vz = 0;
        }
        player.mesh.visible = true;
        if (!player.riding && player.mesh.parent !== scene) {
          scene.add(player.mesh);
          player.mesh.scale.set(1, 1, 1);
        } else if (player.riding && player.mesh.parent !== player.riding.mesh) {
          player.riding.mesh.add(player.mesh);
          player.mesh.position.set(0, 1.15, -0.15);
          player.mesh.rotation.set(0, 0, 0);
          player.mesh.scale.set(1, 1, 1);
        }

        // 3. Update Drops & Particles
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          d.life -= dt;
          if (d.life <= 0) {
            scene.remove(d.mesh);
            drops.splice(i, 1);
            continue;
          }
          const dx = player.x - d.x;
          const dz = player.z - d.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 4) d.attracted = true;
          if (d.attracted && dist > 0.5) {
            d.vx += (dx / dist) * 12 * dt;
            d.vz += (dz / dist) * 12 * dt;
            d.vy += (player.y + 1 - d.y) * 2 * dt;
          } else if (d.attracted) {
            player.gold += d.amount;
            sound.playCoinPickup();
            progressQuest('gold', d.amount);
            addLogMessage(`💰 +${d.amount} золота`);
            scene.remove(d.mesh);
            drops.splice(i, 1);
            continue;
          }
          d.vy -= 12 * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.z += d.vz * dt;
          const gY = getHeight(d.x, d.z) + 0.3;
          if (d.y < gY) {
            d.y = gY;
            d.vy = 0;
            d.vx *= 0.7;
            d.vz *= 0.7;
          }
          d.mesh.position.set(d.x, d.y + Math.sin(now * 0.005) * 0.1, d.z);
          d.mesh.rotation.z += dt * 3;
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= dt;
          if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
            continue;
          }
          p.vy -= 15 * dt;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life / p.maxLife;
        }

        // 3a. Полёт 3D-стрел, выпущенных из лука (с баллистикой, снайперским попаданием и стихийными взрывами)
        for (let i = activeArrows.length - 1; i >= 0; i--) {
          const ar = activeArrows[i];
          ar.life -= dt;
          if (ar.life <= 0) {
            scene.remove(ar.mesh);
            activeArrows.splice(i, 1);
            continue;
          }
          ar.vy -= 9.5 * dt; // Лёгкая баллистическая дуга стрелы
          ar.x += ar.vx * dt;
          ar.y += ar.vy * dt;
          ar.z += ar.vz * dt;
          ar.mesh.position.set(ar.x, ar.y, ar.z);
          const nextLook = new THREE.Vector3(ar.x + ar.vx, ar.y + ar.vy, ar.z + ar.vz);
          ar.mesh.lookAt(nextLook);

          // Проверка попадания стрелы во врагов
          let hitTarget: GameEntity | null = null;
          for (const e of entities) {
            if (e.dead || e.type === 'npc' || e.type === 'horse' || e.isFriendlySummon) continue;
            if ((e.inCaveId || null) !== (player.inCaveId || null)) continue;
            const hitRadius = e.type === 'troll' ? 2.3 : e.type === 'bear' || e.type === 'orc' ? 1.55 : 1.25;
            const dy = ar.y - (e.y + 1.25);
            const dHoriz = Math.hypot(ar.x - e.x, ar.z - e.z);
            if (dHoriz < hitRadius && Math.abs(dy) < 1.65) {
              hitTarget = e;
              break;
            }
          }

          if (hitTarget) {
            const isHeadshot = ar.y > hitTarget.y + 1.55;
            const finalDmg = isHeadshot ? Math.round(ar.dmg * 1.45) : ar.dmg;
            hitTarget.hp -= finalDmg;
            hitTarget.hitFlash = 0.28;
            hitTarget.aggro = Math.max(hitTarget.aggro, 45);
            sound.playSwordHit();
            progressQuest('archery', 1);

            const trailColor =
              ar.arrowType === 'fire'
                ? 0xff5511
                : ar.arrowType === 'poison'
                ? 0x33dd44
                : ar.arrowType === 'ice'
                ? 0x44ccff
                : ar.arrowType === 'explosive'
                ? 0xffaa22
                : 0xffe090;
            spawnParticles(ar.x, ar.y, ar.z, trailColor, ar.arrowType === 'explosive' ? 26 : 14);

            // Если стрела взрывная или огненная — наносит дополнительный урон соседям в радиусе!
            if (ar.arrowType === 'explosive' || ar.arrowType === 'fire') {
              const aoeRad = ar.arrowType === 'explosive' ? 5.5 : 3.2;
              for (const other of entities) {
                if (other === hitTarget || other.dead || other.type === 'npc' || other.type === 'horse') continue;
                if (Math.hypot(other.x - ar.x, other.z - ar.z) < aoeRad) {
                  const splash = Math.round(finalDmg * 0.55);
                  other.hp -= splash;
                  other.hitFlash = 0.25;
                  if (other.hp <= 0) handleEntityDeath(other);
                }
              }
            } else if (ar.arrowType === 'ice') {
              hitTarget.speed = Math.max(1.8, hitTarget.speed * 0.72);
            }

            const label = isHeadshot
              ? '🎯 СНАЙПЕРСКИЙ ВЫСТРЕЛ В ГОЛОВУ!'
              : ar.isSniperShot
              ? '🏹 СНАЙПЕРСКИЙ ВЫСТРЕЛ!'
              : '🏹 ВЫСТРЕЛ ИЗ ЛУКА';
            pushFloatingDamage(hitTarget.x, hitTarget.y + 2.2, hitTarget.z, finalDmg, label);

            if (hitTarget.hp <= 0) {
              handleEntityDeath(hitTarget);
            }
            scene.remove(ar.mesh);
            activeArrows.splice(i, 1);
            continue;
          }

          // Проверка попадания стрелы в землю или пол пещеры
          const curCave = player.inCaveId
            ? caveDungeons.find((c) => c.id === player.inCaveId) || null
            : null;
          const floorY = curCave ? curCave.interiorCenter.y : getHeight(ar.x, ar.z);
          if (ar.y <= floorY + 0.1) {
            spawnParticles(ar.x, floorY + 0.15, ar.z, 0xd4a862, 6);
            scene.remove(ar.mesh);
            activeArrows.splice(i, 1);
          }
        }

        // 3a-2. Полёт 3D Атакующих Шаров Заклинаний (Файерболы 5 стихий и уровней Two Worlds!)
        for (let i = activeSpellOrbs.length - 1; i >= 0; i--) {
          const orb = activeSpellOrbs[i];
          orb.life -= dt;
          if (orb.life <= 0) {
            scene.remove(orb.mesh);
            activeSpellOrbs.splice(i, 1);
            continue;
          }
          orb.x += orb.vx * dt;
          orb.y += orb.vy * dt;
          orb.z += orb.vz * dt;
          orb.mesh.position.set(orb.x, orb.y, orb.z);
          orb.mesh.rotation.y += dt * 8;
          orb.mesh.rotation.x += dt * 6;

          const meta = ELEMENT_INFO[orb.element];
          let hitOrbTarget: GameEntity | null = null;
          for (const e of entities) {
            if (e.dead || e.type === 'npc' || e.type === 'horse' || e.isFriendlySummon) continue;
            if ((e.inCaveId || null) !== (player.inCaveId || null)) continue;
            const hitRad = e.type === 'troll' ? 2.5 : 1.7;
            if (
              Math.hypot(orb.x - e.x, orb.z - e.z) < hitRad &&
              Math.abs(orb.y - (e.y + 1.25)) < 1.9
            ) {
              hitOrbTarget = e;
              break;
            }
          }

          const curCave = player.inCaveId
            ? caveDungeons.find((c) => c.id === player.inCaveId) || null
            : null;
          const floorY = curCave ? curCave.interiorCenter.y : getHeight(orb.x, orb.z);
          const hitGround = orb.y <= floorY + 0.25;

          if (hitOrbTarget || hitGround) {
            spawnParticles(orb.x, orb.y, orb.z, meta.color, 26);
            sound.playSwordHit();
            const blastRadius = 4.6 + orb.level * 0.45;
            let hitAnyOrb = false;
            for (const e of entities) {
              if (e.dead || e.type === 'npc' || e.type === 'horse' || e.isFriendlySummon) continue;
              if ((e.inCaveId || null) !== (player.inCaveId || null)) continue;
              const d = Math.hypot(e.x - orb.x, e.z - orb.z);
              if (d <= blastRadius) {
                const dmg = e === hitOrbTarget ? orb.dmg : Math.round(orb.dmg * 0.7);
                e.hp -= dmg;
                e.hitFlash = 0.32;
                e.aggro = Math.max(e.aggro, 45);
                hitAnyOrb = true;
                pushFloatingDamage(
                  e.x,
                  e.y + 2.2,
                  e.z,
                  dmg,
                  `${meta.spellName.toUpperCase()} УР.${orb.level}!`
                );
                if (orb.element === 'water') {
                  e.speed = Math.max(2.0, e.speed * 0.72);
                } else if (orb.element === 'air' && d > 0.1) {
                  e.x += ((e.x - orb.x) / d) * 2.2;
                  e.z += ((e.z - orb.z) / d) * 2.2;
                } else if (orb.element === 'necro') {
                  player.hp = Math.min(player.maxHp, player.hp + Math.round(dmg * 0.25));
                }
                if (e.hp <= 0) {
                  handleEntityDeath(e);
                }
              }
            }
            if (hitAnyOrb) {
              progressQuest('mage_fireballs', 1);
            }
            scene.remove(orb.mesh);
            activeSpellOrbs.splice(i, 1);
          }
        }

        // 3b. Левитация Гримуаров и автоматический сбор трав, яиц (гнёздышки остаются на земле!), сердец и гримуаров в Сумочку!
        for (const col of worldCollectibles) {
          if (col.collected) {
            // Если это гнёздышко на земле, из которого собрали яйца — само гнездо остаётся на месте,
            // а через некоторое время птицы могут снова снести в него свежие яйца!
            if (col.eggsGroup && col.respawnTimer !== undefined) {
              col.respawnTimer -= dt;
              if (col.respawnTimer <= 0) {
                col.collected = false;
                col.eggsGroup.visible = true;
                col.respawnTimer = undefined;
              }
            }
            continue;
          }
          const distToPlayer = Math.hypot(col.x - player.x, col.z - player.z);
          if (distToPlayer > 90) {
            if (col.mesh.visible) col.mesh.visible = false;
            continue;
          }
          if (!col.mesh.visible) col.mesh.visible = true;

          if (distToPlayer < 48) {
            col.phase += dt * 2.8;
            if (col.floatingPart) {
              col.floatingPart.position.y =
                (col.auraRing ? 1.1 : 0.95) + Math.sin(col.phase) * 0.16;
              col.floatingPart.rotation.y += dt * 1.4;
            } else if (!col.eggsGroup && col.itemId !== 'firewood_bundle') {
              col.mesh.rotation.y += dt * 0.8;
            }
            if (col.auraRing) {
              col.auraRing.rotation.z -= dt * 1.2;
            }
          }

          if (distToPlayer < 2.35) {
            col.collected = true;
            if (col.eggsGroup) {
              // Подбираем ЧИСТО ЯЙЦА из гнезда, а само плетёное гнёздышко остаётся лежать на земле!
              col.eggsGroup.visible = false;
              col.respawnTimer = 85;
            } else {
              scene.remove(col.mesh);
            }
            const def = ITEM_CATALOG[col.itemId];
            if (def) {
              addItemToBag(col.itemId, 1);
              if (col.itemId === 'fishing_rod') {
                sound.playItemPickup(true);
                spawnParticles(col.x, col.y + 1.4, col.z, 0x44e5ff, 24);
                progressQuest('fishing_rod', 1);
                addLogMessage(
                  '🎣 Подобрана удочка рыбака Фарима! Верните её Фариму у костра за монеты и опыт!'
                );
              } else if (col.itemId === 'elena_ring') {
                sound.playItemPickup(true);
                spawnParticles(col.x, col.y + 1.0, col.z, 0x55bbff, 24);
                progressQuest('elena_ring', 1);
                addLogMessage(
                  '💍 Найдено Золотое колечко Елены с сапфиром! Верните его Елене в деревне за монеты и опыт!'
                );
              } else if (col.itemId === 'firewood_bundle') {
                sound.playItemPickup(false);
                spawnParticles(col.x, col.y + 0.6, col.z, 0xffaa33, 14);
                progressQuest('firewood', 1);
                addLogMessage(
                  '🪵 Подобрана связка сухих дров! Отнесите дрова Лесорубу Брому к костру за монетки!'
                );
              } else if (def.category === 'grimoire' && def.grimoireElement) {
                // Гримуар сразу повышает уровень магии стихии И сохраняется в книге знаний
                const el = def.grimoireElement;
                player.magicLevels[el] = (player.magicLevels[el] || 0) + 1;
                setMagicLevels({ ...player.magicLevels });
                sound.playItemPickup(true);
                spawnParticles(col.x, col.y + 1.2, col.z, ELEMENT_INFO[el].color, 20);
                addLogMessage(
                  `📖 Найден ${def.name}! Навык Ур.${player.magicLevels[el]} (клавиша [${ELEMENT_INFO[el].hotkey}])`
                );
              } else if (def.category === 'card' && def.cardElement) {
                sound.playItemPickup(true);
                spawnParticles(col.x, col.y + 1.0, col.z, ELEMENT_INFO[def.cardElement].color, 18);
                addLogMessage(
                  `🃏 Подобрана ${def.name}! Откройте Сумочку [I] для экипировки или слияния ★`
                );
              } else if (def.category === 'weapon' || def.category === 'shield') {
                sound.playSwordDraw(false);
                spawnParticles(col.x, col.y + 0.9, col.z, 0x99ccff, 16);
                addLogMessage(
                  `⚔️ В сумочку: ${def.icon} ${def.name} (Можно надеть или слить дубликаты в [I]!)`
                );
              } else {
                sound.playItemPickup(Boolean(def.unlockAllMagic));
                spawnParticles(col.x, col.y + 0.6, col.z, 0xf5d76e, 10);
                addLogMessage(`🎒 В сумочку: ${def.icon} ${def.name}`);
              }
            }
          }
        }

        // 4. Освещение и смена суток — 1-в-1 как в оригинальной v9!
        const preset = gfxRef.current.presetTime;
        if (preset === 'auto') {
          gameTime += dt * 6;
          if (gameTime >= 24 * 60) {
            gameTime = 0;
            gameDay++;
          }
        } else if (preset === 'dawn') gameTime = 6.2 * 60;
        else if (preset === 'noon') gameTime = 12.5 * 60;
        else if (preset === 'sunset') gameTime = 18.8 * 60;
        else if (preset === 'night') gameTime = 23 * 60;

        const hour = (gameTime / 60) % 24;
        const angle = ((hour - 6) / 24) * Math.PI * 2;
        sun.position.set(
          player.x + Math.cos(angle) * 180,
          Math.max(15, Math.sin(angle) * 220),
          player.z + Math.cos(angle) * 90
        );
        sun.target.position.set(player.x, player.y, player.z);
        sun.intensity = Math.max(0.1, Math.sin(angle) * 1.4);
        ambient.intensity = 0.15 + Math.max(0, Math.sin(angle)) * 0.5;

        const dT = new THREE.Color(0x3a5a8a);
        const dB = new THREE.Color(0xc0b090);
        const nT = new THREE.Color(0x050810);
        const nB = new THREE.Color(0x101828);
        const sT = new THREE.Color(0x4a3060);
        const sB = new THREE.Color(0xe08040);

        let topC: THREE.Color;
        let botC: THREE.Color;
        if (hour < 5 || hour > 21) {
          topC = nT;
          botC = nB;
        } else if (hour < 7) {
          const t = (hour - 5) / 2;
          topC = nT.clone().lerp(sT, t);
          botC = nB.clone().lerp(sB, t);
        } else if (hour < 9) {
          const t = (hour - 7) / 2;
          topC = sT.clone().lerp(dT, t);
          botC = sB.clone().lerp(dB, t);
        } else if (hour < 18) {
          topC = dT;
          botC = dB;
        } else if (hour < 20) {
          const t = (hour - 18) / 2;
          topC = dT.clone().lerp(sT, t);
          botC = dB.clone().lerp(sB, t);
        } else {
          const t = hour - 20;
          topC = sT.clone().lerp(nT, t);
          botC = sB.clone().lerp(nB, t);
        }

        skyUniforms.topColor.value.copy(topC);
        skyUniforms.bottomColor.value.copy(botC);
        if (!scene.fog) scene.fog = new THREE.FogExp2(0x8a7a5a, 0.008);
        (scene.fog as THREE.FogExp2).color.copy(botC);

        // 4b. Ночное небо: Звёзды случайного размера на разных расстояниях + Луна в разных фазах!
        nightSkyGroup.position.set(player.x, 0, player.z);
        let nightVis = 0;
        if (hour >= 19.5 || hour <= 6.2) {
          if (hour >= 20.5 || hour <= 5.0) nightVis = 1;
          else if (hour >= 19.5) nightVis = (hour - 19.5) / 1.0;
          else nightVis = (6.2 - hour) / 1.2;
        }
        nightSkyGroup.visible = nightVis > 0.01;
        if (nightVis > 0.01) {
          moonPhaseAutoTimer += dt;
          if (moonPhaseAutoTimer >= 28) {
            moonPhaseAutoTimer = 0;
            currentMoonPhaseIdx = (currentMoonPhaseIdx + 1) % MOON_PHASES.length;
            renderMoonPhaseToCanvas(currentMoonPhaseIdx);
          }
          const moonAz = ((hour + 6) / 24) * Math.PI * 2;
          const moonDist = 265;
          const moonY = 125 + Math.sin(moonAz) * 45;
          moonSprite.position.set(
            Math.cos(moonAz) * moonDist,
            moonY,
            Math.sin(moonAz) * moonDist
          );
          moonMat.opacity = nightVis * 0.96;

          for (const layer of starLayers) {
            const tw =
              0.65 + 0.35 * Math.sin(now * 0.001 * layer.twinkleSpeed + layer.twinklePhase);
            layer.mat.opacity = nightVis * tw * 0.95;
          }
        }

        minimapTimer += dt;
        if (minimapTimer >= 0.06) {
          minimapTimer = 0;
          drawMinimap();
        }

        // 5. Спокойная фоновая мелодия и уместные звуки фауны (без музыки боя/тревоги и без наложения!)
        let nearestWolfDist = 999;
        let nearestBearDist = 999;
        let wolfAggroed = false;
        let bearAggroed = false;
        for (const e of entities) {
          if (e.dead) continue;
          if (e.type === 'wolf') {
            const d = Math.hypot(e.x - player.x, e.z - player.z);
            if (d < nearestWolfDist) nearestWolfDist = d;
            if (e.state === 'chase' || e.state === 'windup') wolfAggroed = true;
          } else if (e.type === 'bear') {
            const d = Math.hypot(e.x - player.x, e.z - player.z);
            if (d < nearestBearDist) nearestBearDist = d;
            if (e.state === 'chase' || e.state === 'windup') bearAggroed = true;
          }
        }
        const audioState = sound.update({
          dt,
          hour,
          nearestWolfDist,
          nearestBearDist,
          wolfAggroed,
          bearAggroed,
        });

        hudTimer += dt;
        if (hudTimer > 0.2) {
          hudTimer = 0;
          const hours = Math.floor(gameTime / 60) % 24;
          const mins = Math.floor(gameTime % 60);
          const dist = Math.hypot(player.x, player.z);
          const curCave = player.inCaveId
            ? caveDungeons.find((c) => c.id === player.inCaveId) || null
            : null;
          let region = 'Луга Миртаны';
          if (curCave) region = `🕳️ ${curCave.name}`;
          else if (player.riding) region = `Верхом — ${player.riding.name}`;
          else if (player.isSwimming) region = 'Вода';
          else if (Math.hypot(player.x - -85, player.z - 25) < 38) region = 'Озёрная деревня (Маг Воды)';
          else if (Math.hypot(player.x - 25, player.z - 95) < 38) region = 'Край Големов (Маг Земли)';
          else if (Math.hypot(player.x - -80, player.z - -95) < 38) region = 'Ветреный Приют (Маги Воздуха и Некромагии)';
          else if (dist < 40) region = 'Лагерь у Костра';
          else if (player.x > 40 && player.z < -30) region = 'Деревня Горна (Маг Огня)';
          else if (dist > 300) region = 'Дикие земли';

          const curArrowCount = player.equippedQuiver
            ? inventoryRef.current[player.equippedQuiver] || 0
            : 0;
          const activeGolemsCount = entities.filter(
            (ent) => !ent.dead && ent.type === 'golem' && ent.isFriendlySummon
          ).length;

          setHud({
            hp: Math.ceil(player.hp),
            maxHp: player.maxHp,
            mp: Math.ceil(player.mp),
            maxMp: player.maxMp,
            stamina: Math.ceil(player.stamina),
            maxStamina: player.maxStamina,
            level: player.level,
            xp: player.xp,
            xpNext: player.xpNext,
            gold: player.gold,
            region,
            timeString: `День ${gameDay}, ${String(hours).padStart(2, '0')}:${String(
              mins
            ).padStart(2, '0')}`,
            comboStep: player.comboStep,
            ridingHorseName: player.riding ? player.riding.name : null,
            weaponsDrawn: player.weaponsDrawn,
            musicMood: audioState.mood,
            musicLabel: audioState.label,
            hpBonusPct: player.hpBonusPct,
            mpBonusPct: player.mpBonusPct,
            agilityBonusPct: player.agilityBonusPct,
            dmgBonusPct: player.dmgBonusPct,
            moonPhaseName: `${MOON_PHASES[currentMoonPhaseIdx].icon} ${MOON_PHASES[currentMoonPhaseIdx].name}`,
            sniperAiming: player.sniperAiming,
            bowModeActive: player.bowMode,
            inCaveName: curCave ? curCave.name : null,
            arrowCount: curArrowCount,
            activeGolemsCount,
          });

          // Синхронизируем дистанцию седельных сумок только когда открыта сумочка (экономия React-рендеров!)
          if (bagOpenRef.current) {
            const hList: {
              id: string;
              name: string;
              coatHex: string;
              dist: number;
              isRiding: boolean;
              canAccess: boolean;
            }[] = [];
            for (const e of entities) {
              if (e.type === 'horse' && e.horseId) {
                const isRidingThis = player.riding === e;
                const d = isRidingThis ? 0 : Math.round(Math.hypot(e.x - player.x, e.z - player.z));
                hList.push({
                  id: e.horseId,
                  name: e.name,
                  coatHex: e.coatHex || '#8a4a20',
                  dist: d,
                  isRiding: isRidingThis,
                  canAccess: isRidingThis || d <= 9,
                });
              }
            }
            setHorsesStatus(hList);
          }

          if (player.riding) {
            setInteractPrompt(`[E] Слезть с лошади • [B] Сумочка лошади (${player.riding.name})`);
          } else {
            // Проверяем пещеры, сундуки, алхимические котлы и телепорты рядом с героем
            let customPrompt: string | null = null;
            if (curCave) {
              for (let ci = 0; ci < curCave.chests.length; ci++) {
                const ch = curCave.chests[ci];
                if (!ch.opened && Math.hypot(player.x - ch.pos.x, player.z - ch.pos.z) < 4.0) {
                  customPrompt = `[E] 🎁 Открыть кованый сундук пещеры`;
                  break;
                }
              }
              if (
                !customPrompt &&
                Math.hypot(player.x - curCave.exitPortalPos.x, player.z - curCave.exitPortalPos.z) < 4.5
              ) {
                customPrompt = `[E] 🚪 Выйти из подземелья на поверхность`;
              }
            } else {
              for (const c of caveDungeons) {
                if (Math.hypot(player.x - c.entranceX, player.z - c.entranceZ) < 5.5) {
                  customPrompt = `[E] 🕳️ Войти в подземелье: «${c.name}»`;
                  break;
                }
              }
              if (!customPrompt) {
                for (const caul of worldCauldrons) {
                  if (Math.hypot(player.x - caul.x, player.z - caul.z) < 4.5) {
                    customPrompt = `[E / C] ⚗️ Открыть Алхимический Котёл (${caul.name})`;
                    break;
                  }
                }
              }
              if (!customPrompt) {
                for (const pad of stationaryTeleporters) {
                  if (Math.hypot(player.x - pad.x, player.z - pad.z) < 4.8) {
                    customPrompt = `[E / T] 🌀 Телепортироваться через «${pad.name}»`;
                    break;
                  }
                }
              }
            }

            if (customPrompt) {
              setInteractPrompt(customPrompt);
            } else {
              const npc = findNearestNPC();
              if (npc) {
                setInteractPrompt(`[E] Говорить с ${npc.name}`);
              } else {
                const horse = findNearestHorse();
                if (horse) {
                  setInteractPrompt(
                    `[E] Сесть верхом • [B] Сумочка лошади (${horse.name})`
                  );
                } else {
                  setInteractPrompt(null);
                }
              }
            }
          }

          let target: GameEntity | null = null;
          let nd = 20;
          const fx = -Math.sin(camControl.yaw);
          const fz = -Math.cos(camControl.yaw);
          for (const e of entities) {
            if (e.dead || e.type === 'npc' || e.type === 'horse') continue;
            const dx = e.x - player.x;
            const dz = e.z - player.z;
            const d = Math.hypot(dx, dz);
            if (d > nd) continue;
            const dot = (dx / d) * fx + (dz / d) * fz;
            if (dot < 0.5) continue;
            nd = d;
            target = e;
          }
          setTargetEnemy(
            target ? { name: target.name, hp: Math.max(0, target.hp), maxHp: target.maxHp } : null
          );
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('wheel', onWheel);
      sound.dispose();
      renderer.dispose();
    };
  }, []);

  const handleStartGame = () => {
    soundRef.current?.init();
    setIsLoading(false);
    setIsPaused(false);
    setGameStarted(true);
  };

  const toggleMuteAudio = () => {
    soundRef.current?.init();
    const next = !soundMuted;
    setSoundMuted(next);
    soundRef.current?.setMuted(next);
  };

  const handleVolumeChange = (val: number) => {
    soundRef.current?.init();
    setSoundVolume(val);
    soundRef.current?.setVolume(val);
    if (val > 0 && soundMuted) {
      setSoundMuted(false);
      soundRef.current?.setMuted(false);
    }
  };

  // ============================================================
  // 🐴 СЕДЕЛЬНЫЕ СУМКИ ЛОШАДЕЙ (TWO WORLDS) — Перекладывание предметов
  // ============================================================
  const selectedHorseMeta =
    horsesStatus.find((h) => h.id === selectedHorseId) || horsesStatus[0];
  const selectedHorseBag = horseBags[selectedHorseId] || {};

  const calcBagWeight = (bag: Record<string, number>) => {
    let w = 0;
    for (const [id, q] of Object.entries(bag)) {
      if (q <= 0) continue;
      const def = ITEM_CATALOG[id];
      if (!def) continue;
      const itemW =
        def.category === 'weapon' || def.category === 'shield'
          ? 4.5
          : def.category === 'artifact' || def.category === 'grimoire'
          ? 2.0
          : def.category === 'trophy'
          ? 1.5
          : 0.5;
      w += itemW * q;
    }
    return Math.round(w * 10) / 10;
  };

  const heroBagWeight = calcBagWeight(inventory);
  const heroMaxWeight = 80 + skills.strength * 25;
  const horseBagWeight = calcBagWeight(selectedHorseBag);
  const horseMaxWeight = 500;

  const transferToHorse = (horseId: string, itemId: string, amount: number) => {
    const def = ITEM_CATALOG[itemId];
    if (!def) return;
    const hMeta = horsesStatus.find((h) => h.id === horseId);
    if (hMeta && !hMeta.canAccess) {
      addLogMessage(
        `🐴 Лошадь «${hMeta.name}» далеко (${hMeta.dist}м)! Нажмите «🎵 Позвать к себе», чтобы сложить поклажу.`
      );
      return;
    }
    const currentQty = inventory[itemId] || 0;
    const moveQty = Math.min(currentQty, amount);
    if (moveQty <= 0) return;

    // Если перекладываем последний экземпляр надетого оружия/щита/карты — снимаем его с рук
    if (currentQty - moveQty <= 0) {
      if (
        equippedWeapon === itemId ||
        equippedShield === itemId ||
        equippedCard === itemId
      ) {
        equipItemRef.current(itemId);
      }
    }

    setInventory((prev) => {
      const cur = prev[itemId] || 0;
      const actual = Math.min(cur, moveQty);
      if (actual <= 0) return prev;
      const next = { ...prev };
      if (cur - actual <= 0) delete next[itemId];
      else next[itemId] = cur - actual;
      return next;
    });

    setHorseBags((prev) => {
      const curHorse = prev[horseId] || {};
      return {
        ...prev,
        [horseId]: {
          ...curHorse,
          [itemId]: (curHorse[itemId] || 0) + moveQty,
        },
      };
    });

    soundRef.current?.playItemPickup(false);
    addLogMessage(
      `🐴➔ Сложено на лошадь (${hMeta?.name || 'Скакун'}): ${def.icon} ${def.name} ×${moveQty}`
    );
  };

  const transferFromHorse = (horseId: string, itemId: string, amount: number) => {
    const def = ITEM_CATALOG[itemId];
    if (!def) return;
    const hMeta = horsesStatus.find((h) => h.id === horseId);
    if (hMeta && !hMeta.canAccess) {
      addLogMessage(
        `🐴 Лошадь «${hMeta.name}» далеко (${hMeta.dist}м)! Нажмите «🎵 Позвать к себе», чтобы забрать вещи.`
      );
      return;
    }
    const horseInv = horseBags[horseId] || {};
    const currentQty = horseInv[itemId] || 0;
    const moveQty = Math.min(currentQty, amount);
    if (moveQty <= 0) return;

    setHorseBags((prev) => {
      const curHorse = { ...(prev[horseId] || {}) };
      const cur = curHorse[itemId] || 0;
      const actual = Math.min(cur, moveQty);
      if (cur - actual <= 0) delete curHorse[itemId];
      else curHorse[itemId] = cur - actual;
      return {
        ...prev,
        [horseId]: curHorse,
      };
    });

    setInventory((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + moveQty,
    }));

    soundRef.current?.playItemPickup(false);
    addLogMessage(
      `🎒⬅ Взято с лошади (${hMeta?.name || 'Скакун'}): ${def.icon} ${def.name} ×${moveQty}`
    );
  };

  const transferAllUnguardedToHorse = (horseId: string) => {
    const hMeta = horsesStatus.find((h) => h.id === horseId);
    if (hMeta && !hMeta.canAccess) {
      addLogMessage(
        `🐴 Лошадь «${hMeta.name}» далеко (${hMeta.dist}м)! Сначала позовите её кнопкой «🎵 Позвать к себе».`
      );
      return;
    }

    const movedItems: Record<string, number> = {};
    let totalMoved = 0;

    for (const [id, qty] of Object.entries(inventory)) {
      if (qty <= 0) continue;
      const isEq =
        equippedWeapon === id || equippedShield === id || equippedCard === id;
      const spareQty = isEq ? Math.max(0, qty - 1) : qty;
      if (spareQty > 0) {
        movedItems[id] = spareQty;
        totalMoved += spareQty;
      }
    }

    if (totalMoved === 0) {
      addLogMessage('В сумочке героя нет свободных предметов для погрузки на лошадь.');
      return;
    }

    setInventory((prev) => {
      const next = { ...prev };
      for (const [id, mQty] of Object.entries(movedItems)) {
        const rem = (next[id] || 0) - mQty;
        if (rem <= 0) delete next[id];
        else next[id] = rem;
      }
      return next;
    });

    setHorseBags((prev) => {
      const curH = { ...(prev[horseId] || {}) };
      for (const [id, mQty] of Object.entries(movedItems)) {
        curH[id] = (curH[id] || 0) + mQty;
      }
      return {
        ...prev,
        [horseId]: curH,
      };
    });

    soundRef.current?.playItemPickup(true);
    addLogMessage(
      `🐴📦 На лошадь «${hMeta?.name || 'Скакун'}» сложено предметов: ${totalMoved} шт.!`
    );
  };

  const takeAllFromHorse = (horseId: string) => {
    const hMeta = horsesStatus.find((h) => h.id === horseId);
    if (hMeta && !hMeta.canAccess) {
      addLogMessage(
        `🐴 Лошадь «${hMeta.name}» далеко (${hMeta.dist}м)! Сначала позовите её кнопкой «🎵 Позвать к себе».`
      );
      return;
    }
    const curH = horseBags[horseId] || {};
    const entries = Object.entries(curH).filter(([, q]) => q > 0);
    if (entries.length === 0) {
      addLogMessage('Седельная сумка этой лошади пуста.');
      return;
    }

    setHorseBags((prev) => ({
      ...prev,
      [horseId]: {},
    }));

    setInventory((prev) => {
      const next = { ...prev };
      for (const [id, q] of entries) {
        next[id] = (next[id] || 0) + q;
      }
      return next;
    });

    soundRef.current?.playItemPickup(true);
    addLogMessage(`🎒📥 Все предметы из седельной сумки «${hMeta?.name}» переложены герою!`);
  };

  const mergeItemInHorseBag = (horseId: string, itemId: string) => {
    const def = ITEM_CATALOG[itemId];
    if (!def || !def.mergeable) return;
    const curH = horseBags[horseId] || {};
    const qty = curH[itemId] || 0;
    if (qty < 2) return;

    setHorseBags((prev) => {
      const bag = { ...(prev[horseId] || {}) };
      bag[itemId] = (bag[itemId] || 2) - 1;
      return { ...prev, [horseId]: bag };
    });
    setItemRanks((prev) => {
      const nextRank = (prev[itemId] || 0) + 1;
      addLogMessage(
        `⚒️ СЛИЯНИЕ НА ЛОШАДИ: ${def.icon} ${def.name} улучшен до ★+${nextRank} (+${
          nextRank * 35
        }% к мощи)!`
      );
      return { ...prev, [itemId]: nextRank };
    });
    soundRef.current?.playItemPickup(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Viewport Container */}
      <div
        ref={mountRef}
        className={`w-full h-full ${
          gameStarted && !activeDialog && !isPaused
            ? 'cursor-grab active:cursor-grabbing'
            : 'cursor-default'
        }`}
      />

      {/* Vignette as in v9 */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle, transparent 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Red Hit Vignette Overlay */}
      <div
        className={`pointer-events-none fixed inset-0 transition-opacity duration-200 ${
          damageHitFlash ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle, transparent 40%, rgba(180,0,0,0.7) 100%)',
        }}
      />

      {/* Floating Damage Numbers */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-20">
        {floatingDamages.map((fd) => (
          <div
            key={fd.id}
            style={{ left: `${fd.x}px`, top: `${fd.y}px` }}
            className="damage-floater absolute text-center"
          >
            {fd.comboLabel && (
              <div className="text-[10px] font-display tracking-wider text-amber-200 uppercase mb-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                {fd.comboLabel}
              </div>
            )}
            <div
              className={`font-mono-num font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${
                fd.isCrit ? 'text-amber-300 text-xl' : 'text-red-300 text-base'
              }`}
            >
              -{fd.value}
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================
          HUD OVERLAYS (When Game is Running)
         ============================================================ */}
      {gameStarted && (
        <div className="pointer-events-none fixed inset-0 z-10">
          {/* Top-Left: Ultra-Compact Player Status (minimal visual noise) */}
          <div className="pointer-events-auto absolute top-2.5 left-2.5 w-44 rounded bg-[#140f0a]/75 border border-[#6b4a2a]/75 px-2 py-1.5 shadow">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="font-bold text-[#d4a862]">Ур.{hud.level}</span>
                <span className="text-[#c8a870]">💰{hud.gold}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMuteAudio}
                  className="p-0.5 rounded bg-[#231911] hover:bg-[#36261a] border border-[#5a3d22] text-[#e8d5a8] cursor-pointer"
                  title={soundMuted ? 'Включить звук' : 'Выключить звук'}
                >
                  {soundMuted ? (
                    <VolumeX className="w-2.5 h-2.5 text-red-400" />
                  ) : (
                    <Volume2 className="w-2.5 h-2.5 text-[#d4a862]" />
                  )}
                </button>
                <button
                  onClick={() => setIsPaused(true)}
                  className="px-1 py-0.5 rounded bg-[#231911] hover:bg-[#36261a] border border-[#5a3d22] text-[9px] text-[#e8d5a8] flex items-center gap-0.5 cursor-pointer"
                  title="Пауза и меню (Esc)"
                >
                  <Pause className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* HP */}
            <div className="h-2 bg-[#1a0f08] border border-[#4a2f1a] rounded-sm my-0.5 overflow-hidden relative">
              <span
                className="block h-full bg-gradient-to-r from-[#8b0000] to-[#d43a2a]"
                style={{ width: `${Math.max(0, (hud.hp / hud.maxHp) * 100)}%` }}
              />
              <div className="absolute inset-0 text-center text-[8px] leading-[8px] text-white/90 font-bold">
                {hud.hp}/{hud.maxHp}
              </div>
            </div>

            {/* MP */}
            <div className="h-1.5 bg-[#1a0f08] border border-[#4a2f1a] rounded-sm my-0.5 overflow-hidden relative">
              <span
                className="block h-full bg-gradient-to-r from-[#1a3a8b] to-[#3a7ad4]"
                style={{ width: `${Math.max(0, (hud.mp / hud.maxMp) * 100)}%` }}
              />
            </div>

            {/* Stamina & XP */}
            <div className="grid grid-cols-2 gap-1 my-0.5">
              <div className="h-1 bg-[#1a0f08] rounded-sm overflow-hidden">
                <span
                  className="block h-full bg-[#98c838]"
                  style={{ width: `${Math.max(0, (hud.stamina / hud.maxStamina) * 100)}%` }}
                />
              </div>
              <div className="h-1 bg-[#1a0f08] rounded-sm overflow-hidden">
                <span
                  className="block h-full bg-[#d4a862]"
                  style={{ width: `${Math.min(100, (hud.xp / hud.xpNext) * 100)}%` }}
                />
              </div>
            </div>

            {/* Single compact icon toolbar */}
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#3d2817]/70 text-[9px]">
              <button
                onClick={() => {
                  setShopOpen(false);
                  if (bagOpen && bagTab === 'items') setBagOpen(false);
                  else {
                    setBagTab('items');
                    setBagOpen(true);
                  }
                }}
                className="px-1 py-0.5 rounded bg-[#1f140c] hover:bg-[#2e1e12] border border-[#5a3d22] text-[#f0d090] cursor-pointer"
                title="Сумочка, Слияние и Навыки [I]"
              >
                🎒I{skillPoints > 0 ? `+${skillPoints}` : ''}
              </button>
              <button
                onClick={() => openHorseBagQuickRef.current()}
                className="px-1 py-0.5 rounded bg-[#1f140c] hover:bg-[#2e1e12] border border-[#5a3d22] text-[#f0d090] cursor-pointer"
                title="Сумка лошади [B]"
              >
                🐴B
              </button>
              <button
                onClick={() => {
                  setBagOpen(false);
                  setShopOpen((prev) => !prev);
                }}
                className="px-1 py-0.5 rounded bg-[#1f140c] hover:bg-[#2e1e12] border border-[#5a3d22] text-[#f0d090] cursor-pointer"
                title="Лавка [M]"
              >
                🏪M
              </button>
              <button
                onClick={() => toggleBowModeRef.current()}
                className={`px-1 py-0.5 rounded border cursor-pointer ${
                  hud.bowModeActive
                    ? 'bg-[#3d4a18] border-[#a8e060] text-[#f0ffd0]'
                    : 'bg-[#1f140c] border-[#5a3d22] text-[#c8b088]'
                }`}
                title="Лук [V] / Прицел [ПКМ] / Стрелы [R]"
              >
                🏹{hud.arrowCount}
              </button>
              <button
                onClick={() => {
                  setShopOpen(false);
                  setBagTab('cauldron');
                  setBagOpen(true);
                }}
                className="px-1 py-0.5 rounded bg-[#1b2918] hover:bg-[#273d22] border border-[#5c8a4e] text-[#d8ffd0] cursor-pointer"
                title="Алхимический котёл [C]"
              >
                ⚗️C
              </button>
              <button
                onClick={() => {
                  setShopOpen(false);
                  setBagTab('teleports');
                  setBagOpen(true);
                }}
                className="px-1 py-0.5 rounded bg-[#162636] hover:bg-[#203850] border border-[#4ca8ff] text-[#d0f0ff] cursor-pointer"
                title="Телепорты [T]"
              >
                🌀T
              </button>
            </div>
          </div>

          {/* Bottom-Center: Ultra-Compact Magic Bar */}
          <div className="pointer-events-auto absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#140f0a]/75 border border-[#6b4a2a]/75 rounded-full px-2 py-0.5 shadow">
            {(
              [
                ['fire', '🔥'],
                ['water', '💧'],
                ['air', '🌪️'],
                ['lightning', '🪨'],
                ['necro', '☠️'],
              ] as const
            ).map(([el, icon]) => {
              const info = ELEMENT_INFO[el];
              return (
                <button
                  key={el}
                  onClick={() => castSpellRef.current(el)}
                  className="px-1.5 py-0.5 rounded-full border border-[#6b4a2a] bg-[#24180e] hover:bg-[#382516] text-[9px] text-[#fff0d0] flex items-center gap-0.5 cursor-pointer"
                  title={`${info.name} [${info.hotkey}] (Ур.${magicLevels[el] || 1})`}
                >
                  <span>{icon}</span>
                  <span className="font-mono-num text-[#d4a862]">{info.hotkey}</span>
                </button>
              );
            })}
            <button
              onClick={() => summonGolemRef.current()}
              className="px-1.5 py-0.5 rounded-full border border-[#6ea846] bg-[#1c2e12] hover:bg-[#28421a] text-[9px] text-[#e6ffd4] flex items-center gap-0.5 cursor-pointer"
              title="Призвать Големов [G]"
            >
              <span>🗿G</span>
              {hud.activeGolemsCount > 0 && (
                <span className="text-[#a8ff70]">×{hud.activeGolemsCount}</span>
              )}
            </button>
          </div>

          {/* 🎒 СУМОЧКА ГЕРОЯ + 🐴 СЕДЕЛЬНЫЕ СУМКИ ЛОШАДЕЙ (TWO WORLDS) + ⭐ НАВЫКИ GOTHIC 3 */}
          {bagOpen && !isPaused && (
            <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
              <div className="w-full max-w-4xl rounded-xl bg-gradient-to-br from-[#16100a]/95 to-[#26190f]/95 border-2 border-[#8b6a3a] p-5 shadow-2xl">
                {/* Заголовок */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#4a2f1a] pb-2.5 mb-3">
                  <div>
                    <h2 className="text-base font-bold tracking-wider text-[#d4a862]">
                      🎒 Сумочка Героя ⇄ 🐴 Седельные Сумки Лошадей • Навыки и Ковка
                    </h2>
                    <p className="text-[11px] text-[#a89068]">
                      ❤️ HP +{hud.hpBonusPct}% • 🏃 Ловкость +{hud.agilityBonusPct}% • 💧 Мана +
                      {hud.mpBonusPct}% • ⚔️ Сила +{hud.dmgBonusPct}% • ⚖️ Вес героя:{' '}
                      <b className="text-[#f0d090]">
                        {heroBagWeight}/{heroMaxWeight} кг
                      </b>{' '}
                      • ⭐ LP: <b className="text-[#ffd866]">{skillPoints}</b>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => mergeAllRef.current()}
                      className="px-2.5 py-1 rounded bg-gradient-to-b from-[#5a3e1b] to-[#38240e] hover:from-[#7a5424] hover:to-[#4f3314] border border-[#d4a862] text-[11px] font-bold text-[#ffe8a0] cursor-pointer"
                      title="Объединить все одинаковые мечи, булавы, щиты и карты магии (Two Worlds)"
                    >
                      ⚒️ Авто-слияние ★
                    </button>
                    <button
                      onClick={() => {
                        setBagOpen(false);
                        setShopOpen(true);
                      }}
                      className="px-2.5 py-1 rounded bg-[#2c1e12] hover:bg-[#3f2b1a] border border-[#8b6a3a] text-xs text-[#f0d090] cursor-pointer"
                    >
                      🏪 Лавка
                    </button>
                    <button
                      onClick={() => setBagOpen(false)}
                      className="px-2.5 py-1 rounded bg-[#231911] hover:bg-[#36261a] border border-[#6b4a2a] text-xs text-[#e8d5a8] cursor-pointer"
                    >
                      ✕ [I / B]
                    </button>
                  </div>
                </div>

                {/* Слоты активной экипировки героя (Меч, Щит, Лук, Колчан Стрел, Кольца и Карта Магии Two Worlds) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 mb-3">
                  <div className="bg-[#120c08]/90 border border-[#5a3d22] rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-[#9a8468]">⚔️ Правая рука:</div>
                    <div className="text-[11px] font-bold text-[#f0d090] truncate">
                      {equippedWeapon && ITEM_CATALOG[equippedWeapon]
                        ? `${ITEM_CATALOG[equippedWeapon].icon} ${ITEM_CATALOG[equippedWeapon].name}${
                            itemRanks[equippedWeapon] ? ` [★+${itemRanks[equippedWeapon]}]` : ''
                          }`
                        : '⚔️ Парные клинки'}
                    </div>
                  </div>
                  <div className="bg-[#120c08]/90 border border-[#5a3d22] rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-[#9a8468]">🛡️ Левая рука:</div>
                    <div className="text-[11px] font-bold text-[#f0d090] truncate">
                      {equippedShield && ITEM_CATALOG[equippedShield]
                        ? `${ITEM_CATALOG[equippedShield].icon} ${ITEM_CATALOG[equippedShield].name}${
                            itemRanks[equippedShield] ? ` [★+${itemRanks[equippedShield]}]` : ''
                          }`
                        : '🗡️ Второй клинок'}
                    </div>
                  </div>
                  <div className="bg-[#120c08]/90 border border-[#6a8a3a] rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-[#b0d080]">🏹 Лук [V / ПКМ]:</div>
                    <div className="text-[11px] font-bold text-[#e8ffd0] truncate">
                      {equippedBow && ITEM_CATALOG[equippedBow]
                        ? `${ITEM_CATALOG[equippedBow].icon} ${ITEM_CATALOG[equippedBow].name}${
                            itemRanks[equippedBow] ? ` [★+${itemRanks[equippedBow]}]` : ''
                          }`
                        : '— Не выбран —'}
                    </div>
                  </div>
                  <div className="bg-[#120c08]/90 border border-[#6a8a3a] rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-[#b0d080]">🪶 Колчан стрел [R]:</div>
                    <div className="text-[11px] font-bold text-[#e8ffd0] truncate">
                      {equippedQuiver && ITEM_CATALOG[equippedQuiver]
                        ? `${ITEM_CATALOG[equippedQuiver].icon} ${ITEM_CATALOG[equippedQuiver].name} (${
                            inventory[equippedQuiver] || 0
                          })`
                        : '— Нет стрел —'}
                    </div>
                  </div>
                  <div className="bg-[#120c08]/90 border border-[#8b6a3a] rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-[#d4a862]">💍 Магическое кольцо:</div>
                    <div className="text-[11px] font-bold text-[#ffd890] truncate">
                      {equippedRing && ITEM_CATALOG[equippedRing]
                        ? `${ITEM_CATALOG[equippedRing].icon} ${ITEM_CATALOG[equippedRing].name}${
                            itemRanks[equippedRing] ? ` [★+${itemRanks[equippedRing]}]` : ''
                          }`
                        : '— Не надето —'}
                    </div>
                  </div>
                  <div className="bg-[#120c08]/90 border border-[#5a3d22] rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-[#9a8468]">🃏 Карта Магии / Голема [G]:</div>
                    <div className="text-[11px] font-bold text-[#f0d090] truncate">
                      {equippedCard && ITEM_CATALOG[equippedCard]
                        ? `${ITEM_CATALOG[equippedCard].icon} ${ITEM_CATALOG[equippedCard].name}${
                            itemRanks[equippedCard] ? ` [★+${itemRanks[equippedCard]}]` : ''
                          }`
                        : '— Не выбрана —'}
                    </div>
                  </div>
                  <div className="bg-[#120c08]/90 border border-[#7ad460] rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-[#a8ff88]">✨ Карта-Усилитель (×2):</div>
                    <div className="text-[11px] font-bold text-[#e8ffd8] truncate">
                      {equippedBooster && ITEM_CATALOG[equippedBooster]
                        ? `${ITEM_CATALOG[equippedBooster].icon} ${ITEM_CATALOG[equippedBooster].name}${
                            itemRanks[equippedBooster] ? ` [★+${itemRanks[equippedBooster]}]` : ''
                          }`
                        : '— Не выбран —'}
                    </div>
                  </div>
                </div>

                {/* Переключатель вкладок: 1) Сумочка 2) Сумки Лошадей 3) Алхимический Котёл 4) Телепорты 5) Навыки */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setBagTab('items')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer ${
                        bagTab === 'items'
                          ? 'bg-[#5a381e] border-[#d4a862] text-[#fff0d0]'
                          : 'bg-[#1a120b] border-[#4a2f1a] text-[#a89068]'
                      }`}
                    >
                      🎒 Сумочка [I]
                    </button>
                    <button
                      onClick={() => setBagTab('horse')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer flex items-center gap-1 ${
                        bagTab === 'horse'
                          ? 'bg-[#5a381e] border-[#ffd066] text-[#fff0d0]'
                          : 'bg-[#1a120b] border-[#4a2f1a] text-[#e8c680]'
                      }`}
                    >
                      <span>🐴 Сумки Лошадей [B]</span>
                    </button>
                    <button
                      onClick={() => setBagTab('cauldron')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer ${
                        bagTab === 'cauldron'
                          ? 'bg-[#284820] border-[#7aff66] text-[#eaffd8]'
                          : 'bg-[#132010] border-[#3b6630] text-[#9ce088]'
                      }`}
                    >
                      ⚗️ Котёл Алхимии [C]
                    </button>
                    <button
                      onClick={() => setBagTab('teleports')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer ${
                        bagTab === 'teleports'
                          ? 'bg-[#183858] border-[#66d4ff] text-[#e0f8ff]'
                          : 'bg-[#102030] border-[#2d5a88] text-[#88ccf0]'
                      }`}
                    >
                      🌀 Телепорты [T]
                    </button>
                    <button
                      onClick={() => setBagTab('skills')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer ${
                        bagTab === 'skills'
                          ? 'bg-[#5a381e] border-[#d4a862] text-[#fff0d0]'
                          : 'bg-[#1a120b] border-[#4a2f1a] text-[#a89068]'
                      }`}
                    >
                      ⭐ Навыки (LP: {skillPoints})
                    </button>
                  </div>

                  {bagTab === 'items' && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      {(
                        [
                          ['all', 'Все'],
                          ['gear', '⚔️🏹💍 Оружие/Луки/Кольца'],
                          ['magic', '🃏📖🌀 Магия/Телепорты'],
                          ['nature', '🌿🧪 Травы/Зелья'],
                        ] as const
                      ).map(([fKey, fLabel]) => (
                        <button
                          key={fKey}
                          onClick={() => setBagFilter(fKey)}
                          className={`px-2 py-0.5 rounded border cursor-pointer ${
                            bagFilter === fKey
                              ? 'bg-[#3d2614] border-[#d4a862] text-[#ffd890]'
                              : 'bg-[#160f09] border-[#3d2816] text-[#9a8468]'
                          }`}
                        >
                          {fLabel}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {bagTab === 'items' ? (
                  /* ВКЛАДКА 1: СУМОЧКА ПРЕДМЕТОВ, ЭКИПИРОВКА И СЛИЯНИЕ ДУБЛИКАТОВ TWO WORLDS */
                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                    {Object.entries(inventory).filter(([, qty]) => qty > 0).length === 0 ? (
                      <div className="text-center py-8 text-xs text-[#8a7558]">
                        Сумочка пока пуста. Побеждайте скелетов, орков, исследуйте подземные пещеры с сундуками
                        или загляните в седельную сумку вашей лошади [B]!
                      </div>
                    ) : (
                      Object.entries(inventory)
                        .filter(([itemId, qty]) => {
                          if (qty <= 0) return false;
                          const def = ITEM_CATALOG[itemId];
                          if (!def) return false;
                          if (bagFilter === 'gear')
                            return (
                              def.category === 'weapon' ||
                              def.category === 'shield' ||
                              def.category === 'bow' ||
                              def.category === 'quiver' ||
                              def.category === 'ring' ||
                              def.category === 'artifact'
                            );
                          if (bagFilter === 'magic')
                            return (
                              def.category === 'card' ||
                              def.category === 'booster' ||
                              def.category === 'grimoire' ||
                              def.category === 'potion' ||
                              def.category === 'teleport'
                            );
                          if (bagFilter === 'nature')
                            return (
                              def.category === 'trophy' ||
                              def.category === 'egg' ||
                              def.category === 'herb' ||
                              def.category === 'potion' ||
                              def.category === 'quest'
                            );
                          return true;
                        })
                        .map(([itemId, qty]) => {
                          const def = ITEM_CATALOG[itemId];
                          if (!def) return null;
                          const rank = itemRanks[itemId] || 0;
                          const isEquipped =
                            equippedWeapon === itemId ||
                            equippedShield === itemId ||
                            equippedBow === itemId ||
                            equippedQuiver === itemId ||
                            equippedRing === itemId ||
                            equippedCard === itemId ||
                            equippedBooster === itemId;
                          const canMerge = Boolean(def.mergeable && qty >= 2);

                          return (
                            <div
                              key={itemId}
                              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 border ${
                                isEquipped
                                  ? 'bg-[#261a0e]/95 border-[#ffd066]'
                                  : 'bg-[#120c08]/90 border-[#4a2f1a]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl">{def.icon}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#f0d090] flex flex-wrap items-center gap-1.5">
                                    <span>{def.name}</span>
                                    {rank > 0 && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-500/25 border border-amber-400 text-amber-300 text-[10px]">
                                        ★+{rank} (+{rank * 35}%)
                                      </span>
                                    )}
                                    <span className="px-1.5 py-0.2 rounded bg-[#2d1e12] text-[#d4a862] text-[10px]">
                                      ×{qty}
                                    </span>
                                    {isEquipped && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-900/70 border border-emerald-500 text-emerald-200 text-[9px]">
                                        НАДЕТО
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#7ad47a]">{def.effectText}</div>
                                  <div className="text-[10px] text-[#9a8468] truncate">
                                    {def.description}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Быстрая кнопка переложить на активную лошадь */}
                                <button
                                  onClick={() => transferToHorse(selectedHorseId, itemId, 1)}
                                  className="px-2 py-1.5 rounded bg-[#22170f] hover:bg-[#362417] border border-[#7a5835] text-[10px] font-semibold text-[#e6c896] whitespace-nowrap cursor-pointer"
                                  title={`Переложить 1 шт. в седельную сумку лошади «${selectedHorseMeta?.name}»`}
                                >
                                  🐴 На лошадь
                                </button>

                                {/* Кнопка СЛИЯНИЯ ДУБЛИКАТОВ (Two Worlds!) */}
                                {canMerge && (
                                  <button
                                    onClick={() => mergeItemRef.current(itemId)}
                                    className="px-2.5 py-1.5 rounded bg-gradient-to-b from-[#7a5218] to-[#4a300a] hover:from-[#9a6a22] hover:to-[#624010] border border-[#ffd066] text-[11px] font-bold text-[#fff4c2] whitespace-nowrap cursor-pointer"
                                    title="Слить 2 одинаковых предмета в 1 более мощного ранга ★ (Two Worlds)"
                                  >
                                    ⚒️ Слить ★
                                  </button>
                                )}

                                {/* Для магических карт и карт-усилителей: можно вставить в слот и призвать Големов */}
                                {(def.category === 'card' || def.category === 'booster') && (
                                  <button
                                    onClick={() => equipItemRef.current(itemId)}
                                    className="px-2.5 py-1.5 rounded bg-[#241834] hover:bg-[#35234d] border border-[#9b6dff] text-[11px] font-bold text-[#e6d8ff] whitespace-nowrap cursor-pointer"
                                  >
                                    {equippedCard === itemId || equippedBooster === itemId
                                      ? 'Снять карту'
                                      : def.category === 'booster'
                                      ? '✨ В слот Усилителя ×2'
                                      : '🃏 В слот карты'}
                                  </button>
                                )}

                                <button
                                  onClick={() => useItemRef.current(itemId)}
                                  className="px-3 py-1.5 rounded bg-gradient-to-b from-[#6b4a2a] to-[#3d2815] hover:from-[#8b6a3a] hover:to-[#54381e] border border-[#d4a862] text-[11px] font-bold text-[#fff0d0] whitespace-nowrap cursor-pointer"
                                >
                                  {def.category === 'weapon' || def.category === 'shield'
                                    ? isEquipped
                                      ? 'Снять'
                                      : '⚔️ Надеть'
                                    : def.category === 'bow'
                                    ? isEquipped
                                      ? 'Убрать лук'
                                      : '🏹 Взять лук'
                                    : def.category === 'quiver'
                                    ? isEquipped
                                      ? 'Выбрано'
                                      : '🪶 Выбрать стрелы'
                                    : def.category === 'ring'
                                    ? isEquipped
                                      ? 'Снять кольцо'
                                      : '💍 Надеть кольцо'
                                    : def.category === 'booster'
                                    ? isEquipped
                                      ? 'Усилитель активен'
                                      : '✨ Активировать ×2'
                                    : def.summonGolemType
                                    ? '🗿 Призвать Големов [G]'
                                    : def.category === 'teleport'
                                    ? '🌀 Телепорт [T]'
                                    : def.category === 'grimoire' || def.category === 'card'
                                    ? '📖 Изучить'
                                    : '✨ Применить'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                ) : bagTab === 'horse' ? (
                  /* ВКЛАДКА 2: 🐴 СЕДЕЛЬНЫЕ СУМКИ КАЖДОЙ ЛОШАДИ (Как в Two Worlds!) */
                  <div className="space-y-2.5">
                    {/* Выбор конкретной лошади из всех 6 лошадей мира */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                      {horsesStatus.map((h) => {
                        const hBag = horseBags[h.id] || {};
                        const itemCount = Object.values(hBag).reduce((a, b) => a + b, 0);
                        const isSelected = selectedHorseId === h.id;
                        return (
                          <button
                            key={h.id}
                            onClick={() => setSelectedHorseId(h.id)}
                            className={`text-left rounded-lg p-2 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#3b2514] border-[#ffd066] shadow-md'
                                : 'bg-[#140d08]/90 border-[#4a2f1a] hover:bg-[#22160d]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-amber-300/60 shrink-0"
                                style={{ backgroundColor: h.coatHex }}
                              />
                              <span className="text-[11px] font-bold text-[#f0d090] truncate">
                                {h.name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[9px]">
                              <span className="text-[#d4a862]">📦 {itemCount} шт.</span>
                              <span
                                className={
                                  h.isRiding
                                    ? 'text-emerald-300 font-bold'
                                    : h.canAccess
                                    ? 'text-emerald-400'
                                    : 'text-amber-400/80'
                                }
                              >
                                {h.isRiding
                                  ? 'Верхом'
                                  : h.canAccess
                                  ? `Рядом (${h.dist}м)`
                                  : `${h.dist}м`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Статус выбранной лошади и быстрые кнопки Two Worlds */}
                    {selectedHorseMeta && (
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#120c07]/95 border border-[#6b4a2a] rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🐴</span>
                          <div>
                            <div className="text-xs font-bold text-[#ffd890] flex items-center gap-2">
                              <span>Седельные сумки: {selectedHorseMeta.name}</span>
                              <span className="text-[10px] font-normal text-[#b89f78]">
                                ⚖️ Поклажа: {horseBagWeight} / {horseMaxWeight} кг
                              </span>
                            </div>
                            <div className="text-[10px] text-[#a89068]">
                              {selectedHorseMeta.isRiding
                                ? '🟢 Вы в седле на этой лошади — полный доступ к седельным сумкам.'
                                : selectedHorseMeta.canAccess
                                ? `🟢 Лошадь стоит рядом (${selectedHorseMeta.dist} м) — можно свободно перекладывать любые вещи.`
                                : `🟡 Лошадь на расстоянии ${selectedHorseMeta.dist} м — нажмите «🎵 Позвать к себе», чтобы она прискакала с вашей поклажей!`}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {!selectedHorseMeta.canAccess && (
                            <button
                              onClick={() => summonSpecificHorseRef.current(selectedHorseMeta.id)}
                              className="px-2.5 py-1 rounded bg-gradient-to-b from-[#7a5218] to-[#4a300a] hover:from-[#9a6a22] hover:to-[#624010] border border-[#ffd066] text-[11px] font-bold text-[#fff4c2] cursor-pointer"
                            >
                              🎵 Позвать эту лошадь к себе [H]
                            </button>
                          )}
                          <button
                            onClick={() => transferAllUnguardedToHorse(selectedHorseMeta.id)}
                            className="px-2.5 py-1 rounded bg-[#2d1e12] hover:bg-[#422c1a] border border-[#8b6a3a] text-[11px] text-[#f0d090] cursor-pointer"
                            title="Переложить все свободные трофеи, травы, яйца и дубликаты оружия на эту лошадь"
                          >
                            📦➔ Сгрузить добычу на лошадь
                          </button>
                          <button
                            onClick={() => takeAllFromHorse(selectedHorseMeta.id)}
                            className="px-2.5 py-1 rounded bg-[#1f2e1b] hover:bg-[#2c4226] border border-[#5c8a4e] text-[11px] text-[#d8ffd0] cursor-pointer"
                          >
                            📥⬅ Забрать всё с лошади
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ДВУХКОЛОНОЧНОЕ ОКНО TWO WORLDS: Слева — Сумочка Героя, Справа — Седельная Сумка Лошади */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                      {/* Левая колонка: 🎒 Сумочка Героя */}
                      <div className="bg-[#110b07]/90 border border-[#4a2f1a] rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between border-b border-[#3a2414] pb-1 mb-1">
                          <span className="text-xs font-bold text-[#d4a862]">
                            🎒 Сумочка Героя ({heroBagWeight}/{heroMaxWeight} кг)
                          </span>
                          <span className="text-[10px] text-[#9a8468]">Сложить на лошадь ➔</span>
                        </div>

                        {Object.entries(inventory).filter(([, q]) => q > 0).length === 0 ? (
                          <div className="text-[11px] text-[#7a6850] py-6 text-center">
                            Сумочка героя пуста.
                          </div>
                        ) : (
                          Object.entries(inventory)
                            .filter(([, q]) => q > 0)
                            .map(([itemId, qty]) => {
                              const def = ITEM_CATALOG[itemId];
                              if (!def) return null;
                              const rank = itemRanks[itemId] || 0;
                              const isEq =
                                equippedWeapon === itemId ||
                                equippedShield === itemId ||
                                equippedCard === itemId;
                              return (
                                <div
                                  key={itemId}
                                  className="flex items-center justify-between gap-2 bg-[#1a110b] border border-[#3d2716] rounded px-2.5 py-1.5"
                                >
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-[#f0d090] truncate flex items-center gap-1">
                                      <span>{def.icon}</span>
                                      <span className="truncate">{def.name}</span>
                                      {rank > 0 && (
                                        <span className="text-amber-300 text-[10px]">
                                          [★+{rank}]
                                        </span>
                                      )}
                                      <span className="text-[#d4a862]">×{qty}</span>
                                      {isEq && (
                                        <span className="text-[9px] text-emerald-300">(Надето)</span>
                                      )}
                                    </div>
                                    <div className="text-[9px] text-[#88c488] truncate">
                                      {def.effectText}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() =>
                                        transferToHorse(selectedHorseId, itemId, 1)
                                      }
                                      className="px-2 py-1 rounded bg-[#3a2514] hover:bg-[#52351d] border border-[#8b6a3a] text-[10px] font-bold text-[#ffe0a0] cursor-pointer"
                                      title="Переложить 1 шт. в седельную сумку лошади"
                                    >
                                      ➔ 1
                                    </button>
                                    {qty > 1 && (
                                      <button
                                        onClick={() =>
                                          transferToHorse(selectedHorseId, itemId, qty)
                                        }
                                        className="px-2 py-1 rounded bg-[#4a3018] hover:bg-[#664222] border border-[#b88a44] text-[10px] font-bold text-[#fff0c0] cursor-pointer"
                                        title="Переложить все экземпляры на лошадь"
                                      >
                                        ➔ Все ({qty})
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>

                      {/* Правая колонка: 🐴 Седельная сумочка выбранной лошади */}
                      <div className="bg-[#110b07]/90 border border-[#6b4a2a] rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between border-b border-[#3a2414] pb-1 mb-1">
                          <span className="text-xs font-bold text-[#ffd890]">
                            🐴 Сумка: {selectedHorseMeta?.name} ({horseBagWeight}/{horseMaxWeight} кг)
                          </span>
                          <span className="text-[10px] text-[#9a8468]">⬅ Взять герою</span>
                        </div>

                        {Object.entries(selectedHorseBag).filter(([, q]) => q > 0).length === 0 ? (
                          <div className="text-[11px] text-[#7a6850] py-6 text-center">
                            В седельной сумке этой лошади пока пусто. Переложите сюда трофеи,
                            запасные мечи, щиты, карты магии или травы!
                          </div>
                        ) : (
                          Object.entries(selectedHorseBag)
                            .filter(([, q]) => q > 0)
                            .map(([itemId, qty]) => {
                              const def = ITEM_CATALOG[itemId];
                              if (!def) return null;
                              const rank = itemRanks[itemId] || 0;
                              const canMergeOnHorse = Boolean(def.mergeable && qty >= 2);
                              return (
                                <div
                                  key={itemId}
                                  className="flex items-center justify-between gap-2 bg-[#1c130c] border border-[#52361e] rounded px-2.5 py-1.5"
                                >
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-[#f0d090] truncate flex items-center gap-1">
                                      <span>{def.icon}</span>
                                      <span className="truncate">{def.name}</span>
                                      {rank > 0 && (
                                        <span className="text-amber-300 text-[10px]">
                                          [★+{rank}]
                                        </span>
                                      )}
                                      <span className="text-[#ffd066]">×{qty}</span>
                                    </div>
                                    <div className="text-[9px] text-[#88c488] truncate">
                                      {def.effectText}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {canMergeOnHorse && (
                                      <button
                                        onClick={() =>
                                          mergeItemInHorseBag(selectedHorseId, itemId)
                                        }
                                        className="px-1.5 py-1 rounded bg-[#624214] hover:bg-[#7d551a] border border-[#ffd066] text-[10px] font-bold text-[#fff4c2] cursor-pointer"
                                        title="Слить дубликаты прямо в седельной сумке лошади (Two Worlds)"
                                      >
                                        ⚒️★
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        transferFromHorse(selectedHorseId, itemId, 1)
                                      }
                                      className="px-2 py-1 rounded bg-[#23381e] hover:bg-[#314f2a] border border-[#6a9a44] text-[10px] font-bold text-[#e8ffd0] cursor-pointer"
                                      title="Забрать 1 шт. в сумочку героя"
                                    >
                                      ⬅ 1
                                    </button>
                                    {qty > 1 && (
                                      <button
                                        onClick={() =>
                                          transferFromHorse(selectedHorseId, itemId, qty)
                                        }
                                        className="px-2 py-1 rounded bg-[#2e4a27] hover:bg-[#3e6335] border border-[#88c468] text-[10px] font-bold text-[#f2ffe8] cursor-pointer"
                                        title="Забрать все экземпляры в сумочку героя"
                                      >
                                        ⬅ Все ({qty})
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                ) : bagTab === 'cauldron' ? (
                  /* ВКЛАДКА 3: ⚗️ АЛХИМИЧЕСКИЙ КОТЁЛ (Смешивание трав и трофеев как в Two Worlds!) */
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#101c0e]/95 border border-[#4c883a] rounded-lg px-3.5 py-2">
                      <div>
                        <div className="text-xs font-bold text-[#b8ff9e]">
                          ⚗️ Алхимический Котёл Миртаны — Смешивание ингредиентов, трав и сердец
                        </div>
                        <div className="text-[10px] text-[#8ab878]">
                          Варите эликсиры и огненные стрелы в котле из собранных в мире трав и охотничьих трофеев!
                        </div>
                      </div>
                    </div>

                    {/* Книга проверенных рецептов алхимии */}
                    <div className="space-y-1.5">
                      {ALCHEMY_RECIPES.map((rec) => {
                        const resDef = ITEM_CATALOG[rec.resultItemId];
                        const canBrew = rec.ingredients.every(
                          (ing) => (inventory[ing.itemId] || 0) >= ing.count
                        );
                        return (
                          <div
                            key={rec.id}
                            className="flex items-center justify-between gap-3 bg-[#120c08]/90 border border-[#4a2f1a] rounded-lg px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#f0d090] flex items-center gap-1.5">
                                <span>{resDef?.icon || '🧪'}</span>
                                <span>{rec.name}</span>
                                <span className="text-[10px] text-[#7ad47a]">
                                  ➔ ×{rec.resultQty} ({resDef?.effectText})
                                </span>
                              </div>
                              <div className="text-[10px] text-[#b8a282] mt-0.5 flex flex-wrap gap-2">
                                {rec.ingredients.map((ing) => {
                                  const iDef = ITEM_CATALOG[ing.itemId];
                                  const have = inventory[ing.itemId] || 0;
                                  return (
                                    <span
                                      key={ing.itemId}
                                      className={
                                        have >= ing.count ? 'text-emerald-300' : 'text-amber-400/80'
                                      }
                                    >
                                      {iDef?.icon} {iDef?.name}: {have}/{ing.count}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <button
                              onClick={() => brewRecipeRef.current(rec.id)}
                              disabled={!canBrew}
                              className={`px-3 py-1.5 rounded border text-xs font-bold whitespace-nowrap cursor-pointer ${
                                canBrew
                                  ? 'bg-gradient-to-b from-[#3b7a22] to-[#1e4410] hover:from-[#4c992c] hover:to-[#285916] border-[#88ff66] text-[#f0ffe8]'
                                  : 'bg-[#1a130d] border-[#3d2a18] text-[#6e5c44] cursor-not-allowed'
                              }`}
                            >
                              ⚗️ Сварить зелье
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : bagTab === 'teleports' ? (
                  /* ВКЛАДКА 4: 🌀 СЕТЬ СТАЦИОНАРНЫХ И ПЕРЕНОСНЫХ ТЕЛЕПОРТОВ (Как в Two Worlds!) */
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    <div className="bg-[#0e1c2a]/95 border border-[#3a7ab8] rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-[#9be0ff]">
                          💎 Переносной Камень Телепортации (Как в Two Worlds)
                        </div>
                        <div className="text-[11px] text-[#8ab4d0]">
                          {portableBeaconCoords
                            ? `Активная личная точка: X=${portableBeaconCoords.x}, Z=${portableBeaconCoords.z}`
                            : 'Личная точка возврата ещё не установлена. Установите её в любом месте карты!'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => placePortableBeaconRef.current()}
                          className="px-3 py-1.5 rounded bg-[#18344e] hover:bg-[#22496e] border border-[#5cc4ff] text-xs font-bold text-[#e0f6ff] cursor-pointer"
                        >
                          📍 Установить маяк здесь
                        </button>
                        <button
                          onClick={() => teleportToPadRef.current('portable_beacon')}
                          disabled={!portableBeaconCoords}
                          className={`px-3 py-1.5 rounded border text-xs font-bold cursor-pointer ${
                            portableBeaconCoords
                              ? 'bg-gradient-to-b from-[#1f6a9a] to-[#103b58] border-[#7ce0ff] text-white'
                              : 'bg-[#141e28] border-[#2a3d50] text-[#58748c] cursor-not-allowed'
                          }`}
                        >
                          🌀 Вернуться к маяку
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-[#d4a862]">
                      🏛️ Древние Стационарные Платформы Телепортации (Мгновенное перемещение по карте):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: 'tp_camp', name: '🔮 Лагерь у Костра', desc: 'Лесоруб Бром, Рыбак Фарим и Охотник Ларс (X: 44, Z: -34)' },
                        { id: 'tp_village', name: '🔥 Деревня Горна (Маг Огня и Конюх)', desc: 'Верховный Маг Огня Пирокар, Конюх Гюнтер, Елена, Кузнец и Хакон' },
                        { id: 'tp_lake_village', name: '💧 Озёрная деревня «Тихая Заводь»', desc: 'Маг Воды Сатурас, Сапожник Криспен и Шеф-повар Гаспар (X: -85, Z: 25)' },
                        { id: 'tp_earth_village', name: '🪨 Каменный Посад «Край Големов»', desc: 'Маг Земли Торгалор (Призыв Големов) и Работяга Борк (X: 25, Z: 95)' },
                        { id: 'tp_wind_village', name: '🌪️☠️ Поселение «Ветреный Приют»', desc: 'Маг Воздуха Аэрион и Маг Некромагии/Ядов Ксардас (X: -80, Z: -95)' },
                        { id: 'tp_cave_skulls', name: '🕳️ Пещера «Склеп Черепов»', desc: 'У входа в северную подземную пещеру со скелетами и сундуками' },
                        { id: 'tp_cave_shadows', name: '🕳️ Пещера «Катакомбы Теней»', desc: 'У входа в юго-восточные катакомбы с сундуками' },
                      ].map((pad) => (
                        <div
                          key={pad.id}
                          className="flex items-center justify-between gap-2 bg-[#120c08]/90 border border-[#3a6888] rounded-lg px-3 py-2.5"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#b8ecff]">{pad.name}</div>
                            <div className="text-[10px] text-[#8aa8c0]">{pad.desc}</div>
                          </div>
                          <button
                            onClick={() => teleportToPadRef.current(pad.id)}
                            className="px-3 py-1.5 rounded bg-gradient-to-b from-[#1e5c8a] to-[#103450] hover:from-[#2878b4] hover:to-[#16466b] border border-[#66d4ff] text-xs font-bold text-[#f0fbff] whitespace-nowrap cursor-pointer"
                          >
                            🌀 Переместиться
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* ВКЛАДКА 2: ОЧКИ ОБУЧЕНИЯ И ПРОКАЧКА НАВЫКОВ (Как в Gothic 3 и Two Worlds!) */
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(
                      [
                        {
                          key: 'strength',
                          icon: '💪',
                          title: 'Сила Воина (Кузнечная мощь)',
                          lvl: skills.strength,
                          desc: 'Увеличивает физический урон мечей, булав орков и молота тролля на +12% за каждый уровень.',
                        },
                        {
                          key: 'dexterity',
                          icon: '🏹',
                          title: 'Ловкость Охотника и Акробатика',
                          lvl: skills.dexterity,
                          desc: 'Даёт +8% к скорости бега и +7% к шансу нанести двойной Критический Удар в ближнем бою.',
                        },
                        {
                          key: 'ancientKnowledge',
                          icon: '🔮',
                          title: 'Древнее Знание Магов (Иннос / Аданос / Белиар)',
                          lvl: skills.ancientKnowledge,
                          desc: 'Увеличивает урон всех 5 школ магии и карт на +20% и даёт +25 к максимальной Мане.',
                        },
                        {
                          key: 'shieldMastery',
                          icon: '🛡️',
                          title: 'Мастер Щита и Доспехов Паладина',
                          lvl: skills.shieldMastery,
                          desc: 'Даёт +30 к максимальному Здоровью (HP) и блокирует дополнительные +6% любого урона.',
                        },
                        {
                          key: 'regeneration',
                          icon: '🌿',
                          title: 'Высшая Регенерация (Мастерство Gothic 3)',
                          lvl: skills.regeneration,
                          desc: 'Непрерывно восстанавливает Здоровье и Ману даже прямо во время боя.',
                        },
                      ] as const
                    ).map((sk) => (
                      <div
                        key={sk.key}
                        className="flex items-center justify-between gap-3 bg-[#120c08]/90 border border-[#4a2f1a] rounded-lg px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl">{sk.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#f0d090] flex items-center gap-2">
                              <span>{sk.title}</span>
                              <span className="px-2 py-0.5 rounded bg-[#2d1e12] border border-[#8b6a3a] text-[#ffd866] text-[10px]">
                                Ранг {sk.lvl}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#b8a282]">{sk.desc}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => upgradeSkillRef.current(sk.key)}
                          disabled={skillPoints <= 0}
                          className={`px-3 py-1.5 rounded border text-xs font-bold whitespace-nowrap cursor-pointer ${
                            skillPoints > 0
                              ? 'bg-gradient-to-b from-[#7a5218] to-[#4a300a] hover:from-[#9a6a22] hover:to-[#624010] border-[#ffd066] text-[#fff4c2]'
                              : 'bg-[#1a130d] border-[#3d2a18] text-[#6e5c44] cursor-not-allowed'
                          }`}
                        >
                          ➕ Изучить (1 LP)
                        </button>
                      </div>
                    ))}

                    {/* 🔮 СООБЩЕСТВА МАГОВ 5 СТИХИЙ — Прокачка заклинаний и Големов за Монеты + Опыт */}
                    <div className="pt-2 border-t border-[#4a2f1a]">
                      <div className="text-xs font-bold text-[#ffd880] mb-1.5">
                        🔮 Сообщества Магов Миртаны (Обучение за монеты 💰 и набранный опыт XP):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(
                          [
                            {
                              action: 'train_mage_fire' as const,
                              icon: '🔥',
                              title: 'Сообщество Магов Огня (Пирокар)',
                              lvl: magicLevels.fire,
                              desc: 'Файербол [1] + Карта Огня + Усилитель ×2 (80 💰)',
                            },
                            {
                              action: 'train_mage_water' as const,
                              icon: '💧',
                              title: 'Круг Магов Воды (Сатурас)',
                              lvl: magicLevels.water,
                              desc: 'Ледяной Шар [2] + Исцеление + Карта Воды (80 💰)',
                            },
                            {
                              action: 'train_mage_air' as const,
                              icon: '🌪️',
                              title: 'Братство Магов Воздуха (Аэрион)',
                              lvl: magicLevels.air,
                              desc: 'Штормовой Шар [3] + Карта Ветра + Усилитель (80 💰)',
                            },
                            {
                              action: 'train_mage_earth' as const,
                              icon: '🪨',
                              title: 'Орден Магов Земли (Торгалор)',
                              lvl: magicLevels.lightning,
                              desc: 'Призыв Земляного/Каменного/Стального Големов [G] ×2 (90 💰)',
                            },
                            {
                              action: 'train_mage_necro' as const,
                              icon: '☠️',
                              title: 'Ковен Некромагии и Ядов (Ксардас)',
                              lvl: magicLevels.necro,
                              desc: 'Шар Чумного Яда [5] + Вампиризм + Стальной Голем (90 💰)',
                            },
                          ]
                        ).map((mg) => (
                          <div
                            key={mg.action}
                            className="flex items-center justify-between gap-2 bg-[#161020]/90 border border-[#6a4c9c] rounded-lg px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#ebd8ff] flex items-center gap-1.5">
                                <span>{mg.icon}</span>
                                <span className="truncate">{mg.title}</span>
                                <span className="px-1.5 py-0.2 rounded bg-[#2d1e42] text-[#ffd866] text-[10px]">
                                  Ур.{mg.lvl}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#b8a8d8] truncate">{mg.desc}</div>
                            </div>
                            <button
                              onClick={() => handleDialogActionRef.current(mg.action)}
                              className="px-2.5 py-1.5 rounded bg-gradient-to-b from-[#523088] to-[#2e1852] hover:from-[#683ead] hover:to-[#3f2270] border border-[#b888ff] text-[10px] font-bold text-white whitespace-nowrap cursor-pointer"
                            >
                              🔮 Обучиться
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🏪 МАГАЗИН / ЛАВКА КАРАВАНЩИКА ХАКОНА */}
          {shopOpen && !isPaused && (
            <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4">
              <div className="w-full max-w-2xl rounded-xl bg-gradient-to-br from-[#16100a]/95 to-[#26190f]/95 border-2 border-[#8b6a3a] p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#4a2f1a] pb-2.5 mb-3">
                  <div>
                    <h2 className="text-base font-bold tracking-wider text-[#d4a862]">
                      🏪 Торговая лавка Миртаны • 💰 Ваше золото: {hud.gold}
                    </h2>
                    <p className="text-[11px] text-[#a89068]">
                      Продавайте волчьи сердца, медвежатину, дичь и травы или покупайте редкие
                      эликсиры и магические Гримуары стихий.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShopOpen(false);
                        setBagOpen(true);
                      }}
                      className="px-2.5 py-1 rounded bg-[#2c1e12] hover:bg-[#3f2b1a] border border-[#8b6a3a] text-xs text-[#f0d090] cursor-pointer"
                    >
                      🎒 Сумочка
                    </button>
                    <button
                      onClick={() => setShopOpen(false)}
                      className="px-2.5 py-1 rounded bg-[#231911] hover:bg-[#36261a] border border-[#6b4a2a] text-xs text-[#e8d5a8] cursor-pointer"
                    >
                      ✕ Закрыть [M]
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {/* Левая колонка: Продать из сумочки */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-[#d4a862] mb-1">
                      🎒 Продать добычу из вашей сумочки:
                    </div>
                    {Object.entries(inventory).filter(([, qty]) => qty > 0).length === 0 ? (
                      <div className="text-[11px] text-[#7a6850] py-4">
                        В сумочке пока нет трофеев на продажу.
                      </div>
                    ) : (
                      Object.entries(inventory)
                        .filter(([, qty]) => qty > 0)
                        .map(([itemId, qty]) => {
                          const def = ITEM_CATALOG[itemId];
                          if (!def) return null;
                          return (
                            <div
                              key={itemId}
                              className="flex items-center justify-between bg-[#120c08]/90 border border-[#4a2f1a] rounded px-2.5 py-1.5"
                            >
                              <div className="text-[11px] text-[#e8d5a8] truncate">
                                {def.icon} {def.name} <span className="text-[#d4a862]">×{qty}</span>
                              </div>
                              <button
                                onClick={() => sellItemRef.current(itemId)}
                                className="px-2 py-0.5 rounded bg-[#2e441d] hover:bg-[#3d5c26] border border-[#6a9a44] text-[10px] text-[#e8ffd0] whitespace-nowrap cursor-pointer"
                              >
                                Продать +{def.sellPrice} 💰
                              </button>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Правая колонка: Купить товары и Гримуары */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-[#d4a862] mb-1">
                      📜 Купить травы, припасы и Гримуары стихий:
                    </div>
                    {Object.values(ITEM_CATALOG).map((def) => (
                      <div
                        key={def.id}
                        className="flex items-center justify-between gap-2 bg-[#120c08]/90 border border-[#4a2f1a] rounded px-2.5 py-1.5"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-[#f0d090] truncate">
                            {def.icon} {def.name}
                          </div>
                          <div className="text-[10px] text-[#88c488] truncate">{def.effectText}</div>
                        </div>
                        <button
                          onClick={() => buyItemRef.current(def.id)}
                          className="px-2 py-0.5 rounded bg-[#3a2614] hover:bg-[#52361c] border border-[#8b6a3a] text-[10px] text-[#ffd890] whitespace-nowrap cursor-pointer"
                        >
                          Купить {def.buyPrice} 💰
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top-Center: Target Info */}
          {targetEnemy && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-center">
              <div className="text-[#ffd090] text-xs font-semibold mb-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                {targetEnemy.name}
              </div>
              <div className="w-36 h-1.5 bg-black/75 border border-[#4a2f1a] overflow-hidden mx-auto rounded-full">
                <span
                  className="block h-full bg-gradient-to-r from-[#8b0000] to-[#d43a2a]"
                  style={{ width: `${(targetEnemy.hp / targetEnemy.maxHp) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Top-Right: Compact Radar (92x92) + Compact Collapsible Active Quests */}
          <div className="pointer-events-auto absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
            <div className="relative flex flex-col items-center">
              <canvas
                ref={minimapRef}
                width={124}
                height={124}
                className="w-[92px] h-[92px] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.8)]"
              />
              <div className="mt-0.5 px-2 py-0.5 rounded-full bg-[#140f0a]/80 border border-[#6b4a2a]/70 text-[9px] text-[#f0d090] max-w-[148px] truncate">
                {hud.region}
              </div>
            </div>

            {/* Ultra-Compact Collapsible Quest Box (shows only top 3 active quests to avoid screen clutter) */}
            <div className="w-40 bg-[#140f0a]/70 border border-[#6b4a2a]/65 rounded px-2 py-1 text-[10px]">
              <button
                onClick={() => setQuestsCollapsed((prev) => !prev)}
                className="w-full flex items-center justify-between text-[#d4a862] font-bold text-[10px] cursor-pointer"
              >
                <span>
                  ◈ Задания ({quests.filter((q) => q.done).length}/{quests.length})
                </span>
                <span className="text-[9px] text-[#a08050]">{questsCollapsed ? '▸' : '▾'}</span>
              </button>
              {!questsCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {quests
                    .filter((q) => !q.done)
                    .slice(0, 3)
                    .map((q) => (
                      <div
                        key={q.id}
                        className="pl-2.5 relative leading-tight text-[#c8b898] truncate"
                        title={`${q.text} (${q.current}/${q.target})`}
                      >
                        <span className="absolute left-0 text-[#8b6a3a]">•</span>
                        {q.text} ({q.current}/{q.target})
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* ✨ Баннер Просветления при повышении уровня (Two Worlds Enlightenment) */}
          {levelUpBanner && (
            <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-20 animate-bounce">
              <div className="px-5 py-2 rounded-full bg-gradient-to-r from-[#0e2a38]/95 via-[#18485e]/95 to-[#0e2a38]/95 border-2 border-[#70f0ff] shadow-[0_0_28px_rgba(100,240,255,0.85)] text-center">
                <div className="text-xs font-bold tracking-widest text-[#d8ffff] drop-shadow">
                  {levelUpBanner.title}
                </div>
              </div>
            </div>
          )}

          {/* Crosshair + Снайперский Оптический Прицел Лучника (ПКМ / Z как в Skyrim!) */}
          {hud.sniperAiming ? (
            <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
              {/* Снайперская виньетка фокусировки лучника */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle, transparent 28%, rgba(0, 12, 8, 0.55) 70%, rgba(0, 0, 0, 0.88) 100%)',
                }}
              />
              {/* Кольцо снайперского прицела с делениями дальности */}
              <div className="relative w-56 h-56 rounded-full border border-[#9be070]/75 shadow-[0_0_25px_rgba(120,255,100,0.35)] flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border border-[#ffd866]/55" />
                <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#9be070]/60" />
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#9be070]/60" />
                {/* Деления баллистической поправки стрелы */}
                <div className="absolute top-[58%] left-1/2 -translate-x-1/2 w-3 h-[1px] bg-[#ffd866]" />
                <div className="absolute top-[66%] left-1/2 -translate-x-1/2 w-2 h-[1px] bg-[#ffd866]/80" />
                <div className="w-2 h-2 rounded-full bg-[#ff4422] shadow-[0_0_8px_#ff4422]" />
              </div>
              <div className="absolute bottom-16 text-center bg-[#0c160e]/85 border border-[#7ad460] rounded-full px-4 py-1 text-xs font-bold text-[#d8ffc8] shadow-lg">
                🎯 СНАЙПЕРСКИЙ ПРИЦЕЛ ЛУКА (Кратность 2.5× • Урон +35%) • ЛКМ — Выстрел • [R] Сменить стрелы ({hud.arrowCount} шт.)
              </div>
            </div>
          ) : (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-75">
              <div className="absolute left-[7px] top-0 w-0.5 h-4 bg-[#d4a862] shadow-[0_0_3px_#000]" />
              <div className="absolute top-[7px] left-0 h-0.5 w-4 bg-[#d4a862] shadow-[0_0_3px_#000]" />
              {hud.bowModeActive && (
                <div className="absolute -inset-1.5 rounded-full border border-[#9be070]/80" />
              )}
            </div>
          )}

          {/* Компактная подсказка взаимодействия — внизу справа */}
          {interactPrompt && !activeDialog && !isPaused && (
            <button
              onClick={() => triggerInteractRef.current()}
              className="pointer-events-auto absolute bottom-2.5 right-2.5 max-w-[230px] truncate text-right text-[#f0d090] text-[10px] bg-[#140f0a]/80 px-2.5 py-1 border border-[#8b6a3a]/80 rounded shadow cursor-pointer hover:bg-[#281d14]"
            >
              {interactPrompt}
            </button>
          )}

          {/* Bottom-Left: Minimal 2-Line Event Log */}
          <div className="absolute bottom-2.5 left-2.5 max-w-[210px] bg-[#140f0a]/45 border-l border-[#8b6a3a]/60 px-2 py-0.5 text-[10px] leading-tight rounded-r">
            {logs.slice(0, 2).map((line, idx) => (
              <p
                key={idx}
                className={`truncate ${
                  idx === 0 ? 'text-[#f0d090]' : 'text-[#b0a080]/70'
                }`}
              >
                {line}
              </p>
            ))}
          </div>

          {/* NPC Dialog */}
          {activeDialog && !isPaused && (
            <div className="pointer-events-auto absolute bottom-10 left-1/2 -translate-x-1/2 w-[660px] max-w-[92%] bg-gradient-to-br from-[#1e140c]/95 to-[#0f0a06]/95 border-2 border-[#8b6a3a] rounded-lg px-5 py-4 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 border-b border-[#3d2817] pb-2">
                <div>
                  <div className="text-[#d4a862] text-base font-bold flex items-center gap-2">
                    <span>{activeDialog.name}</span>
                    <span className="text-xs font-normal text-[#a89068]">
                      • {activeDialog.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-300/90 mt-0.5">{voiceStatus}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeDialog.heroPhrase && (
                    <button
                      onClick={() => {
                        setDialogSpeaker('hero');
                        soundRef.current?.speakDialog(
                          'hero',
                          activeDialog.heroPhrase!,
                          setVoiceStatus,
                          '🗣️ Говорит ваш Герой'
                        );
                      }}
                      className="px-2.5 py-1 rounded bg-[#1f2918] hover:bg-[#2d3d22] border border-[#6a8a4a] text-xs text-[#d8f5c0] flex items-center gap-1 cursor-pointer"
                      title="Повторно озвучить только фразу вашего Героя"
                    >
                      <span>🗣️ Фраза героя</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (activeDialog.heroPhrase) {
                        soundRef.current?.speakHeroAndNpc(
                          activeDialog.key,
                          activeDialog.name,
                          activeDialog.heroPhrase,
                          activeDialog.text,
                          setVoiceStatus,
                          setDialogSpeaker
                        );
                      } else {
                        setDialogSpeaker('npc');
                        soundRef.current?.speakDialog(
                          activeDialog.key,
                          activeDialog.text,
                          setVoiceStatus,
                          `💬 ${activeDialog.name}`
                        );
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-[#2c1e12] hover:bg-[#422d1b] border border-[#8b6a3a] text-xs text-[#f0d090] flex items-center gap-1 cursor-pointer"
                    title="Повторно воспроизвести студийную озвучку реплики"
                  >
                    <span>🔊 Озвучить снова</span>
                  </button>
                </div>
              </div>

              {/* Отображение сказанной вслух фразы нашего Героя + ответа NPC */}
              {activeDialog.heroPhrase && (
                <div
                  className={`mb-2 px-3 py-1.5 rounded border text-sm transition-colors ${
                    dialogSpeaker === 'hero'
                      ? 'bg-[#25361a]/90 border-[#8cd460] text-[#eaffd8]'
                      : 'bg-[#17120c]/85 border-[#4a3520] text-[#c8d8b0]'
                  }`}
                >
                  <span className="font-bold text-[#9be070] mr-1.5">
                    🗣️ Вы (Герой){dialogSpeaker === 'hero' ? ' [говорит вслух...]' : ':'}
                  </span>
                  <span className="italic">«{activeDialog.heroPhrase}»</span>
                </div>
              )}

              <div
                className={`text-[15px] leading-relaxed mb-3 italic px-3 py-1.5 rounded border transition-colors ${
                  dialogSpeaker === 'npc'
                    ? 'bg-[#2e1e10]/90 border-[#ffd066] text-[#fff4d8]'
                    : 'bg-transparent border-transparent text-[#e8d8b8]'
                }`}
              >
                <span className="not-italic font-semibold text-[#d4a862] mr-1.5 text-xs">
                  💬 {activeDialog.name}
                  {dialogSpeaker === 'npc' ? ' [отвечает вслух...]' : ':'}
                </span>
                «{activeDialog.text}»
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {/* Кнопка «Продолжить разговор» — сначала вслух говорит наш Герой, затем отвечает NPC */}
                {activeDialog.choices.length > 0 && (
                  <div
                    onClick={() => {
                      const nextIdx = (activeDialog.stepIndex + 1) % activeDialog.choices.length;
                      const nextChoice = activeDialog.choices[nextIdx];
                      const dynamicReply = nextChoice.action
                        ? handleDialogActionRef.current(nextChoice.action) || nextChoice.reply
                        : nextChoice.reply;
                      soundRef.current?.speakHeroAndNpc(
                        activeDialog.key,
                        activeDialog.name,
                        nextChoice.text,
                        dynamicReply,
                        setVoiceStatus,
                        setDialogSpeaker
                      );
                      // Предзагружаем следующую фразу Героя и ответ NPC в фоновом режиме
                      const followIdx = (nextIdx + 1) % activeDialog.choices.length;
                      soundRef.current?.prefetchDialog(
                        'hero',
                        activeDialog.choices[followIdx].text
                      );
                      soundRef.current?.prefetchDialog(
                        activeDialog.key,
                        activeDialog.choices[followIdx].reply
                      );
                      if (nextChoice.quest) {
                        addLogMessage(`📜 Принято задание от ${activeDialog.name}`);
                      }
                      const nextVisited = activeDialog.visitedIndices.includes(nextIdx)
                        ? activeDialog.visitedIndices
                        : [...activeDialog.visitedIndices, nextIdx];
                      setActiveDialog({
                        ...activeDialog,
                        heroPhrase: nextChoice.text,
                        text: dynamicReply,
                        replied: true,
                        stepIndex: nextIdx,
                        visitedIndices: nextVisited,
                      });
                    }}
                    className="text-[#ffd880] font-semibold text-sm px-3 py-1.5 my-1 rounded bg-[#2d1e12]/90 border border-[#d4a862] cursor-pointer hover:bg-[#422c1a] hover:text-white flex items-center justify-between"
                  >
                    <span>
                      💬 [Продолжить разговор] — Сказать: «
                      {
                        activeDialog.choices[
                          (activeDialog.stepIndex + 1) % activeDialog.choices.length
                        ].text
                      }
                      »
                    </span>
                    <span className="text-xs text-[#d4a862]">
                      Фраза {((activeDialog.stepIndex + 1) % activeDialog.choices.length) + 1}/
                      {activeDialog.choices.length} ➔
                    </span>
                  </div>
                )}

                {/* Все вопросы и темы разговора всегда доступны для выбора (озвучивается и Герой, и ответ NPC) */}
                {activeDialog.choices.map((c, idx) => {
                  const isVisited = activeDialog.visitedIndices.includes(idx);
                  const isCurrent = activeDialog.stepIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        const dynamicReply = c.action
                          ? handleDialogActionRef.current(c.action) || c.reply
                          : c.reply;
                        soundRef.current?.speakHeroAndNpc(
                          activeDialog.key,
                          activeDialog.name,
                          c.text,
                          dynamicReply,
                          setVoiceStatus,
                          setDialogSpeaker
                        );
                        const followIdx = (idx + 1) % activeDialog.choices.length;
                        soundRef.current?.prefetchDialog(
                          'hero',
                          activeDialog.choices[followIdx].text
                        );
                        soundRef.current?.prefetchDialog(
                          activeDialog.key,
                          activeDialog.choices[followIdx].reply
                        );
                        if (c.quest) {
                          addLogMessage(`📜 Принято задание от ${activeDialog.name}`);
                        }
                        const nextVisited = activeDialog.visitedIndices.includes(idx)
                          ? activeDialog.visitedIndices
                          : [...activeDialog.visitedIndices, idx];
                        setActiveDialog({
                          ...activeDialog,
                          heroPhrase: c.text,
                          text: dynamicReply,
                          replied: true,
                          stepIndex: idx,
                          visitedIndices: nextVisited,
                        });
                      }}
                      className={`text-sm px-2.5 py-1.5 my-1 border-l-2 cursor-pointer transition-colors flex items-center justify-between ${
                        isCurrent
                          ? 'text-[#ffd890] border-[#ffd066] bg-[#b4783c]/15 font-semibold'
                          : isVisited
                          ? 'text-[#8e8068] border-[#3d2817] hover:text-[#f0d090] hover:border-[#d4a862] hover:bg-[#b4783c]/10'
                          : 'text-[#c8b898] border-[#6b4a2a] hover:text-[#f0d090] hover:border-[#d4a862] hover:bg-[#b4783c]/10'
                      }`}
                    >
                      <span>
                        🗣️ {c.text} {c.quest ? '📜' : ''}
                      </span>
                      {isVisited && <span className="text-[11px] text-[#7a9a5a]">✓</span>}
                    </div>
                  );
                })}

                <div
                  onClick={() => {
                    soundRef.current?.stopDialogVoice();
                    setDialogSpeaker('idle');
                    setActiveDialog(null);
                  }}
                  className="text-[#b08870] text-sm px-2.5 py-1.5 my-1 border-l-2 border-[#5a2f1a] cursor-pointer hover:text-[#ffd0b0] hover:border-[#d46a4a] hover:bg-[#b43c28]/10"
                >
                  ▸ [Закончить разговор]
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          PAUSE MENU OVERLAY (ESC)
         ============================================================ */}
      {gameStarted && isPaused && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 backdrop-blur-sm p-6">
          <div className="max-w-md w-full rounded-xl bg-gradient-to-br from-[#140f0a]/95 to-[#28190f]/95 border-2 border-[#8b6a3a] p-7 text-center shadow-2xl space-y-5">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[#a38f6d] mb-1">
                Игра на паузе
              </p>
              <h2 className="font-display text-3xl font-bold tracking-widest text-[#d4a862]">
                ПАУЗА
              </h2>
            </div>

            <div className="text-left text-xs bg-[#120e0a]/90 border border-[#473422] rounded-lg p-4 space-y-3">
              <div>
                <div className="text-[#a38f6d] mb-1.5">Время суток и атмосфера (меняет музыку):</div>
                <div className="grid grid-cols-5 gap-1">
                  {(
                    [
                      ['auto', 'Авто'],
                      ['dawn', 'Утро'],
                      ['noon', 'День'],
                      ['sunset', 'Вечер'],
                      ['night', 'Ночь'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setGfx({ presetTime: key })}
                      className={`px-2 py-1.5 rounded border text-[11px] cursor-pointer whitespace-nowrap ${
                        gfx.presetTime === key
                          ? 'bg-[#6b4a2a] border-[#d4a862] text-white'
                          : 'bg-[#1f1710] border-[#3d2d1d] text-[#bfa986] hover:bg-[#2c2117]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="pt-2 border-t border-[#332417] flex items-center justify-between gap-2">
                  <span className="text-[#a38f6d] text-[11px] truncate">
                    Фаза луны: <b className="text-[#f0d090]">{hud.moonPhaseName}</b>
                  </span>
                  <button
                    onClick={() => cycleMoonPhaseRef.current()}
                    className="px-2 py-1 rounded bg-[#231911] hover:bg-[#36261a] border border-[#6b4a2a] text-[11px] text-[#ffd890] whitespace-nowrap cursor-pointer"
                  >
                    🌙 Сменить фазу луны
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#332417] flex items-center justify-between gap-3">
                <span className="text-[#a38f6d]">Громкость музыки и природы:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={soundMuted ? 0 : soundVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-28 accent-[#d4a862] cursor-pointer"
                  />
                  <button
                    onClick={toggleMuteAudio}
                    className="px-2 py-1 rounded bg-[#231911] hover:bg-[#36261a] border border-[#6b4a2a] text-[#e8d5a8] cursor-pointer"
                  >
                    {soundMuted ? 'Вкл' : 'Выкл'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 rounded bg-gradient-to-b from-[#6b4a2a] to-[#3a2515] hover:from-[#8b6a3a] hover:to-[#5a3a20] border-2 border-[#8b6a3a] text-sm font-bold tracking-widest text-[#e8d5a8] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>ПРОДОЛЖИТЬ ИГРУ (ESC)</span>
              </button>

              <button
                onClick={() => resetToCampRef.current()}
                className="w-full py-2.5 rounded bg-[#241b13] hover:bg-[#33271b] border border-[#5c442b] text-xs text-[#d8cbb4] flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Переместиться в центр мира</span>
              </button>

              <button
                onClick={() => {
                  setIsPaused(false);
                  setGameStarted(false);
                }}
                className="w-full py-2.5 rounded bg-[#1c140e] hover:bg-[#2b1f15] border border-[#473422] text-xs text-[#a89578] hover:text-[#ebd4ab] cursor-pointer"
              >
                Выйти в главное меню
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TITLE SCREEN OVERLAY (As in v9 / v10)
         ============================================================ */}
      {!gameStarted && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6">
          <div className="text-center bg-gradient-to-br from-[#140f0a]/95 to-[#28190f]/95 px-14 py-10 border-[3px] border-[#8b6a3a] rounded-xl shadow-2xl">
            <h1 className="text-[#d4a862] text-[52px] tracking-[8px] mb-2 font-bold">
              GOTHIC
            </h1>
            <h2 className="text-[#8b6a3a] text-base tracking-[6px] mb-8 font-normal">
              CHRONICLES OF MYRTANA 3D
            </h2>

            {isLoading ? (
              <div className="text-[#d4a862] text-xl tracking-[3px] py-3">
                Загрузка мира...
              </div>
            ) : (
              <button
                onClick={handleStartGame}
                className="bg-gradient-to-b from-[#6b4a2a] to-[#3a2515] hover:from-[#8b6a3a] hover:to-[#5a3a20] text-[#e8d5a8] hover:text-white border-2 border-[#8b6a3a] px-11 py-3.5 text-lg tracking-[3px] cursor-pointer rounded"
              >
                НАЧАТЬ ПРИКЛЮЧЕНИЕ
              </button>
            )}

            <div className="text-[#6a5a3a] text-xs mt-6 leading-[1.7]">
              <b className="text-[#9a8458]">ЛКМ зажать + мышь</b> — вращать камеру •{' '}
              <b className="text-[#9a8458]">ЛКМ клик</b> — атака
              <br />
              WASD — движение • Shift — бег • Space — прыжок • Ctrl — кувырок
              <br />
              <b className="text-[#9a8458]">F</b> — достать/убрать мечи в ножны •{' '}
              <b className="text-[#9a8458]">H</b> — свистнуть лошади
              <br />
              <b className="text-[#9a8458]">E</b> — говорить с NPC /{' '}
              <b className="text-[#9a8458]">сесть на лошадь</b> / слезть •{' '}
              <b className="text-[#9a8458]">Esc</b> — пауза
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
