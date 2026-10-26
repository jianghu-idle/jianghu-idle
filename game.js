'use strict';

/* ============================================================
   江湖 · 挂机录  demo
   纯文字挂机：10 图 × 10 级 / 五维属性 / 品质词条 / 心法功法 / 故人互动
   ============================================================ */

const SAVE_KEY = 'wuxia-idle-save-v1';
const SAVE_VER = 2;
/* 公开版：剔除成人向奇物。本地 file:// 或地址带 ?full=1 时为完整版 */
const SAFE_MODE = (() => {
  if (typeof location === 'undefined') return true;
  if (location.protocol === 'file:') return false;
  if (/[?&]full=1/.test(location.search)) return false;
  return true;
})();
const TICK_MS = 2600;
const MAX_LEVEL = 100;

/* ------------------------------------------------------------ 数据：地图 */

const MAPS = [
  {
    name: '青石村', min: 1, max: 10,
    intro: '青石村外，野狼伤人，山贼劫道。你握紧柴刀，决定先拿它们练手。',
    outro: '你击退山贼头目，村长把一把祖传铁剑塞进你手里，只说了一句：「山外有山。」',
    mobs: ['野狼', '山贼喽啰', '流浪剑客'],
    boss: '山贼头目',
  },
  {
    name: '落霞镇', min: 11, max: 20,
    intro: '镇上的镖局被劫，镖头悬赏追查。黑店里的酒气掩着一股血腥味。',
    outro: '你从劫匪尸身上搜出半块黑风寨的腰牌——劫镖只是幌子，黑风寨在找人。',
    mobs: ['劫镖匪徒', '黑店打手', '醉汉刀客'],
    boss: '劫镖头领',
  },
  {
    name: '黑风寨', min: 21, max: 30,
    intro: '黑风寨盘踞山道多年，寨墙上挂满了镖旗。你提着剑，从后山摸上去。',
    outro: '寨主伏诛，你在他书案夹层里找到一封密信，落款是州府某位大人。',
    mobs: ['寨中刀手', '暗器手', '寨主亲卫'],
    boss: '黑风寨主',
  },
  {
    name: '州府大牢', min: 31, max: 40,
    intro: '你被人诬陷入狱。铁栅之后，有人认出你，低声说：「想活命，今夜就走。」',
    outro: '你带着账册杀出大牢，册子上记着官员与魔教往来的银两——每一条都够诛族。',
    mobs: ['狱卒', '死囚', '贪官爪牙'],
    boss: '铁面典狱',
  },
  {
    name: '魔教外围', min: 41, max: 50,
    intro: '魔教总坛设在山腹，外围三步一哨。血煞堂的人腰间都挂着人骨。',
    outro: '你擒下一名香主，问出魔教在寻一件前朝遗物——据说能号令旧部。',
    mobs: ['巡山弟子', '血煞堂众', '毒烟侍者'],
    boss: '血煞堂主',
  },
  {
    name: '前朝古墓', min: 51, max: 60,
    intro: '古墓入口被雷劈开。墓室深处，兵戈陈列如林，像在等一场迟到的点卯。',
    outro: '你捧起遗物——一枚玉骨兵符。它温得像人的骨头，旧部认符不认人。',
    mobs: ['守墓傀儡', '盗墓贼', '墓中阴尸'],
    boss: '守墓人',
  },
  {
    name: '边关军营', min: 61, max: 70,
    intro: '兵符的消息比你先到。边关兵变，烽火连营，忠将与叛军各执一词。',
    outro: '你助忠将平定兵变。站在城头，听万人齐呼你的名字——这声音，皇城听得到。',
    mobs: ['叛军士卒', '军中高手', '敌国细作'],
    boss: '叛军统领',
  },
  {
    name: '武林大会', min: 71, max: 80,
    intro: '武林大会，各派推你做盟主。擂台之上，有人喊你名，也有人想要你命。',
    outro: '你识破了藏在各派中的魔教卧底，也看清了：所谓名门，有人比魔教更脏。',
    mobs: ['各派挑战者', '伪君子掌门', '魔教卧底'],
    boss: '伪君子掌门',
  },
  {
    name: '皇城暗流', min: 81, max: 90,
    intro: '皇城夜禁。你握着兵符与账册，穿过大内侍卫的眼线，听见更鼓声里的杀机。',
    outro: '你拿到权臣谋反的铁证。国师在城楼上等你，说：「你要救的，未必值得救。」',
    mobs: ['大内侍卫', '权臣死士', '魔教长老'],
    boss: '权臣影卫',
  },
  {
    name: '金銮殿', min: 91, max: 100,
    intro: '金銮殿外，血还没干。禁军倒戈，魔教教主与国师立于丹陛之下，等你一战。',
    outro: '国师伏诛，天下在你一念之间。',
    mobs: ['禁军统领', '魔教教主', '幕后国师'],
    boss: '幕后国师',
  },
  {
    name: '劫境', min: 1, max: 100, hidden: true,
    intro: '轮回之后，你看见了另一重天地。这里没有王朝，只有劫云与异兽。',
    outro: '劫云散开，你已不在凡尘。',
    mobs: ['劫境游魂', '劫云异兽'],
    boss: '劫境之主',
  },
];

const TIERS = [
  { name: '凡胎', color: '#cfd6cf' },
  { name: '淬体', color: '#7fd08a' },
  { name: '通脉', color: '#6fa8ff' },
  { name: '凝丹', color: '#5fd3d3' },
  { name: '化神', color: '#c98bff' },
  { name: '渡劫', color: '#ffb066' },
  { name: '飞升', color: '#ff6f6f' },
];

const TIER_ENEMIES = [
  null,
  { mobs: ['青狼', '铁背熊', '山魈', '雷纹虎'], elite: '裂地犀', boss: '苍狼王' },
  { mobs: ['幽冥鬼卒', '血蝠妖', '千年树妖', '尸傀'], elite: '阴山鬼将', boss: '黄泉鬼母' },
  { mobs: ['火鸦', '熔岩巨人', '赤炎兽', '炎魔'], elite: '焚天蛟', boss: '赤霄炎君' },
  { mobs: ['玄冰蛟', '寒潭鬼母', '冰晶蛛', '雪魈'], elite: '玄冰龙王', boss: '冰魄魔尊' },
  { mobs: ['天雷兽', '雷鹏', '九幽鬼帝', '雷劫傀儡'], elite: '雷部天将', boss: '九天雷帝' },
  { mobs: ['混沌兽', '虚空吞噬者', '远古魔神', '九头蛇'], elite: '灭世魔龙', boss: '混沌之主' },
];

const TIER_TRIALS = ['', '雷劫·惊蛰', '心魔劫·照影', '阴火劫·焚身', '玄冰劫·锁魂', '天雷劫·九重', '混沌劫·终焉'];

/* ------------------------------------------------------------ 数据：品质/词条 */

const QUALITIES = [
  { k: 'white', name: '凡品', cls: 'q-white', weight: 60, affixes: 0, mult: 1.0 },
  { k: 'green', name: '良品', cls: 'q-green', weight: 25, affixes: 1, mult: 1.22 },
  { k: 'blue', name: '上品', cls: 'q-blue', weight: 10, affixes: 2, mult: 1.5 },
  { k: 'purple', name: '珍品', cls: 'q-purple', weight: 4, affixes: 3, mult: 1.85 },
  { k: 'orange', name: '神品', cls: 'q-orange', weight: 1, affixes: 4, mult: 2.3 },
  { k: 'red', name: '传奇', cls: 'q-red', weight: 0.15, affixes: 5, mult: 3.0 },
];

const SLOTS = {
  weapon: { name: '武器', base: 'atk' },
  armor: { name: '防具', base: 'def' },
  helmet: { name: '头饰', base: 'def' },
  boots: { name: '鞋履', base: 'agi' },
  accessory: { name: '饰品', base: 'hp' },
};

const WEAPON_NAMES = ['铁剑', '柳叶刀', '精钢剑', '寒铁枪', '玄铁重剑', '龙渊剑'];
const ARMOR_NAMES = ['粗布劲装', '皮甲', '锁子甲', '玄铁护心镜', '天蚕宝衣', '龙鳞甲'];
const HELMET_NAMES = ['青布巾', '皮盔', '铁盔', '玄铁盔', '紫金冠', '龙纹冠'];
const BOOTS_NAMES = ['草鞋', '皮靴', '快靴', '踏云靴', '追风履', '龙鳞靴'];
const ACC_NAMES = ['铜护腕', '玉扳指', '玛瑙串', '玄玉佩', '龙纹戒'];

/* 词条池：value 按物品等级成长 */
const AFFIXES = {
  atk: { name: '攻击', roll: (lv) => Math.round(2 + lv * 0.75), fmt: (v) => '攻击 +' + v },
  def: { name: '防御', roll: (lv) => Math.round(1.5 + lv * 0.55), fmt: (v) => '防御 +' + v },
  hp: { name: '气血', roll: (lv) => Math.round(8 + lv * 2.6), fmt: (v) => '气血 +' + v },
  agi: { name: '身法', roll: (lv) => Math.round(1 + lv * 0.35), fmt: (v) => '身法 +' + v },
  mpMax: { name: '内力上限', roll: (lv) => Math.round(4 + lv * 1.4), fmt: (v) => '内力上限 +' + v },
  mpRegen: { name: '内力回复', roll: (lv) => Math.max(1, Math.round(lv * 0.12)), fmt: (v) => '内力回复 +' + v },
  crit: { name: '暴击率', roll: (lv) => +(0.8 + lv * 0.03).toFixed(1), fmt: (v) => '暴击率 +' + v + '%' },
  critDmg: { name: '暴击伤害', roll: (lv) => Math.round(6 + lv * 0.5), fmt: (v) => '暴击伤害 +' + v + '%' },
  dodge: { name: '闪避', roll: (lv) => +(0.4 + lv * 0.02).toFixed(1), fmt: (v) => '闪避 +' + v + '%' },
  hit: { name: '命中', roll: (lv) => +(0.5 + lv * 0.02).toFixed(1), fmt: (v) => '命中 +' + v + '%' },
  lifesteal: { name: '吸血', roll: (lv) => +(0.3 + lv * 0.015).toFixed(1), fmt: (v) => '吸血 +' + v + '%' },
  pierce: { name: '破防', roll: (lv) => +(0.6 + lv * 0.02).toFixed(1), fmt: (v) => '破防 +' + v + '%' },
  dmgReduce: { name: '伤害减免', roll: (lv) => +(0.3 + lv * 0.015).toFixed(1), fmt: (v) => '伤害减免 +' + v + '%' },
  block: { name: '格挡', roll: (lv) => +(0.5 + lv * 0.02).toFixed(1), fmt: (v) => '格挡 +' + v + '%' },
  thorns: { name: '反伤', roll: (lv) => +(0.4 + lv * 0.02).toFixed(1), fmt: (v) => '反伤 +' + v + '%' },
  skillPower: { name: '招式威力', roll: (lv) => Math.round(2 + lv * 0.3), fmt: (v) => '招式威力 +' + v + '%' },
};

/* ------------------------------------------------------------ 数据：心法/功法 */

const PASSIVES = [
  { id: 'tuna', name: '吐纳心法', desc: '内力上限 +20%，内力回复 +1', mods: { mpMaxPct: 0.2, mpRegen: 1 } },
  { id: 'jinzhong', name: '金钟罩', desc: '防御 +15%，受伤 -5%', mods: { defPct: 0.15, dmgReduce: 0.05 } },
  { id: 'jifeng', name: '疾风诀', desc: '身法 +10%，闪避 +3%', mods: { agiPct: 0.1, dodge: 3 } },
  { id: 'yunvjing', name: '玉女心经', desc: '内力上限 +25%，受伤 -5%', mods: { mpMaxPct: 0.25, dmgReduce: 0.05 }, exclusive: true },
  { id: 'langhuan', name: '琅嬛武库', desc: '招式威力 +20%，暴击 +2%', mods: { skillPower: 20, crit: 2 }, exclusive: true },
  { id: 'xinji', name: '心机', desc: '暴击 +6%，暴击伤害 +15%', mods: { crit: 6, critDmg: 15 }, exclusive: true },
  { id: 'wuxiang', name: '小无相功', desc: '招式威力 +15%，内力回复 +2', mods: { skillPower: 15, mpRegen: 2 }, exclusive: true },
  { id: 'bohai', name: '薄雾身法', desc: '闪避 +8%，受伤 -5%', mods: { dodge: 8, dmgReduce: 0.05 }, exclusive: true },
  { id: 'emei', name: '峨眉心法', desc: '暴击 +5%，招式威力 +10%', mods: { crit: 5, skillPower: 10 }, exclusive: true },
  { id: 'qimen', name: '奇门遁甲', desc: '闪避 +5%，暴击 +3%', mods: { dodge: 5, crit: 3 }, exclusive: true },
  { id: 'qingxin', name: '清心普善咒', desc: '内力回复 +2，受伤 -5%', mods: { mpRegen: 2, dmgReduce: 0.05 }, exclusive: true },
  { id: 'tianying', name: '天鹰心法', desc: '暴击 +4%，闪避 +4%', mods: { crit: 4, dodge: 4 }, exclusive: true },
  /* 门派专属 */
  { id: 'yijin', name: '易筋经', desc: '气血 +8%', mods: { hpPct: 0.08 }, exclusive: true },
  { id: 'taiji', name: '太极心法', desc: '受到伤害 -6%', mods: { dmgReduce: 0.06 }, exclusive: true },
  { id: 'emeijian', name: '峨眉剑诀', desc: '暴击 +5%', mods: { crit: 5 }, exclusive: true },
  { id: 'huashanxin', name: '华山心法', desc: '攻击 +6%', mods: { atkPct: 0.06 }, exclusive: true },
  { id: 'xianglong', name: '降龙劲', desc: '招式威力 +15%', mods: { skillPower: 15 }, exclusive: true },
  { id: 'shenghuo', name: '圣火令', desc: '暴击伤害 +15%', mods: { critDmg: 15 }, exclusive: true },
  { id: 'netrunner', name: '网络行者', desc: '闪避 +5%，暴击 +3%', mods: { dodge: 5, crit: 3 }, exclusive: true },
];

const ACTIVES = [
  { id: 'pingsha', name: '平沙落雁', desc: '150% 伤害', cost: 20, cd: 3, power: 1.5, text: '平沙落雁' },
  { id: 'poyu', name: '破玉拳', desc: '120% 伤害，破防 10%', cost: 15, cd: 2, power: 1.2, pierce: 0.1, text: '破玉拳' },
  { id: 'huichun', name: '回春诀', desc: '回复 15% 气血', cost: 25, cd: 5, heal: 0.15, text: '回春诀' },
  { id: 'qiankun', name: '乾坤大挪移', desc: '220% 伤害', cost: 35, cd: 5, power: 2.2, text: '乾坤大挪移' },
  { id: 'zhemei', name: '天山折梅手', desc: '170% 伤害，破防 15%', cost: 25, cd: 3, power: 1.7, pierce: 0.15, text: '天山折梅手' },
  { id: 'yunvjian', name: '玉女素心剑', desc: '200% 伤害，命中回 10% 气血', cost: 30, cd: 4, power: 2.0, healOnHit: 0.1, text: '玉女素心剑', exclusive: true },
  { id: 'zhidian', name: '指点', desc: '3 回合内攻击 +30%', cost: 25, cd: 5, buff: { atk: 0.3, rounds: 3 }, text: '指点', exclusive: true },
  { id: 'lvliu', name: '绿柳刀法', desc: '240% 伤害', cost: 30, cd: 5, power: 2.4, text: '绿柳刀法', exclusive: true },
  { id: 'baihong', name: '白虹掌力', desc: '260% 伤害，破防 20%', cost: 40, cd: 6, power: 2.6, pierce: 0.2, text: '白虹掌力', exclusive: true },
  { id: 'canghai', name: '沧海一粟', desc: '300% 伤害', cost: 50, cd: 8, power: 3.0, text: '沧海一粟', exclusive: true },
  { id: 'jiuyinzhua', name: '九阴白骨爪', desc: '280% 伤害，破防 25%', cost: 35, cd: 5, power: 2.8, pierce: 0.25, text: '九阴白骨爪', exclusive: true },
  { id: 'dagoubang', name: '打狗棒法', desc: '230% 伤害', cost: 30, cd: 4, power: 2.3, text: '打狗棒法', exclusive: true },
  { id: 'xixing', name: '吸星大法', desc: '250% 伤害，命中回 8% 气血', cost: 40, cd: 6, power: 2.5, healOnHit: 0.08, text: '吸星大法', exclusive: true },
  { id: 'qianzhu', name: '千蛛万毒手', desc: '260% 伤害，破防 20%', cost: 45, cd: 6, power: 2.6, pierce: 0.2, text: '千蛛万毒手', exclusive: true },
  { id: 'kamehameha', name: '龟派气功', desc: '260% 伤害', cost: 40, cd: 5, power: 2.6, text: '龟派气功' },
  { id: 'makankosappo', name: '魔贯光杀炮', desc: '320% 伤害，破防 30%', cost: 50, cd: 7, power: 3.2, pierce: 0.3, text: '魔贯光杀炮' },
  { id: 'kienzan', name: '气圆斩', desc: '220% 伤害，破防 20%', cost: 35, cd: 4, power: 2.2, pierce: 0.2, text: '气圆斩' },
  { id: 'monowire', name: '单分子线', desc: '280% 伤害，破防 25%', cost: 40, cd: 5, power: 2.8, pierce: 0.25, text: '单分子线', exclusive: true },
];

const PAGES_NEEDED = 5;

/* 出身 */
const ORIGINS = {
  orphan: { name: '孤儿', desc: '气血 +20，暴击 +1%', base: { hp: 20 }, crit: 1, skill: 0 },
  escort: { name: '镖师之后', desc: '攻击 +2，身法 +1', base: { atk: 2, agi: 1 }, crit: 0, skill: 0 },
  scholar: { name: '书香门第', desc: '内力 +20，招式威力 +5%', base: { mp: 20 }, crit: 0, skill: 5 },
};

/* 药品与礼物 */
const POTIONS = [
  { id: 'jinchuang', name: '金疮药', type: 'heal', value: 0.3, price: 20, lv: 1, desc: '回复 30% 气血' },
  { id: 'dahuan', name: '大还丹', type: 'heal', value: 0.6, price: 60, lv: 30, desc: '回复 60% 气血' },
  { id: 'huiqi', name: '回气丹', type: 'mana', value: 0.4, price: 25, lv: 1, desc: '回复 40% 内力' },
  { id: 'xingqi', name: '行气散', type: 'buff', value: 0.15, rounds: 3, price: 45, lv: 10, desc: '攻击 +15%，持续 3 回合' },
  { id: 'jiedu', name: '解毒散', type: 'cure', price: 30, lv: 5, desc: '解除中毒与流血' },
];

const GIFTS = [
  { id: 'gift_xiu', name: '绣线', price: 30, fav: 5 },
  { id: 'gift_jiu', name: '一壶酒', price: 40, fav: 5 },
  { id: 'gift_book', name: '话本', price: 50, fav: 5 },
];

const POTION_BY_ID = {};
for (const p of POTIONS) POTION_BY_ID[p.id] = p;
for (const g of GIFTS) POTION_BY_ID[g.id] = { id: g.id, name: g.name, type: 'gift', price: g.price, lv: 1, desc: '赠予故人，好感 +' + g.fav, fav: g.fav };

const REALMS = ['初出茅庐', '后天', '先天', '化劲', '罡气', '宗师', '大宗师', '天人', '陆地神仙', '破碎虚空'];

function realmOf(level) {
  return REALMS[Math.min(REALMS.length - 1, Math.floor(level / 10))] || REALMS[0];
}

/* 突破 */
function breakHelpers() {
  return NPCS.filter((n) => npcState(n.id).fav >= 60).slice(0, 3);
}

function breakChance() {
  const bonus = breakHelpers().length * 0.1 + ((S.honor || 0) >= 40 ? 0.05 : 0);
  return Math.min(0.9, 0.55 + bonus);
}

function canBreak() {
  return S.level > 0 && S.level % 10 === 9 && S.exp >= expNeed(S.level);
}

function doBreakthrough() {
  if (!canBreak()) return;
  const helpers = breakHelpers();
  if (Math.random() < breakChance()) {
    S.exp = 0;
    S.level += 1;
    S.breakCount = (S.breakCount || 0) + 1;
    S.base.hp += 30;
    S.base.atk += 4;
    S.base.def += 3;
    S.base.agi += 2;
    S.base.mp += 6;
    battle.hp = totalStats().hp;
    battle.mp = totalStats().mp;
    addLog('你冲关成功，境界踏入「' + realmOf(S.level) + '」。', 'gold');
    helpers.forEach((h) => addLog('【' + h.name + '】为你护法，渡你过了这一关。', 'story'));
  } else {
    S.exp = 0;
    if (helpers.length) {
      battle.hp = Math.round(totalStats().hp * 0.7);
      addLog('冲关失败，气血翻涌。', 'bad');
      helpers.forEach((h) => addLog('【' + h.name + '】扶住你，输了一半真气过来。', 'story'));
    } else {
      battle.hp = Math.max(1, battle.hp - totalStats().hp * 0.4);
      addLog('冲关失败，你独自压着内伤。', 'bad');
    }
  }
  save();
  renderAll();
}
const STAGE_LV = [0, 15, 30, 50, 70, 85, 95];
const STAGE_FAV = [0, 20, 40, 60, 80, 90, 95];
const SHOP_REFRESH_MS = 30 * 60 * 1000;

/* 随机奇遇 */
const EVENTS = [
  {
    id: 'wounded',
    title: '路边伤者',
    text: '一名受伤的侠客靠在树下，伤口发黑，像是中了毒。他看见你，张了张嘴。',
    options: [
      { label: '搭救（花 30 两）', cost: 30, effect: { exp: 80, npc: 0 }, reply: '他塞给你半本残页，说是从魔教手里抢的。' },
      { label: '视而不见', effect: { silver: 15 }, reply: '你从他身边走过，脚步没停。' },
    ],
  },
  {
    id: 'oldman',
    title: '白发老者',
    text: '一个白发老头拦在路中央，笑着要跟你赌一局：猜他手里有没有东西。',
    options: [
      { label: '赌（押 50 两）', cost: 50, effect: { gamble: true }, reply: '' },
      { label: '不赌，绕路', effect: { exp: 20 }, reply: '老头笑了一声，说你这人没意思。' },
    ],
  },
  {
    id: 'thief',
    title: '扒手',
    text: '人群里有人贴上来，手指已经碰到了你的钱袋。',
    options: [
      { label: '抓住他', effect: { silver: 40, exp: 30 }, reply: '你反手扣住他的手腕，扒手丢下一把碎银跑了。' },
      { label: '随他去', effect: { silver: -30 }, reply: '钱袋轻了一点。' },
    ],
  },
  {
    id: 'ruins',
    title: '破庙',
    text: '破庙里供着一尊无头神像，香炉里还有半截没烧完的香。',
    options: [
      { label: '上香', effect: { exp: 50, heal: true }, reply: '你拜了三拜，心里的杂念散了些。' },
      { label: '翻香炉', effect: { silver: 60, hp: 15 }, reply: '炉底有几枚铜钱，也有毒虫。' },
    ],
  },
  {
    id: 'sword',
    title: '残剑',
    text: '土里插着一把断了一半的剑，剑柄上缠着褪色的红绳。',
    options: [
      { label: '拔出来', effect: { item: true }, reply: '剑身一颤，竟还有些锋芒。' },
      { label: '不动它', effect: { exp: 25 }, reply: '你给它添了一捧土，走了。' },
    ],
  },
  {
    id: 'rescue',
    title: '官道上的哭喊',
    text: '官道上，一个锦衣恶少拽着姑娘的手腕，家丁围了一圈。姑娘在哭，路过的人都低着头。',
    options: [
      { label: '拔剑', effect: { rescue: 'save' }, reply: '你一剑挑开家丁的棍子。恶少丢下一句狠话，带人跑了。姑娘缩在路边，抬头看你。' },
      { label: '低头走过', effect: { rescue: 'watch' }, reply: '你从人群外走过，哭声被风吹散。' },
      { label: '趁火打劫', effect: { rescue: 'rob' }, reply: '你逼住恶少，搜走他腰间的钱袋。姑娘看着你，眼里的光灭了。' },
    ],
  },
  {
    id: 'revenge',
    title: '巷口伏击',
    text: '恶少的家丁堵在巷口，为首的提着刀：「上次的账，今天算。」',
    options: [
      { label: '迎战', effect: { revenge: 'fight' }, reply: '你把人打散，肩头挨了一刀，但没退。' },
      { label: '破财免灾', effect: { revenge: 'pay' }, reply: '你丢下钱袋，他们笑着走了。' },
    ],
  },
  {
    id: 'swordsong',
    title: '刀剑齐鸣',
    text: '行囊里的倚天与屠龙同时震了一下，像在呼应什么。远处有个穿黄衫的人站在雪里，等你。',
    options: [
      { label: '走过去', effect: { hero: true }, reply: '她只说了一句话：「刀剑合壁，不是让你去争，是让你去守。」' },
      { label: '按住刀柄，远远看着', effect: { exp: 200 }, reply: '雪落下来，她转身走了。' },
    ],
  },
  {
    id: 'huashan',
    title: '华山之巅',
    text: '山顶聚了很多人，说是要论剑。有人递给你一根木剑：「上去试试？」',
    options: [
      { label: '上台', effect: { exp: 500, honor: 8 }, reply: '你连胜三场，最后一招是险胜。' },
      { label: '在下面看', effect: { exp: 150 }, reply: '你看了整夜，看懂了两招。' },
    ],
  },
  {
    id: 'juxian',
    title: '聚贤庄',
    text: '庄里群雄围着一个汉子，说要「讨个公道」。那汉子喝了一碗酒，把碗摔了。',
    options: [
      { label: '站出来', effect: { exp: 400, honor: 10, hp: 20 }, reply: '你和他背靠背，打了一夜。' },
      { label: '退到门外', effect: { exp: 100, honor: -8 }, reply: '你听见里面的刀声，没回头。' },
    ],
  },
  {
    id: 'heimuya',
    title: '黑木崖',
    text: '崖上有个人在绣花，头也不抬：「你来得不巧，我刚绣坏了一针。」',
    options: [
      { label: '拔剑', effect: { exp: 700, honor: 5, hp: 25 }, reply: '你以身法躲过三针，最后一针擦着耳朵过去。' },
      { label: '转身就走', effect: { exp: 200 }, reply: '「聪明。」他在你背后说。' },
    ],
  },
  {
    id: 'jueqing',
    title: '绝情谷',
    text: '谷里开满了花，花瓣上带着刺。有人说这花叫情花，碰了会疼。',
    options: [
      { label: '摘一朵', effect: { item: true, hp: 10 }, reply: '手指被刺了一下，花却很好看。' },
      { label: '绕过去', effect: { exp: 120 }, reply: '你绕了很远，没再回头。' },
    ],
  },
  {
    id: 'xiaoli',
    title: '小李飞刀',
    text: '路边有人喝酒，桌上插着一把很短的刀。他问你：「你猜我会不会出手？」',
    options: [
      { label: '「会。」', effect: { silver: 300, honor: 5 }, reply: '「猜对了。」他把酒推给你，刀不见了。' },
      { label: '「不会。」', effect: { exp: 200 }, reply: '「也对。」他笑了一下，「今天不杀。」' },
    ],
  },
  {
    id: 'chuxiang',
    title: '盗帅留香',
    text: '墙上留了一行字：「借你钱袋一用，三日后还。」字旁边还画了一朵花。',
    options: [
      { label: '追', effect: { silver: 500, honor: 3 }, reply: '三日后果真还了，还多给了一百两。' },
      { label: '算了', effect: { exp: 150 }, reply: '你笑了笑，把墙上的花擦掉了。' },
    ],
  },
];

let bagFilter = { q: 'all', slot: 'all' };
let speedMul = 1;

/* ------------------------------------------------------------ 收集与秘境数据 */

const COLLECTIBLES = [
  { id: 'jade', name: '残破的玉玺', lore: '缺了一角，印面还看得清「受命于天」。', price: 900, weight: 5 },
  { id: 'letter', name: '染血的婚书', lore: '名字被血浸糊了，只剩一个「偕」字。', price: 620, weight: 12 },
  { id: 'tally', name: '半枚兵符', lore: '断口很新，像是有人故意掰开的。', price: 780, weight: 8 },
  { id: 'tassel', name: '无名剑穗', lore: '穗子编得很细，主人应当很爱惜那把剑。', price: 380, weight: 18 },
  { id: 'bell', name: '哑了的铜铃', lore: '摇不出声，铃舌上刻着一个「归」字。', price: 450, weight: 14 },
  { id: 'mask', name: '魔教铁面', lore: '内侧有牙印，戴它的人死前咬过自己。', price: 660, weight: 10 },
  { id: 'scroll', name: '半卷河山图', lore: '只画了半壁江山，另一半被人撕走。', price: 1200, weight: 4 },
  { id: 'hairpin', name: '赤金步摇', lore: '宫里的东西，怎么会在乱葬岗。', price: 540, weight: 15 },
];

const SETS = [
  {
    id: 'qingfeng', name: '青锋套',
    pieces: ['青锋剑', '青锋甲', '青锋冠', '青锋靴', '青锋戒'],
    b2: '攻击 +8%', b4: '暴击伤害 +25%', b5: '暴击 +5%',
    m2: { atkPct: 0.08 }, m4: { critDmg: 25 }, m5: { crit: 5 },
  },
  {
    id: 'xuantie', name: '玄铁套',
    pieces: ['玄铁刀', '玄铁甲', '玄铁盔', '玄铁靴', '玄铁令'],
    b2: '防御 +12%', b4: '伤害减免 +8%', b5: '气血 +10%',
    m2: { defPct: 0.12 }, m4: { dmgReduce: 8 }, m5: { hpPct: 0.1 },
  },
  {
    id: 'tiancan', name: '天蚕套',
    pieces: ['天蚕剑', '天蚕衣', '天蚕冠', '天蚕履', '天蚕带'],
    b2: '气血 +8%', b4: '闪避 +5%', b5: '攻击 +10%',
    m2: { hpPct: 0.08 }, m4: { dodge: 5 }, m5: { atkPct: 0.1 },
  },
  {
    id: 'xuemo', name: '血魔套',
    pieces: ['血魔刃', '血魔袍', '血魔盔', '血魔靴', '血魔戒'],
    b2: '吸血 +4%', b4: '攻击 +10%', b5: '暴击伤害 +30%',
    m2: { lifesteal: 4 }, m4: { atkPct: 0.1 }, m5: { critDmg: 30 },
  },
  {
    id: 'nightrunner', name: '夜行者套',
    pieces: ['夜行者刃', '夜行者衣', '夜行者目镜', '夜行者靴', '夜行者环'],
    b2: '闪避 +4%', b4: '暴击 +4%', b5: '攻击 +12%',
    m2: { dodge: 4 }, m4: { crit: 4 }, m5: { atkPct: 0.12 },
  },
  {
    id: 'lanruo', name: '兰若套',
    pieces: ['兰若剑', '兰若衣', '兰若冠', '兰若履', '兰若铃'],
    b2: '暴击 +3%', b4: '闪避 +4%', b5: '攻击 +10%',
    m2: { crit: 3 }, m4: { dodge: 4 }, m5: { atkPct: 0.1 },
  },
];

const LEGENDARIES = [
  {
    id: 'longyuan', name: '龙渊', slot: 'weapon',
    desc: '对首领伤害 +20%，暴击时回复 5 点内力。',
    base: { atk: 46 }, affixes: [{ k: 'crit', v: 6 }, { k: 'critDmg', v: 20 }],
    bossDamage: 0.2, critMp: 5, ilvl: 60,
  },
  {
    id: 'yitian', name: '倚天剑', slot: 'weapon',
    desc: '对首领伤害 +15%，暴击时回复 4 点内力。',
    base: { atk: 44 }, affixes: [{ k: 'crit', v: 8 }, { k: 'critDmg', v: 18 }],
    bossDamage: 0.15, critMp: 4, ilvl: 70,
  },
  {
    id: 'tulong', name: '屠龙刀', slot: 'weapon',
    desc: '对首领伤害 +20%，吸血 +4%。',
    base: { atk: 52 }, affixes: [{ k: 'lifesteal', v: 4 }],
    bossDamage: 0.2, critMp: 0, ilvl: 70,
  },
  {
    id: 'xuantiejia', name: '玄铁重甲', slot: 'armor',
    desc: '对首领伤害 +10%，受伤 -6%。',
    base: { def: 36, hp: 60 }, affixes: [{ k: 'dmgReduce', v: 6 }],
    bossDamage: 0.1, critMp: 0, ilvl: 70,
  },
  {
    id: 'linglong', name: '玲珑佩', slot: 'accessory',
    desc: '暴击时回复 3 点内力。',
    base: { hp: 70 }, affixes: [{ k: 'crit', v: 5 }, { k: 'dodge', v: 3 }],
    bossDamage: 0, critMp: 3, ilvl: 70,
  },
];

const MANUALS = [
  { id: 'taixuan', name: '《太玄经》', desc: '攻击 +2%（永久）', mods: { atkPct: 0.02 } },
  { id: 'candao', name: '《残刀诀》', desc: '暴击伤害 +5%（永久）', mods: { critDmg: 5 } },
  { id: 'tingfeng', name: '《听风录》', desc: '闪避 +2%（永久）', mods: { dodge: 2 } },
  { id: 'jiuyang', name: '《九阳神功》', desc: '气血 +5%（永久）', mods: { hpPct: 0.05 } },
  { id: 'lingbo', name: '《凌波微步》', desc: '闪避 +3%（永久）', mods: { dodge: 3 } },
  { id: 'jiuyin', name: '《九阴真经》', desc: '攻击 +3%（永久）', mods: { atkPct: 0.03 } },
];

/* 群侠录（致敬） */
const HEROES = [
  { id: 'zhangwuji', name: '张无忌', lv: 20, desc: '明教教主。武功极高，最怕的却是做决定。' },
  { id: 'zhaomin', name: '赵敏', lv: 20, desc: '绍敏郡主。算无遗策，唯独算不准自己会喜欢谁。' },
  { id: 'zhouzhiruo', name: '周芷若', lv: 30, desc: '峨眉掌门。温柔是真的，狠也是真的。' },
  { id: 'xiaofeng', name: '萧峰', lv: 30, desc: '丐帮帮主。一掌能开山，却护不住想护的人。' },
  { id: 'duanyu', name: '段誉', lv: 10, desc: '大理世子。不会武功，偏偏运气好得离谱。' },
  { id: 'xuzhu', name: '虚竹', lv: 10, desc: '少林小僧。不想争，什么却都落到了他头上。' },
  { id: 'linghuchong', name: '令狐冲', lv: 40, desc: '华山弟子。酒比剑好，朋友比命重。' },
  { id: 'renyingying', name: '任盈盈', lv: 40, desc: '日月神教圣姑。会弹琴，也会杀人。' },
  { id: 'yangguo', name: '杨过', lv: 50, desc: '神雕大侠。断了一条手臂，走完了十六年。' },  { id: 'xiaolongnv', name: '小龙女', lv: 50, desc: '古墓派传人。话很少，剑很快。' },
  { id: 'guojing', name: '郭靖', lv: 60, desc: '襄阳守将。笨，所以认死理；认了死理，就不退。' },
  { id: 'huangrong', name: '黄蓉', lv: 60, desc: '丐帮帮主。聪明得让人头疼，偏又心软。' },
  { id: 'dongfang', name: '东方不败', lv: 80, desc: '日月神教教主。绣花针比刀快，也躲不开。' },
  { id: 'yuebuqun', name: '岳不群', lv: 70, desc: '华山掌门。君子剑，剑是假的，君子也是。' },
  { id: 'huangshan', name: '黄衫女', lv: 1, desc: '古墓后人。一身黄衫，来去如雪。' },
];

/* 称号 */
const TITLES = [
  { id: 'firstblood', name: '初出茅庐', desc: '第一次杀人', mods: { atkPct: 0.01 }, cond: () => S.stats.kills >= 1 },
  { id: 'hunter', name: '百人斩', desc: '击杀 100', mods: { atkPct: 0.02 }, cond: () => S.stats.kills >= 100 },
  { id: 'tiger', name: '伏虎', desc: '击败 10 个首领', mods: { atkPct: 0.03 }, cond: () => S.bossCount >= 10 },
  { id: 'hero', name: '侠名远播', desc: '侠义 ≥60', mods: { hpPct: 0.05 }, cond: () => (S.honor || 0) >= 60 },
  { id: 'villain', name: '恶名昭彰', desc: '恶名 ≤-60', mods: { atkPct: 0.05, hpPct: -0.03 }, cond: () => (S.honor || 0) <= -60 },
  { id: 'reborn', name: '轮回者', desc: '转生一次', mods: { expPct: 0.05 }, cond: () => (S.rebirth || 0) >= 1 },
  { id: 'collector', name: '拾遗', desc: '奇物 ≥5', mods: { drop: 0.03 }, cond: () => Object.keys(S.relics || {}).length >= 5 },
  { id: 'lover', name: '有家室的人', desc: '成婚 ≥1', mods: { hpPct: 0.05 }, cond: () => (S.spouses || []).length >= 1 },
  { id: 'realm', name: '天人', desc: '境界 70 级', mods: { hpPct: 0.08, atkPct: 0.08 }, cond: () => S.level >= 70 },
  { id: 'curator', name: '藏家', desc: '图鉴 100%', mods: { drop: 0.05 }, cond: () => codexProgress() >= 1 },
];

const CODEX_REWARDS = [
  { p: 0.25, silver: 3000, tokens: 2 },
  { p: 0.5, silver: 8000, tokens: 3 },
  { p: 0.75, silver: 20000, tokens: 3 },
  { p: 1, silver: 50000, tokens: 5 },
];

function checkCodexRewards() {
  const p = codexProgress();
  let changed = false;
  for (const r of CODEX_REWARDS) {
    const key = String(r.p);
    if (p < r.p || (S.codexClaimed || []).includes(key)) continue;
    S.codexClaimed.push(key);
    S.silver += r.silver;
    S.tokens = Math.min(20, (S.tokens || 0) + r.tokens);
    addLog('图鉴达到 ' + Math.round(r.p * 100) + '%，奖励 ' + r.silver + ' 两、' + r.tokens + ' 枚挑战令。', 'gold');
    changed = true;
  }
  if (changed) save();
}

function titleMods() {
  const t = TITLES.find((x) => x.id === S.title);
  return (t && t.mods) || {};
}

function relicMods() {
  const o = {};
  for (const id of Object.keys(S.relics || {})) {
    const r = RELICS.find((x) => x.id === id);
    if (!r || !r.mods) continue;
    const cnt = (S.relicCount && S.relicCount[id]) || 1;
    const factor = 1 + Math.max(0, cnt - 1) * 0.1;
    for (const k of Object.keys(r.mods)) o[k] = (o[k] || 0) + r.mods[k] * factor;
  }
  return o;
}

function relicEffect(r) {
  const m = r.mods || {};
  const parts = [];
  if (m.atkPct) parts.push('攻击+' + (m.atkPct * 100).toFixed(1) + '%');
  if (m.hpPct) parts.push('气血+' + (m.hpPct * 100).toFixed(1) + '%');
  if (m.defPct) parts.push('防御+' + (m.defPct * 100).toFixed(1) + '%');
  if (m.agiPct) parts.push('身法+' + (m.agiPct * 100).toFixed(1) + '%');
  if (m.crit) parts.push('暴击+' + m.crit + '%');
  if (m.dodge) parts.push('闪避+' + m.dodge + '%');
  if (m.drop) parts.push('掉落+' + (m.drop * 100).toFixed(1) + '%');
  if (m.expPct) parts.push('经验+' + (m.expPct * 100).toFixed(1) + '%');
  if (m.silverPct) parts.push('银两+' + (m.silverPct * 100).toFixed(1) + '%');
  return parts.join(' · ');
}

/* ------------------------------------------------------------ 赞助激活码 */
const CODE_SECRET = 'wuxia-afdian-2026-7f3a';
const CODE_TIERS = {
  '06': { price: 6, silver: 2000, tokens: 10, title: { id: 'friend', name: '江湖旧友', mods: { atkPct: 0.01 } } },
  '18': {
    price: 18, silver: 3000,
    title: { id: 'winefriend', name: '知交', mods: { hpPct: 0.01 } },
    relic: { id: 'gourd', name: '旧友酒葫芦', desc: '葫芦上刻着一个歪歪扭扭的「谢」字，不知道是谁刻的。' },
    pet: 'qingque',
  },
  '32': {
    price: 32, tokens: 5,
    title: { id: 'fellow', name: '同路人', mods: { hpPct: 0.02 } },
    weapon: { name: '旧友剑', affixes: [{ k: 'atk', v: 14 }, { k: 'crit', v: 3 }] },
  },
  '64': {
    price: 64, silver: 5000, pages: 5,
    title: { id: 'guest', name: '座上宾', mods: { atkPct: 0.01, hpPct: 0.01 } },
    relic: { id: 'letter', name: '故人笺', desc: '一封没有署名的信，只写了一句「江湖路远，保重」。' },
  },
  '99': {
    silver: 20000, tokens: 5,
    title: { id: 'zhiji', name: '生死之交', mods: { atkPct: 0.02, hpPct: 0.02, drop: 0.02 } },
    relic: { id: 'friendtoken', name: '旧友的信物', desc: '一枚磨得发亮的铜扣，背面刻着两个人的名字缩写。' },
  },
};

function codeHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function codeSig(tier, serial) {
  const h = codeHash(CODE_SECRET + '|' + tier + '|' + serial);
  return h.toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

function ensureTitle(def) {
  if (TITLES.some((t) => t.id === def.id)) return;
  TITLES.push({ id: def.id, name: def.name, desc: '赞助礼包', mods: def.mods || {}, cond: () => true });
}

function ensureRelic(def) {
  if (RELICS.some((r) => r.id === def.id)) return;
  RELICS.push({ id: def.id, name: def.name, desc: def.desc });
}

function redeemCode(raw) {
  const code = String(raw || '').trim().toUpperCase();
  const m = /^WX-(\d{2})-(\d{4})-([A-Z0-9]{6})$/.exec(code);
  if (!m) return { ok: false, msg: '格式不对，应该是 WX-32-0007-XXXXXX 这种' };
  const tier = m[1];
  const serial = m[2];
  const sig = m[3];
  const conf = CODE_TIERS[tier];
  if (!conf) return { ok: false, msg: '没有这个档位' };
  if (codeSig(tier, serial) !== sig) return { ok: false, msg: '码无效，检查一下有没有打错' };
  if ((S.redeemed || []).includes(code)) return { ok: false, msg: '这个码已经兑换过了' };

  const gained = [];
  if (conf.silver) { S.silver += conf.silver; gained.push(conf.silver + ' 两'); }
  if (conf.tokens) { S.tokens = Math.min(20, (S.tokens || 0) + conf.tokens); gained.push(conf.tokens + ' 枚挑战令'); }
  if (conf.title) {
    ensureTitle(conf.title);
    if (!S.titles.includes(conf.title.id)) S.titles.push(conf.title.id);
    S.title = conf.title.id;
    gained.push('称号「' + conf.title.name + '」');
  }
  if (conf.relic) {
    ensureRelic(conf.relic);
    S.relics[conf.relic.id] = true;
    gained.push('奇物「' + conf.relic.name + '」');
  }
  if (conf.pet) {
    if (!S.pets[conf.pet]) S.pets[conf.pet] = { level: 1 };
    if (!S.petActive) S.petActive = conf.pet;
    const p = PETS.find((x) => x.id === conf.pet);
    if (!p) {
      PETS.push({ id: conf.pet, name: '青雀', desc: '气血 +3%，飞得不高，但总在你肩上。', mods: { hpPct: 0.03 } });
    }
    gained.push('宠物「青雀」');
  }
  if (conf.weapon) {
    const it = generateItem('weapon', Math.max(10, S.level), QUALITIES.find((q) => q.k === 'orange'));
    it.name = conf.weapon.name;
    it.qname = '赞助';
    it.sponsor = true;
    it.affixes = conf.weapon.affixes.slice();
    S.bag.push(it);
    gained.push('武器「' + conf.weapon.name + '」');
  }
  if (conf.pages) {
    for (let i = 0; i < conf.pages; i++) dropManualPage();
    gained.push(conf.pages + ' 张残页');
  }
  S.redeemed.push(code);
  addLog('兑换成功：' + gained.join('、') + '。', 'gold');
  save();
  renderAll();
  return { ok: true, msg: '兑换成功', gained };
}

/* 悬赏 */
const BOUNTY_POOL = [
  { id: 'kill', n: 40, text: (n) => '击杀 ' + n + ' 个敌人' },
  { id: 'kill', n: 80, text: (n) => '击杀 ' + n + ' 个敌人' },
  { id: 'boss', n: 1, text: () => '击败 1 个首领' },
  { id: 'dungeon', n: 1, text: () => '通关 1 次秘境' },
  { id: 'sect', n: 1, text: () => '门派切磋赢 1 场' },
];

function ensureBounty() {
  const d = todayKey();
  if (S.bounty && S.bounty.date === d && (S.bounty.list || []).length) return;
  const pool = BOUNTY_POOL.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  S.bounty = { date: d, list: pool.map((b) => ({ id: b.id, n: b.n })), prog: {}, claimed: [] };
  save();
}

function bountyAdd(id, n) {
  ensureBounty();
  S.bounty.prog[id] = (S.bounty.prog[id] || 0) + (n || 1);
}

function bountyText(b) {
  const t = BOUNTY_POOL.find((x) => x.id === b.id && x.n === b.n);
  return t ? t.text(b.n) : b.id;
}

function claimBounty(idx) {
  ensureBounty();
  const b = S.bounty.list[idx];
  if (!b) return;
  const prog = S.bounty.prog[b.id] || 0;
  if (prog < b.n) return;
  if (S.bounty.claimed.includes(idx)) return;
  S.bounty.claimed.push(idx);
  S.silver += 800;
  S.exp += 400;
  S.tokens = Math.min(20, (S.tokens || 0) + 1);
  addLog('悬赏完成：' + bountyText(b) + '。得 800 两、400 经验、1 枚挑战令。', 'gold');
  save();
  renderAll();
}

function panelBounty() {
  ensureBounty();
  let html = '<h3>悬赏</h3><div class="muted">每天 3 件，自然日重置。' + S.bounty.date + '</div>';
  html += S.bounty.list.map((b, i) => {
    const prog = Math.min(S.bounty.prog[b.id] || 0, b.n);
    const done = prog >= b.n;
    const claimed = S.bounty.claimed.includes(i);
    return '<div class="item"><div class="row"><span>' + bountyText(b) + '</span>' +
      '<span>' + (claimed ? '<span class="muted">已领</span>' : (done ? '<button data-bounty="' + i + '">领取</button>' : prog + ' / ' + b.n)) + '</span></div></div>';
  }).join('');
  return html;
}

/* 榜单奖励 */
const BOARD_REWARDS = [
  { id: 'chivalry', name: '侠客榜第一', need: () => (S.honor || 0) >= 90 },
  { id: 'villain', name: '恶人榜第一', need: () => (S.honor || 0) <= -90 },
  { id: 'fairy', name: '仙子榜第一', need: () => NPCS.some((n) => npcState(n.id).fav >= 100) },
];

function claimBoard(id) {
  const r = BOARD_REWARDS.find((x) => x.id === id);
  if (!r || !r.need()) return;
  if (S.boardClaimed.includes(id)) return;
  S.boardClaimed.push(id);
  S.silver += 20000;
  S.exp += 2000;
  addLog('你登上了' + r.name + '，得 20000 两。', 'gold');
  save();
  renderAll();
}

/* 宠物进化 */
function evolvePet(id) {
  const pet = S.pets[id];
  if (!pet) return;
  if (pet.level < 10) { addLog('要到 10 级才能进化。', 'bad'); return; }
  if (pet.evo) { addLog('已经进化过了。', 'sys'); return; }
  if (S.silver < 3000) { addLog('银两不够（需 3000）。', 'bad'); return; }
  S.silver -= 3000;
  pet.evo = 1;
  addLog(PETS.find((p) => p.id === id).name + '进化了，气息都不一样了。', 'gold');
  save();
  renderAll();
}
const RELICS = [
  { id: 'pistol', name: '旧式手枪', mods: { atkPct: 0.005 }, desc: '枪身有划痕，弹仓里还剩一发。你不知道这玩意在江湖上能换几条命。' },
  { id: 'lighter', name: '铜打火机', mods: { crit: 0.5 }, desc: '盖子有点松，一按就着。火苗是蓝的。' },
  { id: 'charm', name: '断裂的挂件', mods: { dodge: 0.5 }, desc: '一枚小小的银色挂件，链子断了一半，背面刻着看不清的字。' },
  { id: 'heel', name: '红色高跟鞋', mods: { agiPct: 0.005 }, desc: '鞋跟很高，鞋面保养得很好，像是主人很爱惜。' },
  { id: 'stocking', name: '黑色丝袜', mods: { hpPct: 0.005 }, desc: '叠得整整齐齐，收在一只盒子里，盒子上有一点香水味。' },
  { id: 'badge', name: '染血的徽章', mods: { defPct: 0.005 }, desc: '一枚金属徽章，图案是伞和盾。' },
  { id: 'tape', name: '半盘磁带', mods: { expPct: 0.01 }, desc: '没有能放它的东西，你只能听见里面沙沙的响。' },
  { id: 'photo', name: '模糊的合影', mods: { drop: 0.005 }, desc: '照片上的人脸都看不清，只剩一排笑。' },
  { id: 'cyberpart', name: '义体零件', mods: { atkPct: 0.005 }, desc: '一小截金属关节，摸上去还有余温。' },
  { id: 'neonsign', name: '霓虹灯牌', mods: { drop: 0.01 }, desc: '巴掌大的灯牌，蓝紫色，接上电还能亮。' },
  { id: 'chip', name: '数据芯片', mods: { expPct: 0.01 }, desc: '指甲盖大小的芯片，边缘刻着一串编号。' },
  { id: 'ada_photo', name: '一张旧照片', mods: { crit: 1 }, desc: '红衣女人侧着身，脸被窗外的光挡住了。背面用钢笔写着「别找我」——落款是艾达。' },
  { id: 'ada_card', name: '唇印名片', mods: { dodge: 1 }, desc: '黑色名片上只有一个号码，角落印着一个淡红的唇印。艾达见你时没说话，只把这张放下就走了。' },
  { id: 'ada_red', name: '红色内衣', adult: true, mods: { hpPct: 0.008 }, desc: '叠得整整齐齐的红色内衣，压在一只纸盒底下，像是来不及带走。上面还留着艾达的味道。' },
  { id: 'bulma_stocking', name: '布尔玛的丝袜', adult: true, mods: { dodge: 0.5 }, desc: '一双白色蕾丝长袜，叠在胶囊公司行李箱的夹层里。' },
  { id: 'bulma_bra', name: '布尔玛的胸罩', adult: true, mods: { hpPct: 0.005 }, desc: '粉色系带款，搭扣上刻着一个小小的「B」。' },
  { id: 'bulma_camisole', name: '布尔玛的吊带', adult: true, mods: { crit: 0.5 }, desc: '黑色蕾丝吊带，肩带细得几乎看不见。' },
  { id: 'turtle_gi', name: '龟仙流战斗服', mods: { defPct: 0.008 }, desc: '橙色的龟仙流道服，背后一个「龟」字，洗得发白。' },
  { id: 'piccolo_gi', name: '比克的战斗服', mods: { hpPct: 0.006, atkPct: 0.004 }, desc: '深紫色战斗服，肩甲上有魔族的纹路。' },
  { id: 'kinto', name: '筋斗云', mods: { dodge: 1 }, desc: '一团会飞的黄云，踩上去软绵绵的，只肯载心地干净的人。' },
  { id: 'senzu', name: '仙豆', mods: { hpPct: 0.01 }, desc: '一颗绿色的小豆子，据说吃下去能让人瞬间恢复。' },
  { id: 'radar', name: '龙珠雷达', mods: { drop: 0.01 }, desc: '圆盘形的小雷达，屏幕上有一个闪烁的光点。' },
  { id: 'lucy_foot', name: '露西的足部写真', adult: true, mods: { dodge: 0.5 }, desc: '一张霓虹灯下的照片，穿黑色作战靴的脚踩在湿漉漉的天台上。背面是露西的笔迹：「别放大看。」' },
  { id: 'lucy_kiss', name: '露西的拥吻', mods: { crit: 1 }, desc: '不是照片，是一段记忆碎片。雨里她突然凑近，吻很轻，霓虹在你们之间闪了一下就灭了。' },
  { id: 'lucy_blood', name: '露西的体液', adult: true, mods: { atkPct: 0.005 }, desc: '一支封好的采样管，标签上只写了编号和日期。是汗还是别的什么，她没说。' },
  { id: 'lq_portrait', name: '聂小倩的画像', mods: { dodge: 0.6 }, desc: '一幅没有落款的仕女图，画中人一直在看你。' },
  { id: 'lq_talisman', name: '燕赤霞的符纸', mods: { crit: 0.8 }, desc: '黄纸朱砂，边角烧焦了。捏在手里是温的。' },
  { id: 'lq_treeheart', name: '姥姥的树心', mods: { hpPct: 0.006 }, desc: '一段乌黑的木心，断口渗着汁液，像还没死透。' },
  { id: 'lq_bell', name: '兰若寺的铜铃', mods: { drop: 0.008 }, desc: '铃身刻满经文，摇起来却没有声音。' },
];

/* 女性角色专属奇物：内裤 / 胸罩 / 唾液 / 丝袜 */
const FEMALE_LIST = [
  ['axiu', '阿绣'], ['shen', '沈青霜'], ['longnv', '小龙女'], ['wangyuyan', '王语嫣'],
  ['zhaomin', '赵敏'], ['zhiruo', '周芷若'], ['huangrong', '黄蓉'], ['yingying', '任盈盈'],
  ['liqiushui', '李秋水'], ['licanghai', '李沧海'], ['liu', '柳三娘'], ['aheng', '阿蘅'],
  ['qin', '秦照'], ['yan', '燕七'], ['su2', '苏娘子'], ['lucy', '露西'],
];
for (const [fid, fname] of FEMALE_LIST) {
  RELICS.push(
    { id: fid + '_panty', name: fname + '的内裤', adult: true, mods: { hpPct: 0.0008 }, desc: '叠得整整齐齐的一条，收在箱底。' },
    { id: fid + '_bra', name: fname + '的胸罩', adult: true, mods: { defPct: 0.0008 }, desc: '蕾丝边的，尺码正好。' },
    { id: fid + '_saliva', name: fname + '的唾液', adult: true, mods: { atkPct: 0.0008 }, desc: '一支封好的采样管，标签上写着她的名字。' },
    { id: fid + '_stocking', name: fname + '的丝袜', adult: true, mods: { dodge: 0.15 }, desc: '一双穿过的丝袜，叠得很整齐。' },
  );
}

if (SAFE_MODE) {
  for (let i = RELICS.length - 1; i >= 0; i--) {
    if (RELICS[i].adult) RELICS.splice(i, 1);
  }
}

const OVERWORLDS = [
  { id: 'zombie', name: '尸潮小镇', mobs: ['丧尸', '舔食者'], boss: '暴君', desc: '空气里有铁锈味，远处有脚步声。' },
  { id: 'neon', name: '霓虹夜城', floors: 9, mobs: ['械卫', '义体猎手'], boss: '亚当·重锤', desc: '雨夜，满城的灯牌，没有人。荒坂塔的灯还亮着，像一只睁着的眼睛。' },
  {
    id: 'dragonball', name: '龙珠·拉蒂兹来袭', floors: 10,
    mobs: ['红缎带军士兵', '红缎带军上尉', '桃白白', '天津饭', '少年悟空', '比克大魔王', '成年比克', '孙悟饭', '栽培人'],
    boss: '拉蒂兹',
    desc: '天空裂开一道口子，一个留着长发的男人落在田里。他说，他是来带走一个孩子的。',
  },
  {
    id: 'liaozhai', name: '聊斋·兰若寺', floors: 8,
    mobs: ['巡夜鬼', '纸人', '画皮', '狐妖', '摄魂鬼', '守寺尸', '树妖'],
    boss: '树妖姥姥',
    desc: '破寺里点着一盏不肯灭的灯。风里有脂粉味，也有腐烂的木头味。',
  },
];

const DB_FLOORS = ['红缎带军士兵', '红缎带军上尉', '桃白白', '天津饭', '少年悟空', '比克大魔王', '成年比克', '孙悟饭', '栽培人', '拉蒂兹'];

const NEON_FLOORS = ['街头混混', '公司安保', '义体猎手', '网络黑客', '荒坂特工', '暴走族头目', '装甲佣兵', '荒坂塔守卫', '亚当·重锤'];

const LIAO_FLOORS = ['巡夜鬼', '纸人', '画皮', '狐妖', '摄魂鬼', '守寺尸', '树妖', '树妖姥姥'];

/* 轮回天赋 */
const TALENTS = [
  { id: 'jianxin', name: '剑心', desc: '暴击率 +8%，气血 -10%', mods: { crit: 8, hpPct: -0.1 } },
  { id: 'tiegu', name: '铁骨', desc: '受到伤害 -10%', mods: { dmgReduce: 10 } },
  { id: 'tianji', name: '天机', desc: '掉落率 +15%，经验 -5%', mods: { drop: 0.15, expPct: -0.05 } },
  { id: 'fuyuan', name: '福缘', desc: '银两 +30%', mods: { silverPct: 0.3 } },
  { id: 'guxing', name: '孤星', desc: '无队友时攻击 +15%', mods: { atkPctIfNoComp: 0.15 } },
  { id: 'changming', name: '长明', desc: '气血 +12%', mods: { hpPct: 0.12 } },
  { id: 'jiban', name: '羁绊', desc: '每位结缘的故人：攻击 +2%、气血 +2%（最多 10 位）', dyn: 'bonds' },
];

/* 宠物 */
const PETS = [
  { id: 'wolf', name: '狼', desc: '攻击 +6%（每级 +10%）', mods: { atkPct: 0.06 } },
  { id: 'dog', name: '狗', desc: '气血 +8%（每级 +10%）', mods: { hpPct: 0.08 } },
  { id: 'cat', name: '猫', desc: '闪避 +3%（每级 +10%）', mods: { dodge: 3 } },
  { id: 'eagle', name: '鹰', desc: '暴击率 +4%（每级 +10%）', mods: { crit: 4 } },
  { id: 'sparrow', name: '麻雀', desc: '掉落率 +8%（每级 +10%）', mods: { drop: 0.08 } },
];

/* 队友/配偶加成 */
const ALLY_BONUS = {
  axiu: { hpPct: 0.05 },
  shen: { crit: 5 },
  su: { expPct: 0.1 },
  liu: { drop: 0.1 },
  lu: { defPct: 0.1 },
  aheng: { hpPct: 0.04 },
  qin: { crit: 4 },
  yan: { dodge: 3 },
  su2: { hpPct: 0.05 },
  longnv: { dodge: 3 },
  wangyuyan: { expPct: 0.08 },
  zhaomin: { crit: 4 },
  liqiushui: { atkPct: 0.05 },
  licanghai: { hpPct: 0.05 },
  zhiruo: { crit: 3 },
  huangrong: { dodge: 4 },
  yingying: { expPct: 0.08 },
  susu: { crit: 3 },
  lucy: { dodge: 4, crit: 3 },
};

/* 醉月楼（银两消耗） */
const BROTHEL = [
  { id: 'wine', name: '喝一壶', price: 50, desc: '回满气血', scene: '掌柜给你烫了一壶酒，温得刚好。' },
  { id: 'music', name: '听一曲', price: 120, desc: '经验 +15%，30 分钟', buff: { expPct: 0.15 }, scene: '姑娘抱琴坐在帘后，一曲终了，你忘了催更。' },
  { id: 'dance', name: '看一支舞', price: 300, desc: '掉落 +15%，30 分钟', buff: { drop: 0.15 }, scene: '灯影里有人起舞，袖子扫过你的酒盏。' },
  { id: 'top', name: '点花魁', price: 1000, desc: '经验/掉落/银两 +20%，30 分钟', buff: { expPct: 0.2, drop: 0.2, silverPct: 0.2 }, scene: '花魁只陪你说了半宿话，什么都说了，又什么都没说。' },
];

/* 衣饰：攻略后由角色相赠，不售卖 */
const CLOTHES = [
  { id: 'cl_longnv', name: '冰蚕丝袜', from: 'longnv', desc: '古墓里养的冰蚕吐的丝，素白，触手生凉。' },
  { id: 'cl_yuyan', name: '曼陀罗袜', from: 'wangyuyan', desc: '袜口绣着曼陀罗，是她在琅嬛玉洞照着图谱描的。' },
  { id: 'cl_zhaomin', name: '绿柳丝袜', from: 'zhaomin', desc: '墨绿色，绿柳庄的染坊亲手染的。' },
  { id: 'cl_qiushui', name: '西夏暗纹', from: 'liqiushui', desc: '光下才看得见花纹，是西夏王宫的旧物。' },
  { id: 'cl_canghai', name: '薄雾纱袜', from: 'licanghai', desc: '薄得像雾，她说这东西本不该属于这个时代。' },
  { id: 'cl_zhiruo', name: '峨眉素袜', from: 'zhiruo', desc: '峨眉山上织的，素净，袜口绣着一朵小小的莲花。' },
  { id: 'cl_rong', name: '杏黄丝袜', from: 'huangrong', desc: '桃花岛的杏黄，她自己在院子里染的。' },
  { id: 'cl_ying', name: '黑纱袜', from: 'yingying', desc: '日月神教的玄色，她说穿这个好走路。' },
  { id: 'cl_susu', name: '朱红丝袜', from: 'susu', desc: '天鹰教的朱红，她穿着走过很多刀口。' },
  { id: 'cl_lucy', name: '露西的发带', from: 'lucy', desc: '一条洗旧的深色发带，末端缝着一小片反光布，在夜里会亮。' },
];

/* 门派地图 */
const SECTS = [
  { id: 'shaolin', name: '少林寺', lv: 20, master: '扫地僧', req: 900, exp: 600, silver: 200, honor: 6, teach: 'yijin', teachPrice: 3000, desc: '藏经阁里扫地的老僧，扫了几十年。' },
  { id: 'wudang', name: '武当山', lv: 30, master: '张三丰', req: 1800, exp: 900, silver: 300, honor: 6, teach: 'taiji', teachPrice: 3000, desc: '太极圆转，以柔克刚。' },
  { id: 'emei', name: '峨眉山', lv: 35, master: '灭绝师太', req: 2600, exp: 1200, silver: 400, honor: 4, teach: 'emeijian', teachPrice: 3000, desc: '剑法凌厉，门规极严。' },
  { id: 'huashan', name: '华山派', lv: 40, master: '岳不群', req: 3600, exp: 1600, silver: 600, honor: 0, teach: 'huashanxin', teachPrice: 3000, desc: '君子剑的名头，比剑还响。' },
  { id: 'gaibang', name: '丐帮', lv: 45, master: '洪七公', req: 4800, exp: 2000, silver: 800, honor: 8, teach: 'xianglong', teachPrice: 3000, desc: '降龙十八掌，一掌一江湖。' },
  { id: 'mingjiao', name: '光明顶', lv: 60, master: '张无忌', req: 7000, exp: 3000, silver: 1200, honor: 10, teach: 'shenghuo', teachPrice: 3000, desc: '明教总坛，圣火不熄。' },
];

const DUNGEON_MODS = [
  { id: 'enemy', name: '敌强', desc: '敌人属性 +40%', mult: 1.4, reward: 1.5 },
  { id: 'nopotion', name: '禁药', desc: '本层无法使用药品', mult: 1.0, reward: 1.8, noPotion: true },
  { id: 'swift', name: '疾风', desc: '敌人攻击 +25%，速度更快', mult: 1.25, reward: 1.4 },
  { id: 'plain', name: '无华', desc: '敌人的防御翻倍', mult: 1.0, defMult: 2, reward: 1.35 },
];

/* ------------------------------------------------------------ 数据：故人 */

const NPCS = [
  {
    id: 'axiu', name: '阿绣', mapIndex: 0, minLevel: 1, faction: 'neutral',
    title: '青石村的绣娘',
    stages: [
      {
        min: 0, name: '陌生',
        lines: [{
          text: '阿绣在村口缝一件血衣，针脚很稳。她抬头看你：「你也要出村？」',
          options: [
            { label: '「山外有山，我想去看看。」', fav: 6, reply: '她低头咬断线头：「活着回来，我给你补衣裳。」' },
            { label: '「与你无关。」', fav: -2, reply: '她没生气，只把血衣叠好：「那便算了。」' },
          ],
        }],
      },
      {
        min: 30, name: '相识',
        lines: [{
          text: '她把一碗热汤推到你面前，汤里飘着两片野菜：「听说你在黑风寨杀了人。」',
          options: [
            { label: '「杀的是该杀的人。」', fav: 6, reply: '她点头：「那就好。我怕你夜里睡不着。」' },
            { label: '「不多。」', fav: 3, reply: '她笑了一下，笑意没到眼底。' },
          ],
        }],
      },
      {
        min: 60, name: '熟络',
        lines: [{
          text: '阿绣给你缝的护腕里侧绣了一个小小的「安」字。她说：「别给人看。」',
          options: [
            { label: '「你也别给人看。」', fav: 8, reply: '她耳根红了，转身去收针线。' },
            { label: '「多谢。」', fav: 4, reply: '「谢什么，」她说，「你活着，我就当没白缝。」' },
          ],
        }],
      },
      {
        min: 90, name: '知己',
        lines: [{
          text: '皇城的事传回青石村。她坐在门槛上等你，手里那盏灯快烧尽了。',
          options: [
            { label: '「我回来了。」', fav: 10, reply: '她没说话，只把那盏灯递给你——灯还亮着。' },
            { label: '「以后不走了。」', fav: 10, reply: '「说话算话。」她终于哭了。' },
          ],
        }],
      },
    ],
  },
  {
    id: 'shen', name: '沈青霜', mapIndex: 1, minLevel: 11, faction: 'good',
    title: '落霞镇的镖师',
    stages: [
      {
        min: 0, name: '陌生',
        lines: [{
          text: '沈青霜把断刀横在膝上磨，头也不抬：「镖是我丢的，我会自己找回来。」',
          options: [
            { label: '「我帮你。」', fav: 6, reply: '她抬眼：「你？先活过今晚再说。」' },
            { label: '「那你自己小心。」', fav: 1, reply: '她哼了一声，继续磨刀。' },
          ],
        }],
      },
      {
        min: 30, name: '相识',
        lines: [{
          text: '她把酒囊扔给你：「黑风寨那封密信，你看懂了几成？」',
          options: [
            { label: '「州府里有人通匪。」', fav: 7, reply: '「不止，」她压低声音，「有人在养魔教。」' },
            { label: '「看不懂。」', fav: 0, reply: '「那你活着回来干什么。」她翻了个白眼。' },
          ],
        }],
      },
      {
        min: 60, name: '熟络',
        lines: [{
          text: '大牢外，她替你挡了一刀，肩头血浸透了镖衣。她说：「别回头。」',
          options: [
            { label: '「一起走。」', fav: 9, reply: '「你烦不烦。」她骂着，却把手伸给了你。' },
            { label: '「欠你一次。」', fav: 5, reply: '「记着就行。」' },
          ],
        }],
      },
      {
        min: 90, name: '知己',
        lines: [{
          text: '金銮殿前，她把镖旗插在丹陛上：「镖局没了，但这趟镖我押到底。」',
          options: [
            { label: '「这趟镖，押的是天下。」', fav: 10, reply: '「那就别输。」她笑了，第一次。' },
            { label: '「你可以走。」', fav: 8, reply: '「我走了，谁给你收尸。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'su', name: '苏无名', mapIndex: 8, minLevel: 81, faction: 'neutral',
    title: '皇城的说书人',
    stages: [
      {
        min: 0, name: '陌生',
        lines: [{
          text: '说书人苏无名在茶楼讲你的故事，讲到一半停下：「客官，后面的，得加钱。」',
          options: [
            { label: '「讲完。」', fav: 6, reply: '他笑了：「痛快。那我说句不该说的——国师不是人。」' },
            { label: '「胡编乱造。」', fav: -1, reply: '「编的才有人信，」他摇扇，「真的，没人敢听。」' },
          ],
        }],
      },
      {
        min: 30, name: '相识',
        lines: [{
          text: '他递给你一张皇城布防图，纸角还带着茶渍：「别问哪来的。」',
          options: [
            { label: '「你要什么？」', fav: 7, reply: '「你活着回来，」他说，「我还想讲下半段。」' },
            { label: '收下，不说话。', fav: 4, reply: '他点头：「聪明人。」' },
          ],
        }],
      },
      {
        min: 60, name: '熟络',
        lines: [{
          text: '他说书说到「权臣谋反」四字，满楼寂静，只有他扇子轻响。',
          options: [
            { label: '「你不怕死？」', fav: 8, reply: '「怕，」他收起扇子，「可总得有人把这事说出来。」' },
            { label: '「继续说。」', fav: 6, reply: '他看了你一眼，声调忽然高了八度。' },
          ],
        }],
      },
      {
        min: 90, name: '知己',
        lines: [{
          text: '金銮殿外，他把最后一页话本塞给你：「结局我没写，留给你。」',
          options: [
            { label: '「我写。」', fav: 10, reply: '「好，」他退后一步，「那老朽就等着听。」' },
            { label: '「或许没有结局。」', fav: 8, reply: '「那也是结局。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'liu', name: '柳三娘', mapIndex: 2, minLevel: 21, faction: 'evil',
    title: '黑市的女掌柜',
    stages: [
      {
        min: 0, name: '陌生',
        lines: [{
          text: '柳三娘拨着算盘，眼也不抬：「买命还是卖命？价钱不一样。」',
          options: [
            { label: '「问个价。」', fav: 5, reply: '她终于抬头，笑了一下：「你倒是实在。」' },
            { label: '掉头就走。', fav: -2, reply: '算盘声没停，像在给你送行。' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '她把一包药推过来：「这药能救人，也能杀人。看你怎么用。」',
          options: [
            { label: '收下。', fav: 6, honor: -5, reply: '「聪明。」她说，「活着才谈得上善恶。」' },
            { label: '推回去。', fav: 2, honor: 5, reply: '她挑了下眉：「你这人，活不长。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'lu', name: '陆铮', mapIndex: 3, minLevel: 31, faction: 'good',
    title: '州府的捕头',
    stages: [
      {
        min: 0, name: '陌生',
        lines: [{
          text: '陆铮把刀横在桌上：「你身上有血腥味。是自己人，还是案子？」',
          options: [
            { label: '「杀的是该杀的人。」', fav: 6, honor: 5, reply: '他盯了你一会儿，把刀收了：「那就别说是我教的。」' },
            { label: '「与你无关。」', fav: -2, reply: '「这城里的事，都与我有关。」' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '「帮个忙，」他压低声音，「牢里那个人，不该死。」',
          options: [
            { label: '「我去。」', fav: 8, honor: 8, reply: '他锤了你一拳：「欠你一条命。」' },
            { label: '「官府的事，我不碰。」', fav: -3, reply: '他没再说话，只把酒推到你面前。' },
          ],
        }],
      },
    ],
  },
  {
    id: 'aheng', name: '阿蘅', mapIndex: 0, minLevel: 1, faction: 'neutral',
    title: '官道上的姑娘',
    stages: [
      {
        min: 0, name: '陌生',
        lines: [{
          text: '阿蘅见了你，先低头，又抬起来：「那天……多谢你。」',
          options: [
            { label: '「举手之劳。」', fav: 6, reply: '「对你来说是举手，」她说，「对我来说不是。」' },
            { label: '「你叫什么？」', fav: 5, reply: '「阿蘅。」她把名字说得很轻。' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '她给你缝了个平安符，针脚很密：「戴着，别再受伤了。」',
          options: [
            { label: '收下。', fav: 8, reply: '她笑了，眼睛弯起来。' },
            { label: '「你自己留着。」', fav: 4, reply: '她摇头：「我不用上阵。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'qin', name: '秦照', mapIndex: 3, minLevel: 31, faction: 'good',
    title: '州府的女捕快',
    stages: [
      {
        min: 0, name: '陌生',
        lines: [{
          text: '秦照把腰牌往桌上一拍：「别动。你身上有人命。」',
          options: [
            { label: '「杀的是该杀的人。」', fav: 6, honor: 5, reply: '她盯了你半晌，收起腰牌：「这话我记下了。」' },
            { label: '「你先查清楚。」', fav: 3, reply: '「有点意思。」她拉过椅子坐下。' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '案子查到一半，她把卷宗推给你：「上头有人压着，我动不了。」',
          options: [
            { label: '「我替你动。」', fav: 8, honor: 8, reply: '她压低声音：「别让我在牢里见到你。」' },
            { label: '「撕了吧。」', fav: 1, honor: -5, reply: '她愣了愣，把卷宗收回抽屉。' },
          ],
        }],
      },
    ],
  },
  {
    id: 'yan', name: '燕七', mapIndex: 2, minLevel: 21, faction: 'evil',
    title: '轻功很好的女飞贼',
    stages: [
      {
        min: 0, name: '陌生',
        lines: [{
          text: '燕七蹲在屋脊上冲你笑：「追得上我，东西就还你。」',
          options: [
            { label: '追。', fav: 6, reply: '她跑得很快，最后故意慢了一步。' },
            { label: '「你留着吧。」', fav: 2, reply: '「没意思。」她把钱袋丢回来。' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '她把偷来的账册塞给你：「这东西比我值钱。你拿去，别问谁写的。」',
          options: [
            { label: '收下。', fav: 7, honor: 5, reply: '「你倒是敢接。」她笑得像只偷到鸡的狐狸。' },
            { label: '「你自己留着防身。」', fav: 3, reply: '「傻。」她骂了一句，把账册塞得更紧。' },
          ],
        }],
      },
    ],
  },
  {
    id: 'su2', name: '苏娘子', mapIndex: 1, minLevel: 11, faction: 'neutral',
    title: '被夫家逼到墙角的妇人',
    stages: [
      {
        min: 0, name: '陌生',
        lines: [{
          text: '苏娘子站在当铺门口，手里攥着一支旧簪：「这是他留给我的最后一样东西。」',
          options: [
            { label: '「赎回来。」（花 50 两）', fav: 8, honor: 5, reply: '她把簪子攥在手里，眼泪掉下来，又赶紧擦了。' },
            { label: '「活着比簪子要紧。」', fav: 3, reply: '她点头，把簪子收回了袖子里。' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '「小叔要拿我的嫁妆抵债，」她低声说，「还要我改嫁，说是给我寻条活路。」',
          options: [
            { label: '「我替你去说。」', fav: 8, honor: 8, reply: '她抬眼看你，像抓住了一根绳子。' },
            { label: '「报官吧。」', fav: 4, reply: '她苦笑：「官老爷和他是一路的。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'longnv', name: '小龙女', mapIndex: 5, minLevel: 20, faction: 'neutral', gift: 'cl_longnv',
    persona: '三无', skills: ['yunvjian', 'yunvjing'],
    title: '终南山古墓',
    look: '白衣如雪，一根素银簪挽着长发。脸很白，白得像常年不见日头；眉淡淡的，唇色也淡。说话时不太看人，看人的时候目光很直。身量瘦，走路没有声音。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '古墓外，白衣女子提着剑：「这里没有你要找的东西。」',
          options: [
            { label: '「我找人。」', fav: 6, reply: '她看了你一眼：「这里只有死人，和不想死的人。」' },
            { label: '硬闯。', fav: -3, reply: '剑光一闪，你的袖子被削下一角。' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '她把一枚冰魄银针放在石桌上：「拿着。有人追你时，别犹豫。」',
          options: [
            { label: '收下。', fav: 7, reply: '「疼吗？」她忽然问。你摇头。' },
            { label: '「为什么给我？」', fav: 3, reply: '她想了很久：「不知道。」' },
          ],
        }],
      },
      {
        min: 60, name: '交心',
        lines: [{
          text: '寒玉床上，她替你疗伤，指尖很凉：「疼就说。」',
          options: [
            { label: '「不疼。」', fav: 8, reply: '她没说话，手上的力道却轻了些。' },
            { label: '抓住她的手。', fav: 5, reply: '她愣了一下，没有挣开。' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '断龙石一寸寸落下，她把你推了出去，自己留在门里。',
          options: [
            { label: '扑回去。', fav: 8, reply: '你被石门挡住，只听见她在里面说：「活着。」' },
            { label: '转身找机关。', fav: 6, reply: '你摸到墙上一处凸起，石门停住了。' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '多年后，你在古墓深处又听见水声。她坐在寒玉床边，白衣如旧。',
          options: [
            { label: '走过去。', fav: 10, reply: '她抬头看你，眼睛里有了一点活人的光。' },
            { label: '站在门口。', fav: 5, reply: '「进来。」她说，「门没关。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'wangyuyan', name: '王语嫣', mapIndex: 1, minLevel: 25, faction: 'neutral', gift: 'cl_yuyan',
    persona: '书痴天然', skills: ['zhidian', 'langhuan'],
    title: '琅嬛玉洞的姑娘',
    look: '鹅蛋脸，皮肤白净，眼睛大而清，像总在想别的事。穿淡青衫子，袖口绣着碎花；手里常卷着一本书，指甲修得很干净。笑起来很轻，像怕惊动谁。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '她翻着武学图谱，头也不抬：「你这招，错在第三式。」',
          options: [
            { label: '「请姑娘指点。」', fav: 6, reply: '她终于抬头，眼睛亮了一下。' },
            { label: '「你看错了。」', fav: -2, reply: '她合上书：「随你。」' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '「我背得下天下武功，却一套都使不出来。」她笑得很轻。',
          options: [
            { label: '「那就教我。」', fav: 7, reply: '「我？」她怔住，「从来没人这么说。」' },
            { label: '「不会武功也很好。」', fav: 5, reply: '她低头，把书页抚平。' },
          ],
        }],
      },
      {
        min: 60, name: '交心',
        lines: [{
          text: '她把一页图谱塞给你：「这是我照着描的，只给你一个人。」',
          options: [
            { label: '收好。', fav: 8, reply: '她的耳根红了。' },
            { label: '「为什么？」', fav: 4, reply: '「因为你肯听我说话。」' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '慕容复在前面走，她跟在后面，像一道影子。风把她的书页吹得乱翻。',
          options: [
            { label: '替她按住书。', fav: 8, reply: '她低声道谢，眼睛却没离开前面那个人。' },
            { label: '「别跟了。」', fav: 4, reply: '她脚步一顿，还是跟了上去。' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '她终于停下来问你：「我是不是很没用？」',
          options: [
            { label: '「你救过很多人的命。」', fav: 10, reply: '她愣住，眼泪掉在书页上。' },
            { label: '「至少你救过我。」', fav: 6, reply: '她笑了一下，把书合上。' },
          ],
        }],
      },
      {
        min: 90, name: '同心',
        lines: [{
          text: '「我不会武功，」她说，「可我记得住天下所有的招式。你要是累了，我念给你听。」',
          options: [
            { label: '「念吧。」', fav: 8, reply: '她真的从第一式念起，念到天亮。' },
            { label: '「我想听别的。」', fav: 6, reply: '她愣了愣，耳朵红了。' },
          ],
        }],
      },
      {
        min: 95, name: '偕老',
        lines: [{
          text: '洞中很静，她把那本书合上，说了一个从来没人问过她的事。',
          options: [
            { label: '认真听。', fav: 10, reply: '说完她笑了，像放下一样很重的东西。' },
            { label: '「以后慢慢讲。」', fav: 8, reply: '「好。」她点头，把书放到一边。' },
          ],
        }],
      },
    ],
  },
  {
    id: 'zhaomin', name: '赵敏', mapIndex: 3, minLevel: 30, faction: 'neutral', gift: 'cl_zhaomin',
    persona: '英气腹黑', skills: ['lvliu', 'xinji'],
    title: '绿柳庄主',
    look: '眉眼生得英气，一笑就带三分坏。常穿宝蓝或墨绿劲装，腰束得紧，靴子是中原样式；头发束起，只用一根金簪。说话时喜欢看着人的眼睛，看得人先挪开。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '绿柳庄里，她端着茶：「你胆子不小，敢一个人来。」',
          options: [
            { label: '「你约的，我自然来。」', fav: 7, reply: '她挑了挑眉，把茶推到你面前。' },
            { label: '「不来，怕你拆了庄子。」', fav: 4, reply: '「我像是那种人？」她笑得像。' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '「万安寺那晚，你要是没来，我也不会怪你。」',
          options: [
            { label: '「我来了。」', fav: 8, reply: '她看着你，慢慢地说：「我知道。」' },
            { label: '「你算准了我会来。」', fav: 5, reply: '「算准了，」她说，「但不确定。」' },
          ],
        }],
      },
      {
        min: 60, name: '交心',
        lines: [{
          text: '她把一封信丢进火里：「从今往后，我不替谁办事了。」',
          options: [
            { label: '「那替我。」', fav: 8, reply: '她笑出声：「你倒是会挑时候。」' },
            { label: '「替你自己。」', fav: 6, reply: '她愣了一下，然后点头。' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '她替你挡了一箭，肩头渗血，还在笑：「这下你可欠我了。」',
          options: [
            { label: '替她包扎。', fav: 8, reply: '她别过脸：「轻点，我怕疼。」' },
            { label: '「谁让你挡的。」', fav: 4, reply: '「下次不挡了。」她说，眼里却没生气。' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '「我父兄要杀你，」她说，「我拦不住，但我可以先杀了他们。」',
          options: [
            { label: '「不用，我陪你回去。」', fav: 10, reply: '她看了你很久，说：「你可想好了。」' },
            { label: '「那是你父兄。」', fav: 6, reply: '「所以你更该活着。」' },
          ],
        }],
      },
      {
        min: 90, name: '同心',
        lines: [{
          text: '她把虎符放在你手里：「我这一生算尽人心，只算错了一件事。」',
          options: [
            { label: '「什么事？」', fav: 8, reply: '「算错了我自己会喜欢谁。」' },
            { label: '「算错了我。」', fav: 7, reply: '「差不多。」她笑。' },
          ],
        }],
      },
      {
        min: 95, name: '偕老',
        lines: [{
          text: '「跟我回绿柳庄吧，」她说，「这次不设宴，不试你。」',
          options: [
            { label: '「走。」', fav: 10, reply: '她把缰绳递给你，自己先上了马。' },
            { label: '「你带路。」', fav: 8, reply: '「跟紧，别掉队。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'liqiushui', name: '李秋水', mapIndex: 5, minLevel: 60, faction: 'neutral', gift: 'cl_qiushui',
    skills: ['baihong', 'wuxiang'],
    title: '西夏王宫的白发人',
    look: '白发梳得一丝不乱，脸上看不出年纪。穿西夏样式的深色长袍，腕上叠着银镯，走一步响一声。眼睛很亮，亮得让人不敢多看；笑的时候眼角不动。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '西夏王宫的白发女子看着你：「你身上有逍遥派的味道。」',
          options: [
            { label: '「你也是。」', fav: 5, reply: '她笑了：「眼光不错。」' },
            { label: '「你是谁？」', fav: 2, reply: '「一个活得太久的人。」' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '「无崖子当年也这么看我。」她笑了一下，眼里没有笑。',
          options: [
            { label: '「我不是他。」', fav: 8, reply: '她盯着你看了很久，才说：「但愿。」' },
            { label: '「他负了你。」', fav: 4, reply: '「负不负，都过去了。」' },
          ],
        }],
      },
      {
        min: 60, name: '交心',
        lines: [{
          text: '她教了你半式掌法：「剩下的，看你自己的造化。」',
          options: [
            { label: '认真学。', fav: 8, reply: '她难得露出一点真心的笑。' },
            { label: '「你陪我练完。」', fav: 5, reply: '「贪心。」她骂了一句，却留了下来。' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '她带你去看无崖子的画像。画上的人眉眼清俊，和她一点也不像。',
          options: [
            { label: '「像你。」', fav: 8, reply: '她怔了一下，随即笑出声：「你这张嘴。」' },
            { label: '「不像。」', fav: 4, reply: '「是不像。」她把画卷起来，「也好。」' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '「我这一生，争的都是同一个东西。」她看着你，「你呢？」',
          options: [
            { label: '「现在不争了。」', fav: 10, reply: '她伸手替你拂去肩上的雪。' },
            { label: '「争一个答案。」', fav: 6, reply: '「什么答案？」「你还在不在。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'licanghai', name: '李沧海', mapIndex: 5, minLevel: 70, faction: 'neutral', gift: 'cl_canghai',
    skills: ['canghai', 'bohai'],
    title: '雾里的人',
    look: '一身白，白得和雾分不清。头发很长，散着；五官很轻，像画上去的。声音低，得凑近才听得清。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '海边的雾里，她说：「你走过来的时候，我以为是故人。」',
          options: [
            { label: '「不是。」', fav: 5, reply: '「我知道。」她的声音很轻。' },
            { label: '「我可以做你的故人。」', fav: 7, reply: '她转过头，雾遮住了脸。' },
          ],
        }],
      },
      {
        min: 25, name: '相识',
        lines: [{
          text: '「有些东西不属于这个时代，」她说，「比如我。」',
          options: [
            { label: '「那我也留下来。」', fav: 8, reply: '她伸手替你把衣领理好。' },
            { label: '「时代会过去，你也在。」', fav: 5, reply: '她笑了笑，没有答。' },
          ],
        }],
      },
      {
        min: 60, name: '交心',
        lines: [{
          text: '「你要是记得我，就别老得那么快。」',
          options: [
            { label: '「我尽量。」', fav: 8, reply: '她低头笑了，雾散了一点。' },
            { label: '「你也不会老。」', fav: 6, reply: '「傻话。」她说，声音却软了。' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '雾散了。你第一次看清她的脸，也第一次发现她一直在发抖。',
          options: [
            { label: '把外袍给她。', fav: 8, reply: '她没有推辞，只把衣襟拢紧了些。' },
            { label: '「你在怕什么？」', fav: 5, reply: '「怕雾散了。」' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '她说：「该走了。你再不走，就真的走不了了。」',
          options: [
            { label: '「那就走不了。」', fav: 10, reply: '她笑了，眼睛里有水光。' },
            { label: '「一起走。」', fav: 7, reply: '她摇头：「我走不出这片雾。你替我看看外面。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'zhiruo', name: '周芷若', mapIndex: 3, minLevel: 35, faction: 'neutral', gift: 'cl_zhiruo',
    persona: '温婉其表', skills: ['jiuyinzhua', 'emei'],
    title: '峨眉派的女弟子',
    look: '眉眼很柔，说话也轻，像永远不会生气。穿素白的道袍，袖口总洗得发白；手里常年端着一只药碗。真正看她眼睛的时候，会发现里面没什么温度。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '她端着药碗，声音很轻：「你的伤，得换药了。」',
          options: [
            { label: '道谢。', fav: 5, reply: '她垂着眼，把药碗放下就走了。' },
            { label: '「你叫什么？」', fav: 4, reply: '「周芷若。」她说完，像有点后悔。' },
          ],
        }],
      },
      {
        min: 20, name: '相识',
        lines: [{
          text: '她把师父的戒尺收进袖里：「有些事，我不想再忍。」',
          options: [
            { label: '「我帮你。」', fav: 7, honor: 5, reply: '她看了你很久，轻轻点了下头。' },
            { label: '「再忍忍。」', fav: 1, reply: '她笑了一下，那笑让人不太舒服。' },
          ],
        }],
      },
      {
        min: 40, name: '交心',
        lines: [{
          text: '她替你挡了一掌，血从嘴角渗出来，还在笑。',
          options: [
            { label: '抱住她。', fav: 8, reply: '她整个人僵了一下，然后慢慢靠过来。' },
            { label: '先找药。', fav: 5, reply: '「你倒是清醒。」她说，语气听不出情绪。' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '「我做过一件错事，」她说，「你要是知道了，会不会不认我。」',
          options: [
            { label: '「不会。」', fav: 8, reply: '她低下头，眼泪掉在药碗里。' },
            { label: '「那要看是什么事。」', fav: 3, reply: '「……也是。」她收回手。' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '她把那把刀放到你手里：「从今往后，我只信你一个。」',
          options: [
            { label: '握住她的手。', fav: 10, reply: '她的手很凉，握得很紧。' },
            { label: '把刀收好。', fav: 6, reply: '「你不问为什么？」「不问。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'huangrong', name: '黄蓉', mapIndex: 1, minLevel: 40, faction: 'neutral', gift: 'cl_rong',
    persona: '古灵精怪', skills: ['dagoubang', 'qimen'],
    title: '桃花岛主的女儿',
    look: '杏黄衫子，头发用一根竹簪随便挽着，眼睛亮得像随时在打坏主意。说话快，笑起来的时候眼睛先弯。手里常捏着个橘子或者竹枝，站着也不安分。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '她拿竹枝敲了敲你的头：「喂，你走路的样子，像被人卖了还帮着数钱。」',
          options: [
            { label: '「那你卖我试试。」', fav: 6, reply: '她愣了一下，笑得直不起腰：「有点意思。」' },
            { label: '忍了。', fav: 3, reply: '「没劲。」她把竹枝一丢。' },
          ],
        }],
      },
      {
        min: 20, name: '相识',
        lines: [{
          text: '她剥着橘子，忽然说：「郭靖那人什么都好，就是太好。」',
          options: [
            { label: '「那不好吗？」', fav: 5, reply: '「好啊，」她把橘瓣塞进嘴里，「好得让人舍不得欺负。」' },
            { label: '「你不好吗？」', fav: 7, reply: '她眯起眼睛看你，像在盘算什么。' },
          ],
        }],
      },
      {
        min: 40, name: '交心',
        lines: [{
          text: '她拉你去偷酒，被发现了把你推出去挡，自己在后面笑得直不起腰。',
          options: [
            { label: '替她认罚。', fav: 8, reply: '她笑得眼泪都出来了，回头偷偷塞给你一块糖。' },
            { label: '追回去拽她。', fav: 5, reply: '「哎哎哎——」她被你拖着跑，笑得更大声。' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '「我嫁人了，」她忽然不笑了，「你该知道的。」',
          options: [
            { label: '「我知道。」', fav: 6, reply: '她看着你，很久没说话。' },
            { label: '「那又怎样。」', fav: 5, honor: -3, reply: '她嘴唇动了动，最后只说了句：「别这样。」' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '「傻郭靖在等我回家，」她把一封信折好，「可我还想再跟你走一段。」',
          options: [
            { label: '「我送你回去。」', fav: 8, reply: '她笑了笑，把信收进袖里，走得很慢。' },
            { label: '「就走一段。」', fav: 6, reply: '「一段就好。」她说。' },
          ],
        }],
      },
    ],
  },
  {
    id: 'yingying', name: '任盈盈', mapIndex: 2, minLevel: 45, faction: 'neutral', gift: 'cl_ying',
    persona: '外冷内热', skills: ['xixing', 'qingxin'],
    title: '日月神教的圣姑',
    look: '黑衣，袖口绣着暗纹，头发挽得简单。脸生得很冷，不笑的时候像在生气；真笑起来，又有点孩子气。手指很长，常按着琴弦。说话慢，句尾偶尔会软下来。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '绿竹巷里琴声停了。她隔着帘子问：「你听得懂？」',
          options: [
            { label: '「懂一点。」', fav: 5, reply: '帘子动了一下，她又弹了下去。' },
            { label: '「想学。」', fav: 6, reply: '「坐。」帘子后面让出了一把椅子。' },
          ],
        }],
      },
      {
        min: 20, name: '相识',
        lines: [{
          text: '她给你一碗药：「黑木崖的人不喝这个。你喝。」',
          options: [
            { label: '喝了。', fav: 7, reply: '「不怕有毒？」「你不会。」她别过脸。' },
            { label: '「你先喝。」', fav: 4, reply: '她皱眉，还是喝了一口。' },
          ],
        }],
      },
      {
        min: 40, name: '交心',
        lines: [{
          text: '「我爹是任我行，」她平静地说，「你怕不怕。」',
          options: [
            { label: '「不怕。」', fav: 8, reply: '「傻子。」她说，声音却软了。' },
            { label: '「怕，但我留下。」', fav: 7, reply: '她看了你一会儿，低头笑了。' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '她替你挡下长老一掌，袖口裂开，露出里面旧伤。',
          options: [
            { label: '替她上药。', fav: 8, reply: '她没躲，只是一直看着窗外。' },
            { label: '「谁伤的？」', fav: 5, reply: '「旧账。」她把袖子拉下来。' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '「江湖人都怕我，」她低头拨弦，「你能不能只把我当个人。」',
          options: [
            { label: '「我一直是。」', fav: 10, reply: '琴声停了，她抬头，眼睛有点红。' },
            { label: '「我把你当任盈盈。」', fav: 7, reply: '「那就够了。」她说。' },
          ],
        }],
      },
    ],
  },
  {
    id: 'susu', name: '殷素素', mapIndex: 0, minLevel: 30, faction: 'neutral', gift: 'cl_susu',
    persona: '外柔内刚', skills: ['qianzhu', 'tianying'],
    title: '天鹰教的朱衣女子',
    look: '眉目清秀，穿一身天鹰教的朱红，袖口沾过血也不换。说话带笑，笑意不常到眼底；手很稳，针线活和暗器一样准。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '她坐在船头理线，头也不抬：「这条江上，死人比鱼多。你最好不是下一个。」',
          options: [
            { label: '「那你呢？」', fav: 6, reply: '她抬眼看你，笑了：「我？我死不了。」' },
            { label: '「多谢提醒。」', fav: 3, reply: '「客气。」她把线咬断。' },
          ],
        }],
      },
      {
        min: 20, name: '相识',
        lines: [{
          text: '她替你把肩上的伤口缝好，针脚很密：「别乱动，我手不稳会缝歪。」',
          options: [
            { label: '「你手很稳。」', fav: 7, reply: '「废话。」她嘴上骂，手却更轻了。' },
            { label: '「疼。」', fav: 4, reply: '「疼就记住，下次别硬接。」' },
          ],
        }],
      },
      {
        min: 40, name: '交心',
        lines: [{
          text: '「我做过一件错事，」她望着江面，「报应落在了不该落的人身上。」',
          options: [
            { label: '「不是你的错。」', fav: 8, reply: '她沉默很久，才说：「你倒是会安慰人。」' },
            { label: '「说给我听。」', fav: 5, reply: '她摇头：「听了会做噩梦。」' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '刀光里她把你护在身后，朱红的衣裳被划开一道口子。',
          options: [
            { label: '替她挡回去。', fav: 8, reply: '她气得骂人：「谁让你逞能！」' },
            { label: '拉她走。', fav: 6, reply: '她踉跄了一下，反手扣住你的手腕。' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '「我这辈子最怕的不是死，」她低头理着袖口，「是没人记得我。」',
          options: [
            { label: '「我记得。」', fav: 10, reply: '她没说话，眼泪先掉下来了。' },
            { label: '「那你就别死。」', fav: 7, reply: '「行，」她笑着抹了下脸，「听你的。」' },
          ],
        }],
      },
    ],
  },
  {
    id: 'lucy', name: '露西', mapIndex: 0, minLevel: 50, faction: 'neutral', gift: 'cl_lucy',
    persona: '冷静神秘', skills: ['monowire', 'netrunner'],
    title: '夜之城的网络行者',
    look: '银白色的短发，深色连帽外套，颈侧有一道义体接口，在暗处会亮起细细的蓝光。她说话很轻，眼神像一块没关掉的屏幕。',
    stages: [
      {
        min: 0, name: '初遇',
        lines: [{
          text: '天台上下着雨，她背对着你站在霓虹里：「你不该来这里。」',
          options: [
            { label: '「我找人。」', fav: 6, reply: '「找到了又怎样。」她没回头。' },
            { label: '站在雨里等她。', fav: 4, reply: '过了很久，她把伞往你这边偏了一点。' },
          ],
        }],
      },
      {
        min: 20, name: '相识',
        lines: [{
          text: '「名字也别问，」她把一杯热的东西塞给你，「问了就麻烦了。」',
          options: [
            { label: '「那你叫我什么？」', fav: 6, reply: '她想了想：「就叫你……来的人。」' },
            { label: '不问，接过杯子。', fav: 5, reply: '她看了你一眼，唇角动了一下。' },
          ],
        }],
      },
      {
        min: 40, name: '交心',
        lines: [{
          text: '她给你看手腕上的接口：「这是我和这座城的连接，也是它拴住我的绳子。」',
          options: [
            { label: '握住她的手。', fav: 8, reply: '她的手指很凉，没有抽回去。' },
            { label: '什么都不说，陪她坐着。', fav: 6, reply: '雨声很大，她慢慢把肩膀靠了过来。' },
          ],
        }],
      },
      {
        min: 60, name: '共难',
        lines: [{
          text: '追兵堵住巷口，她拉起你的手：「跑，别回头。」',
          options: [
            { label: '跟上她。', fav: 8, reply: '她跑得很快，手一直没松。' },
            { label: '替她断后。', fav: 6, reply: '「你疯了！」她折回来拽你，骂了一句。' },
          ],
        }],
      },
      {
        min: 80, name: '白首',
        lines: [{
          text: '「我想去月球看看，」她仰着头，「听说那里很安静。你陪不陪我？」',
          options: [
            { label: '「陪你。」', fav: 10, reply: '她笑了，霓虹在她眼里亮了一下。' },
            { label: '「现在就去。」', fav: 7, reply: '「疯子。」她骂着，却先迈了一步。' },
          ],
        }],
      },
    ],
  },
];

/* ------------------------------------------------------------ 内容覆盖（content.js） */

if (typeof window !== 'undefined' && window.__WUXIA_CONTENT__) {
  const c = window.__WUXIA_CONTENT__;
  if (Array.isArray(c.npcs)) {
    for (const n of c.npcs) {
      const i = NPCS.findIndex((x) => x.id === n.id);
      if (i >= 0) NPCS[i] = n;
      else NPCS.push(n);
    }
  }
  if (Array.isArray(c.events)) EVENTS.push(...c.events);
  window.__WUXIA_NIGHTS__ = c.nights || {};
} else {
  window.__WUXIA_NIGHTS__ = {};
}

/* 人物小传（点开故人卡片可看） */
const NPC_LORE = {
  axiu: { bio: '青石村的绣娘，替人缝补为生。', hist: ['父母早亡，靠一手针线活养活自己。', '村口那件血衣是替山贼缝的，她没得选。', '她说你要是活着回去，就替你补衣裳。'] },
  shen: { bio: '落霞镇的女镖师，镖局的镖丢了，她一个人查。', hist: ['在镖局长大，刀是端着饭碗练的。', '那趟镖丢得蹊跷，她不信是寻常劫匪。', '肩上有道旧伤，是替人挡的。'] },
  su: { bio: '皇城的说书人，讲江湖，也讲朝堂。', hist: ['在茶楼说了三十年书，谁给钱就讲谁。', '他知道的比讲出来的多。', '手里那本话本，最后一页是空的。'] },
  liu: { bio: '黑市的女掌柜，买命卖命都做。', hist: ['从跑单帮起家，如今半座黑市听她的。', '账本上的名字，能压垮半个州府。', '她说活着才谈得上善恶。'] },
  lu: { bio: '州府的捕头，刀比话快。', hist: ['当差二十年，没办过一件冤案。', '上头压着的卷宗，他偷偷留着。', '牢里那个人，他不想让他死。'] },
  aheng: { bio: '官道上被恶少纠缠的姑娘，后来住进了青石村。', hist: ['那日若不是你，她不知会怎样。', '她手很巧，缝的平安符针脚很密。', '她说她不怕穷，怕的是没人记得。'] },
  qin: { bio: '州府第一位女捕快，破案不讲情面。', hist: ['考捕快考了三次，第三次把考官问住了。', '她查的案子，查到一半就没人敢让她查。', '腰牌比命重。'] },
  yan: { bio: '轻功极好的女飞贼，专偷贪官。', hist: ['十二岁上屋，十六岁偷了第一户人家。', '偷来的东西，一半散给了穷人。', '她说她偷的是账，不是钱。'] },
  su2: { bio: '丈夫被逼死后，被夫家夺产的妇人。', hist: ['嫁妆是她爹留下的，小叔要拿去抵债。', '当铺里那支旧簪，是她丈夫最后一样东西。', '她说官老爷和小叔是一路的。'] },
  longnv: { bio: '古墓派传人，终南山活死人墓里长大。', hist: ['师父养大的，没见过外面的日头。', '寒玉床、玉女心经、冰魄银针，是她的全部。', '她不太会说话，也不太会生气。'] },
  wangyuyan: { bio: '琅嬛玉洞的姑娘，记性极好，不会武功。', hist: ['读过天下武学，一套也使不出来。', '心里装着一个人，那个人眼里没有她。', '她说她只会念书，不会别的。'] },
  zhaomin: { bio: '绿柳庄主，蒙古郡主，心思比刀快。', hist: ['奉父命入中原，办的是灭江湖的差事。', '算无遗策，唯独算不准自己。', '她说从今往后，不替谁办事了。'] },
  liqiushui: { bio: '西夏太妃，逍遥派旧人。', hist: ['年轻时和无崖子同门，后来反目。', '争了一辈子，争的都是同一个东西。', '白发梳得一丝不乱。'] },
  licanghai: { bio: '雾里来去的人，来历不明。', hist: ['她说有些东西不属于这个时代。', '没人知道她从哪里来，也没人见她老。', '她说你替我看看外面。'] },
  zhiruo: { bio: '峨眉派弟子，灭绝师太的徒弟。', hist: ['从小在峨眉长大，规矩比剑法熟。', '做过一件错事，一直没说出口。', '她说从今往后只信你一个。'] },
  huangrong: { bio: '桃花岛主之女，丐帮帮主，已嫁郭靖。', hist: ['聪明得让江湖人头疼。', '嫁给了一个很好很好的人。', '可她还想过一点自己的日子。'] },
  yingying: { bio: '日月神教圣姑，任我行之女。', hist: ['父亲被囚，她在教中撑了很多年。', '江湖人怕她，怕到不敢看她的眼睛。', '她说你能不能只把我当个人。'] },
  susu: { bio: '天鹰教紫微堂堂主，张无忌的母亲。', hist: ['天鹰教殷家的女儿，手上沾过血。', '嫁给武当张翠山，生下无忌。', '她说她最怕的不是死，是没人记得她。'] },
};

/* ------------------------------------------------------------ 工具 */

const rnd = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (n) => Math.round(n).toLocaleString('zh-CN');

function weightedQuality(guarantee) {
  if (guarantee) {
    const pool = QUALITIES.filter((q) => q.k === 'blue' || q.k === 'purple' || q.k === 'orange' || q.k === 'red');
    const w = pool.map((q) => q.weight);
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) {
      r -= w[i];
      if (r <= 0) return pool[i];
    }
    return pool[0];
  }
  const total = QUALITIES.reduce((a, q) => a + q.weight, 0);
  let r = Math.random() * total;
  for (const q of QUALITIES) {
    r -= q.weight;
    if (r <= 0) return q;
  }
  return QUALITIES[0];
}

/* ------------------------------------------------------------ 状态 */

const DEFAULT_STATE = () => ({
  ver: SAVE_VER,
  name: '无名',
  level: 1,
  exp: 0,
  silver: 0,
  points: 0,
  base: { hp: 120, atk: 12, def: 6, agi: 6, mp: 40 },
  mapIndex: 0,
  kills: 0,
  bossCount: 0,
  cleared: MAPS.map(() => false),
  equip: { weapon: null, armor: null, helmet: null, boots: null, accessory: null },
  bag: [],
  learned: { passives: [], actives: [] },
  pages: {},
  passiveEquip: [],
  activeEquip: [null, null],
  skillQ: {},
  passiveLevels: {},
  npc: {},
  npcImg: {},
  stats: { kills: 0, deaths: 0, dungeon: 0, challWin: 0 },
  ending: null,
  savedAt: Date.now(),
  paused: false,
  created: false,
  origin: null,
  originCrit: 0,
  originSkill: 0,
  potions: {},
  buffs: [],
  shop: { stock: [], next: 0 },
  autoPotion: 30,
  autoSellWhite: false,
  eventOpen: false,
  speed: 1,
  honor: 0,
  flags: {},
  night: {},
  tokens: 3,
  codex: { collect: {}, sets: {}, legend: {}, manuals: {}, manualPages: {}, clothes: {} },
  dungeon: { active: false, step: 0, total: 3, mod: null },
  rebirth: 0,
  reinc: 0,
  talents: [],
  talentLv: {},
  companions: [],
  spouses: [],
  pets: {},
  petActive: null,
  tempBuffs: [],
  sects: {},
  duel: { active: false, sectId: null },
  titles: [],
  title: null,
  relics: {},
  breakCount: 0,
  codexClaimed: [],
  bounty: { date: '', list: [], prog: {}, claimed: [] },
  boardClaimed: [],
  sectTasks: { date: '', done: [] },
  redeemed: [],
  xuanjing: 0,
  shards: 0,
  towerBest: 0,
  relicCount: {},
  mystery: { stock: [], next: 0 },
  tower: { active: false, floor: 1 },
  party: [],
  achClaimed: {},
  afterTale: {},
  tier: 0,
  hall: null,
  hallUnlocked: false,
  essence: 0,
  mats: {},
  artifacts: {},
  artEquip: [null, null, null],
  week: { key: '', done: false },
  afterBoss: {},
});

let S = load();
let monster = null;
let foes = [];
let timer = null;
let activeTab = 'stats';
let logLines = [];
let logMode = 'all';
let codexFilter = '';
let codexTab = 'relic';
let expandedRelic = null;
let brothelTab = 'fun';

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && (data.ver === 1 || data.ver === SAVE_VER)) {
        const base = DEFAULT_STATE();
        const s = Object.assign(base, data, {
          equip: Object.assign({ weapon: null, armor: null, helmet: null, boots: null, accessory: null }, data.equip || {}),
          bag: Array.isArray(data.bag) ? data.bag : [],
          cleared: MAPS.map((_, i) => !!(data.cleared && data.cleared[i])),
          npc: data.npc || {},
          npcImg: data.npcImg || {},
          pages: data.pages || {},
          passiveLevels: data.passiveLevels || {},
          activeEquip: Array.isArray(data.activeEquip) ? data.activeEquip : [null, null],
          learned: Object.assign({ passives: [], actives: [] }, data.learned || {}),
        });
        // 旧档兼容
        s.potions = s.potions || {};
        s.buffs = s.buffs || [];
        s.shop = Object.assign({ stock: [], next: 0 }, s.shop || {});
        s.autoPotion = typeof s.autoPotion === 'number' ? s.autoPotion : 30;
        s.autoSellWhite = !!s.autoSellWhite;
        s.originCrit = s.originCrit || 0;
        s.originSkill = s.originSkill || 0;
        for (const id of Object.keys(s.npc)) {
          const st = s.npc[id] || {};
          if (!st.done) s.npc[id] = { fav: st.fav || 0, done: {}, chats: {}, gifts: {} };
        }
        s.honor = typeof s.honor === 'number' ? s.honor : 0;
        s.flags = s.flags || {};
        s.night = s.night || {};
        s.tokens = typeof s.tokens === 'number' ? s.tokens : 3;
        s.codex = Object.assign({ collect: {}, sets: {}, legend: {}, manuals: {}, manualPages: {}, clothes: {} }, s.codex || {});
        s.codex.clothes = s.codex.clothes || {};
        s.dungeon = Object.assign({ active: false, step: 0, total: 3, mod: null }, s.dungeon || {});
        s.rebirth = s.rebirth || 0;
        s.reinc = s.reinc || 0;
        s.talents = Array.isArray(s.talents) ? s.talents : [];
        s.companions = Array.isArray(s.companions) ? s.companions : [];
        s.spouses = Array.isArray(s.spouses) ? s.spouses : [];
        s.pets = s.pets || {};
        s.petActive = s.petActive || null;
        s.tempBuffs = Array.isArray(s.tempBuffs) ? s.tempBuffs : [];
        s.sects = s.sects || {};
        s.duel = Object.assign({ active: false, sectId: null }, s.duel || {});
        s.titles = Array.isArray(s.titles) ? s.titles : [];
        s.title = s.title || null;
        s.relics = s.relics || {};
        s.breakCount = s.breakCount || 0;
        s.codexClaimed = Array.isArray(s.codexClaimed) ? s.codexClaimed : [];
        s.bounty = Object.assign({ date: '', list: [], prog: {}, claimed: [] }, s.bounty || {});
        s.boardClaimed = Array.isArray(s.boardClaimed) ? s.boardClaimed : [];
        s.sectTasks = Object.assign({ date: '', done: [] }, s.sectTasks || {});
        s.redeemed = Array.isArray(s.redeemed) ? s.redeemed : [];
        s.party = Array.isArray(s.party) ? s.party : [];
        s.achClaimed = s.achClaimed || {};
        s.afterTale = s.afterTale || {};
        s.week = s.week || { key: '', done: false };
        s.afterBoss = s.afterBoss || {};
        s.mystery = s.mystery || { stock: [], next: 0 };
        if (Array.isArray(s.tempBuffs)) {
          const seen = {};
          s.tempBuffs = s.tempBuffs.filter((b) => {
            if (!b || b.until <= Date.now()) return false;
            if (seen[b.id]) { seen[b.id].until = Math.max(seen[b.id].until, b.until); return false; }
            seen[b.id] = b;
            return true;
          });
        }
        if (s.mystery && Array.isArray(s.mystery.stock)) {
          s.mystery.stock = s.mystery.stock.filter((o) => !o || o.kind !== 'relic' || RELICS.some((r) => r.id === o.id));
        }
        // 旧版神兵改为永久被动：从行囊/装备中移除，记入图鉴
        const cleanBag = [];
        for (const it of s.bag || []) {
          if (it && it.legendId) { s.codex.legend[it.legendId] = true; continue; }
          cleanBag.push(it);
        }
        s.bag = cleanBag;
        for (const k of Object.keys(s.equip || {})) {
          const it = s.equip[k];
          if (it && it.legendId) { s.codex.legend[it.legendId] = true; s.equip[k] = null; }
        }
        s.stats = Object.assign({ kills: 0, deaths: 0, dungeon: 0, challWin: 0 }, s.stats || {});
        if (s.ending && (s.level || 1) < MAX_LEVEL) s.ending = null;
        s.ver = SAVE_VER;
        s.xuanjing = s.xuanjing || 0;
        s.shards = s.shards || 0;
        s.relicCount = s.relicCount || {};
        for (const id of Object.keys(s.relics || {})) {
          if (!s.relicCount[id]) s.relicCount[id] = 1;
        }
        s.towerBest = s.towerBest || 0;
        s.mystery = Object.assign({ stock: [], next: 0 }, s.mystery || {});
        s.tier = s.tier || 0;
        s.essence = s.essence || 0;
        s.hall = s.hall || null;
        s.hallUnlocked = !!(s.hallUnlocked || (s.hall && s.hall.level));
        s.talentLv = s.talentLv || {};
        s.mats = s.mats || {};
        s.artifacts = s.artifacts || {};
        s.artEquip = Array.isArray(s.artEquip) ? s.artEquip.slice(0, 3) : [null, null, null];
        while (s.artEquip.length < 3) s.artEquip.push(null);
        s.tower = Object.assign({ active: false, floor: 1 }, s.tower || {});
        s.dungeon.other = !!s.dungeon.other;
        s.passiveEquip = typeof s.passiveEquip === 'string'
          ? (s.passiveEquip ? [s.passiveEquip] : [])
          : (Array.isArray(s.passiveEquip) ? s.passiveEquip : []);
        s.skillQ = s.skillQ || {};
        while (s.activeEquip.length < 4) s.activeEquip.push(null);
        return s;
      }
    }
  } catch (e) {
    /* 存档损坏就当新档 */
  }
  return DEFAULT_STATE();
}

function save() {
  S.savedAt = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  } catch (e) {
    /* 图片过多可能超限，静默失败 */
  }
}

/* ------------------------------------------------------------ 属性 */

function passiveMods() {
  const out = {};
  for (const id of S.passiveEquip || []) {
    const p = PASSIVES.find((x) => x.id === id);
    if (!p) continue;
    const lv = S.passiveLevels[id] || 1;
    const q = (S.skillQ && S.skillQ[id]) || 1;
    const scale = (1 + (lv - 1) * 0.12) * (1 + (q - 1) * 0.15);
    for (const k of Object.keys(p.mods)) out[k] = (out[k] || 0) + p.mods[k] * scale;
  }
  return out;
}

/* 功法/心法槽位与品阶 */
function passiveSlots() { return 1 + (S.level >= 40 ? 1 : 0) + (S.level >= 70 ? 1 : 0) + Math.min(2, S.rebirth || 0); }
function activeSlots() { return 2 + (S.level >= 30 ? 1 : 0) + (S.level >= 60 ? 1 : 0) + Math.min(2, S.rebirth || 0); }
function skillQ(id) { return (S.skillQ && S.skillQ[id]) || 1; }
function skillQName(q) { return q >= 3 ? '金色' : q === 2 ? '紫色' : '蓝色'; }
function skillQClass(q) { return q >= 3 ? 'q-orange' : q === 2 ? 'q-purple' : 'q-blue'; }
function skillUpCost(id) { const q = skillQ(id); return q >= 3 ? 0 : q === 1 ? 1200 : 4000; }
function skillById(id) { return ACTIVES.find((a) => a.id === id) || PASSIVES.find((p) => p.id === id); }

function upgradeSkill(id) {
  const sk = skillById(id);
  if (!sk) return;
  const q = skillQ(id);
  if (q >= 3) { addLog('已经是金色了。', 'sys'); return; }
  const cost = skillUpCost(id);
  if (S.silver < cost) { addLog('银两不够（需 ' + cost + '）。', 'bad'); return; }
  S.silver -= cost;
  S.skillQ[id] = q + 1;
  // 进阶后重数归 1，品质效果 +15%
  if (S.passiveLevels[id]) S.passiveLevels[id] = 1;
  addLog('「' + sk.name + '」进阶为' + skillQName(q + 1) + '：基础效果 +15%，重数归 1，可重新升重。', 'gold');
  save();
  renderAll();
}

function talentMods() {
  const o = {};
  for (const id of S.talents || []) {
    const t = TALENTS.find((x) => x.id === id);
    if (!t) continue;
    let base = t.mods || {};
    if (t.dyn === 'bonds') {
      const cnt = Math.min(10, NPCS.filter((n) => npcState(n.id).bond).length);
      base = { atkPct: 0.02 * cnt, hpPct: 0.02 * cnt };
    }
    const lv = (S.talentLv && S.talentLv[id]) || 1;
    const factor = 1 + 0.5 * (lv - 1);
    for (const k of Object.keys(base)) o[k] = (o[k] || 0) + base[k] * factor;
  }
  return o;
}

const TALENT_MAX = 5;

function talentUpCost(id) {
  const lv = (S.talentLv && S.talentLv[id]) || 1;
  return lv;
}

function upgradeTalent(id) {
  if (!(S.talents || []).includes(id)) return;
  S.talentLv = S.talentLv || {};
  const lv = S.talentLv[id] || 1;
  if (lv >= TALENT_MAX) { addLog('这个天赋已经满级。', 'sys'); return; }
  const cost = lv;
  if ((S.reinc || 0) < cost) { addLog('轮回点不够（需 ' + cost + ' 点）。', 'bad'); return; }
  S.reinc -= cost;
  S.talentLv[id] = lv + 1;
  const t = TALENTS.find((x) => x.id === id);
  addLog('天赋「' + t.name + '」升至 ' + (lv + 1) + ' 级，效果 ×' + (1 + 0.5 * lv).toFixed(1) + '。', 'gold');
  save();
  renderAll();
}

function allyMods() {
  const o = {};
  for (const id of [].concat(S.companions || [], S.spouses || [])) {
    const m = ALLY_BONUS[id];
    if (!m) continue;
    for (const k of Object.keys(m)) o[k] = (o[k] || 0) + m[k];
  }
  return o;
}

function petMods() {
  const id = S.petActive;
  if (!id) return {};
  const p = PETS.find((x) => x.id === id);
  if (!p) return {};
  const pet = S.pets[id] || { level: 1 };
  const lv = pet.level || 1;
  const scale = (1 + (lv - 1) * 0.1) * (pet.evo ? 1.5 : 1);
  const o = {};
  for (const k of Object.keys(p.mods)) o[k] = p.mods[k] * scale;
  return o;
}

function rewardMul() {
  const tm = talentMods();
  const pm = petMods();
  const am = allyMods();
  const now = Date.now();
  S.tempBuffs = (S.tempBuffs || []).filter((b) => b.until > now);
  let exp = 1 + (tm.expPct || 0) + (am.expPct || 0);
  let silver = 1 + (tm.silverPct || 0);
  let drop = (tm.drop || 0) + (pm.drop || 0) + (am.drop || 0);
  for (const b of S.tempBuffs) {
    exp += b.expPct || 0;
    silver += b.silverPct || 0;
    drop += b.drop || 0;
  }
  const ttm = titleMods();
  exp += ttm.expPct || 0;
  drop += ttm.drop || 0;
  const rlm = relicMods();
  exp += rlm.expPct || 0;
  drop += rlm.drop || 0;
  silver += rlm.silverPct || 0;
  return { exp: Math.max(0.1, exp), silver: Math.max(0.1, silver), drop };
}

/* ------------------------------------------------------------ 轮回 / 结缘 / 宠物 */

function codexProgress() {
  const c = S.codex;
  const man = Object.keys(c.manuals).length / MANUALS.length;
  const leg = Object.keys(c.legend).length / LEGENDARIES.length;
  let setP = 0;
  for (const s of SETS) setP += Math.min(1, Object.keys(c.sets[s.id] || {}).length / s.pieces.length);
  setP /= SETS.length;
  return (man + leg + setP) / 3;
}

function reincPoints() {
  return Math.floor(S.level / 10) + Math.round(codexProgress() * 10);
}

function canRebirth() {
  return S.created && S.level >= 60 && !S.dungeon.active;
}

function offerTalents() {
  const pool = TALENTS.filter((t) => !(S.talents || []).includes(t.id));
  if (!pool.length) { addLog('天赋已集齐。', 'sys'); return; }
  const picks = pool.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  showModal('<h2>轮回 · 天赋</h2><p class="muted">带一个进下一世。</p>' +
    picks.map((t, i) => '<button class="choice" data-talent="' + i + '">' + t.name + ' —— ' + t.desc + '</button>').join(''));
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-talent]').forEach((b) => b.addEventListener('click', () => {
    const t = picks[+b.dataset.talent];
    S.talents.push(t.id);
    addLog('你得了天赋「' + t.name + '」。', 'gold');
    hideModal();
    save();
    renderAll();
  }));
}

function doRebirth() {
  if (!canRebirth()) { addLog('至少 60 级才能轮回。', 'bad'); return; }
  if (!confirm('轮回将重置等级、银两、普通装备；保留图鉴、收藏、队友、宠物、天赋。确定？')) return;
  const pts = reincPoints();
  S.reinc = (S.reinc || 0) + pts;
  S.rebirth = (S.rebirth || 0) + 1;
  S.level = 1; S.exp = 0; S.silver = 0; S.points = 0;
  S.mapIndex = 0; S.kills = 0; S.bossCount = 0;
  S.cleared = MAPS.map(() => false);
  S.base = { hp: 120, atk: 12, def: 6, agi: 6, mp: 40 };
  S.equip = { weapon: null, armor: null, helmet: null, boots: null, accessory: null };
  S.bag = []; S.potions = {}; S.buffs = [];
  S.dungeon = { active: false, step: 0, total: 3, mod: null };
  S.tower = { active: false, floor: 1 };
  S.duel = { active: false, sectId: null };
  S.ending = null;
  S.eventOpen = false;
  addLog('你散去一身修为，重入轮回。得轮回点 ' + pts + '。', 'gold');
  save();
  offerTalents();
  start();
}

function bondNpc(id, kind) {
  const st = npcState(id);
  if (st.bond) return;
  if (kind === 'companion') {
    if ((S.companions || []).length >= 2) { addLog('队友位已满（2 个）。', 'bad'); return; }
    S.companions.push(id);
  } else {
    S.spouses.push(id);
  }
  st.bond = kind;
  addLog('【' + npcName(id) + '】' + (kind === 'companion' ? '答应与你同行。' : '与你结为夫妻。'), 'story');
  save();
  renderAll();
  openNpc(id);
}

function petEncounter() {
  if (Math.random() > 0.35) return;
  const pool = PETS.filter((p) => !S.pets[p.id]);
  if (!pool.length) return;
  const p = pick(pool);
  showModal('<h2>野地 · ' + p.name + '</h2><p class="story-text">你在路边看见一只' + p.name + '，正盯着你。</p>' +
    '<button class="choice" data-catch="' + p.id + '">收服（50 两）</button>' +
    '<button class="choice" data-close="1">放它走</button>');
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-catch]').forEach((b) => b.addEventListener('click', () => capturePet(b.dataset.catch)));
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
}

function capturePet(id) {
  if (S.silver < 50) { addLog('银两不够。', 'bad'); return; }
  S.silver -= 50;
  S.pets[id] = { level: 1 };
  if (!S.petActive) S.petActive = id;
  addLog('你收服了' + PETS.find((p) => p.id === id).name + '。', 'gold');
  hideModal();
  save();
  renderAll();
}

function feedPet(id) {
  const pet = S.pets[id];
  if (!pet) return;
  if (pet.level >= 10) { addLog('已经 10 级了。', 'sys'); return; }
  if (S.silver < 100) { addLog('银两不够。', 'bad'); return; }
  S.silver -= 100;
  pet.level += 1;
  addLog(PETS.find((p) => p.id === id).name + '升到 ' + pet.level + ' 级。', 'gold');
  save();
  renderAll();
}

function totalStats() {
  const mods = passiveMods();
  let hp = S.base.hp;
  let atk = S.base.atk;
  let def = S.base.def;
  let agi = S.base.agi;
  let mp = S.base.mp;
  let mpRegen = 1 + S.base.mp * 0.02;
  let crit = 5 + S.base.agi * 0.25;
  let critDmg = 150;
  let dodge = S.base.agi * 0.15;
  let hit = 90;
  let lifesteal = 0;
  let pierce = 0;
  let dmgReduce = 0;
  let block = 0;
  let thorns = 0;
  let skillPower = 0;

  for (const slot of Object.keys(SLOTS)) {
    const it = S.equip[slot];
    if (!it) continue;
    const up = 1 + 0.08 * (it.up || 0);
    atk += (it.base.atk || 0) * up;
    def += (it.base.def || 0) * up;
    hp += (it.base.hp || 0) * up;
    agi += (it.base.agi || 0) * up;
    for (const a of it.affixes) {
      switch (a.k) {
        case 'atk': atk += a.v; break;
        case 'def': def += a.v; break;
        case 'hp': hp += a.v; break;
        case 'agi': agi += a.v; break;
        case 'mpMax': mp += a.v; break;
        case 'mpRegen': mpRegen += a.v; break;
        case 'crit': crit += a.v; break;
        case 'critDmg': critDmg += a.v; break;
        case 'dodge': dodge += a.v; break;
        case 'hit': hit += a.v; break;
        case 'lifesteal': lifesteal += a.v; break;
        case 'pierce': pierce += a.v; break;
        case 'dmgReduce': dmgReduce += a.v; break;
        case 'block': block += a.v; break;
        case 'thorns': thorns += a.v; break;
        case 'skillPower': skillPower += a.v; break;
        default: break;
      }
    }
  }

  if (mods.mpMaxPct) mp *= 1 + mods.mpMaxPct;
  if (mods.defPct) def *= 1 + mods.defPct;
  if (mods.agiPct) agi *= 1 + mods.agiPct;
  if (mods.mpRegen) mpRegen += mods.mpRegen;
  if (mods.dmgReduce) dmgReduce += mods.dmgReduce * 100;
  if (mods.dodge) dodge += mods.dodge;
  if (mods.atkPct) atk *= 1 + mods.atkPct;
  if (mods.hpPct) hp *= 1 + mods.hpPct;
  if (mods.crit) crit += mods.crit;
  if (mods.critDmg) critDmg += mods.critDmg;
  if (mods.skillPower) skillPower += mods.skillPower;

  crit += S.originCrit || 0;
  skillPower += S.originSkill || 0;
  for (const b of S.buffs || []) {
    if (b.stat === 'atk') atk *= 1 + b.mult;
  }

  // 套装
  const setCount = {};
  for (const slot of Object.keys(SLOTS)) {
    const it = S.equip[slot];
    if (it && it.setId) setCount[it.setId] = (setCount[it.setId] || 0) + 1;
  }
  for (const setId of Object.keys(setCount)) {
    const set = SETS.find((x) => x.id === setId);
    if (!set) continue;
    if (setCount[setId] >= 2 && set.m2) {
      if (set.m2.atkPct) atk *= 1 + set.m2.atkPct;
      if (set.m2.defPct) def *= 1 + set.m2.defPct;
      if (set.m2.hpPct) hp *= 1 + set.m2.hpPct;
      if (set.m2.lifesteal) lifesteal += set.m2.lifesteal;
    }
    if (setCount[setId] >= 4 && set.m4) {
      if (set.m4.critDmg) critDmg += set.m4.critDmg;
      if (set.m4.dmgReduce) dmgReduce += set.m4.dmgReduce;
      if (set.m4.atkPct) atk *= 1 + set.m4.atkPct;
      if (set.m4.dodge) dodge += set.m4.dodge;
      if (set.m4.hpPct) hp *= 1 + set.m4.hpPct;
    }
    if (setCount[setId] >= 5 && set.m5) {
      if (set.m5.crit) crit += set.m5.crit;
      if (set.m5.critDmg) critDmg += set.m5.critDmg;
      if (set.m5.hpPct) hp *= 1 + set.m5.hpPct;
      if (set.m5.atkPct) atk *= 1 + set.m5.atkPct;
      if (set.m5.dmgReduce) dmgReduce += set.m5.dmgReduce;
    }
  }

  // 套装联动（集齐 5 件的额外效果）
  if (setCount.nightrunner >= 5 && (S.activeEquip || []).includes('monowire')) skillPower += 20;
  if (setCount.qingfeng >= 5) critDmg += 15;
  if (setCount.xuantie >= 5) dmgReduce += 5;
  if (setCount.tiancan >= 5) dodge += 3;
  if (setCount.xuemo >= 5) lifesteal += 3;

  // 已收集秘籍的永久加成
  for (const m of MANUALS) {
    if (!S.codex.manuals[m.id]) continue;
    if (m.mods.atkPct) atk *= 1 + m.mods.atkPct;
    if (m.mods.hpPct) hp *= 1 + m.mods.hpPct;
    if (m.mods.critDmg) critDmg += m.mods.critDmg;
    if (m.mods.dodge) dodge += m.mods.dodge;
  }

  // 倚天屠龙：刀剑齐鸣
  if (S.codex.legend.yitian && S.codex.legend.tulong) {
    atk *= 1.05;
    crit += 3;
  }

  // 轮回天赋
  const tm = talentMods();
  if (tm.hpPct) hp *= 1 + tm.hpPct;
  if (tm.atkPct) atk *= 1 + tm.atkPct;
  if (tm.crit) crit += tm.crit;
  if (tm.dmgReduce) dmgReduce += tm.dmgReduce;
  if (tm.dodge) dodge += tm.dodge;
  if (tm.atkPctIfNoComp && !(S.companions || []).length) atk *= 1 + tm.atkPctIfNoComp;

  // 队友 / 配偶
  const am = allyMods();
  if (am.hpPct) hp *= 1 + am.hpPct;
  if (am.atkPct) atk *= 1 + am.atkPct;
  if (am.defPct) def *= 1 + am.defPct;
  if (am.crit) crit += am.crit;
  if (am.dodge) dodge += am.dodge;

  // 宠物
  const pm = petMods();
  if (pm.atkPct) atk *= 1 + pm.atkPct;
  if (pm.hpPct) hp *= 1 + pm.hpPct;
  if (pm.crit) crit += pm.crit;
  if (pm.dodge) dodge += pm.dodge;

  // 称号
  const ttm = titleMods();
  if (ttm.atkPct) atk *= 1 + ttm.atkPct;
  if (ttm.hpPct) hp *= 1 + ttm.hpPct;
  if (ttm.crit) crit += ttm.crit;
  if (ttm.dodge) dodge += ttm.dodge;

  // 奇物收藏加成
  const rlm = relicMods();
  if (rlm.atkPct) atk *= 1 + rlm.atkPct;
  if (rlm.hpPct) hp *= 1 + rlm.hpPct;
  if (rlm.defPct) def *= 1 + rlm.defPct;
  if (rlm.agiPct) agi *= 1 + rlm.agiPct;
  if (rlm.crit) crit += rlm.crit;
  if (rlm.dodge) dodge += rlm.dodge;

  // 道途品阶
  const tier = S.tier || 0;
  if (tier > 0) {
    atk *= 1 + 0.08 * tier;
    hp *= 1 + 0.08 * tier;
  }

  // 法宝
  const arts = (S.artEquip || []).map((id) => ARTIFACTS.find((a) => a.id === id)).filter(Boolean);
  for (const a of arts) {
    const m = a.mods || {};
    if (m.atkPct) atk *= 1 + m.atkPct;
    if (m.hpPct) hp *= 1 + m.hpPct;
    if (m.defPct) def *= 1 + m.defPct;
    if (m.crit) crit += m.crit;
    if (m.critDmg) critDmg += m.critDmg;
    if (m.dodge) dodge += m.dodge;
    if (m.skillPower) skillPower += m.skillPower;
    if (m.lifesteal) lifesteal += m.lifesteal;
  }
  if (arts.length >= 2) skillPower += 5;
  if (arts.length >= 3) atk *= 1.08;

  // 神兵被动：获得即永久生效
  for (const L of LEGENDARIES) {
    if (!S.codex.legend[L.id]) continue;
    for (const a of L.affixes) {
      if (a.k === 'crit') crit += a.v;
      else if (a.k === 'critDmg') critDmg += a.v;
      else if (a.k === 'lifesteal') lifesteal += a.v;
      else if (a.k === 'dmgReduce') dmgReduce += a.v;
      else if (a.k === 'dodge') dodge += a.v;
      else if (a.k === 'pierce') pierce += a.v;
    }
  }

  return {
    hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def),
    agi: Math.round(agi), mp: Math.round(mp),
    mpRegen: +mpRegen.toFixed(1),
    crit: +clamp(crit, 0, 80).toFixed(1),
    critDmg: Math.round(clamp(critDmg, 100, 350)),
    dodge: +clamp(dodge, 0, 60).toFixed(1),
    hit: +clamp(hit, 0, 100).toFixed(1),
    lifesteal: +clamp(lifesteal, 0, 15).toFixed(1),
    pierce: +clamp(pierce, 0, 50).toFixed(1),
    dmgReduce: +clamp(dmgReduce, 0, 60).toFixed(1),
    block: +clamp(block, 0, 45).toFixed(1),
    thorns: +clamp(thorns, 0, 50).toFixed(1),
    skillPower: Math.round(skillPower),
  };
}

function powerScore(st) {
  return Math.round(st.atk * 3 + st.def * 2 + st.hp * 0.3 + st.agi * 2 + st.mp * 0.2);
}

/* ------------------------------------------------------------ 战斗数值 */

let battle = { hp: 0, mp: 0, cds: {}, log: [], usedPot: 0, potCd: 0 };

function playerVitals() {
  const st = totalStats();
  if (battle.hp <= 0 || battle.hp > st.hp) battle.hp = st.hp;
  return st;
}

function expNeed(level) {
  return Math.floor(50 * Math.pow(level, 1.18));
}

/* ------------------------------------------------------------ 药品 */

function usePotion(id, silent) {
  const p = POTION_BY_ID[id];
  if (!p || p.type === 'gift') return false;
  const mod = dungeonMod();
  if (mod && mod.noPotion) {
    if (!silent) addLog('秘境禁药，喝不了。', 'bad');
    return false;
  }
  if ((S.potions[id] || 0) <= 0) return false;
  const st = totalStats();
  if (p.type === 'heal') {
    if (battle.hp >= st.hp) return false;
    battle.hp = Math.min(st.hp, battle.hp + st.hp * p.value);
  } else if (p.type === 'mana') {
    if (battle.mp >= st.mp) return false;
    battle.mp = Math.min(st.mp, battle.mp + st.mp * p.value);
  } else if (p.type === 'buff') {
    S.buffs.push({ id, stat: 'atk', mult: p.value, rounds: p.rounds });
  } else if (p.type === 'cure') {
    battle.hp = Math.min(st.hp, battle.hp + st.hp * 0.1);
  }
  S.potions[id] -= 1;
  if (S.potions[id] <= 0) delete S.potions[id];
  if (!silent) addLog('你服下' + p.name + '。', 'good');
  return true;
}

function bestHealPotion() {
  const ids = Object.keys(S.potions || {}).filter((id) => {
    const p = POTION_BY_ID[id];
    return p && p.type === 'heal' && (S.potions[id] || 0) > 0;
  });
  if (!ids.length) return null;
  ids.sort((a, b) => POTION_BY_ID[b].value - POTION_BY_ID[a].value);
  return ids[0];
}

function autoUsePotion() {
  if (!S.autoPotion) return;
  const mod = dungeonMod();
  if (mod && mod.noPotion) return;
  const st = totalStats();
  if (battle.hp / st.hp >= S.autoPotion / 100) return;
  if (battle.usedPot >= 3 || battle.potCd > 0) return;
  const id = bestHealPotion();
  if (!id) return;
  if (usePotion(id, true)) {
    battle.usedPot += 1;
    battle.potCd = 1;
    addLog('你急忙服下' + POTION_BY_ID[id].name + '。', 'good');
  }
}

/* ------------------------------------------------------------ 商店 */

function refreshShop() {
  const stock = [];
  for (let i = 0; i < 6; i++) {
    const slot = pick(Object.keys(SLOTS));
    const q = weightedQuality(false);
    const it = generateItem(slot, S.level, q);
    it.price = Math.round((18 + it.ilvl * 8) * q.mult);
    stock.push(it);
  }
  S.shop = { stock, next: Date.now() + SHOP_REFRESH_MS };
  save();
}

function setSpeed(m) {
  speedMul = m;
  S.speed = m;
  if (timer) {
    clearInterval(timer);
    timer = setInterval(tick, Math.max(300, Math.round(TICK_MS / m)));
  }
  save();
  renderAll();
}

function ensureShop() {
  if (!S.shop || !Array.isArray(S.shop.stock) || !S.shop.stock.length || Date.now() > S.shop.next) refreshShop();
}

const CUSTOM_Q = { blue: 2.4, purple: 3.6, orange: 5.2 };

function customPrice(q) {
  return Math.round((60 + S.level * 25) * (CUSTOM_Q[q] || 2.4));
}

function customForge(slot, q) {
  const price = customPrice(q);
  if (S.silver < price) { addLog('银两不够（需 ' + price + '）。', 'bad'); return; }
  if (S.bag.length >= 60) { addLog('行囊已满。', 'bad'); return; }
  const qq = QUALITIES.find((x) => x.k === q);
  if (!qq) return;
  S.silver -= price;
  const it = generateItem(slot, S.level, qq);
  S.bag.push(it);
  addLog('你花 ' + price + ' 两，请铁匠打了' + it.name + '（' + it.qname + '）。', 'gold');
  save();
  renderAll();
}

function buyEquip(uid) {
  const i = S.shop.stock.findIndex((x) => x.uid === uid);
  if (i < 0) return;
  const it = S.shop.stock[i];
  if (S.silver < it.price) { addLog('银两不够。', 'bad'); return; }
  if (S.bag.length >= 60) { addLog('行囊已满。', 'bad'); return; }
  S.silver -= it.price;
  S.shop.stock.splice(i, 1);
  S.bag.push(it);
  addLog('你买下【' + it.qname + '】' + it.name + '。', 'gold');
  save();
  renderAll();
}

function buyItem(id) {
  const p = POTION_BY_ID[id];
  if (!p) return;
  if (S.level < p.lv) { addLog('你还没到能用的境界。', 'bad'); return; }
  if (S.silver < p.price) { addLog('银两不够。', 'bad'); return; }
  S.silver -= p.price;
  S.potions[id] = (S.potions[id] || 0) + 1;
  addLog('你买了' + p.name + '。', 'sys');
  save();
  renderAll();
}

function shopCountdown() {
  const ms = Math.max(0, (S.shop.next || 0) - Date.now());
  const m = Math.ceil(ms / 60000);
  return m > 0 ? m + ' 分钟' : '即将刷新';
}

function checkNpcGift(id) {
  const npc = NPCS.find((n) => n.id === id);
  if (!npc || !npc.gift) return;
  const st = npcState(id);
  if (st.fav < 90 || S.codex.clothes[npc.gift]) return;
  S.codex.clothes[npc.gift] = true;
  const c = CLOTHES.find((x) => x.id === npc.gift);
  addLog('【' + npc.name + '】把' + c.name + '给了你。' + c.desc, 'gold');
  for (const sid of npc.skills || []) {
    if (ACTIVES.find((x) => x.id === sid)) {
      if (!S.learned.actives.includes(sid)) S.learned.actives.push(sid);
    } else if (PASSIVES.find((x) => x.id === sid)) {
      if (!S.learned.passives.includes(sid)) S.learned.passives.push(sid);
      if (!S.passiveLevels[sid]) S.passiveLevels[sid] = 1;
    }
  }
  addLog('你得了' + npc.name + '的绝学。', 'gold');
  save();
}

function monsterFor(mapIndex, level, isBoss) {
  const map = MAPS[mapIndex];
  const lv = clamp(level, map.min, map.max);
  const scale = 1 + (lv - map.min) * 0.055 + mapIndex * 0.06;
  const baseHp = (52 + mapIndex * 26) * scale * (isBoss ? 3.2 : 1);
  const baseAtk = (9 + mapIndex * 4.2) * scale * (isBoss ? 1.55 : 1);
  const baseDef = (3 + mapIndex * 2.1) * scale * (isBoss ? 1.4 : 1);
  const name = isBoss ? map.boss : pick(map.mobs);
  return {
    name,
    isBoss: !!isBoss,
    level: lv,
    hp: Math.round(baseHp),
    maxHp: Math.round(baseHp),
    atk: Math.round(baseAtk),
    def: Math.round(baseDef),
    exp: Math.round((14 + mapIndex * 12 + lv * 4.5) * (isBoss ? 4 : 1)),
    silver: Math.round((10 + mapIndex * 9 + lv * 2.2) * (isBoss ? 4 : 1)),
  };
}

function jiejingMonster(isBoss) {
  const tier = S.tier || 0;
  const t = TIER_ENEMIES[tier] || TIER_ENEMIES[1];
  const pw = powerScore(totalStats());
  const elite = !isBoss && Math.random() < 0.3;
  const name = isBoss ? t.boss : (elite ? t.elite : pick(t.mobs));
  const hp = Math.round((90 + pw * 0.85) * (1 + 0.55 * tier) * (isBoss ? 2 : elite ? 1.35 : 1));
  const atk = Math.round((12 + pw * 0.07) * (1 + 0.3 * tier) * (isBoss ? 1.3 : 1));
  return {
    name,
    isBoss: !!isBoss,
    level: S.level,
    hp,
    maxHp: hp,
    atk,
    def: Math.round(8 + pw * 0.05),
    exp: Math.round((30 + pw * 0.5) * (isBoss ? 4 : 1.5)),
    silver: Math.round((20 + pw * 0.25) * (isBoss ? 4 : 1.5)),
  };
}

const CHALLENGERS = [
  { name: '乔峰', side: '正道', line: '「听闻你近来名声不小，接我一掌。」' },
  { name: '段誉', side: '正道', line: '「得罪了，我只用一成功力。」' },
  { name: '虚竹', side: '正道', line: '「施主，得罪。」说完先念了声佛号。' },
  { name: '郭靖', side: '正道', line: '「你做的事，我听过。今日先试试你的斤两。」' },
  { name: '黄蓉', side: '正道', line: '「我可不跟你硬拼，小心脚下。」' },
  { name: '洪七公', side: '正道', line: '「小子，接一掌降龙十八掌。」' },
  { name: '张三丰', side: '正道', line: '「太极无招，你若懂，便接得住。」' },
  { name: '欧阳锋', side: '魔道', line: '「嘿嘿，让老夫看看你的筋骨。」' },
  { name: '金轮法王', side: '魔道', line: '「中原武林，也不过如此。」' },
  { name: '丁春秋', side: '魔道', line: '「好一副皮囊，留下来做我的药人吧。」' },
  { name: '李莫愁', side: '魔道', line: '「问世间情为何物——先问过我的拂尘。」' },
  { name: '任我行', side: '魔道', line: '「跪下，或者死。」' },
  { name: '东方不败', side: '魔道', line: '「绣花针也能要命，你信么。」' },
  { name: '鸠摩智', side: '魔道', line: '「小施主，借你一身内力一用。」' },
  { name: '岳不群', side: '魔道', line: '「君子剑在此，你还不束手？」' },
];

function challengerMonster() {
  const c = pick(CHALLENGERS);
  const pw = powerScore(totalStats());
  const m = monsterFor(S.mapIndex, S.level, true);
  m.name = c.name;
  m.isBoss = true;
  m.isChallenger = true;
  m.side = c.side;
  m.hp = Math.round((90 + pw * 1.0) * 1.1);
  m.maxHp = m.hp;
  m.atk = Math.round((14 + pw * 0.08) * 1.1);
  m.def = Math.round(8 + pw * 0.05);
  m.exp = Math.round((m.exp + pw * 0.5) * 1.5);
  m.silver = Math.round((m.silver + pw * 0.25) * 1.5);
  m.challengeLine = '【' + c.side + '】' + c.name + '拦在你面前：' + c.line;
  m.challengeClass = c.side === '正道' ? 'righteous' : 'evil';
  if (Math.random() < 0.5) m.trait = pick(TRAITS);
  return m;
}

function aliveFoes() {
  return (foes || []).filter((f) => f && f.hp > 0);
}

function syncMonster() {
  const a = aliveFoes();
  monster = a[0] || null;
  return monster;
}

function multiCount(isBoss) {
  if (isBoss) return 1;
  const r = Math.random();
  if (r < 0.08) return 5;
  if (r < 0.2) return 4;
  if (r < 0.4) return 3;
  if (r < 0.7) return 2;
  return 1;
}

function makeFoes(base, n) {
  const count = Math.max(1, n);
  if (count === 1) { base.spd = Math.round(totalStats().agi * 0.8); return [base]; }
  const st = totalStats();
  const scale = Math.pow(count, -0.55);
  const out = [];
  for (let i = 0; i < count; i++) {
    const f = Object.assign({}, base);
    f.hp = Math.round(base.maxHp * scale * (0.9 + Math.random() * 0.2));
    f.maxHp = f.hp;
    f.atk = Math.round(base.atk * scale);
    f.spd = Math.round(st.agi * (0.7 + Math.random() * 0.6));
    f.name = base.name + '·' + ['甲', '乙', '丙', '丁', '戊'][i];
    if (i > 0) f.trait = Math.random() < 0.15 ? pick(TRAITS) : null;
    out.push(f);
  }
  return out;
}

function spawnMonster() {
  battle.ally = {};
  if (S.tower && S.tower.active) {
    const base = towerMonster(S.tower.floor);
    const n = S.tower.floor < 5 ? 1 : multiCount(false);
    foes = makeFoes(base, base.isBoss ? 1 : n);
    monster = foes[0];
    monster.spd = Math.round(totalStats().agi * 0.9);
    addLog('第 ' + S.tower.floor + ' 层：' + monster.name +
      (foes.length > 1 ? '（' + foes.length + ' 人）' : '') + '。', 'sys');
    renderStatus();
    return;
  }
  if (S.dungeon && S.dungeon.active) {
    const base = dungeonMonster(S.dungeon.step);
    foes = makeFoes(base, S.dungeon.step < S.dungeon.total ? multiCount(false) : 1);
    monster = foes[0];
    addLog('秘境第 ' + S.dungeon.step + ' 阵：' + monster.name +
      (foes.length > 1 ? '（' + foes.length + ' 人）' : '') + '。', 'sys');
    renderStatus();
    return;
  }
  if (S.duel && S.duel.active) {
    const sec = SECTS.find((x) => x.id === S.duel.sectId);
    if (sec) {
      const pw = powerScore(totalStats());
      const m = monsterFor(S.mapIndex, Math.max(S.level, sec.lv), true);
      const mul = 1 + sec.req / 4000;
      m.name = sec.master;
      m.isBoss = true;
      m.hp = Math.round((80 + pw * 0.9) * mul);
      m.maxHp = m.hp;
      m.atk = Math.round((12 + pw * 0.07) * mul);
      m.def = Math.round(8 + pw * 0.05);
      m.spd = Math.round(totalStats().agi * 0.95);
      assignTrait(m, true);
      monster = m;
      foes = [m];
      renderStatus();
      return;
    }
  }
  const mapIndex = S.mapIndex;
  const wantBoss = S.kills > 0 && S.kills % 10 === 0 && !S.cleared[mapIndex];
  if (!wantBoss && S.kills > 5 && Math.random() < 0.025) {
    monster = challengerMonster();
    monster.spd = Math.round(totalStats().agi * 1.05);
    foes = [monster];
    battle.usedPot = 0;
    battle.potCd = 0;
    addLog(monster.challengeLine, monster.challengeClass || 'boss');
    renderStatus();
    return;
  }
  if (mapIndex === 10) {
    monster = jiejingMonster(wantBoss);
    assignTrait(monster, wantBoss);
    foes = makeFoes(monster, wantBoss ? 1 : multiCount(false));
    monster = foes[0];
    battle.usedPot = 0;
    battle.potCd = 0;
    addLog((wantBoss ? '【' + monster.name + '】现身劫境。' : '劫境中，你遇上了' + monster.name +
      (foes.length > 1 ? '等 ' + foes.length + ' 头异兽' : '') + '。'), wantBoss ? 'boss' : 'sys');
    renderStatus();
    return;
  }
  monster = monsterFor(mapIndex, S.level, wantBoss);
  if (wantBoss) {
    const pw = powerScore(totalStats());
    monster.hp = Math.round((80 + pw * 0.9) * 1.2);
    monster.maxHp = monster.hp;
    monster.atk = Math.round((12 + pw * 0.07) * 1.1);
    monster.def = Math.round(8 + pw * 0.05);
  }
  assignTrait(monster, wantBoss);
  foes = makeFoes(monster, wantBoss ? 1 : multiCount(false));
  monster = foes[0];
  battle.usedPot = 0;
  battle.potCd = 0;
  if (wantBoss) {
    addLog('【' + monster.name + '】挡在路前，杀气森然。', 'boss');
  } else {
    addLog('你遇上了' + monster.name + (foes.length > 1 ? '等 ' + foes.length + ' 人' : '') + '。', 'sys');
  }
  renderStatus();
}

function hitDamage(atk, def, level, opts) {
  const pierce = opts && opts.pierce ? opts.pierce : 0;
  const effDef = Math.max(0, def * (1 - pierce));
  const mitig = effDef / (effDef + 40 + level * 4);
  let dmg = atk * (1 - mitig) * rnd(0.88, 1.12);
  return Math.max(1, Math.round(dmg));
}

const TRAITS = [
  { id: 'armor', name: '重甲', desc: '非破防伤害 -60%' },
  { id: 'evade', name: '鬼影', desc: '25% 概率闪避' },
  { id: 'regen', name: '再生', desc: '每回合回复 3% 气血' },
  { id: 'thorns', name: '反伤', desc: '反弹 15% 伤害' },
  { id: 'berserk', name: '狂暴', desc: '气血越低攻击越高' },
];

function assignTrait(m, isBoss) {
  const chance = 0.15 + Math.min(0.2, (S.rebirth || 0) * 0.05);
  if (!isBoss && Math.random() > chance) return;
  m.trait = pick(TRAITS);
}

function partyAllies() {
  return (S.party || []).filter((id) => npcState(id).bond).slice(0, 4);
}

const ALLY_SKILLS = {
  axiu: { name: '绣针暗器', mult: 1.7 },
  shen: { name: '回风刀', mult: 1.9 },
  su: { name: '说书人的扇', mult: 1.5 },
  liu: { name: '黑市毒针', mult: 1.8 },
  lu: { name: '捕快刀法', mult: 1.8 },
  aheng: { name: '平安符', mult: 1.3 },
  qin: { name: '铁尺', mult: 1.8 },
  yan: { name: '飞贼身法', mult: 1.7 },
  su2: { name: '素手', mult: 1.5 },
  longnv: { name: '玉女剑法', mult: 2.0 },
  wangyuyan: { name: '指点', mult: 1.4 },
  zhaomin: { name: '绿柳刀法', mult: 1.9 },
  liqiushui: { name: '白虹掌力', mult: 2.0 },
  licanghai: { name: '雾中身法', mult: 1.8 },
  zhiruo: { name: '九阴爪', mult: 1.9 },
  huangrong: { name: '打狗棒法', mult: 1.8 },
  yingying: { name: '吸星大法', mult: 1.8 },
  susu: { name: '千蛛万毒手', mult: 1.9 },
  lucy: { name: '单分子线', mult: 2.0 },
};

const PET_SKILLS = {
  wolf: '撕咬', dog: '扑咬', cat: '扑爪', eagle: '俯冲', sparrow: '啄击', qingque: '轻啄',
};

function lowestFoe() {
  const a = aliveFoes();
  if (!a.length) return null;
  a.sort((x, y) => x.hp - y.hp);
  return a[0];
}

function allyUnit(id) {
  if (!battle.ally) battle.ally = {};
  const st = totalStats();
  const b = ALLY_BONUS[id] || {};
  const max = Math.round(st.hp * 0.5 * (1 + (b.hpPct || 0)));
  let u = battle.ally[id];
  if (!u || u.max !== max) {
    u = battle.ally[id] = { id, max, hp: max };
  }
  u.dead = u.hp <= 0;
  return u;
}

function partyTargets() {
  const out = [];
  if (battle.hp > 0) out.push({ k: 'player' });
  for (const id of partyAllies()) {
    const u = allyUnit(id);
    if (u.hp > 0) out.push({ k: 'ally', id, u });
  }
  return out;
}

function allyAttack(id, foe) {
  if (!foe) return;
  const st = totalStats();
  const b = ALLY_BONUS[id] || {};
  const u = allyUnit(id);
  // 有人残血：优先治疗
  const wounded = partyTargets().filter((t) => {
    const hp = t.k === 'player' ? battle.hp : t.u.hp;
    const max = t.k === 'player' ? st.hp : t.u.max;
    return hp / max < 0.4;
  });
  if (wounded.length && Math.random() < 0.45) {
    wounded.sort((a, c) => (a.k === 'player' ? battle.hp / st.hp : a.u.hp / a.u.max) - (c.k === 'player' ? battle.hp / st.hp : c.u.hp / c.u.max));
    const t = wounded[0];
    if (t.k === 'player') {
      const heal = Math.round(st.hp * 0.08);
      battle.hp = Math.min(st.hp, battle.hp + heal);
      addLog('「' + npcName(id) + '」替你疗伤，你回复 ' + heal + ' 点气血。', 'good');
    } else {
      const heal = Math.round(t.u.max * 0.15);
      t.u.hp = Math.min(t.u.max, t.u.hp + heal);
      addLog('「' + npcName(id) + '」替' + npcName(t.id) + '包扎，回复 ' + heal + ' 点气血。', 'good');
    }
    return;
  }
  if (foe.trait && foe.trait.id === 'evade' && Math.random() < 0.25) {
    addLog('「' + npcName(id) + '」的攻势被' + foe.name + '闪开了。', 'sys');
    return;
  }
  const sk = ALLY_SKILLS[id];
  const useSkill = sk && Math.random() < 0.3;
  const crit = Math.random() * 100 < (st.crit * 0.5 + (b.crit || 0));
  let dmg = hitDamage(st.atk * 0.3 * (useSkill ? sk.mult : 1) * (1 + (b.atkPct || 0)), foe.def, S.level, { pierce: b.pierce || 0 });
  if (crit) dmg = Math.round(dmg * (st.critDmg / 100));
  if (foe.trait && foe.trait.id === 'armor' && !b.pierce) dmg = Math.round(dmg * 0.4);
  foe.hp -= dmg;
  addLog('「' + npcName(id) + '」' + (useSkill ? '使出「' + sk.name + '」' : '出手') +
    '，对' + foe.name + '造成 ' + dmg + ' 点伤害' + (crit ? '（暴击）' : '') + '。', 'good');
  if (foe.hp <= 0) addLog(foe.name + '倒下了。', 'good');
  if (foe.trait && foe.trait.id === 'thorns') {
    const back = Math.max(1, Math.round(dmg * 0.15));
    u.hp = Math.max(0, u.hp - back);
    addLog('反伤：「' + npcName(id) + '」受到 ' + back + ' 点伤害。', 'sys');
    if (u.hp <= 0 && !u.dead) { u.dead = true; addLog('「' + npcName(id) + '」倒下了。', 'bad'); }
  }
}

function petAttack(foe) {
  if (!S.petActive || !S.pets[S.petActive] || !foe) return;
  const p = PETS.find((x) => x.id === S.petActive);
  if (!p) return;
  const st = totalStats();
  const lv = S.pets[S.petActive].level || 1;
  const crit = Math.random() * 100 < st.crit * 0.3;
  let dmg = hitDamage(st.atk * 0.12 * (1 + lv * 0.03), foe.def, S.level, {});
  if (crit) dmg = Math.round(dmg * (st.critDmg / 100));
  foe.hp -= dmg;
  addLog('「' + p.name + '」' + (PET_SKILLS[p.id] || '扑击') + '，对' + foe.name + '造成 ' + dmg + ' 点伤害' + (crit ? '（暴击）' : '') + '。', 'good');
  if (foe.hp <= 0) addLog(foe.name + '倒下了。', 'good');
}

function playerAttack(foe) {
  if (!foe) return;
  const st = totalStats();
  if (S.dungeon && S.dungeon.space === 'liaozhai' && (S.dungeon.sanity || 100) < 30 && Math.random() < 0.25) {
    const self = Math.round(st.atk * 0.6);
    battle.hp = Math.max(1, battle.hp - self);
    addLog('鬼迷心窍：你一剑划向自己，受到 ' + self + ' 点伤害。', 'bad');
    return;
  }
  const opts = { pierce: st.pierce / 100 };
  let usedSkill = null;

  for (let i = 0; i < S.activeEquip.length; i++) {
    const id = S.activeEquip[i];
    if (!id) continue;
    const sk = ACTIVES.find((x) => x.id === id);
    if (!sk) continue;
    const cd = battle.cds[id] || 0;
    if (cd > 0) { battle.cds[id] = cd - 1; continue; }
    if (battle.mp < sk.cost) continue;
    battle.mp -= sk.cost;
    battle.cds[id] = sk.cd;
    usedSkill = sk;
    break;
  }

  if (usedSkill && usedSkill.heal) {
    const heal = Math.round(st.hp * usedSkill.heal);
    battle.hp = Math.min(st.hp, battle.hp + heal);
    addLog('你运起「' + usedSkill.name + '」，气血回复 ' + heal + ' 点。', 'good');
    return;
  }

  if (usedSkill && usedSkill.buff) {
    S.buffs.push({ id: usedSkill.id, stat: 'atk', mult: usedSkill.buff.atk || 0, rounds: usedSkill.buff.rounds || 3 });
    addLog('你运起「' + usedSkill.name + '」，气势陡增。', 'good');
    return;
  }

  const power = usedSkill ? usedSkill.power * (1 + st.skillPower / 100) * (1 + (skillQ(usedSkill.id) - 1) * 0.15) : 1;
  if (foe.trait && foe.trait.id === 'evade' && Math.random() < 0.25) {
    addLog(foe.name + '身形一晃，你这一剑落空了。', 'sys');
    return;
  }
  const crit = Math.random() * 100 < st.crit;
  let dmg = hitDamage(st.atk * power, foe.def, S.level, usedSkill && usedSkill.pierce ? { pierce: usedSkill.pierce } : opts);
  if (crit) dmg = Math.round(dmg * (st.critDmg / 100));
  if (foe.trait && foe.trait.id === 'armor' && !(usedSkill && usedSkill.pierce)) dmg = Math.round(dmg * 0.4);

  let legendBoss = 0;
  let legendMp = 0;
  for (const L of LEGENDARIES) {
    if (!S.codex.legend[L.id]) continue;
    legendBoss += L.bossDamage || 0;
    legendMp += L.critMp || 0;
  }
  if (legendBoss) dmg = Math.round(dmg * (1 + legendBoss));
  if (crit && legendMp) battle.mp = Math.min(st.mp, battle.mp + legendMp);

  const label = usedSkill ? '你使出「' + usedSkill.name + '」' : '你一剑递出';
  addLog(label + '，对' + foe.name + '造成 ' + dmg + ' 点伤害' + (crit ? '（暴击）' : '') + '。', crit ? 'gold' : '');

  foe.hp -= dmg;
  if (foe.hp <= 0) addLog(foe.name + '倒下了。', 'good');
  if (foe.trait && foe.trait.id === 'thorns') {
    const back = Math.max(1, Math.round(dmg * 0.15));
    battle.hp = Math.max(1, battle.hp - back);
    addLog('反伤：你受到 ' + back + ' 点伤害。', 'sys');
  }
  if (usedSkill && usedSkill.healOnHit) {
    const heal = Math.round(st.hp * usedSkill.healOnHit);
    battle.hp = Math.min(st.hp, battle.hp + heal);
    addLog('剑意回护，你回复 ' + heal + ' 点气血。', 'good');
  }
  if (st.lifesteal > 0) {
    const heal = Math.max(1, Math.round(dmg * st.lifesteal / 100));
    battle.hp = Math.min(st.hp, battle.hp + heal);
  }
  if (st.block > 0 && Math.random() * 100 < st.block) {
    addLog('你横剑格挡，卸去几分来势。', 'sys');
  }
}

function foeAttack(foe, unit) {
  const st = totalStats();
  if (!unit) return;
  if (unit.k === 'player') {
    if (Math.random() * 100 < st.dodge) {
      addLog('你侧身避开' + foe.name + '的攻势。', 'sys');
      return;
    }
    if (Math.random() * 100 > st.hit) {
      addLog(foe.name + '的招式落了空。', 'sys');
      return;
    }
    let atk = foe.atk;
    if (foe.trait && foe.trait.id === 'berserk') atk = Math.round(atk * (1 + (1 - foe.hp / foe.maxHp) * 0.6));
    let dmg = hitDamage(atk, st.def, foe.level, null);
    dmg = Math.round(dmg * (1 - st.dmgReduce / 100));
    battle.hp -= dmg;
    addLog(foe.name + '还了一手，你受到 ' + dmg + ' 点伤害。', 'bad');
    if (st.thorns > 0) {
      const back = Math.max(1, Math.round(dmg * st.thorns / 100));
      foe.hp -= back;
      addLog('反伤：' + foe.name + '受到 ' + back + ' 点伤害。', 'sys');
    }
    return;
  }
  // 打队友
  const u = unit.u;
  if (Math.random() * 100 < 5) {
    addLog(foe.name + '扑向' + npcName(unit.id) + '，被她闪开了。', 'sys');
    return;
  }
  let atk = foe.atk;
  if (foe.trait && foe.trait.id === 'berserk') atk = Math.round(atk * (1 + (1 - foe.hp / foe.maxHp) * 0.6));
  let dmg = hitDamage(atk, Math.round(st.def * 0.6), foe.level, null);
  u.hp = Math.max(0, u.hp - dmg);
  addLog(foe.name + '攻向' + npcName(unit.id) + '，她受到 ' + dmg + ' 点伤害。', 'bad');
  if (u.hp <= 0 && !u.dead) {
    u.dead = true;
    addLog('「' + npcName(unit.id) + '」倒下了。', 'bad');
  }
}

function tick() {
  if (S.ending || S.paused || !S.created || S.eventOpen) return;
  const st = totalStats();
  battle.mp = Math.min(st.mp, battle.mp + st.mpRegen);
  if (battle.potCd > 0) battle.potCd -= 1;
  syncMonster();
  if (!monster) spawnMonster();

  autoUsePotion();

  // 本回合行动顺序：按身法从高到低
  const actors = [];
  if (battle.hp > 0) actors.push({ k: 'player', spd: st.agi });
  for (const id of partyAllies()) {
    const u = allyUnit(id);
    if (u.hp > 0) actors.push({ k: 'ally', id, u, spd: Math.round(st.agi * 0.9) });
  }
  if (S.petActive && S.pets[S.petActive]) {
    actors.push({ k: 'pet', spd: Math.round(st.agi * 0.75) });
  }
  for (const f of aliveFoes()) {
    actors.push({ k: 'foe', f, spd: f.spd || Math.round(st.agi * 0.8) });
  }
  actors.sort((a, b) => b.spd - a.spd || Math.random() - 0.5);

  for (const a of actors) {
    if (battle.hp <= 0 || aliveFoes().length === 0) break;
    if (a.k === 'player') {
      playerAttack(lowestFoe());
    } else if (a.k === 'ally') {
      if (a.u.hp > 0) allyAttack(a.id, lowestFoe());
    } else if (a.k === 'pet') {
      petAttack(lowestFoe());
    } else if (a.f.hp > 0) {
      const targets = partyTargets();
      if (!targets.length) break;
      let t;
      if (targets.length === 1) t = targets[0];
      else {
        const allies = targets.filter((x) => x.k === 'ally');
        t = allies.length && Math.random() < 0.55 ? pick(allies) : (Math.random() < 0.5 ? targets[0] : pick(targets));
      }
      foeAttack(a.f, t);
    }
  }

  if (aliveFoes().length === 0) onMonsterKilled();
  syncMonster();
  for (const f of aliveFoes()) {
    if (f.trait && f.trait.id === 'regen') {
      f.hp = Math.min(f.maxHp, f.hp + Math.round(f.maxHp * 0.03));
    }
  }
  if (battle.hp <= 0) onPlayerDown();

  for (const b of S.buffs) b.rounds -= 1;
  S.buffs = S.buffs.filter((b) => b.rounds > 0);

  renderBars();
  renderHud();
  renderStatus();
  renderPartyStatus();
  save();
}

function onMonsterKilled() {
  if (S.tower && S.tower.active) {
    winTower();
    return;
  }
  if (S.duel && S.duel.active) {
    winSectDuel();
    return;
  }
  if (S.dungeon.active) {
    handleDungeonKill();
    return;
  }
  const m = monster;
  S.stats.kills += 1;
  S.kills += 1;
  bountyAdd('kill', 1);
  const rm = rewardMul();
  const gainExp = Math.round(m.exp * rm.exp * 2.2);
  const gainSilver = Math.round(m.silver * rm.silver * 2.2);
  S.exp += gainExp;
  S.silver += gainSilver;
  addLog('你斩了' + m.name + '，得经验 ' + gainExp + '，银两 ' + gainSilver + '。', 'good');

  if (S.mapIndex === 10) {
    const tier = S.tier || 0;
    const pool = tier <= 1 ? ['yaodan', 'yaodan', 'shougu']
      : tier === 2 ? ['yaodan', 'shougu', 'guihuo']
        : tier <= 4 ? ['guihuo', 'leisui', 'yaodan', 'shougu']
          : ['hundun', 'leisui', 'guihuo', 'yaodan', 'shougu'];
    if (Math.random() < (m.isBoss ? 1 : 0.35)) {
      const k = pick(pool);
      const n = m.isBoss ? 2 : 1;
      S.mats = S.mats || {};
      S.mats[k] = (S.mats[k] || 0) + n;
      addLog('拾得材料：' + matName(k) + ' ×' + n + '。', 'gold');
    }
  }

  // 玄晶 / 神兵碎片
  if (Math.random() < (m.isBoss ? 0.03 : 0.001)) {
    S.xuanjing += m.isBoss ? 2 : 1;
    addLog('你拾到一枚玄晶。', 'gold');
  }
  if (m.isBoss && Math.random() < 0.1) {
    S.shards += 1;
    addLog('首领身上掉下一片神兵碎片。', 'gold');
  }

  // 装备掉落（挂机主要产出）
  if (m.isBoss) {
    dropItem(true);
    if (Math.random() < 0.5) dropItem(true);
  } else if (Math.random() < 0.55 * (1 + rm.drop)) {
    dropItem(false);
  }
  if (Math.random() < (m.isBoss ? 1 : 0.12) * (1 + rm.drop)) dropPotion(m.isBoss);
  if (Math.random() < (m.isBoss ? 0.9 : 0.16) * (1 + rm.drop)) dropPage();

  if (m.isChallenger) {
    S.stats.challWin = (S.stats.challWin || 0) + 1;
    addLog(m.name + '收了招式，抱拳退去。', m.challengeClass || 'story');
    if (Math.random() < 0.2) { S.xuanjing = (S.xuanjing || 0) + 1; addLog('他留下了一枚玄晶。', 'gold'); }
  }

  if (m.isAfterBoss && m.afterId) {
    S.afterBoss = S.afterBoss || {};
    S.afterBoss[m.afterId] = true;
    const b = AFTERBOSSES.find((x) => x.id === m.afterId);
    if (b) {
      S.xuanjing = (S.xuanjing || 0) + b.xj;
      S.silver += b.silver;
      addLog('后日谈了结【' + b.name + '】：' + b.text + '（玄晶 +' + b.xj + '，银两 +' + b.silver + '）', 'story');
    }
  }

  if (m.isWeekly) {
    ensureWeek().done = true;
    S.xuanjing = (S.xuanjing || 0) + 5;
    S.silver += 5000;
    addLog('本周挑战达成：玄晶 +5，银两 +5000。', 'gold');
  }

  if (m.isTianjie) {
    S.tier = (S.tier || 0) + 1;
    const t = TIERS[S.tier];
    addLog('天劫已过！道途晋为「' + t.name + '」，攻防气血 +8%。', 'gold');
    if (S.tier >= 6) addLog('你已飞升。此界再无敌手，只剩天边一线白。', 'gold');
  }

  if (m.isBoss && !m.isChallenger && !m.isWeekly && !m.isAfterBoss && !m.isTianjie) {
    S.bossCount += 1;
    bountyAdd('boss', 1);
    S.cleared[S.mapIndex] = true;
    S.tokens = Math.min(5, (S.tokens || 0) + 1);
    const map = MAPS[S.mapIndex];
    addLog(map.outro, 'story');
    if (S.mapIndex < MAPS.length - 1) {
      addLog('前路已开：' + MAPS[S.mapIndex + 1].name + '。', 'gold');
    }
    maybeUnlockPassive();
    if (S.mapIndex === MAPS.length - 1 && S.level >= MAX_LEVEL) {
      showEndingChoice();
    }
  }

  levelUpIfNeeded();
  checkFinal();
  monster = null;
  checkTitles();
  if (S.stats.kills % 15 === 0 && !S.eventOpen) petEncounter();
  if (S.codex.legend.yitian && S.codex.legend.tulong && !S.flags.swordSong && !S.eventOpen) {
    S.flags.swordSong = true;
    showEvent(EVENTS.find((e) => e.id === 'swordsong'));
  }
  maybeEvent(m);
  maybeRevenge();
  renderAll();
}

/* ------------------------------------------------------------ 随机奇遇 */

function maybeEvent(m) {
  if (m.isBoss || S.eventOpen) return;
  if (S.kills % 7 !== 0) return;
  if (Math.random() > 0.5) return;
  const ev = pick(EVENTS);
  S.eventOpen = true;
  save();
  renderStatus();
  renderAll();
  showEvent(ev);
}

function maybeRevenge() {
  if (!S.flags.rescued || S.flags.revengeDone || S.eventOpen) return;
  if (S.stats.kills < (S.flags.revengeAt || 999999)) return;
  const ev = EVENTS.find((e) => e.id === 'revenge');
  if (!ev) return;
  S.eventOpen = true;
  save();
  renderStatus();
  renderAll();
  showEvent(ev);
}

let eventTimer = null;

function eventAutoIndex(ev) {
  const h = S.honor || 0;
  let best = 0;
  let bestScore = null;
  ev.options.forEach((o, i) => {
    const e = o.effect || {};
    let sc = e.honor || 0;
    if (e.rescue === 'save') sc += 15;
    else if (e.rescue === 'watch') sc -= 15;
    else if (e.rescue === 'rob') sc -= 25;
    if (e.revenge === 'fight') sc += 5;
    if (h < 0) sc = -sc;
    if (bestScore === null || sc > bestScore) { bestScore = sc; best = i; }
  });
  return best;
}

function showEvent(ev) {
  showModal(
    '<h2>奇遇 · ' + ev.title + '</h2><p class="story-text">' + escapeHtml(ev.text) + '</p>' +
    ev.options.map((o, i) => '<button class="choice" data-ev="' + i + '">' + escapeHtml(o.label) + '</button>').join('') +
    '<p class="muted">45 秒不选，会依你的侠义之心自动决定。</p>'
  );
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-ev]').forEach((b) => b.addEventListener('click', () => resolveEvent(ev, +b.dataset.ev)));
  clearTimeout(eventTimer);
  eventTimer = setTimeout(() => {
    if (!S.eventOpen) return;
    addLog('你久未决断，依侠义之心做了选择。', 'sys');
    resolveEvent(ev, eventAutoIndex(ev));
  }, 45000);
}

function resolveEvent(ev, idx) {
  clearTimeout(eventTimer);
  eventTimer = null;
  const opt = ev.options[idx];
  const eff = opt.effect || {};
  if (opt.cost) {
    if (S.silver < opt.cost) { addLog('银两不够。', 'bad'); return; }
    S.silver -= opt.cost;
  }
  if (eff.rescue) {
    if (eff.rescue === 'save') {
      addHonor(15);
      S.flags.rescued = true;
      S.flags.revengeAt = S.stats.kills + 20;
      addLog('你救下了她。她叫阿蘅，就住在青石村。', 'gold');
    } else if (eff.rescue === 'watch') {
      addHonor(-15);
    } else if (eff.rescue === 'rob') {
      addHonor(-25);
      S.silver += 120;
    }
  } else if (eff.revenge) {
    if (eff.revenge === 'fight') {
      battle.hp = Math.max(1, battle.hp - totalStats().hp * 0.15);
      addHonor(5);
      S.silver += 80;
      addLog('你捡起他们掉下的钱袋，里面有些碎银。', 'gold');
    } else {
      S.silver = Math.max(0, S.silver - 80);
    }
    S.flags.revengeDone = true;
  } else if (eff.hero) {
    S.exp += 300;
    S.silver += 1500;
    addHonor(10);
    addLog('你记住了那句话。', 'story');
  } else if (eff.gamble) {
    if (Math.random() < 0.5) {
      S.silver += 120;
      addLog('老头摊开手：空的。你赢了 120 两。', 'gold');
    } else {
      addLog('他手里有一枚铜钱。你输了 50 两。', 'bad');
    }
  } else {
    if (eff.silver) S.silver = Math.max(0, S.silver + eff.silver);
    if (eff.exp) S.exp += eff.exp;
    if (eff.hp) battle.hp = Math.max(1, battle.hp - eff.hp);
    if (eff.harmony) battle.hp = Math.min(totalStats().hp, battle.hp + totalStats().hp * 0.1);
    if (eff.heal) battle.hp = totalStats().hp;
    if (eff.honor) addHonor(eff.honor);
    if (eff.item) {
      const it = generateItem(pick(Object.keys(SLOTS)), S.level, weightedQuality(false));
      if (S.bag.length < 40) {
        S.bag.push(it);
        addLog('获得【' + it.qname + '】' + it.name + '。', 'gold');
      } else {
        addLog('行囊已满，只好作罢。', 'sys');
      }
    }
  }
  if (opt.reply) addLog(opt.reply, 'story');
  S.eventOpen = false;
  hideModal();
  levelUpIfNeeded();
  save();
  renderAll();
}

/* ------------------------------------------------------------ 爬塔 */

function towerMonster(floor) {
  const isBoss = floor % 10 === 0;
  const pw = powerScore(totalStats());
  const m = monsterFor(S.mapIndex, S.level, isBoss);
  m.name = isBoss ? '塔主' : '守塔人';
  const mul = 1 + 0.18 * (floor - 1);
  m.hp = Math.round((40 + pw * 0.6) * mul * (isBoss ? 1.4 : 1));
  m.maxHp = m.hp;
  m.atk = Math.round((5 + pw * 0.04) * (1 + 0.1 * (floor - 1)));
  m.def = Math.round(4 + pw * 0.04);
  m.exp = Math.round((m.exp + pw * 0.5) * (1 + floor * 0.2));
  m.silver = Math.round((m.silver + pw * 0.25) * (1 + floor * 0.15));
  m.isBoss = isBoss;
  assignTrait(m, isBoss);
  return m;
}

function startTower() {
  if (S.tower.active) return;
  if (S.dungeon.active || (S.duel && S.duel.active)) { addLog('你正忙着。', 'bad'); return; }
  S.tower = { active: true, floor: 1 };
  battle.hp = totalStats().hp;
  battle.mp = totalStats().mp;
  battle.usedPot = 0;
  battle.potCd = 0;
  S.buffs = [];
  monster = null;
  addLog('你推开塔门。第 1 层，守塔人已经站在那里。', 'boss');
  spawnMonster();
  save();
  renderAll();
}

function winTower() {
  const floor = S.tower.floor;
  S.exp += monster.exp;
  S.silver += monster.silver;
  addLog('第 ' + floor + ' 层清空。', 'good');
  if (floor % 5 === 0) { S.xuanjing = (S.xuanjing || 0) + 1; addLog('第 ' + floor + ' 层奖励：1 枚玄晶。', 'gold'); }
  if (floor % 10 === 0) { S.shards = (S.shards || 0) + 1; addLog('第 ' + floor + ' 层奖励：1 片神兵碎片。', 'gold'); }
  S.towerBest = Math.max(S.towerBest || 0, floor);
  S.tower.floor = floor + 1;
  levelUpIfNeeded();
  monster = null;
  save();
  spawnMonster();
  renderAll();
}

function loseTower() {
  const floor = S.tower.floor;
  S.towerBest = Math.max(S.towerBest || 0, floor - 1);
  S.tower = { active: false, floor: 1 };
  battle.hp = Math.round(totalStats().hp * 0.5);
  addLog('你在第 ' + floor + ' 层倒下。最高纪录：第 ' + S.towerBest + ' 层。', 'bad');
  monster = null;
  save();
  spawnMonster();
  renderAll();
}

function panelTower() {
  const best = S.towerBest || 0;
  if (S.tower && S.tower.active) {
    return '<h3>爬塔</h3>' + kv('当前层', S.tower.floor) + kv('最高层', best) +
      '<div class="muted">胜利自动进下一层；死亡结束，记录保留。</div>' +
      '<div style="margin:8px 0"><button class="danger" data-tower-quit="1">放弃爬塔</button></div>';
  }
  return '<h3>爬塔</h3>' + kv('最高层', best) +
    '<div class="muted">无限层，每层属性 ×1.18；每 5 层给玄晶，每 10 层给神兵碎片。</div>' +
    '<div style="margin:8px 0"><button class="primary" data-tower="1">开始爬塔（第 1 层）</button></div>';
}

function failTianjie() {
  const loss = Math.min(3, Math.max(0, S.level - 1));
  S.level = Math.max(1, S.level - loss);
  S.exp = 0;
  const st = totalStats();
  battle.hp = Math.round(st.hp * 0.5);
  battle.mp = st.mp;
  addLog('天劫失败：道行受损，连落 ' + loss + ' 级。稳住再来。', 'bad');
  monster = null;
  foes = [];
  save();
  spawnMonster();
  renderAll();
}

function onPlayerDown() {
  if (monster && monster.isTianjie) {
    failTianjie();
    return;
  }
  if (S.tower && S.tower.active) {
    loseTower();
    return;
  }
  if (S.duel && S.duel.active) {
    loseSectDuel();
    return;
  }
  if (S.dungeon.active) {
    finishDungeon(false);
    return;
  }
  S.stats.deaths += 1;
  const loss = Math.round(S.silver * 0.1);
  S.silver = Math.max(0, S.silver - loss);
  battle.hp = Math.round(totalStats().hp * 0.5);
  addLog('你眼前一黑，被路过的人拖回村里。损失银两 ' + loss + '。', 'bad');
  save();
  renderAll();
}

function levelUpIfNeeded() {
  while (S.level < MAX_LEVEL && S.exp >= expNeed(S.level)) {
    if (S.level % 10 === 9) {
      S.exp = expNeed(S.level);
      addLog('修为已满，需在「属性」里突破。', 'gold');
      break;
    }
    S.exp -= expNeed(S.level);
    S.level += 1;
    S.base.hp += 20;
    S.base.atk += 3;
    S.base.def += 2;
    S.base.agi += 1;
    S.base.mp += 5;
    if (S.level % 10 === 0) S.points += 1;
    battle.hp = totalStats().hp;
    battle.mp = totalStats().mp;
    addLog('你突破了，境界提升至 ' + S.level + ' 级。' + (S.level % 10 === 0 ? '（获得 1 点自由属性）' : ''), 'gold');
    const map = currentMap();
    if (S.level >= map.max) {
      addLog('此地已难再长进，去更远的地方看看吧。', 'sys');
    }
  }
  if (S.level >= MAX_LEVEL && S.exp >= 10000) {
    const gain = Math.floor(S.exp / 10000);
    S.exp -= gain * 10000;
    S.xuanjing = (S.xuanjing || 0) + gain;
    addLog('满级后溢出的修为凝成玄晶：+' + gain + ' 枚。', 'gold');
  }
}

function checkFinal() {
  if (S.level >= MAX_LEVEL && !S.ending) {
    const map = MAPS[MAPS.length - 1];
    if (S.cleared[MAPS.length - 1] && !S.ending) {
      /* 最终 BOSS 击破时已弹结局 */
    }
  }
}

function currentMap() {
  return MAPS[S.mapIndex];
}

/* ------------------------------------------------------------ 装备 */

function itemLevelTier(lv) {
  return Math.min(5, Math.floor((lv - 1) / 20));
}

function baseItemName(slot, lv) {
  const t = itemLevelTier(lv);
  if (slot === 'weapon') return WEAPON_NAMES[t];
  if (slot === 'armor') return ARMOR_NAMES[t];
  if (slot === 'helmet') return HELMET_NAMES[t];
  if (slot === 'boots') return BOOTS_NAMES[t];
  return ACC_NAMES[Math.min(ACC_NAMES.length - 1, t)];
}

function generateItem(slot, lv, quality) {
  const q = quality || weightedQuality(false);
  const ilvl = clamp(lv, 1, MAX_LEVEL);
  const base = {};
  if (slot === 'weapon') base.atk = Math.round((4 + ilvl * 1.7) * q.mult);
  if (slot === 'armor') {
    base.def = Math.round((3 + ilvl * 1.05) * q.mult);
    base.hp = Math.round((10 + ilvl * 4) * q.mult);
  }
  if (slot === 'helmet') {
    base.def = Math.round((2 + ilvl * 0.9) * q.mult);
    base.hp = Math.round((8 + ilvl * 3) * q.mult);
  }
  if (slot === 'boots') {
    base.agi = Math.round((1 + ilvl * 0.3) * q.mult);
    base.hp = Math.round((6 + ilvl * 2) * q.mult);
  }
  if (slot === 'accessory') {
    base.hp = Math.round((8 + ilvl * 2.2) * q.mult);
    base.agi = Math.round((1 + ilvl * 0.25) * q.mult);
  }
  const affixes = [];
  const keys = Object.keys(AFFIXES);
  const used = new Set();
  for (let i = 0; i < q.affixes; i++) {
    let k = pick(keys);
    let guard = 0;
    while (used.has(k) && guard++ < 30) k = pick(keys);
    used.add(k);
    affixes.push({ k, v: AFFIXES[k].roll(ilvl) });
  }
  return {
    uid: Math.random().toString(36).slice(2, 9),
    slot,
    quality: q.k,
    qname: q.name,
    qcls: q.cls,
    name: baseItemName(slot, ilvl),
    ilvl,
    base,
    affixes,
  };
}

function dropItem(isBoss) {
  const slots = Object.keys(SLOTS);
  const slot = pick(slots);
  const q = weightedQuality(isBoss);
  const item = generateItem(slot, S.level, q);
  if (S.autoSellWhite && item.quality === 'white') {
    const price = sellPrice(item);
    S.silver += price;
    addLog('（白装自动卖店 +' + price + ' 两）', 'sys');
    return;
  }
  if (S.bag.length >= 60) {
    addLog('行囊已满，你丢下了' + item.name + '。', 'sys');
    return;
  }
  S.bag.push(item);
  addLog('获得【' + q.name + '】' + item.name + '。', 'gold');
}

function dropPotion(isBoss) {
  const pool = POTIONS.filter((p) => p.lv <= S.level);
  if (!pool.length) return;
  const p = pick(pool);
  const n = isBoss ? 2 : 1;
  S.potions[p.id] = (S.potions[p.id] || 0) + n;
  addLog('拾得' + p.name + '×' + n + '。', 'gold');
}

/* ------------------------------------------------------------ 秘境与图鉴掉落 */

function dungeonMod() {
  return DUNGEON_MODS.find((m) => m.id === (S.dungeon && S.dungeon.mod)) || null;
}

function dungeonMonster(step) {
  const mod = dungeonMod();
  const isBoss = step >= S.dungeon.total;
  const m = monsterFor(S.mapIndex, S.level, isBoss);
  const db = S.dungeon.other && S.dungeon.space === 'dragonball';
  const neon = S.dungeon.other && S.dungeon.space === 'neon';
  const liao = S.dungeon.other && S.dungeon.space === 'liaozhai';
  if (db) {
    m.name = DB_FLOORS[Math.min(DB_FLOORS.length - 1, step - 1)];
    m.isBoss = isBoss;
  } else if (liao) {
    m.name = LIAO_FLOORS[Math.min(LIAO_FLOORS.length - 1, step - 1)];
    m.isBoss = isBoss;
  } else if (neon) {
    m.name = NEON_FLOORS[Math.min(NEON_FLOORS.length - 1, step - 1)];
    m.isBoss = isBoss;
  } else if (S.dungeon.other) {
    const w = OVERWORLDS.find((x) => x.id === (S.dungeon.space || 'zombie')) || OVERWORLDS[0];
    m.name = isBoss ? w.boss : pick(w.mobs);
  } else {
    m.name = isBoss ? '秘境守卫' : '秘境游魂';
  }
  const floorRate = db ? 0.24 : neon ? 0.22 : liao ? 0.2 : 0.2;
  const pw = powerScore(totalStats());
  const mul = ((mod && mod.mult) || 1) * (1 + floorRate * (step - 1));
  const wave = isBoss ? 1 : 0.85;
  m.hp = Math.round((70 + pw * 0.85) * wave * mul * (isBoss ? 1.45 : 1));
  m.maxHp = m.hp;
  m.atk = Math.round((10 + pw * 0.065) * wave * (1 + floorRate * 0.55 * (step - 1)) * ((mod && mod.mult) || 1));
  m.def = Math.round(6 + pw * 0.05);
  if (mod && mod.defMult) m.def = Math.round(m.def * mod.defMult);
  m.exp = Math.round((m.exp + pw * 0.4) * (1 + 0.15 * (step - 1)) * (db ? 2.2 : neon ? 1.9 : 1.6));
  m.silver = Math.round((m.silver + pw * 0.2) * (1 + 0.12 * (step - 1)) * (db ? 2 : neon ? 1.8 : 1.5));
  assignTrait(m, isBoss);
  return m;
}

function startDungeon() {
  if (S.dungeon.active) return;
  if (!S.created) return;
  if (S.tokens <= 0) { addLog('没有挑战令了——打本图首领、或等明天。', 'bad'); return; }
  S.tokens -= 1;
  const total = 5 + Math.min(15, S.rebirth || 0);
  S.dungeon = { active: true, step: 1, total, mod: pick(DUNGEON_MODS).id };
  battle.hp = totalStats().hp;
  battle.mp = totalStats().mp;
  battle.usedPot = 0;
  battle.potCd = 0;
  S.buffs = [];
  const mod = dungeonMod();
  addLog('你踏进秘境，共 ' + total + ' 层。' + (mod ? '【' + mod.name + '】' + mod.desc : ''), 'boss');
  monster = null;
  spawnMonster();
  save();
  renderAll();
}

function handleDungeonKill() {
  const mod = dungeonMod();
  const mul = (mod && mod.reward) || 1;
  S.exp += Math.round(monster.exp * mul);
  S.silver += Math.round(monster.silver * mul);
  addLog('你斩了' + monster.name + '。', 'good');
  if (S.dungeon.space === 'liaozhai') {
    S.dungeon.sanity = Math.max(0, (S.dungeon.sanity || 100) - 12);
    if (S.dungeon.sanity < 30) addLog('阴气侵体，你有些分不清眼前的人是谁了。（理智 ' + S.dungeon.sanity + '）', 'bad');
  }
  if (Math.random() < 0.4) dropItem(false);
  if (S.dungeon.other && Math.random() < 0.05) dropRelic();
  if (S.dungeon.step >= S.dungeon.total) {
    finishDungeon(true);
    return;
  }
  S.dungeon.step += 1;
  levelUpIfNeeded();
  monster = null;
  spawnMonster();
  renderAll();
}

const ACHIEVEMENTS = [
  { id: 'k10', name: '初露锋芒', desc: '击杀 10 个敌人', cond: () => S.stats.kills >= 10, silver: 500, xj: 1 },
  { id: 'k100', name: '小有名气', desc: '击杀 100 个敌人', cond: () => S.stats.kills >= 100, silver: 2000, xj: 2 },
  { id: 'k1000', name: '杀人如麻', desc: '击杀 1000 个敌人', cond: () => S.stats.kills >= 1000, silver: 8000, xj: 5 },
  { id: 'k10000', name: '血流成河', desc: '击杀 10000 个敌人', cond: () => S.stats.kills >= 10000, silver: 30000, xj: 15 },
  { id: 'boss10', name: '屠首十人', desc: '击败 10 个首领', cond: () => (S.bossCount || 0) >= 10, silver: 3000, xj: 3 },
  { id: 'boss100', name: '百首之威', desc: '击败 100 个首领', cond: () => (S.bossCount || 0) >= 100, silver: 15000, xj: 10 },
  { id: 'd10', name: '秘境常客', desc: '通关秘境 10 次', cond: () => (S.stats.dungeon || 0) >= 10, silver: 4000, xj: 3 },
  { id: 'd50', name: '秘境之主', desc: '通关秘境 50 次', cond: () => (S.stats.dungeon || 0) >= 50, silver: 20000, xj: 10 },
  { id: 't10', name: '登塔十层', desc: '爬塔最高 10 层', cond: () => (S.towerBest || 0) >= 10, silver: 5000, xj: 4 },
  { id: 't30', name: '会当凌绝顶', desc: '爬塔最高 30 层', cond: () => (S.towerBest || 0) >= 30, silver: 20000, xj: 10 },
  { id: 'reb1', name: '轮回一世', desc: '转生 1 次', cond: () => (S.rebirth || 0) >= 1, silver: 5000, xj: 5 },
  { id: 'reb3', name: '三生三世', desc: '转生 3 次', cond: () => (S.rebirth || 0) >= 3, silver: 20000, xj: 15 },
  { id: 'relic1', name: '拾遗者', desc: '收集 1 件奇物', cond: () => Object.keys(S.relics || {}).length >= 1, silver: 1000, xj: 1 },
  { id: 'relic10', name: '收藏家', desc: '收集 10 件奇物', cond: () => Object.keys(S.relics || {}).length >= 10, silver: 8000, xj: 5 },
  { id: 'set1', name: '成套收藏', desc: '集齐 1 套套装', cond: () => SETS.some((st) => Object.keys(S.codex.sets[st.id] || {}).length >= 5), silver: 10000, xj: 5 },
  { id: 'leg1', name: '神兵在手', desc: '获得 1 件传说神兵', cond: () => Object.keys(S.codex.legend || {}).length >= 1, silver: 8000, xj: 5 },
  { id: 'comp1', name: '结伴同行', desc: '拥有 1 位队友', cond: () => (S.companions || []).length >= 1, silver: 3000, xj: 2 },
  { id: 'spouse1', name: '白首之约', desc: '与 1 位故人成婚', cond: () => (S.spouses || []).length >= 1, silver: 5000, xj: 3 },
  { id: 'pet3', name: '驯兽有方', desc: '收服 3 只宠物', cond: () => Object.keys(S.pets || {}).length >= 3, silver: 3000, xj: 2 },
  { id: 'lv100', name: '天下无敌', desc: '境界达到 100 级', cond: () => S.level >= 100, silver: 50000, xj: 30 },
  { id: 'codex50', name: '博闻强识', desc: '图鉴完成度 50%', cond: () => codexProgress() >= 0.5, silver: 20000, xj: 10 },
  { id: 'chall5', name: '来者不拒', desc: '击败 5 位正魔挑战者', cond: () => (S.stats.challWin || 0) >= 5, silver: 3000, xj: 2 },
];

function claimAch(id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return;
  if (S.achClaimed && S.achClaimed[id]) return;
  if (!a.cond()) { addLog('尚未达成。', 'sys'); return; }
  S.achClaimed = S.achClaimed || {};
  S.achClaimed[id] = true;
  S.silver += a.silver;
  S.xuanjing = (S.xuanjing || 0) + (a.xj || 0);
  addLog('成就达成【' + a.name + '】：银两 +' + a.silver + '，玄晶 +' + (a.xj || 0) + '。', 'gold');
  save();
  renderAll();
}

function panelAch() {
  const claimed = S.achClaimed || {};
  const done = ACHIEVEMENTS.filter((a) => a.cond() && !claimed[a.id]).length;
  let html = '<h4>成就 <span class="tag">' + Object.keys(claimed).length + ' / ' + ACHIEVEMENTS.length +
    (done ? ' · 可领取 ' + done : '') + '</span></h4>';
  html += ACHIEVEMENTS.map((a) => {
    const ok = a.cond();
    const got = !!claimed[a.id];
    return '<div class="item"><div class="row"><span class="' + (got ? 'muted' : ok ? 'q-green' : 'muted') + '">' +
      a.name + ' <span class="tag">' + a.desc + '</span></span>' +
      '<span>' + (got ? '已领取' : ok ? '<button data-ach="' + a.id + '">领取</button>' : '未达成') + '</span></div>' +
      '<div class="aff">奖励：银两 ' + a.silver + ' · 玄晶 ' + (a.xj || 0) + '</div></div>';
  }).join('');
  return html;
}

const WEEKLY_BOSSES = [
  { name: '独孤求败', line: '「剑魔独孤求败，败尽天下英雄，只求一败。」' },
  { name: '扫地僧', line: '「施主，这寺里的经，你还没读完。」' },
  { name: '逍遥子', line: '「北冥之水，能吞万物。你接得住么。」' },
  { name: '石破天', line: '「我……我不想打，可我不会收手。」' },
  { name: '王重阳', line: '「先天功一成，你便再无退路。」' },
  { name: '风清扬', line: '「无招胜有招。你的招，太多了。」' },
];

function weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + week;
}

function ensureWeek() {
  S.week = S.week || { key: '', done: false };
  const k = weekKey();
  if (S.week.key !== k) {
    S.week = { key: k, done: false };
  }
  return S.week;
}

function weeklyBoss() {
  html += OVERWORLDS.map((w) =>
    '<div class="item"><div class="row"><span>' + w.name + ' <span class="tag">' + w.mobs.join(' / ') + ' / ' + w.boss + '</span></span>' +
    '<span><button data-other="' + w.id + '"' + ((S.tokens || 0) >= 2 && !S.dungeon.active ? '' : ' disabled') + '>进入（2 挑战令）</button></span></div>' +
    '<div class="aff">' + w.desc + ' 通关掉落奇物，收进行囊。</div></div>'
  ).join('');
  const wk = ensureWeek();
  const idx = Math.abs(parseInt(wk.key.split('-W')[1] || '1', 10)) % WEEKLY_BOSSES.length;
  const b = WEEKLY_BOSSES[idx];
  const pw = powerScore(totalStats());
  const m = monsterFor(S.mapIndex, S.level, true);
  m.name = b.name;
  m.isBoss = true;
  m.isWeekly = true;
  m.hp = Math.round((120 + pw * 1.35) * 1.15);
  m.maxHp = m.hp;
  m.atk = Math.round((16 + pw * 0.09) * 1.15);
  m.def = Math.round(10 + pw * 0.06);
  m.spd = Math.round(totalStats().agi * 1.05);
  m.exp = Math.round((m.exp + pw * 0.8) * 3);
  m.silver = Math.round((m.silver + pw * 0.4) * 3);
  m.trait = pick(TRAITS);
  m.weeklyLine = b.line;
  return m;
}

function startWeekly() {
  const wk = ensureWeek();
  if (wk.done) { addLog('本周挑战已经打过了。', 'sys'); return; }
  if (S.dungeon.active || S.tower.active || (S.duel && S.duel.active)) { addLog('你正忙着。', 'bad'); return; }
  const m = weeklyBoss();
  monster = m;
  foes = [m];
  battle.ally = {};
  battle.hp = totalStats().hp;
  battle.mp = totalStats().mp;
  battle.cds = {};
  battle.usedPot = 0;
  battle.potCd = 0;
  addLog('本周挑战：' + m.name + '。' + m.weeklyLine, 'boss');
  save();
  renderAll();
}

const AFTERBOSSES = [
  { id: 'guoshi', name: '国师残魂', line: '「你以为杀了我，就赢了？」', text: '残魂散在丹陛上，最后看了你一眼，像在笑。', xj: 3, silver: 8000 },
  { id: 'mojiao', name: '魔教余孽', line: '「教主死了，魔教还在。」', text: '余孽伏诛，血水流进石缝。你忽然想起那些年夜里点过的灯。', xj: 3, silver: 8000 },
  { id: 'jiubu', name: '旧部', line: '「兵符在你手里，我们就还认你。」', text: '旧部跪下，把刀放在地上。你没让他们起来，自己先走了。', xj: 3, silver: 8000 },
];

function startAfterBoss(id) {
  const b = AFTERBOSSES.find((x) => x.id === id);
  if (!b) return;
  if (!S.ending) { addLog('这一世还没写完。', 'sys'); return; }
  if (S.afterBoss && S.afterBoss[id]) { addLog('这一战已经了结了。', 'sys'); return; }
  if (S.dungeon.active || S.tower.active || (S.duel && S.duel.active)) { addLog('你正忙着。', 'bad'); return; }
  const pw = powerScore(totalStats());
  const m = monsterFor(S.mapIndex, S.level, true);
  m.name = b.name;
  m.isBoss = true;
  m.isAfterBoss = true;
  m.afterId = id;
  m.hp = Math.round((110 + pw * 1.15) * 1.1);
  m.maxHp = m.hp;
  m.atk = Math.round((15 + pw * 0.08) * 1.1);
  m.def = Math.round(10 + pw * 0.055);
  m.spd = Math.round(totalStats().agi * 1.0);
  m.exp = Math.round((m.exp + pw * 0.6) * 2.5);
  m.silver = Math.round((m.silver + pw * 0.3) * 2.5);
  m.trait = pick(TRAITS);
  m.afterLine = b.line;
  monster = m;
  foes = [m];
  battle.ally = {};
  battle.hp = totalStats().hp;
  battle.mp = totalStats().mp;
  battle.cds = {};
  addLog('后日谈：' + b.name + '。' + b.line, 'boss');
  save();
  renderAll();
}

function startTianjie() {
  if (S.level < MAX_LEVEL) { addLog('未满 100 级，天劫不至。', 'sys'); return; }
  if ((S.tier || 0) >= 6) { addLog('你已飞升，此界再无可渡之劫。', 'sys'); return; }
  if ((S.tier || 0) >= (S.rebirth || 0)) {
    addLog('轮回次数不足：需第 ' + ((S.tier || 0) + 1) + ' 次轮回后才能渡此劫。', 'bad');
    return;
  }
  if (S.dungeon.active || S.tower.active || (S.duel && S.duel.active)) { addLog('你正忙着。', 'bad'); return; }
  const idx = (S.tier || 0) + 1;
  const st0 = totalStats();
  const pw = powerScore(st0);
  const critFactor = 1 + (st0.crit / 100) * (st0.critDmg / 100 - 1);
  const estDps = st0.atk * (1 + st0.skillPower / 100) * critFactor * 1.6;
  const m = {
    name: TIER_TRIALS[idx], isBoss: true, isTianjie: true, level: S.level,
    hp: Math.round(estDps * (10 + 2 * idx)),
    atk: Math.round((16 + pw * 0.13) * (1.3 + 0.4 * idx)),
    def: Math.round(pw * 0.08),
    exp: Math.round(100 + pw), silver: Math.round(100 + pw * 0.5),
  };
  m.maxHp = m.hp;
  m.spd = Math.round(totalStats().agi * 1.1);
  m.trait = pick(TRAITS);
  monster = m;
  foes = [m];
  battle.ally = {};
  battle.hp = totalStats().hp;
  battle.mp = totalStats().mp;
  battle.cds = {};
  addLog('劫云压顶：' + m.name + '。此战只为你一人而来。', 'boss');
  save();
  renderAll();
}

function finishDungeon(win) {
  if (win) S.stats.dungeon = (S.stats.dungeon || 0) + 1;
  if (win) {
    addLog(S.dungeon.other ? '尸潮退了下去。' : '秘境通关。', 'gold');
    bountyAdd('dungeon', 1);
    if (S.dungeon.other) {
      const w = OVERWORLDS.find((x) => x.id === (S.dungeon.space || 'zombie')) || OVERWORLDS[0];
      addLog(w.name + '安静了下来。', 'gold');
      dropRelic();
      S.exp += 300;
      S.silver += 500;
      S.xuanjing = (S.xuanjing || 0) + 1;
      addLog('最后一层留下了一枚玄晶。', 'gold');
      if (Math.random() < 0.12) dropRelic();
      if (w.id === 'dragonball') {
        dropManualPage();
        dropManualPage();
        S.shards = (S.shards || 0) + 1;
        addLog('拉蒂兹的战斗力探测器碎了，你捡到一片神兵碎片。', 'gold');
      }
      if (w.id === 'neon') {
        dropSetPiece('nightrunner');
        if (Math.random() < 0.12) dropRelic();
        if (Math.random() < 0.25) dropSetPiece('nightrunner');
      }
      if (w.id === 'liaozhai') {
        dropSetPiece('lanruo');
        if (Math.random() < 0.15) dropRelic();
        if (Math.random() < 0.25) dropSetPiece('lanruo');
      }
    } else {
      if (Math.random() < 0.65) dropSetPiece();
      if (Math.random() < 0.55) dropManualPage();
      if (Math.random() < 0.04) dropLegendary();
    }
    S.tokens = Math.min(5, S.tokens + (S.dungeon.other ? 1 : 1));
    addLog('你在秘境角落拾到一枚挑战令。', 'gold');
  } else {
    addLog('你倒在秘境里，被人拖了出去。', 'bad');
  }
  S.dungeon = { active: false, step: 0, total: 3, mod: null };
  battle.hp = Math.round(totalStats().hp * 0.5);
  monster = null;
  save();
  spawnMonster();
  renderAll();
}

function dropSetPiece(setId) {
  const set = (setId && SETS.find((s) => s.id === setId)) || pick(SETS);
  const idx = rndInt(0, set.pieces.length - 1);
  const slot = Object.keys(SLOTS)[idx];
  const it = generateItem(slot, S.level, weightedQuality(true));
  it.name = set.pieces[idx];
  it.setId = set.id;
  it.setName = set.name;
  it.qname = set.name + '部件';
  it.qcls = 'q-purple';
  if (S.bag.length >= 60) { addLog('行囊已满，套装部件没能带走。', 'bad'); return; }
  S.bag.push(it);
  if (!S.codex.sets[set.id]) S.codex.sets[set.id] = {};
  S.codex.sets[set.id][idx] = true;
  addLog('获得套装部件：' + it.name + '。', 'gold');
  checkCodexRewards();
}

function dropCollectible() {
  const pool = COLLECTIBLES.filter((c) => !S.codex.collect[c.id]);
  if (!pool.length) { S.silver += 250; addLog('收藏品已集齐，你换了一笔银两。', 'sys'); return; }
  let total = pool.reduce((a, c) => a + c.weight, 0);
  let r = Math.random() * total;
  let got = pool[0];
  for (const c of pool) { r -= c.weight; if (r <= 0) { got = c; break; } }
  S.codex.collect[got.id] = true;
  addLog('拾得收藏品【' + got.name + '】——' + got.lore, 'gold');
  checkCodexRewards();
}

function dropManualPage() {
  const un = MANUALS.filter((m) => !S.codex.manuals[m.id]);
  if (!un.length) { S.silver += 150; return; }
  const m = pick(un);
  const n = (S.codex.manualPages[m.id] || 0) + 1;
  S.codex.manualPages[m.id] = n;
  addLog('拾得' + m.name + '残页（' + n + '/5）。', 'gold');
  if (n >= 5) {
    S.codex.manuals[m.id] = true;
    delete S.codex.manualPages[m.id];
    addLog('你参透了' + m.name + '！' + m.desc, 'gold');
  }
  checkCodexRewards();
}

function dropLegendary() {
  const L = pick(LEGENDARIES);
  if (S.codex.legend[L.id]) { S.silver += 500; return; }
  S.codex.legend[L.id] = true;
  addLog('【神兵】' + L.name + '认你为主，永久生效：' + L.desc, 'gold');
  checkCodexRewards();
  save();
}

function equipItem(item) {
  const cur = S.equip[item.slot];
  S.equip[item.slot] = item;
  S.bag = S.bag.filter((x) => x.uid !== item.uid);
  if (cur) S.bag.push(cur);
  battle.hp = Math.min(battle.hp, totalStats().hp);
  addLog('你换上了【' + item.qname + '】' + item.name + '。', 'good');
  save();
  renderAll();
}

function unequip(slot) {
  const cur = S.equip[slot];
  if (!cur) return;
  if (S.bag.length >= 60) { addLog('行囊已满。', 'sys'); return; }
  S.bag.push(cur);
  S.equip[slot] = null;
  save();
  renderAll();
}

function sellPrice(it) {
  return Math.round((6 + it.ilvl * 2) * qualityIndex(it.quality) * 0.9);
}

function sellItem(item) {
  const price = sellPrice(item);
  S.silver += price;
  S.bag = S.bag.filter((x) => x.uid !== item.uid);
  addLog('你把' + item.name + '卖了 ' + price + ' 两。', 'sys');
  save();
  renderAll();
}

function sellBatch(list, label) {
  if (!list.length) return;
  const total = list.reduce((a, it) => a + sellPrice(it), 0);
  const ids = new Set(list.map((x) => x.uid));
  S.bag = S.bag.filter((x) => !ids.has(x.uid));
  S.silver += total;
  addLog('你' + (label || '卖出 ' + list.length + ' 件装备') + '，得 ' + total + ' 两。', 'gold');
  save();
  renderAll();
}

const ESSENCE_NEED = 3000;

function essenceOf(it) {
  const map = { white: 1, green: 3, blue: 8, purple: 20, orange: 50, red: 200 };
  return map[it.quality] || 1;
}

function dismantleBatch(list, label) {
  if (!list.length) return;
  const gain = list.reduce((a, it) => a + essenceOf(it), 0);
  const ids = new Set(list.map((x) => x.uid));
  S.bag = S.bag.filter((x) => !ids.has(x.uid));
  S.essence = (S.essence || 0) + gain;
  addLog('你' + (label || '分解了 ' + list.length + ' 件装备') + '，得灵石 ' + gain +
    '（' + S.essence + '/' + ESSENCE_NEED + '）。', 'gold');
  checkEssenceReward();
  save();
  renderAll();
}

function checkEssenceReward() {
  while ((S.essence || 0) >= ESSENCE_NEED) {
    S.essence -= ESSENCE_NEED;
    const it = generateItem(pick(Object.keys(SLOTS)), S.level, QUALITIES.find((q) => q.k === 'red'));
    if (S.bag.length < 60) S.bag.push(it);
    else S.silver += 5000;
    addLog('灵石积满，锻出一件【传奇】' + it.name + '！', 'gold');
  }
}

function matchesFilter(it) {
  if (bagFilter.q !== 'all' && it.quality !== bagFilter.q) return false;
  if (bagFilter.slot !== 'all' && it.slot !== bagFilter.slot) return false;
  return true;
}

const AFFIX_SCORE = {
  atk: 3, def: 2, hp: 0.3, agi: 2, crit: 5, critDmg: 1, dodge: 4, hit: 2,
  lifesteal: 6, pierce: 4, dmgReduce: 5, block: 3, thorns: 3, mpMax: 0.5, mpRegen: 4, skillPower: 2,
};

function itemScore(it) {
  let s = (it.base.atk || 0) * 3 + (it.base.def || 0) * 2 + (it.base.hp || 0) * 0.3 + (it.base.agi || 0) * 2;
  for (const a of it.affixes) s += (AFFIX_SCORE[a.k] || 0) * a.v;
  return Math.round(s);
}

function autoEquipBest() {
  let changed = 0;
  for (const slot of Object.keys(SLOTS)) {
    const cur = S.equip[slot];
    let best = cur;
    let bestScore = cur ? itemScore(cur) : -1;
    for (const it of S.bag) {
      if (it.slot !== slot) continue;
      const sc = itemScore(it);
      if (sc > bestScore) { best = it; bestScore = sc; }
    }
    if (best && best !== cur) {
      equipItem(best);
      changed += 1;
    }
  }
  if (!changed) addLog('身上已是最好的装备了。', 'sys');
  else addLog('你换上了更好的装备。', 'good');
  save();
  renderAll();
}

function qualityIndex(k) {
  const order = ['white', 'green', 'blue', 'purple', 'orange', 'red'];
  return order.indexOf(k) + 1;
}

function itemSummary(item) {
  const parts = [];
  const up = 1 + 0.08 * (item.up || 0);
  if (item.base.atk) parts.push('攻击+' + Math.round(item.base.atk * up));
  if (item.base.def) parts.push('防御+' + Math.round(item.base.def * up));
  if (item.base.hp) parts.push('气血+' + Math.round(item.base.hp * up));
  if (item.base.agi) parts.push('身法+' + Math.round(item.base.agi * up));
  if (item.up) parts.push('强化 +' + item.up + '（基础 ×' + up.toFixed(2) + '）');
  for (const a of item.affixes) parts.push(AFFIXES[a.k].fmt(a.v));
  return parts;
}

/* ------------------------------------------------------------ 功法/心法 */

function dropPage() {
  const unlearned = ACTIVES.filter((a) => !a.exclusive && !S.learned.actives.includes(a.id));
  if (!unlearned.length) return;
  const sk = pick(unlearned);
  S.pages[sk.id] = (S.pages[sk.id] || 0) + 1;
  addLog('拾得「' + sk.name + '」残页（' + S.pages[sk.id] + '/' + PAGES_NEEDED + '）。', 'gold');
  if (S.pages[sk.id] >= PAGES_NEEDED) {
    S.learned.actives.push(sk.id);
    delete S.pages[sk.id];
    addLog('你参透了「' + sk.name + '」！可在功法页装备。', 'gold');
  }
}

function maybeUnlockPassive() {
  const left = PASSIVES.filter((p) => !p.exclusive && !S.learned.passives.includes(p.id));
  if (!left.length) return;
  const p = pick(left);
  S.learned.passives.push(p.id);
  S.passiveLevels[p.id] = 1;
  addLog('你在战后拾得心法《' + p.name + '》。', 'gold');
}

function passiveCost(id) {
  const lv = S.passiveLevels[id] || 1;
  return 60 + lv * 45;
}

function upgradePassive(id) {
  const lv = S.passiveLevels[id] || 1;
  if (lv >= 10) { addLog('这门心法已经 10 重了。', 'sys'); return; }
  const cost = passiveCost(id);
  if (S.silver < cost) { addLog('银两不够。', 'bad'); return; }
  S.silver -= cost;
  S.passiveLevels[id] = lv + 1;
  const eff = passiveEffect(id);
  addLog('《' + PASSIVES.find((p) => p.id === id).name + '》升至 ' + (lv + 1) + ' 重。' + (eff ? '当前加成：' + eff : ''), 'gold');
  save();
  renderAll();
}

/* ------------------------------------------------------------ 地图 */

function switchMap(i) {
  if (i === S.mapIndex) return;
  if (S.level < MAPS[i].min) { addLog('以你现在的修为，去了也是送死。', 'bad'); return; }
  S.mapIndex = i;
  S.kills = 0;
  monster = null;
  battle.hp = totalStats().hp;
  battle.mp = totalStats().mp;
  addLog('你来到' + MAPS[i].name + '。', 'sys');
  addLog(MAPS[i].intro, 'story');
  save();
  renderAll();
}

/* ------------------------------------------------------------ 故人 */

const todayKey = () => {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
};

function npcState(id) {
  if (!S.npc[id]) S.npc[id] = { fav: 0, done: {}, chats: {}, gifts: {} };
  const st = S.npc[id];
  st.done = st.done || {};
  st.chats = st.chats || {};
  st.gifts = st.gifts || {};
  return st;
}

function npcAvailable(npc) {
  if (S.level < npc.minLevel) return false;
  if (npc.id === 'aheng' && !S.flags.rescued) return false;
  return true;
}

function stageIndex(id) {
  const npc = NPCS.find((n) => n.id === id);
  const st = npcState(id);
  let idx = 0;
  for (let i = 0; i < npc.stages.length; i++) {
    if (st.fav >= STAGE_FAV[i] && S.level >= STAGE_LV[i]) idx = i;
  }
  return idx;
}

function npcStage(id) {
  const npc = NPCS.find((n) => n.id === id);
  const si = stageIndex(id);
  return npc.stages[si];
}

function nextLine(id) {
  const npc = NPCS.find((n) => n.id === id);
  const si = stageIndex(id);
  const lines = npc.stages[si].lines;
  const st = npcState(id);
  for (let i = 0; i < lines.length; i++) {
    if (st.done[si + ':' + i] === undefined) return { si, i, line: lines[i] };
  }
  return null;
}

const CHAT_MAX = 3;
const CHAT_REGEN_MS = 8 * 60 * 1000;

function chatState(id) {
  const st = npcState(id);
  if (typeof st.chatCharges !== 'number') { st.chatCharges = CHAT_MAX; st.chatNext = 0; }
  const now = Date.now();
  if (st.chatCharges < CHAT_MAX) {
    if (!st.chatNext) st.chatNext = now + CHAT_REGEN_MS;
    while (st.chatCharges < CHAT_MAX && now >= st.chatNext) {
      st.chatCharges += 1;
      st.chatNext += CHAT_REGEN_MS;
    }
    if (st.chatCharges >= CHAT_MAX) st.chatNext = 0;
  }
  return st;
}

function chatsToday(id) { return chatState(id).chatCharges; }

function chatRegenLeft(id) {
  const st = chatState(id);
  if (st.chatCharges >= CHAT_MAX || !st.chatNext) return 0;
  return Math.max(0, st.chatNext - Date.now());
}
function giftedToday(id) { return npcState(id).gifts[todayKey()] || 0; }
function npcName(id) { const n = NPCS.find((x) => x.id === id); return n ? n.name : ''; }

/* ------------------------------------------------------------ 侠义（-100 恶名 ~ +100 大侠） */

function honorLabel(v) {
  const h = v == null ? 0 : v;
  if (h >= 60) return '大侠';
  if (h >= 20) return '侠客';
  if (h <= -60) return '魔头';
  if (h <= -20) return '恶徒';
  return '江湖人';
}

function titleModDesc(t) {
  const m = t.mods || {};
  const parts = [];
  if (m.atkPct) parts.push('攻击+' + Math.round(m.atkPct * 100) + '%');
  if (m.hpPct) parts.push('气血' + (m.hpPct > 0 ? '+' : '') + Math.round(m.hpPct * 100) + '%');
  if (m.crit) parts.push('暴击+' + m.crit + '%');
  if (m.dodge) parts.push('闪避+' + m.dodge + '%');
  if (m.expPct) parts.push('经验+' + Math.round(m.expPct * 100) + '%');
  if (m.drop) parts.push('掉落+' + Math.round(m.drop * 100) + '%');
  return parts.join(' · ');
}

function checkTitles() {
  let gained = false;
  for (const t of TITLES) {
    if (S.titles.includes(t.id)) continue;
    if (!t.cond()) continue;
    S.titles.push(t.id);
    addLog('获得称号「' + t.name + '」。', 'gold');
    gained = true;
  }
  if (gained) save();
}

function setTitle(id) {
  if (!S.titles.includes(id)) return;
  S.title = id;
  addLog('你把称号换成了「' + (TITLES.find((t) => t.id === id) || {}).name + '」。', 'sys');
  save();
  renderAll();
}

function starStr(n) {
  if (!n || n <= 0) return '';
  const count = Math.min(5, Math.ceil(n / 2));
  if (n % 2 === 0) return '★'.repeat(count);
  return '☆' + '★'.repeat(count - 1);
}

function dropRelic() {
  const r = pick(RELICS);
  S.relicCount = S.relicCount || {};
  S.relicCount[r.id] = (S.relicCount[r.id] || 0) + 1;
  const first = !S.relics[r.id];
  S.relics[r.id] = true;
  const stars = starStr(S.relicCount[r.id]);
  if (first) addLog('拾得奇物【' + r.name + '】：' + r.desc, 'gold');
  else addLog('又拾得奇物【' + r.name + '】（' + S.relicCount[r.id] + ' 次' + (stars ? ' ' + stars : '') + '）。', 'gold');
  save();
}

function startOtherDungeon(space) {
  if (S.dungeon.active) return;
  if (!S.created) return;
  const w = OVERWORLDS.find((x) => x.id === (space || 'zombie')) || OVERWORLDS[0];
  if ((S.tokens || 0) < 2) { addLog('挑战令不足（需 2 枚）。', 'bad'); return; }
  S.tokens -= 2;
  const floors = w.floors || rndInt(4, 10);
  S.dungeon = { active: true, step: 1, total: floors, mod: null, other: true, space: w.id };
  if (w.id === 'liaozhai') S.dungeon.sanity = 100;
  battle.hp = totalStats().hp;
  battle.mp = totalStats().mp;
  battle.usedPot = 0;
  battle.potCd = 0;
  S.buffs = [];
  monster = null;
  addLog('你踏进异空间：' + w.name + '。' + w.desc + '（共 ' + floors + ' 层）', 'boss');
  spawnMonster();
  save();
  renderAll();
}

function addHonor(n) {
  if (!n) return;
  S.honor = clamp((S.honor || 0) + n, -100, 100);
  addLog('（侠义 ' + (n > 0 ? '+' : '') + n + '，当前 ' + S.honor + ' · ' + honorLabel(S.honor) + '）', n > 0 ? 'good' : 'bad');
}

function talkOption(id, optIndex) {
  const npc = NPCS.find((n) => n.id === id);
  const st = npcState(id);
  const info = nextLine(id);
  if (!info) return;
  const opt = info.line.options[optIndex];
  if (!opt) return;
  const firstOfStage = Object.keys(st.done).every((k) => k.indexOf(info.si + ':') !== 0);
  st.done[info.si + ':' + info.i] = optIndex;
  let gain = opt.fav;
  if (firstOfStage) gain += 10;
  st.fav = clamp(st.fav + gain, 0, 100);
  addLog('【' + npc.name + '】' + opt.reply + (gain > 0 ? '（好感 +' + gain + '）' : ''), 'story');
  if (opt.honor) addHonor(opt.honor);
  checkNpcGift(id);
  save();
  openNpc(id);
}

function chatIdle(id) {
  const npc = NPCS.find((n) => n.id === id);
  const st = chatState(id);
  if (st.chatCharges <= 0) {
    const m = Math.max(1, Math.ceil(chatRegenLeft(id) / 60000));
    addLog('【' + npc.name + '】' + m + ' 分钟后再聊吧。', 'story');
    return;
  }
  st.chatCharges -= 1;
  if (!st.chatNext) st.chatNext = Date.now() + CHAT_REGEN_MS;
  st.fav = clamp(st.fav + 1, 0, 100);
  const idle = ['她陪你坐了一会儿，没说什么。', '你和她闲扯了几句江湖旧事。', '她问起你身上的伤，你摆摆手。'];
  addLog('【' + npc.name + '】' + pick(idle) + '（好感 +1，今日 ' + st.chatCharges + '/3）', 'story');
  save();
  openNpc(id);
}

function nightTalk(id) {
  if (S.night[id]) return;
  S.night[id] = true;
  const custom = (window.__WUXIA_NIGHTS__ || {})[id];
  const text = custom || '你们说了很久的话。后来灯灭了，窗外的雨一直没停。';
  hideModal();
  showModal(
    '<h2>夜话 · ' + npcName(id) + '</h2>' +
    '<p class="story-text">' + escapeHtml(text) + '</p>' +
    '<div class="modal-actions"><button data-close="1">合眼</button></div>'
  );
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
  save();
  renderAll();
}

function giftNpc(id) {
  const st = npcState(id);
  if (giftedToday(id) >= 1) {
    addLog('今日已送过礼了。', 'sys');
    return;
  }
  const gift = GIFTS.find((g) => (S.potions[g.id] || 0) > 0);
  if (!gift) {
    addLog('你身上没有拿得出手的礼物。', 'sys');
    return;
  }
  S.potions[gift.id] -= 1;
  st.gifts[todayKey()] = 1;
  st.fav = clamp(st.fav + gift.fav, 0, 100);
  addLog('你把' + gift.name + '递给' + npcName(id) + '。（好感 +' + gift.fav + '）', 'story');
  save();
  openNpc(id);
}

/* ------------------------------------------------------------ 日志/渲染 */

function addLog(text, cls) {
  logLines.push({ text, cls: cls || '' });
  if (logLines.length > 220) logLines.shift();
  renderLog();
}

function renderLog() {
  const el = document.getElementById('log');
  if (!el) return;
  const brief = ['story', 'gold', 'boss', 'righteous', 'evil', 'bad'];
  const list = logMode === 'brief' ? logLines.filter((l) => brief.includes(l.cls)) : logLines;
  el.innerHTML = list.map((l) => '<div class="line ' + l.cls + '">' + escapeHtml(l.text) + '</div>').join('');
  el.scrollTop = el.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderHud() {
  const map = currentMap();
  setText('hud-name', S.name);
  setText('hud-level', S.level + ' · ' + realmOf(S.level));
  setText('hud-map', map.name);
  setText('hud-silver', fmt(S.silver));
  setText('hud-honor', (S.honor || 0) + ' · ' + honorLabel(S.honor));
  setText('hud-xuanjing', S.xuanjing || 0);
}

function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

function renderBars() {
  const st = totalStats();
  const hpPct = clamp((battle.hp / st.hp) * 100, 0, 100);
  const mpPct = clamp((battle.mp / st.mp) * 100, 0, 100);
  const need = expNeed(S.level);
  const expPct = clamp((S.exp / need) * 100, 0, 100);
  const bh = document.getElementById('bar-hp');
  const bm = document.getElementById('bar-mp');
  const be = document.getElementById('bar-exp');
  if (bh) bh.style.width = hpPct + '%';
  if (bm) bm.style.width = mpPct + '%';
  if (be) be.style.width = expPct + '%';
  setText('txt-hp', '气血 ' + Math.max(0, Math.round(battle.hp)) + ' / ' + st.hp);
  setText('txt-mp', '内力 ' + Math.round(battle.mp) + ' / ' + st.mp);
  setText('txt-exp', '经验 ' + Math.round(S.exp) + ' / ' + need);
}

function renderStatus() {
  const el = document.getElementById('battle-status');
  if (!el) return;
  if (S.ending) { el.textContent = '江湖已定'; return; }
  if (S.eventOpen) { el.textContent = '奇遇…'; return; }
  if (S.paused) { el.textContent = '已收剑（暂停）'; return; }
  if (!monster) { el.textContent = '行走江湖中…'; el.style.color = ''; return; }
  if ((foes || []).length > 1) {
    el.style.color = '';
    el.textContent = '敌人：' + aliveFoes().map((f) => f.name + ' ' + Math.max(0, f.hp) + '/' + f.maxHp).join(' · ');
    return;
  }
  el.style.color = monster.isChallenger ? (monster.side === '正道' ? '#7cc4ff' : '#c98bff') : '';
  el.textContent = (monster.isChallenger ? '【挑战】' : (monster.isBoss ? '【首领】' : '')) + monster.name +
    (monster.trait ? '【' + monster.trait.name + '】' : '') +
    ' ' + Math.max(0, monster.hp) + '/' + monster.maxHp;
}

function renderPartyStatus() {
  const el = document.getElementById('party-status');
  if (!el) return;
  const ids = partyAllies();
  if (!ids.length) { el.innerHTML = ''; return; }
  el.innerHTML = ids.map((id) => {
    const u = allyUnit(id);
    return '<span class="' + (u.hp <= 0 ? 'dead' : '') + '">' + npcName(id) + ' ' +
      Math.max(0, Math.round(u.hp)) + '/' + u.max + '</span>';
  }).join('');
}

function renderAll() {
  renderHud();
  renderBars();
  renderStatus();
  renderPartyStatus();
  renderTabs();
  renderPanel();
}

/* ------------------------------------------------------------ 面板 */

const TABS = [
  ['stats', '属性'],
  ['equip', '装备'],
  ['bag', '行囊'],
  ['skill', '功法'],
  ['shop', '商铺'],
  ['dungeon', '秘境'],
  ['codex', '图鉴'],
  ['rebirth', '转生'],
  ['party', '伙伴'],
  ['brothel', '醉月楼'],
  ['sects', '门派'],
  ['map', '地图'],
  ['set', '设置'],
];

function renderTabs() {
  const nav = document.getElementById('tabs');
  if (!nav) return;
  nav.innerHTML = TABS.map(([k, n]) =>
    '<button data-tab="' + k + '" class="' + (activeTab === k ? 'on' : '') + '">' + n + '</button>'
  ).join('');
  nav.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => { activeTab = b.dataset.tab; renderTabs(); renderPanel(); });
  });
}

function renderPanel() {
  const el = document.getElementById('panel');
  if (!el) return;
  if (activeTab === 'stats') el.innerHTML = panelStats();
  else if (activeTab === 'equip') el.innerHTML = panelEquip();
  else if (activeTab === 'bag') el.innerHTML = panelBag();
  else if (activeTab === 'skill') el.innerHTML = panelSkill();
  else if (activeTab === 'shop') el.innerHTML = panelShop();
  else if (activeTab === 'dungeon') el.innerHTML = panelDungeon();
  else if (activeTab === 'codex') el.innerHTML = panelCodex();
  else if (activeTab === 'rebirth') el.innerHTML = panelRebirth();
  else if (activeTab === 'party') el.innerHTML = panelParty();
  else if (activeTab === 'brothel') el.innerHTML = panelBrothel();
  else if (activeTab === 'sects') el.innerHTML = panelSects();
  else if (activeTab === 'map') el.innerHTML = panelMap();
  else el.innerHTML = panelSet();
  bindPanel();
}

function modText(m) {
  if (!m) return '';
  const out = [];
  const add = (k, name, pct) => {
    if (!m[k]) return;
    out.push(name + '+' + (pct ? (m[k] * 100).toFixed(1) + '%' : m[k]));
  };
  add('atkPct', '攻击', true); add('hpPct', '气血', true); add('defPct', '防御', true); add('agiPct', '身法', true);
  add('mpMaxPct', '内力上限', true); add('crit', '暴击'); add('critDmg', '暴伤'); add('dodge', '闪避'); add('hit', '命中');
  add('lifesteal', '吸血'); add('pierce', '破防'); add('dmgReduce', '减伤'); add('block', '格挡'); add('thorns', '反伤');
  add('skillPower', '招式威力'); add('mpRegen', '内力回复'); add('drop', '掉落', true); add('expPct', '经验', true); add('silverPct', '银两', true);
  return out.join(' · ');
}

function bonusOverview() {
  const rows = [];
  const cur = TITLES.find((t) => t.id === S.title);
  if (cur) rows.push(['称号 · ' + cur.name, modText(cur.mods)]);
  const rl = relicMods(); if (modText(rl)) rows.push(['奇物收藏', modText(rl)]);
  const tm = talentMods(); if (modText(tm)) rows.push(['轮回天赋', modText(tm)]);
  const pm = petMods(); if (modText(pm)) rows.push(['宠物', modText(pm)]);
  const am = allyMods(); if (modText(am)) rows.push(['队友 / 配偶', modText(am)]);
  const mm = {};
  for (const man of MANUALS) {
    if (!S.codex.manuals[man.id]) continue;
    for (const k of Object.keys(man.mods)) mm[k] = (mm[k] || 0) + man.mods[k];
  }
  if (modText(mm)) rows.push(['秘籍', modText(mm)]);
  const cnt = {};
  for (const sl of Object.keys(SLOTS)) {
    const it = S.equip[sl];
    if (it && it.setId) cnt[it.setId] = (cnt[it.setId] || 0) + 1;
  }
  for (const set of SETS) {
    const c = cnt[set.id] || 0;
    if (c < 2) continue;
    const txt = [];
    if (c >= 2) txt.push('2件 ' + set.b2);
    if (c >= 4) txt.push('4件 ' + set.b4);
    if (c >= 5) txt.push('5件 ' + set.b5);
    rows.push([set.name + ' ' + c + '/5', txt.join(' · ')]);
  }
  for (const L of LEGENDARIES) {
    if (!S.codex.legend[L.id]) continue;
    rows.push(['神兵 · ' + L.name, L.desc]);
  }
  if (!rows.length) return '<div class="muted">暂无额外加成。</div>';
  return rows.map(([k, v]) => '<div class="item"><div class="row"><span>' + k + '</span></div><div class="aff">' + v + '</div></div>').join('');
}

function panelStats() {
  const st = totalStats();
  const need = expNeed(S.level);
  const pts = S.points;
  const cur = TITLES.find((t) => t.id === S.title);
  const tierInfo = TIERS[S.tier || 0];
  return [
    '<h3><span style="color:' + tierInfo.color + '">' + escapeHtml(S.name) + '</span>' +
    (cur ? ' <span class="tag">' + cur.name + '</span>' : '') + '</h3>',
    kv('境界', realmOf(S.level) + ' · ' + S.level + ' 级 / ' + MAX_LEVEL),
    kv('道途', '<span style="color:' + tierInfo.color + '">' + tierInfo.name + '</span>' + ((S.tier || 0) >= 6 ? '（已飞升）' : '')),
    S.level % 10 === 9 ? breakthroughBlock() : '',
    kv('经验', fmt(S.exp) + ' / ' + need),
    kv('战力', fmt(powerScore(st))),
    kv('银两', fmt(S.silver) + ' 两'),
    kv('轮回', (S.rebirth || 0) + ' 次'),
    (S.level >= MAX_LEVEL && (S.tier || 0) < 6
      ? ((S.tier || 0) < (S.rebirth || 0)
          ? '<div style="margin:8px 0"><button class="primary" data-tianjie="1">渡天劫 · ' +
            TIER_TRIALS[(S.tier || 0) + 1] + '</button></div>'
          : '<div class="muted">下一次天劫需第 ' + ((S.tier || 0) + 1) + ' 次轮回后开启（当前 ' +
            (S.rebirth || 0) + ' 次）。</div>')
      : ''),
    '<div class="kv"><span>称号</span><b><select data-title-sel style="background:#0a0f0a;color:#cfe0cf;border:1px solid #2c3f2c;border-radius:4px;padding:2px 4px">' +
      '<option value="">不佩戴</option>' +
      (S.titles || []).map((id) => {
        const t = TITLES.find((x) => x.id === id);
        return t ? '<option value="' + id + '"' + (S.title === id ? ' selected' : '') + '>' + t.name + '</option>' : '';
      }).join('') +
      '</select></b></div>',
    '<h4>五维（基础）</h4>',
    kv('气血', S.base.hp), kv('攻击', S.base.atk), kv('防御', S.base.def),
    kv('身法', S.base.agi), kv('内力', S.base.mp),
    pts > 0 ? ('<h4>自由属性点：' + pts + '</h4>' + attrButtons()) : '',
    '<h4>二级属性</h4>',
    kv('暴击率', st.crit + '%'), kv('暴击伤害', st.critDmg + '%'),
    kv('闪避', st.dodge + '%'), kv('命中', st.hit + '%'),
    kv('吸血', st.lifesteal + '%'), kv('破防', st.pierce + '%'),
    kv('伤害减免', st.dmgReduce + '%'), kv('格挡', st.block + '%'),
    kv('反伤', st.thorns + '%'), kv('招式威力', st.skillPower + '%'),
    kv('内力回复', st.mpRegen + ' / 回合'),
    '<h4>加成总览</h4>',
    bonusOverview(),
    '<h4>战绩</h4>',
    kv('击杀', S.stats.kills), kv('重伤', S.stats.deaths), kv('突破', (S.breakCount || 0) + ' 次'),
  ].join('');
}

function breakthroughBlock() {
  const helpers = breakHelpers();
  const chance = Math.round(breakChance() * 100);
  return '<div class="item"><div class="row"><span>突破在即：' + realmOf(S.level + 1) + '</span>' +
    '<span><button class="primary" data-break="1"' + (canBreak() ? '' : ' disabled') + '>突破</button></span></div>' +
    '<div class="aff">成功率 ' + chance + '% · 护法：' +
    (helpers.length ? helpers.map((h) => h.name).join('、') : '无（好感 60 以上会来帮忙）') + '</div></div>';
}

function attrButtons() {
  const map = [['hp', '气血 +12'], ['atk', '攻击 +2'], ['def', '防御 +2'], ['agi', '身法 +1'], ['mp', '内力 +4']];
  return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">' +
    map.map(([k, n]) => '<button data-attr="' + k + '">' + n + '</button>').join('') + '</div>';
}

const MATS = [
  { id: 'yaodan', name: '妖丹', desc: '妖兽内丹，还带着体温。' },
  { id: 'shougu', name: '兽骨', desc: '坚硬的白骨，敲上去有声。' },
  { id: 'guihuo', name: '鬼火', desc: '不灭的冷焰，装在玉瓶里。' },
  { id: 'leisui', name: '雷髓', desc: '雷劫劈开后凝下的髓。' },
  { id: 'hundun', name: '混沌晶', desc: '混沌之气凝成的一小块。' },
];

const ARTIFACTS = [
  { id: 'hulu', name: '青木葫芦', tier: 1, mods: { hpPct: 0.06 }, need: { yaodan: 5, shougu: 3 }, silver: 3000, xj: 1, desc: '气血 +6%' },
  { id: 'yujian', name: '玄水玉简', tier: 2, mods: { dodge: 3 }, need: { yaodan: 8, guihuo: 3 }, silver: 6000, xj: 2, desc: '闪避 +3%' },
  { id: 'chiyan', name: '赤炎幡', tier: 3, mods: { atkPct: 0.07 }, need: { guihuo: 6, leisui: 3 }, silver: 12000, xj: 3, desc: '攻击 +7%' },
  { id: 'zixiao', name: '紫霄铃', tier: 4, mods: { skillPower: 12 }, need: { guihuo: 8, leisui: 5 }, silver: 20000, xj: 4, desc: '招式威力 +12%' },
  { id: 'leidi', name: '雷帝印', tier: 5, mods: { crit: 5, critDmg: 15 }, need: { leisui: 10, hundun: 2 }, silver: 30000, xj: 6, desc: '暴击 +5%，暴伤 +15%' },
  { id: 'hundunding', name: '混沌鼎', tier: 6, mods: { atkPct: 0.1, hpPct: 0.1 }, need: { hundun: 8 }, silver: 50000, xj: 10, desc: '攻击/气血 +10%' },
];

function matName(id) {
  const m = MATS.find((x) => x.id === id);
  return m ? m.name : id;
}

function craftArtifact(id) {
  const a = ARTIFACTS.find((x) => x.id === id);
  if (!a) return;
  if (S.artifacts && S.artifacts[id]) { addLog('已经炼成过了。', 'sys'); return; }
  if ((S.tier || 0) < a.tier) { addLog('道途不足，炼不了这件法宝。', 'bad'); return; }
  for (const k of Object.keys(a.need)) {
    if ((S.mats[k] || 0) < a.need[k]) { addLog('材料不够：' + matName(k) + ' ' + (S.mats[k] || 0) + '/' + a.need[k] + '。', 'bad'); return; }
  }
  if (S.silver < a.silver) { addLog('银两不够。', 'bad'); return; }
  if ((S.xuanjing || 0) < a.xj) { addLog('玄晶不够。', 'bad'); return; }
  for (const k of Object.keys(a.need)) S.mats[k] -= a.need[k];
  S.silver -= a.silver;
  S.xuanjing -= a.xj;
  S.artifacts = S.artifacts || {};
  S.artifacts[id] = true;
  addLog('炉火纯青，炼成法宝【' + a.name + '】：' + a.desc + '。', 'gold');
  save();
  renderAll();
}

function equipArtifact(id) {
  if (!S.artifacts || !S.artifacts[id]) return;
  S.artEquip = S.artEquip || [null, null, null];
  if (S.artEquip.includes(id)) return;
  const idx = S.artEquip.findIndex((x) => !x);
  if (idx < 0) { addLog('法宝栏已满（3 格）。', 'bad'); return; }
  S.artEquip[idx] = id;
  addLog('你祭起【' + ARTIFACTS.find((a) => a.id === id).name + '】。', 'gold');
  save();
  renderAll();
}

function unequipArtifact(id) {
  S.artEquip = (S.artEquip || []).map((x) => (x === id ? null : x));
  save();
  renderAll();
}

function panelEquip() {
  const rows = Object.keys(SLOTS).map((slot) => {
    const it = S.equip[slot];
    if (!it) return '<div class="item"><div class="row"><span class="muted">' + SLOTS[slot].name + '：空</span></div></div>';
    return '<div class="item"><div class="row"><span class="' + it.qcls + '">' + it.name +
      ' <span class="tag">' + it.qname + (it.up ? ' +' + it.up : '') + '</span></span>' +
      '<span><button data-forge="' + it.uid + '">强化（' + forgeCost(it) + '两）</button>' +
      ' <button data-reroll="' + it.uid + '">重铸（' + rerollCost(it) + '两）</button>' +
      ' <button data-unequip="' + slot + '">卸下</button></span></div>' +
      '<div class="aff">' + itemSummary(it).join(' · ') + '</div>' +
      '<div class="aff">词条锁：' + (it.affixes || []).map((a, i) =>
        '<button data-lock="' + it.uid + ':' + i + '">' + ((it.locked || []).includes(i) ? '锁·' : '开·') + (i + 1) + '</button>'
      ).join(' ') + '</div></div>';
  });
  let html = '<h3>装备</h3>' + rows.join('');
  html += '<h4>法宝（' + (S.artEquip || []).filter(Boolean).length + ' / 3）</h4>';
  html += '<div class="aff">材料：' + MATS.map((m) => m.name + ' ' + (S.mats[m.id] || 0)).join(' · ') + '</div>';
  S.artEquip = S.artEquip || [null, null, null];
  html += S.artEquip.map((id, i) => {
    const a = ARTIFACTS.find((x) => x.id === id);
    return '<div class="item"><div class="row"><span>' +
      (a ? a.name + ' <span class="tag">' + a.desc + '</span>' : '<span class="muted">第 ' + (i + 1) + ' 格：空</span>') +
      '</span>' + (a ? '<span><button data-art-unequip="' + a.id + '">卸下</button></span>' : '') + '</div></div>';
  }).join('');
  html += '<h4>炼制</h4>';
  for (const a of ARTIFACTS) {
    const owned = S.artifacts && S.artifacts[a.id];
    const needTxt = Object.keys(a.need).map((k) => matName(k) + ' ' + (S.mats[k] || 0) + '/' + a.need[k]).join(' · ');
    html += '<div class="item"><div class="row"><span class="q-purple">' + a.name +
      ' <span class="tag">' + a.desc + '</span></span><span>' +
      (owned
        ? (S.artEquip.includes(a.id) ? '<span class="muted">已祭起</span>' : '<button data-art-equip="' + a.id + '">祭起</button>')
        : '<button data-art-craft="' + a.id + '">炼制</button>') +
      '</span></div>' +
      '<div class="aff">需：' + needTxt + ' · ' + a.silver + '两 · ' + a.xj + '玄晶 · 道途 ' +
      TIERS[a.tier].name + ' · 材料来自劫境</div></div>';
  }
  return html +
    '<h4>说明</h4><div class="muted">品质：白 &lt; 绿 &lt; 蓝 &lt; 紫 &lt; 橙。品质越高，基础数值越高、附加词条越多。' +
    '法宝可同时祭起 3 件，2 件起有额外加成。</div>';
}

function panelBag() {
  const qs = [['all', '全部品质'], ['white', '凡品'], ['green', '良品'], ['blue', '上品'], ['purple', '珍品'], ['orange', '神品']];
  const ss = [['all', '全部部位'], ['weapon', '武器'], ['armor', '防具'], ['helmet', '头饰'], ['boots', '鞋履'], ['accessory', '饰品']];
  const filtered = S.bag.filter(matchesFilter);
  const total = filtered.reduce((a, it) => a + sellPrice(it), 0);

  let html = '<h3>行囊（装备 ' + S.bag.length + '/60）</h3>';
  html += '<div class="aff">灵石：' + (S.essence || 0) + ' / ' + ESSENCE_NEED + '（积满必出红色装备）</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">' +
    '<select data-fq style="background:#0a0f0a;color:#cfe0cf;border:1px solid #2c3f2c;border-radius:4px;padding:4px">' +
    qs.map(([v, n]) => '<option value="' + v + '"' + (bagFilter.q === v ? ' selected' : '') + '>' + n + '</option>').join('') +
    '</select>' +
    '<select data-fs style="background:#0a0f0a;color:#cfe0cf;border:1px solid #2c3f2c;border-radius:4px;padding:4px">' +
    ss.map(([v, n]) => '<option value="' + v + '"' + (bagFilter.slot === v ? ' selected' : '') + '>' + n + '</option>').join('') +
    '</select>' +
    '</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">' +
    '<button class="danger" data-sellfilter="1"' + (filtered.length ? '' : ' disabled') + '>卖出筛选（' + filtered.length + ' 件 / 约 ' + total + ' 两）</button>' +
    '<button data-sellwhite="1">一键卖凡品</button>' +
    '<button data-dismantlefilter="1"' + (filtered.length ? '' : ' disabled') + '>分解筛选（' + filtered.length + ' 件）</button>' +
    '<button data-dismantlewhite="1">一键分解凡品</button>' +
    '<button data-autoequip="1">自动换装</button>' +
    '</div>';

  if (!filtered.length) {
    html += '<div class="muted">筛选结果为空。</div>';
  } else {
    const items = filtered.slice().sort((a, b) => qualityIndex(b.quality) - qualityIndex(a.quality) || b.ilvl - a.ilvl);
    html += items.map((it) =>
      '<div class="item"><div class="row"><span class="' + it.qcls + '">' + it.name +
      ' <span class="tag">' + it.qname + ' · ' + it.ilvl + '级</span></span>' +
      '<span><button data-equip="' + it.uid + '">装备</button>' +
      ' <button data-forge="' + it.uid + '">强化（' + forgeCost(it) + '）</button>' +
      ' <button data-reroll="' + it.uid + '">重铸（' + rerollCost(it) + '）</button>' +
      ' <button data-sell="' + it.uid + '">卖 ' + sellPrice(it) + '</button></span></div>' +
      '<div class="aff">' + itemSummary(it).join(' · ') + ' · 评分 ' + itemScore(it) + '</div></div>'
    ).join('');
  }

  const potIds = Object.keys(S.potions || {}).filter((id) => S.potions[id] > 0);
  html += '<h3 style="margin-top:14px">药品</h3>';  html += potIds.length
    ? potIds.map((id) => {
        const p = POTION_BY_ID[id] || { name: id, desc: '', type: 'heal' };
        const btn = p.type === 'gift' ? '<span class="muted">赠予故人</span>' : '<button data-use="' + id + '">服用</button>';
        return '<div class="item"><div class="row"><span>' + p.name + ' ×' + S.potions[id] + '</span>' +
          btn + '</div><div class="aff">' + (p.desc || '') + '</div></div>';
      }).join('')
    : '<div class="muted">没有药品，去商铺买。</div>';
  return html;
}

/* ------------------------------------------------------------ 神秘商店 */

const MYSTERY_MS = 30 * 60 * 1000;

function refreshMystery() {
  const pool = [];
  for (const r of RELICS) {
    if (!S.relics[r.id]) pool.push({ kind: 'relic', id: r.id, name: '奇物「' + r.name + '」', desc: r.desc, price: 10 });
  }
  pool.push({ kind: 'page', name: '秘籍残页', desc: '随机一门未参透功法的残页 ×1', price: 5 });
  pool.push({ kind: 'shard', name: '神兵碎片', desc: '集齐 10 片可合成一件神兵', price: 6 });
  pool.push({ kind: 'legend', name: '神兵（随机）', desc: '直接获得一件传说神兵', price: 60 });
  const stock = [];
  for (let i = 0; i < 6 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    stock.push(pool.splice(idx, 1)[0]);
  }
  S.mystery = { stock, next: Date.now() + MYSTERY_MS };
  save();
}

function validMysteryOffer(o) {
  if (!o) return false;
  if (o.kind === 'relic') return !!RELICS.find((r) => r.id === o.id);
  return true;
}

function ensureMystery() {
  S.mystery = S.mystery || { stock: [], next: 0 };
  S.mystery.stock = (S.mystery.stock || []).filter(validMysteryOffer);
  if (!S.mystery.stock.length || Date.now() > S.mystery.next) refreshMystery();
}

function mysteryCountdown() {
  const ms = Math.max(0, (S.mystery.next || 0) - Date.now());
  const m = Math.ceil(ms / 60000);
  return m > 0 ? m + ' 分钟' : '即将刷新';
}

function buyMystery(i) {
  const o = S.mystery.stock[i];
  if (!o) return;
  if ((S.xuanjing || 0) < o.price) { addLog('玄晶不够（需 ' + o.price + ' 枚）。', 'bad'); return; }
  S.xuanjing -= o.price;
  if (o.kind === 'relic') S.relics[o.id] = true;
  else if (o.kind === 'page') dropManualPage();
  else if (o.kind === 'shard') S.shards = (S.shards || 0) + 1;
  else if (o.kind === 'legend') dropLegendary();
  S.mystery.stock.splice(i, 1);
  addLog('你用 ' + o.price + ' 枚玄晶换到了' + o.name + '。', 'gold');
  save();
  renderAll();
}

function craftLegendary() {
  if ((S.shards || 0) < 10) { addLog('神兵碎片不足（需 10 片）。', 'bad'); return; }
  S.shards -= 10;
  dropLegendary();
  save();
  renderAll();
}

function panelShop() {
  ensureMystery();
  const potHtml = POTIONS.map((p) => {
    const locked = S.level < p.lv;
    return '<div class="item"><div class="row"><span>' + p.name + ' <span class="tag">' + p.desc + '</span></span>' +
      '<span>' + p.price + ' 两 <button data-buy="' + p.id + '"' + (locked ? ' disabled' : '') + '>' +
      (locked ? '需 ' + p.lv + ' 级' : '买') + '</button></span></div></div>';
  }).join('');
  const giftHtml = GIFTS.map((g) =>
    '<div class="item"><div class="row"><span>' + g.name + ' <span class="tag">好感 +' + g.fav + ' · 每日 1 次</span></span>' +
    '<span>' + g.price + ' 两 <button data-buy="' + g.id + '">买</button></span></div></div>'
  ).join('');
  const mysteryHtml = (S.mystery.stock || []).length
    ? S.mystery.stock.map((o, i) =>
        '<div class="item"><div class="row"><span>' + o.name + ' <span class="tag">' + o.price + ' 玄晶</span></span>' +
        '<span><button data-mystery="' + i + '">兑换</button></span></div>' +
        '<div class="aff">' + o.desc + '</div></div>'
      ).join('')
    : '<div class="muted">货架空了，等刷新。</div>';
  const customHtml = '<h4>定制（花银两直接打）</h4>' +
    '<div class="muted">本等级装备，词条随机，必出所选品质。</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">' +
    [['weapon', '武器'], ['armor', '防具'], ['helmet', '头饰'], ['boots', '鞋履'], ['accessory', '饰品']].map(([slot, sn]) =>
      ['blue', 'purple', 'orange'].map((q) =>
        '<button data-custom="' + slot + ':' + q + '">' + sn + '·' +
        ({ blue: '上品', purple: '珍品', orange: '神品' }[q]) + '（' + customPrice(q) + '两）</button>'
      ).join(' ')
    ).join('<br/>') + '</div>';
  return '<h3>药店</h3>' + potHtml +
    '<h4>礼物（赠故人）</h4>' + giftHtml +
    '<h3 style="margin-top:14px">神秘商店 <span class="tag">' + mysteryCountdown() + '后刷新</span></h3>' +
    '<div class="muted">玄晶：' + (S.xuanjing || 0) + ' 枚 · 神兵碎片：' + (S.shards || 0) + ' / 10 ' +
    '<button data-craft="1">合成神兵</button></div>' +
    mysteryHtml +
    customHtml;
}

function panelDungeon() {
  const d = S.dungeon;
  const mod = dungeonMod();
  let html = '<h3>秘境</h3>' + kv('挑战令', (S.tokens || 0) + ' 枚') +
    '<div class="muted">初始 5 层，每转生 +1 层（最多 20）。中途不能换装，死亡即失败。打本图首领必得 1 枚挑战令。</div>';
  if (d.active) {
    html += '<div class="item"><div class="row"><span>进行中：第 ' + d.step + ' / ' + d.total + ' 阵' +
      (d.space === 'liaozhai' ? ' · 理智 ' + (d.sanity || 0) + ' / 100' : '') +
      (mod ? ' · 【' + mod.name + '】' + mod.desc : '') + '</span></div></div>' +
      '<div style="display:flex;gap:6px;margin:6px 0"><button class="danger" data-abandon="1">放弃秘境</button></div>';
  } else {
    html += '<div style="display:flex;gap:6px;margin:6px 0"><button class="primary" data-enter="1"' +
      ((S.tokens || 0) > 0 ? '' : ' disabled') + '>进入秘境（消耗 1 枚）</button></div>';
  }
  html += '<h4>掉落</h4><div class="muted">套装部件 55% · 奇物 5% · 秘籍残页 50% · 神兵 3%，通关返还 1 枚挑战令。</div>';
  html += '<h4 style="margin-top:14px">异空间</h4>';
  html += OVERWORLDS.map((w) =>
    '<div class="item"><div class="row"><span>' + w.name + ' <span class="tag">' + w.mobs.join(' / ') + ' / ' + w.boss + '</span></span>' +
    '<span><button data-other="' + w.id + '"' + ((S.tokens || 0) >= 2 && !S.dungeon.active ? '' : ' disabled') + '>进入（2 挑战令）</button></span></div>' +
    '<div class="aff">' + w.desc + ' 通关掉落奇物，收进行囊。</div></div>'
  ).join('');
  const wk = ensureWeek();
  const wbIdx = Math.abs(parseInt(wk.key.split('-W')[1] || '1', 10)) % WEEKLY_BOSSES.length;
  const wb = WEEKLY_BOSSES[wbIdx];
  html += '<h4 style="margin-top:14px">本周挑战</h4>' +
    '<div class="item"><div class="row"><span>' + wb.name +
    (wk.done ? ' <span class="tag">已完成</span>' : '') + '</span>' +
    '<span>' + (wk.done ? '' : '<button data-weekly="1">挑战</button>') + '</span></div>' +
    '<div class="aff">' + wb.line + ' 每周一位，击败得 5 玄晶 + 5000 两。周一刷新。</div></div>';
  html += '<h4 style="margin-top:14px">爬塔</h4>';
  html += panelTower().replace('<h3>爬塔</h3>', '');
  return html;
}

function panelCodex() {
  const c = S.codex;
  const relicIds = Object.keys(S.relics || {}).filter((id) => {
    const r = RELICS.find((x) => x.id === id);
    return r && (!codexFilter || r.name.indexOf(codexFilter) >= 0);
  });
  const tabs = [['relic', '奇物'], ['ach', '成就'], ['set', '套装'], ['legend', '神兵'], ['manual', '秘籍'], ['clothes', '衣柜'], ['npc', '群侠录']];
  let html = '<h3>图鉴</h3>' +
    '<div style="display:flex;gap:6px;margin:6px 0;flex-wrap:wrap">' +
    tabs.map(([id, label]) => '<button data-codextab="' + id + '"' + (codexTab === id ? ' class="primary"' : '') + '>' + label + '</button>').join('') +
    '</div>' +
    kv('完成度', Math.round(codexProgress() * 100) + '%') +
    '<div class="muted">奇物 ' + Object.keys(S.relics || {}).length + ' / ' + RELICS.length +
    ' · 达成 25% / 50% / 75% / 100% 各有一笔银两和挑战令奖励。</div>';
  if (codexTab === 'ach') {
    html += panelAch();
  } else {
    html += '<input id="codex-search" placeholder="搜索奇物…" value="' + escapeHtml(codexFilter) + '" ' +
      'style="width:100%;margin:6px 0;padding:8px;background:#0a0f0a;border:1px solid #2c3f2c;color:#cfe0cf;border-radius:4px;font:inherit" />';
    html += '<h4>奇物</h4>';
    html += relicIds.length
      ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0">' +
        relicIds.map((id) => {
          const r = RELICS.find((x) => x.id === id);
          if (!r) return '';
          const cnt = (S.relicCount || {})[id] || 1;
          const open = expandedRelic === id;
          return '<div class="item" data-relic="' + id + '" style="padding:4px 6px;cursor:pointer">' +
            '<span class="q-red">' + r.name + (starStr(cnt) ? ' ' + starStr(cnt) : '') + '</span>' +
            '<div class="aff">' + (relicEffect(r) || '—') + (cnt > 1 ? ' · ×' + cnt : '') + '</div>' +
            (open ? '<div class="aff" style="margin-top:4px;color:#9fb59f">' + r.desc + '</div>' : '') +
            '</div>';
        }).join('') + '</div>'
      : '<div class="muted">还没有奇物。秘境异空间里能捡到。</div>';
  }

  if (codexTab === 'set') {
    for (const set of SETS) {
      const owned = c.sets[set.id] || {};
      const n = Object.keys(owned).length;
      html += '<div class="item"><div class="row"><span class="q-purple">' + set.name + ' ' + n + '/5</span></div>' +
        '<div class="aff">2 件：' + set.b2 + ' · 4 件：' + set.b4 + ' · 5 件：' + set.b5 + '</div>' +
        '<div class="aff">' + set.pieces.map((p, i) => (owned[i] ? '✔ ' : '✘ ') + p).join(' · ') + '</div></div>';
    }
  } else if (codexTab === 'legend') {
    for (const L of LEGENDARIES) {
      const got = !!c.legend[L.id];
      html += '<div class="item"><div class="row"><span class="' + (got ? 'q-orange' : 'muted') + '">' +
        (got ? L.name : '？？？') + '</span></div><div class="aff">' + (got ? L.desc + '（已获得，永久生效）' : '尚未出世') + '</div></div>';
    }
  } else if (codexTab === 'manual') {
    for (const m of MANUALS) {
      const got = !!c.manuals[m.id];
      const pages = c.manualPages[m.id] || 0;
      html += '<div class="item"><div class="row"><span class="' + (got ? 'q-green' : 'muted') + '">' +
        (got ? m.name : '残页 ' + pages + '/5') + '</span></div><div class="aff">' + m.desc + '</div></div>';
    }
  } else if (codexTab === 'clothes') {
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0">' +
      CLOTHES.map((cl) => {
        const got = !!S.codex.clothes[cl.id];
        return '<div class="item" style="padding:4px 6px"><span class="' + (got ? 'q-purple' : 'muted') + '">' +
          (got ? cl.name : '？？？') + '</span><div class="aff">' +
          (got ? cl.desc : '攻略' + npcName(cl.from) + '后可获得') + '</div></div>';
      }).join('') + '</div>';
  } else if (codexTab === 'npc') {
    html += HEROES.map((h) => {
      const seen = S.level >= h.lv;
      return '<div class="item"><div class="row"><span class="' + (seen ? 'q-blue' : 'muted') + '">' +
        (seen ? h.name : '？？？') + '</span></div><div class="aff">' + (seen ? h.desc : '修为不足，未见其人') + '</div></div>';
    }).join('');
  }
  return html;
}

function boardList(title, entries, you, note) {
  const rows = entries.slice();
  rows.push({ name: (S.name || '你') + '（你）', score: you, me: true });
  rows.sort((a, b) => b.score - a.score);
  return '<h4>' + title + '</h4>' + (note ? '<div class="muted">' + note + '</div>' : '') +
    rows.map((e, i) => '<div class="kv"><span>' + (i + 1) + '. ' +
      escapeHtml(e.name) + (e.me ? ' ←' : '') + '</span><b>' + Math.round(e.score) + '</b></div>').join('');
}

function panelBoard() {
  const honor = S.honor || 0;
  const chivalry = NPCS.map((n) => ({ name: n.name, score: n.faction === 'good' ? 72 : n.faction === 'neutral' ? 40 : 12 }));
  const villains = NPCS.map((n) => ({ name: n.name, score: n.faction === 'evil' ? 72 : n.faction === 'neutral' ? 28 : 6 }));
  const fairies = NPCS.map((n) => ({ name: n.name, score: npcState(n.id).fav }))
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ name: e.name, score: e.score }));
  return '<h3>百晓生榜</h3>' +
    boardList('侠客榜', chivalry, honor, '侠义越高，名次越前。') +
    boardList('恶人榜', villains, -honor, '恶名越重，名次越前。') +
    '<h4>仙子榜</h4><div class="muted">按你与各人的情分排。</div>' +
    fairies.map((e, i) => '<div class="kv"><span>' + (i + 1) + '. ' + escapeHtml(e.name) + '</span><b>' + Math.round(e.score) + '</b></div>').join('') +
    '<h4>榜单奖励</h4>' +
    BOARD_REWARDS.map((r) => {
      const claimed = (S.boardClaimed || []).includes(r.id);
      const ok = r.need();
      return '<div class="item"><div class="row"><span>' + r.name + '</span>' +
        '<span>' + (claimed ? '<span class="muted">已领</span>' : (ok ? '<button data-board="' + r.id + '">领取 20000 两</button>' : '未达成')) + '</span></div></div>';
    }).join('');
}

function passiveEffect(id) {
  const p = PASSIVES.find((x) => x.id === id);
  if (!p) return '';
  const lv = S.passiveLevels[id] || 1;
  const q = skillQ(id);
  const scale = (1 + (lv - 1) * 0.12) * (1 + (q - 1) * 0.15);
  const m = p.mods;
  const parts = [];
  if (m.mpMaxPct) parts.push('内力上限+' + (m.mpMaxPct * scale * 100).toFixed(1) + '%');
  if (m.mpRegen) parts.push('内力回复+' + (m.mpRegen * scale).toFixed(1));
  if (m.defPct) parts.push('防御+' + (m.defPct * scale * 100).toFixed(1) + '%');
  if (m.agiPct) parts.push('身法+' + (m.agiPct * scale * 100).toFixed(1) + '%');
  if (m.atkPct) parts.push('攻击+' + (m.atkPct * scale * 100).toFixed(1) + '%');
  if (m.hpPct) parts.push('气血+' + (m.hpPct * scale * 100).toFixed(1) + '%');
  if (m.dmgReduce) parts.push('受伤-' + (m.dmgReduce * scale * 100).toFixed(1) + '%');
  if (m.dodge) parts.push('闪避+' + (m.dodge * scale).toFixed(1) + '%');
  if (m.crit) parts.push('暴击+' + (m.crit * scale).toFixed(1) + '%');
  if (m.critDmg) parts.push('暴伤+' + (m.critDmg * scale).toFixed(1) + '%');
  if (m.skillPower) parts.push('招式威力+' + (m.skillPower * scale).toFixed(1) + '%');
  return parts.join(' · ');
}

function skillRow(id, kind, idx) {
  const sk = skillById(id);
  const q = skillQ(id);
  const lvBtn = kind === 'passive'
    ? ((S.passiveLevels[id] || 1) >= 10
        ? ' <span class="muted">已满重</span>'
        : ' <button data-up-passive="' + id + '">升重（' + passiveCost(id) + '两）</button>')
    : '';
  const upBtn = q >= 3 ? '' : ' <button data-up-skill="' + id + '">进阶（' + skillUpCost(id) + '两）</button>';
  const uneq = ' <button data-' + (kind === 'passive' ? 'unpassive' : 'unactive') + '="' + idx + '">卸下</button>';
  const extra = kind === 'passive'
    ? ('第 ' + (S.passiveLevels[id] || 1) + ' 重 · 当前：' + passiveEffect(id))
    : ('耗内力 ' + sk.cost + ' · 冷却 ' + sk.cd + ' 回合');
  const qtxt = '效果 ×' + (1 + (q - 1) * 0.15).toFixed(2);
  return '<div class="item"><div class="row"><span class="' + skillQClass(q) + '">' +
    (kind === 'passive' ? '《' + sk.name + '》' : '「' + sk.name + '」') + '</span>' +
    '<span>' + lvBtn + upBtn + uneq + '</span></div>' +
    '<div class="aff">' + sk.desc + ' · ' + extra + ' · ' + skillQName(q) + '（' + qtxt + '）</div></div>';
}

function learnedRow(id, kind) {
  const sk = skillById(id);
  const q = skillQ(id);
  const equipped = kind === 'passive' ? (S.passiveEquip || []).includes(id) : S.activeEquip.includes(id);
  const btn = equipped ? '<span class="muted">已装备</span>'
    : '<button data-' + (kind === 'passive' ? 'passive' : 'active') + '="' + id + '">装备</button>';
  const eff = kind === 'passive' ? (' · 当前：' + passiveEffect(id)) : '';
  return '<div class="item"><div class="row"><span class="' + skillQClass(q) + '">' +
    (kind === 'passive' ? '《' + sk.name + '》' : '「' + sk.name + '」') + '</span>' + btn + '</div>' +
    '<div class="aff">' + sk.desc + eff + ' · ' + skillQName(q) + '</div></div>';
}

function panelSkill() {
  const learnedP = S.learned.passives;
  const actives = S.learned.actives;
  const ps = passiveSlots();
  const as = activeSlots();

  let html = '<h3>心法（' + (S.passiveEquip || []).length + ' / ' + ps + ' 格）</h3>';
  html += '<div class="muted">40 级 +1 格，70 级 +1 格</div>';
  for (let i = 0; i < ps; i++) {
    const id = (S.passiveEquip || [])[i];
    html += id ? skillRow(id, 'passive', i)
      : '<div class="item"><div class="muted">第 ' + (i + 1) + ' 格：空</div></div>';
  }
  html += '<h4>已习心法</h4>';
  html += learnedP.length ? learnedP.map((id) => learnedRow(id, 'passive')).join('') : '<div class="muted">尚无。</div>';

  html += '<h3 style="margin-top:14px">功法（' + S.activeEquip.filter(Boolean).length + ' / ' + as + ' 格）</h3>';
  html += '<div class="muted">30 级 +1 格，60 级 +1 格</div>';
  for (let i = 0; i < as; i++) {
    const id = S.activeEquip[i];
    html += id ? skillRow(id, 'active', i)
      : '<div class="item"><div class="muted">第 ' + (i + 1) + ' 格：空</div></div>';
  }
  html += '<h4>已习功法</h4>';
  html += actives.length ? actives.map((id) => learnedRow(id, 'active')).join('')
    : '<div class="muted">尚无。打怪有概率拾得残页，集齐 ' + PAGES_NEEDED + ' 张可参透。</div>';

  const pages = Object.keys(S.pages);
  if (pages.length) {
    html += '<h4>残页</h4>' + pages.map((id) => {
      const sk = ACTIVES.find((x) => x.id === id);
      return kv(sk.name, S.pages[id] + ' / ' + PAGES_NEEDED);
    }).join('');
  }
  return html;
}

function allyDesc(id) {
  const m = ALLY_BONUS[id] || {};
  const parts = [];
  if (m.atkPct) parts.push('攻击+' + Math.round(m.atkPct * 100) + '%');
  if (m.hpPct) parts.push('气血+' + Math.round(m.hpPct * 100) + '%');
  if (m.defPct) parts.push('防御+' + Math.round(m.defPct * 100) + '%');
  if (m.crit) parts.push('暴击+' + m.crit + '%');
  if (m.dodge) parts.push('闪避+' + m.dodge + '%');
  if (m.drop) parts.push('掉落+' + Math.round(m.drop * 100) + '%');
  if (m.expPct) parts.push('经验+' + Math.round(m.expPct * 100) + '%');
  return parts.join(' · ') || '—';
}

function petDesc(id) {
  const p = PETS.find((x) => x.id === id);
  if (!p) return '';
  const lv = (S.pets[id] && S.pets[id].level) || 1;
  const evo = (S.pets[id] && S.pets[id].evo) ? 1.5 : 1;
  const scale = (1 + (lv - 1) * 0.1) * evo;
  const m = p.mods;
  const parts = [];
  if (m.atkPct) parts.push('攻击+' + Math.round(m.atkPct * scale * 100) + '%');
  if (m.hpPct) parts.push('气血+' + Math.round(m.hpPct * scale * 100) + '%');
  if (m.dodge) parts.push('闪避+' + (m.dodge * scale).toFixed(1) + '%');
  if (m.crit) parts.push('暴击+' + (m.crit * scale).toFixed(1) + '%');
  if (m.drop) parts.push('掉落+' + Math.round(m.drop * scale * 100) + '%');
  return parts.join(' · ');
}

function panelRebirth() {
  const list = (S.talents || []).map((id) => {
    const t = TALENTS.find((x) => x.id === id);
    if (!t) return '';
    const lv = (S.talentLv && S.talentLv[id]) || 1;
    const cost = talentUpCost(id);
    const maxed = lv >= TALENT_MAX;
    return '<div class="item"><div class="row"><span class="q-blue">' + t.name +
      ' <span class="tag">' + lv + ' / ' + TALENT_MAX + ' 级 · 效果 ×' + (1 + 0.5 * (lv - 1)).toFixed(1) + '</span></span>' +
      '<span>' + (maxed ? '<span class="muted">已满级</span>' : '<button data-talent-up="' + id + '">升级（' + cost + ' 点）</button>') +
      '</span></div><div class="aff">' + t.desc + '</div></div>';
  }).join('');
  return '<h3>轮回</h3>' +
    kv('轮回次数', S.rebirth || 0) +
    kv('轮回点', S.reinc || 0) +
    kv('图鉴完成度', Math.round(codexProgress() * 100) + '%') +
    '<div class="muted">60 级可轮回。重置等级、银两、普通装备；保留图鉴、收藏、队友、配偶、宠物、天赋、侠义。</div>' +
    '<div class="muted">轮回点用于升级天赋：每级 +50% 效果，最高 5 级，升级消耗 1～4 点。</div>' +
    '<div style="margin:8px 0"><button class="danger" data-rebirth="1"' + (canRebirth() ? '' : ' disabled') + '>' +
    (canRebirth() ? '轮回（可得 ' + reincPoints() + ' 点）' : '需要 60 级') + '</button></div>' +
    '<h4>已得天赋</h4>' + (list || '<div class="muted">还没有。转生时三选一。</div>');
}

function panelParty() {
  let html = '<h3>伙伴</h3>';
  const bonded = NPCS.filter((n) => npcState(n.id).bond);
  html += '<h4>出战队伍（' + (S.party || []).length + ' / 4）</h4>';
  html += '<div class="muted">只有结缘过的人能上阵；战斗时会按身法依次出手。</div>';
  html += bonded.length
    ? bonded.map((n) => {
        const inParty = (S.party || []).includes(n.id);
        return '<div class="item"><div class="row"><span>' + n.name + ' <span class="tag">' + allyDesc(n.id) + '</span></span>' +
          '<span>' + (inParty ? '<button data-party="' + n.id + '">下阵</button>' : '<button data-party="' + n.id + '">上阵</button>') + '</span></div></div>';
      }).join('')
    : '<div class="muted">还没有结缘的人。好感 90 后可邀请或成婚。</div>';
  html += '<h4>队友（' + (S.companions || []).length + ' / 2）</h4>';
  html += (S.companions || []).length
    ? S.companions.map((id) => kv(npcName(id), allyDesc(id))).join('')
    : '<div class="muted">好感 90 后可邀请一位故人同行。</div>';
  html += '<h4>内院（' + (S.spouses || []).length + '）</h4>';
  html += (S.spouses || []).length
    ? S.spouses.map((id) => kv(npcName(id), allyDesc(id))).join('')
    : '<div class="muted">尚无婚约。好感 90 后可提亲，不限人数。</div>';
  html += '<h4>宠物</h4>';
  const petIds = Object.keys(S.pets || {});
  if (!petIds.length) {
    html += '<div class="muted">野外会遇到狼、狗、猫、鹰、麻雀，50 两收服。</div>';
  } else {
    for (const id of petIds) {
      const p = PETS.find((x) => x.id === id);
      const pet = S.pets[id];
      html += '<div class="item"><div class="row"><span>' + p.name + ' · ' + pet.level + ' 级' +
        (pet.evo ? ' · 已进化' : '') + (S.petActive === id ? ' <span class="tag">出战</span>' : '') + '</span>' +
        '<span><button data-feed="' + id + '">喂食（100 两）</button>' +
        (!pet.evo && pet.level >= 10 ? ' <button data-evolve="' + id + '">进化（3000 两）</button>' : '') +
        (S.petActive === id ? '' : ' <button data-pet-active="' + id + '">出战</button>') + '</span></div>' +
        '<div class="aff">' + p.desc + ' · 当前 ' + petDesc(id) + '</div></div>';
    }
  }
  html += '<h4>宠物图鉴</h4>' + PETS.map((p) => {
    const owned = !!S.pets[p.id];
    return '<div class="kv"><span class="' + (owned ? 'q-green' : 'muted') + '">' + p.name + '</span><b>' +
      (owned ? '已收服' : '未收服') + '</b></div>';
  }).join('');
  return html;
}

/* ------------------------------------------------------------ 铁匠铺 */

const FORGE_MAX = 10;

function forgeCost(it) {
  return Math.round((40 + it.ilvl * 12) * qualityIndex(it.quality) * Math.pow(1.5, it.up || 0));
}

function rerollCost(it) {
  return Math.round((80 + it.ilvl * 20) * qualityIndex(it.quality)) + 400 * ((it.locked || []).length);
}

function ownedItem(uid) {
  for (const k of Object.keys(SLOTS)) {
    const it = S.equip[k];
    if (it && it.uid === uid) return it;
  }
  return S.bag.find((x) => x.uid === uid) || null;
}

function forgeItem(uid) {
  const it = ownedItem(uid);
  if (!it) return;
  if (it.sponsor) { addLog('赞助物品不可强化。', 'sys'); return; }
  if ((it.up || 0) >= FORGE_MAX) { addLog('已经 +' + FORGE_MAX + ' 了。', 'sys'); return; }
  const cost = forgeCost(it);
  if (S.silver < cost) { addLog('银两不够（需 ' + cost + '）。', 'bad'); return; }
  S.silver -= cost;
  it.up = (it.up || 0) + 1;
  const upMul = 1 + 0.08 * it.up;
  addLog('铁匠把' + it.name + '砸到了 +' + it.up + '（基础属性 ×' + upMul.toFixed(2) + '）。', 'gold');
  save();
  renderAll();
}

function rerollItem(uid) {
  const it = ownedItem(uid);
  if (!it) return;
  if (it.sponsor) { addLog('赞助物品不可重铸。', 'sys'); return; }
  const cost = rerollCost(it);
  if (S.silver < cost) { addLog('银两不够（需 ' + cost + '）。', 'bad'); return; }
  const q = QUALITIES.find((x) => x.k === it.quality);
  const n = q ? q.affixes : 0;
  S.silver -= cost;
  const keys = Object.keys(AFFIXES);
  const used = new Set();
  const old = it.affixes.slice();
  const locked = it.locked || [];
  const next = [];
  for (let i = 0; i < n; i++) {
    if (locked.includes(i) && old[i]) {
      next.push(old[i]);
      used.add(old[i].k);
      continue;
    }
    let k = pick(keys);
    let guard = 0;
    while (used.has(k) && guard++ < 30) k = pick(keys);
    used.add(k);
    next.push({ k, v: AFFIXES[k].roll(it.ilvl) });
  }
  it.affixes = next;
  addLog('铁匠重铸了' + it.name + '的词条。', 'gold');
  save();
  renderAll();
}

/* ------------------------------------------------------------ 醉月楼 */

function visitBrothel(id) {
  const o = BROTHEL.find((x) => x.id === id);
  if (!o) return;
  if (o.buff && (S.tempBuffs || []).some((b) => b.id === o.buff.id && b.until > Date.now())) {
    addLog('这一项还在生效，等它过去再来。', 'sys');
    return;
  }
  if (S.silver < o.price) { addLog('银两不够。', 'bad'); return; }
  S.silver -= o.price;
  if (id === 'wine') battle.hp = totalStats().hp;
  if (o.buff) S.tempBuffs.push(Object.assign({ until: Date.now() + 30 * 60 * 1000 }, o.buff));
  addLog(o.name + '：' + o.scene, 'story');
  save();
  renderAll();
}

function panelBrothel() {
  let html = '<h3>醉月楼</h3>' +
    '<div style="display:flex;gap:6px;margin:6px 0">' +
    '<button data-brothel-tab="fun"' + (brothelTab === 'fun' ? ' class="primary"' : '') + '>消遣</button>' +
    '<button data-brothel-tab="bounty"' + (brothelTab === 'bounty' ? ' class="primary"' : '') + '>悬赏</button></div>';
  if (brothelTab === 'bounty') return html + panelBounty();
  const now = Date.now();
  const active = (S.tempBuffs || []).filter((b) => b.until > now);
  html += '<div class="muted">银两有去处了。喝一壶、听一曲、看支舞，都是正经消遣。</div>';
  html += BROTHEL.map((o) =>
    '<div class="item"><div class="row"><span>' + o.name + ' <span class="tag">' + o.desc + '</span></span>' +
    '<span>' + o.price + ' 两 <button data-brothel="' + o.id + '">去</button></span></div></div>'
  ).join('');
  if (active.length) {
    html += '<h4>当前状态</h4>' + active.map((b) => {
      const m = Math.ceil((b.until - now) / 60000);
      const parts = [];
      if (b.expPct) parts.push('经验+' + Math.round(b.expPct * 100) + '%');
      if (b.drop) parts.push('掉落+' + Math.round(b.drop * 100) + '%');
      if (b.silverPct) parts.push('银两+' + Math.round(b.silverPct * 100) + '%');
      return kv(parts.join(' · '), m + ' 分钟');
    }).join('');
  }
  return html;
}

/* ------------------------------------------------------------ 门派 */

function fightSect(id) {
  const s = SECTS.find((x) => x.id === id);
  if (!s) return;
  if (S.level < s.lv) { addLog('你还没资格拜山。', 'bad'); return; }
  if ((S.duel && S.duel.active) || S.dungeon.active) { addLog('你正忙着。', 'bad'); return; }
  S.duel = { active: true, sectId: id };
  battle.hp = totalStats().hp;
  battle.mp = totalStats().mp;
  battle.usedPot = 0;
  battle.potCd = 0;
  S.buffs = [];
  monster = null;
  addLog('你递上名帖，' + s.master + '从门里走出来。', 'boss');
  spawnMonster();
  save();
  renderAll();
}

function winSectDuel() {
  const s = SECTS.find((x) => x.id === S.duel.sectId);
  S.duel = { active: false, sectId: null };
  if (s) {
    S.exp += s.exp;
    S.silver += s.silver;
    addHonor(s.honor);
    S.sects[s.id] = (S.sects[s.id] || 0) + 1;
    bountyAdd('sect', 1);
    addLog('你赢了' + s.master + '，' + s.name + '上下都记住了你。', 'gold');
  }
  levelUpIfNeeded();
  monster = null;
  save();
  spawnMonster();
  renderAll();
}

function loseSectDuel() {
  const s = SECTS.find((x) => x.id === S.duel.sectId);
  S.duel = { active: false, sectId: null };
  battle.hp = Math.round(totalStats().hp * 0.5);
  addLog('你输给了' + (s ? s.master : '对手') + '，被请出了山门。', 'bad');
  monster = null;
  save();
  spawnMonster();
  renderAll();
}

function doSectTask(id) {
  const s = SECTS.find((x) => x.id === id);
  if (!s) return;
  const d = todayKey();
  if (S.sectTasks.date !== d) S.sectTasks = { date: d, done: [] };
  if (S.sectTasks.done.includes(id)) { addLog('今天的门派任务已经做过了。', 'sys'); return; }
  S.sectTasks.done.push(id);
  S.silver += 2000;
  S.exp += 800;
  S.sects[id] = (S.sects[id] || 0) + 1;
  addLog('你替' + s.name + '办完了一桩差事，得 2000 两、800 经验，声望 +1。', 'gold');
  save();
  renderAll();
}

function learnSect(id) {
  const s = SECTS.find((x) => x.id === id);
  if (!s || !s.teach) return;
  if ((S.sects[id] || 0) < 3) { addLog('声望不够，需先赢 3 场。', 'bad'); return; }
  if (S.learned.passives.includes(s.teach)) { addLog('这门心法已经学过了。', 'sys'); return; }
  if (S.silver < s.teachPrice) { addLog('银两不够（需 ' + s.teachPrice + '）。', 'bad'); return; }
  S.silver -= s.teachPrice;
  S.learned.passives.push(s.teach);
  S.passiveLevels[s.teach] = 1;
  addLog('你在' + s.name + '学到了《' + PASSIVES.find((p) => p.id === s.teach).name + '》。', 'gold');
  save();
  renderAll();
}

const HALL_SLOTS = [
  { id: 'teach', name: '教习', desc: '教弟子，产声望' },
  { id: 'garden', name: '药园', desc: '种灵草，产药材' },
  { id: 'ledger', name: '账房', desc: '管账目，产银两' },
  { id: 'steward', name: '管事', desc: '收徒与效率' },
];

const HALL_APT = {
  wangyuyan: { teach: 0.6 },
  huangrong: { ledger: 0.6 },
  longnv: { garden: 0.6 },
  zhaomin: { steward: 0.6 },
  liqiushui: { teach: 0.4, ledger: 0.2 },
  yingying: { ledger: 0.4 },
  zhiruo: { teach: 0.4 },
  susu: { steward: 0.4 },
  axiu: { garden: 0.4 },
  lucy: { steward: 0.4 },
};

function hallState() {
  if (!S.hall) {
    S.hall = { level: 1, last: Date.now(), herbs: 0, rep: 0, recruits: 0, slots: { teach: null, garden: null, ledger: null, steward: null } };
  }
  S.hall.slots = S.hall.slots || { teach: null, garden: null, ledger: null, steward: null };
  if (!Array.isArray(S.hall.disciples)) S.hall.disciples = [];
  return S.hall;
}

function hallApt(id, slot) {
  if (!id) return 0;
  const a = HALL_APT[id] || {};
  return (a[slot] || 0) + 0.15;
}

function hallBonus(slot) {
  const h = hallState();
  return hallApt(h.slots[slot], slot);
}

function hallRates() {
  const h = hallState();
  const mult = 1 + 0.25 * (h.level - 1);
  return {
    silver: Math.round((80 + 160 * (1 + hallBonus('ledger'))) * mult),
    herbs: Math.round((10 + 25 * (1 + hallBonus('garden'))) * mult),
    rep: Math.round((2 + 4 * (1 + hallBonus('teach'))) * mult),
  };
}

function hallAccrue(claim) {
  const h = hallState();
  const now = Date.now();
  const hours = Math.min(12, Math.max(0, (now - (h.last || now)) / 3600000));
  const r = hallRates();
  const silver = Math.floor(r.silver * hours);
  const herbs = Math.floor(r.herbs * hours);
  const rep = Math.floor(r.rep * hours);
  if (claim) {
    h.last = now;
    S.silver += silver;
    h.herbs += herbs;
    h.rep += rep;
    addLog('武馆结算 ' + hours.toFixed(1) + ' 小时：银两 +' + silver + '，药材 +' + herbs + '，声望 +' + rep + '。', 'gold');
    save();
    renderAll();
  }
  return { hours, silver, herbs, rep };
}

function hallAssign(slot, id) {
  const h = hallState();
  if (id && !npcState(id).bond) return;
  for (const k of Object.keys(h.slots)) {
    if (h.slots[k] === id) h.slots[k] = null;
  }
  h.slots[slot] = id || null;
  addLog(id ? '「' + npcName(id) + '」接手了' + HALL_SLOTS.find((s) => s.id === slot).name + '。' : '你撤下了' + HALL_SLOTS.find((s) => s.id === slot).name + '的人。', 'sys');
  save();
  renderAll();
}

function hallUpgrade() {
  const h = hallState();
  if (h.level >= 5) { addLog('武馆已是天下第一。', 'sys'); return; }
  const cost = 5000 * h.level;
  const needRep = 30 * h.level;
  if (S.silver < cost) { addLog('银两不够（需 ' + cost + '）。', 'bad'); return; }
  if (h.rep < needRep) { addLog('声望不够（需 ' + needRep + '）。', 'bad'); return; }
  S.silver -= cost;
  h.rep -= needRep;
  h.level += 1;
  addLog('武馆升级到 ' + h.level + ' 级，产出提升。', 'gold');
  save();
  renderAll();
}

const DISCIPLE_NAMES = ['张铁柱', '李小刀', '王二虎', '陈阿牛', '林小满', '赵石头', '周小乙', '孙铁牛', '吴小七', '郑小满', '冯小刀', '褚阿福'];

function hallRecruit() {
  const h = hallState();
  if (h.herbs < 30) { addLog('药材不够（收徒需 30）。', 'bad'); return; }
  h.disciples = h.disciples || [];
  if (h.disciples.length >= 6) { addLog('武馆最多带 6 名弟子，先让他们出师。', 'bad'); return; }
  h.herbs -= 30;
  h.recruits += 1;
  const name = pick(DISCIPLE_NAMES) + '·' + ['甲', '乙', '丙', '丁', '戊', '己'][h.disciples.length];
  const apt = rndInt(3, 9);
  h.disciples.push({ name, apt, exp: 0 });
  const gain = Math.round(200 + 60 * h.level + hallBonus('steward') * 400);
  S.silver += gain;
  h.rep += 2;
  addLog('你收下弟子「' + name + '」（资质 ' + apt + '），束脩 ' + gain + ' 两。', 'gold');
  save();
  renderAll();
}

function hallTrain(i) {
  const h = hallState();
  const d = (h.disciples || [])[i];
  if (!d) return;
  if (h.herbs < 10) { addLog('药材不够（培养需 10）。', 'bad'); return; }
  h.herbs -= 10;
  const gain = 15 + Math.round(hallBonus('teach') * 25) + d.apt * 2;
  d.exp += gain;
  addLog('「' + d.name + '」练了一趟功，进度 +' + gain + '（' + Math.min(100, d.exp) + '/100）。', 'sys');
  save();
  renderAll();
}

function hallGraduate(i) {
  const h = hallState();
  const d = (h.disciples || [])[i];
  if (!d) return;
  if (d.exp < 100) { addLog('还没到出师的火候。', 'sys'); return; }
  h.disciples.splice(i, 1);
  const silver = 500 + d.apt * 120;
  const rep = 3 + Math.floor(d.apt / 3);
  S.silver += silver;
  h.rep += rep;
  addLog('弟子「' + d.name + '」出师，摆酒三日。银两 +' + silver + '，声望 +' + rep + '。', 'gold');
  save();
  renderAll();
}

function hallTrial() {
  const h = hallState();
  const now = Date.now();
  if (h.trialAt && now < h.trialAt) {
    const m = Math.ceil((h.trialAt - now) / 60000);
    addLog('刚踢完馆，歇口气（' + m + ' 分钟后再来）。', 'sys');
    return;
  }
  const req = 2000 + h.level * 1500;
  const pw = powerScore(totalStats());
  const chance = clamp(0.5 + (pw - req) / Math.max(1, req) * 0.3, 0.15, 0.92);
  h.trialAt = now + 2 * 3600 * 1000;
  if (Math.random() < chance) {
    const rep = 8 + h.level * 2;
    const silver = 2000 * h.level;
    h.rep += rep;
    S.silver += silver;
    h.trialWin = (h.trialWin || 0) + 1;
    addLog('有人上门踢馆，被你当众打退。声望 +' + rep + '，银两 +' + silver + '。', 'gold');
  } else {
    h.rep = Math.max(0, h.rep - 5);
    addLog('踢馆的人赢了半招，弟子们有些丧气。声望 -5。', 'bad');
  }
  save();
  renderAll();
}

function hallAlchemy() {
  const h = hallState();
  if (h.herbs < 40) { addLog('药材不够（炼丹需 40）。', 'bad'); return; }
  h.herbs -= 40;
  const pool = ['jinchuang', 'dahuan', 'huiqi', 'xingqi', 'jiedu'];
  const id = pick(pool);
  const n = 2 + rndInt(0, 1);
  S.potions[id] = (S.potions[id] || 0) + n;
  const p = POTIONS.find((x) => x.id === id);
  addLog('丹房开炉，炼出「' + p.name + '」×' + n + '（药材 -40）。', 'gold');
  save();
  renderAll();
}

function panelHall() {
  if (S.ending !== 'retire' && !S.hallUnlocked) {
    return '<h4>武馆</h4><div class="muted">归隐结局后，可在青石村开一间武馆，让故人替你打理。</div>';
  }
  const h = hallState();
  const acc = hallAccrue(false);
  const r = hallRates();
  let html = '<h4>武馆（' + h.level + ' / 5 级）</h4>';
  html += kv('已累积', acc.hours.toFixed(1) + ' 小时（最多 12）');
  html += kv('待领取', acc.silver + ' 两 · ' + acc.herbs + ' 药材 · ' + acc.rep + ' 声望');
  html += kv('每小时', r.silver + ' 两 · ' + r.herbs + ' 药材 · ' + r.rep + ' 声望');
  html += '<div class="muted">药材：' + h.herbs + ' · 声望：' + h.rep + ' · 弟子：' + h.recruits + '</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">' +
    '<button class="primary" data-hall-claim="1">领取产出</button>' +
    '<button data-hall-recruit="1">收徒（30 药材）</button>' +
    '<button data-hall-alchemy="1">炼丹（40 药材）</button>' +
    '<button data-hall-up="1">升级（' + (5000 * h.level) + ' 两 · ' + (30 * h.level) + ' 声望）</button></div>';
  const bonded = NPCS.filter((n) => npcState(n.id).bond);
  for (const slot of HALL_SLOTS) {
    const cur = h.slots[slot.id];
    html += '<div class="item"><div class="row"><span>' + slot.name +
      ' <span class="tag">' + slot.desc + ' · 加成 ' + (hallBonus(slot.id) * 100).toFixed(0) + '%</span></span>' +
      '<span><select data-hall-slot="' + slot.id + '" style="background:#0a0f0a;color:#cfe0cf;border:1px solid #2c3f2c;border-radius:4px;padding:2px 4px">' +
      '<option value="">— 空 —</option>' +
      bonded.map((n) => '<option value="' + n.id + '"' + (cur === n.id ? ' selected' : '') + '>' +
        n.name + (HALL_APT[n.id] ? '（专长）' : '') + '</option>').join('') +
      '</select></span></div></div>';
  }
  const dis = h.disciples || [];
  html += '<h4>弟子（' + dis.length + ' / 6）</h4>';
  html += dis.length
    ? dis.map((d, i) => '<div class="item"><div class="row"><span>' + d.name +
        ' <span class="tag">资质 ' + d.apt + ' · 进度 ' + Math.min(100, Math.floor(d.exp)) + '/100</span></span><span>' +
        (d.exp >= 100
          ? '<button data-hall-grad="' + i + '">出师</button>'
          : '<button data-hall-train="' + i + '">培养（10 药材）</button>') +
        '</span></div></div>').join('')
    : '<div class="muted">还没有弟子，先收一个。</div>';
  html += '<div style="margin:6px 0"><button data-hall-trial="1">迎战踢馆（2 小时一次）</button>' +
    '<span class="muted"> 赢了涨声望与银两，输了掉 5 声望</span></div>';
  return html;
}

function panelSects() {
  let html = panelHall() + '<h3>门派</h3><div class="muted">拜山切磋：赢了涨声望和侠义，输了掉三成气血。声望 3 点后可花钱学本派心法。</div>';
  html += SECTS.map((s) => {
    const rep = S.sects[s.id] || 0;
    const locked = S.level < s.lv;
    const learned = S.learned.passives.includes(s.teach);
    return '<div class="item"><div class="row"><span>' + s.name +
      ' <span class="tag">' + s.master + ' · ' + s.lv + '级</span></span>' +
      '<span>' + (locked ? '<span class="muted">未至</span>' : '<button data-duel="' + s.id + '">拜山</button>') +
      (rep >= 3 && !learned ? ' <button data-learn="' + s.id + '">学艺（' + s.teachPrice + '两）</button>' : '') +
      ' <button data-task="' + s.id + '">门派任务</button>' +
      '</span></div>' +
      '<div class="aff">' + s.desc + ' · 声望 ' + rep + ' · 战力门槛 ' + s.req + ' · 心法：' + PASSIVES.find((p) => p.id === s.teach).name + '</div></div>';
  }).join('');
  return html;
}

function panelMap() {
  let html = '<h3>江湖地图</h3>' + MAPS.map((m, i) => {
    if (m.hidden && (S.rebirth || 0) < 1) return '';
    const locked = S.level < m.min;
    const cur = i === S.mapIndex;
    return '<div class="map-row ' + (locked ? 'locked' : '') + (cur ? ' cur' : '') + '">' +
      '<span>' + (cur ? '▶ ' : '') + m.name + ' <span class="tag">' + m.min + '-' + m.max + '级</span>' +
      (S.cleared[i] ? ' <span class="tag">已通关</span>' : '') + '</span>' +
      (locked ? '<span class="muted">未至</span>' : (cur ? '<span class="muted">当前</span>' : '<button data-gomap="' + i + '">前往</button>')) +
      '</div>';
  }).join('') + '<h4>本图进度</h4>' + kv('击杀', S.kills) + kv('首领', S.bossCount);
  if (S.ending) {
    html += '<h4 style="margin-top:14px">后日谈</h4>' +
      '<div class="muted">这一世已经写完。还有几笔旧账没了。</div>';
    html += AFTERBOSSES.map((b) => {
      const done = (S.afterBoss || {})[b.id];
      return '<div class="item"><div class="row"><span>' + b.name +
        (done ? ' <span class="tag">已了结</span>' : '') + '</span>' +
        '<span>' + (done ? '' : '<button data-afterboss="' + b.id + '">了结</button>') + '</span></div></div>';
    }).join('');
  }
  return html;
}

function panelSet() {
  const origin = ORIGINS[S.origin];
  const autoBtns = [0, 20, 30, 50].map((v) =>
    '<button data-auto="' + v + '"' + ((S.autoPotion || 0) === v ? ' class="primary"' : '') + '>' +
    (v ? '低于 ' + v + '%' : '关闭') + '</button>'
  ).join('');
  const speedBtns = [1, 2, 3].map((v) =>
    '<button data-speed="' + v + '"' + ((S.speed || 1) === v ? ' class="primary"' : '') + '>' + v + ' 倍</button>'
  ).join('');
  return '<h3>设置</h3>' +
    '<div class="muted">侠客：' + escapeHtml(S.name) + (origin ? ' · ' + origin.name : '') + '</div>' +
    '<div class="muted">存档自动保存在本机浏览器（localStorage）。</div>' +
    '<h4>战斗速度</h4><div style="display:flex;gap:6px;flex-wrap:wrap">' + speedBtns + '</div>' +
    '<h4>自动喝药</h4><div style="display:flex;gap:6px;flex-wrap:wrap">' + autoBtns + '</div>' +
    '<h4>自动卖白装</h4><button data-toggle="autosell">' + (S.autoSellWhite ? '已开启' : '已关闭') + '</button>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">' +
    '<button data-guide="1">新手引导</button>' +
    '<button data-act="export">导出存档</button>' +
    '<button data-act="import">导入存档</button>' +
    '<button class="danger" data-act="reset">重开一世</button>' +
    '</div>' +
    '<h4>赞助激活码</h4>' +
    '<div class="muted">爱发电赞助后私信领取。档位 6 / 18 / 32 / 64 元。</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">' +
    '<input id="code-input" placeholder="WX-32-0007-XXXXXX" ' +
    'style="flex:1 1 200px;padding:8px;background:#0a0f0a;border:1px solid #2c3f2c;color:#cfe0cf;border-radius:4px;font:inherit" />' +
    '<button data-redeem="1">兑换</button></div>' +
    '<h4>关于</h4>' +
    '<div class="muted">江湖·挂机录 v1.4<br/>十图十级 · 秘境异界 · 门派 · 转生天赋 · 队友内院 · 宠物 · 称号 · 图鉴 · 悬赏<br/>图片导入：在「故人」面板里给角色换图，存在本机。</div>' +
    '<h4>更新日志</h4>' +
    '<div class="item"><div class="row"><span class="q-green">v1.4</span></div>' +
    '<div class="aff">· 归隐结局解锁武馆：教习/药园/账房/管事四岗位，故人驻守产出银两、药材、声望（离线最多 12 小时）<br/>' +
    '· 武馆收徒、培养学生、出师、踢馆事件与炼丹<br/>' +
    '· 装备分解：分解得灵石，攒满 3000 必出红色装备<br/>' +
    '· 属性上限：爆伤 350%、吸血 15%、减伤 60% 等，天劫改为按真实输出定价<br/>' +
    '· 天赋「羁绊」与天赋升级（消耗轮回点，每级 +50%）<br/>' +
    '· 修复爬塔低层过难、故人可同时驻守多个岗位的问题</div></div>' +
    '<div class="item"><div class="row"><span class="q-green">v1.3</span></div>' +
    '<div class="aff">· 新增道途品阶（白→绿→蓝→青→紫→橙→红），名字变色，每阶攻防气血 +8%<br/>' +
    '· 新增天劫：满 100 级后可渡劫，失败连掉 3 级<br/>' +
    '· 新增第 11 张地图「劫境」：首次轮回后开放，长期挂机，敌人随品阶更换<br/>' +
    '· 新增法宝系统：劫境掉材料，可炼制 6 件法宝，同时祭起 3 件，2/3 件有套装加成<br/>' +
    '· 满级后溢出经验自动转玄晶（10000 经验 = 1 枚）<br/>' +
    '· 修复醉月楼 buff 可无限叠加的问题<br/>' +
    '· 新增装备分解：分解得灵石，攒满 3000 必出红色装备</div></div>' +
    '<div class="item"><div class="row"><span class="q-blue">v1.2</span></div>' +
    '<div class="aff">· 5v5 队伍战斗：最多 4 名结缘角色上阵，独立血量、会倒下<br/>' +
    '· 敌人词条（重甲/鬼影/再生/反伤/狂暴）与多敌人战斗<br/>' +
    '· 队友专属技能、宠物参战、正魔挑战者、本周挑战<br/>' +
    '· 新异空间：龙珠、霓虹夜城、兰若寺（理智机制）<br/>' +
    '· 成就系统、图鉴子页、主线后日谈与多结局</div></div>' +
    '<div class="item"><div class="row"><span class="q-purple">v1.1</span></div>' +
    '<div class="aff">· 玄晶与神秘商店、神兵碎片、爬塔、秘境随机层数<br/>' +
    '· 离线收益与即时掉落、行囊扩容、日志精简</div></div>' +
    '<div class="item"><div class="row"><span class="muted">v1.0</span></div>' +
    '<div class="aff">· 十图主线、装备词条、心法功法、故人好感与结缘、门派、转生、宠物、称号、图鉴</div></div>';
}

function kv(k, v) {
  return '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>';
}

/* ------------------------------------------------------------ 面板事件 */

function bindPanel() {
  const el = document.getElementById('panel');
  if (!el) return;
  el.querySelectorAll('[data-attr]').forEach((b) => b.addEventListener('click', () => addAttr(b.dataset.attr)));
  el.querySelectorAll('[data-unequip]').forEach((b) => b.addEventListener('click', () => unequip(b.dataset.unequip)));
  el.querySelectorAll('[data-equip]').forEach((b) => b.addEventListener('click', () => {
    const it = S.bag.find((x) => x.uid === b.dataset.equip);
    if (it) equipItem(it);
  }));
  el.querySelectorAll('[data-sell]').forEach((b) => b.addEventListener('click', () => {
    const it = S.bag.find((x) => x.uid === b.dataset.sell);
    if (it) sellItem(it);
  }));
  el.querySelectorAll('[data-passive]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.passive;
    if ((S.passiveEquip || []).includes(id)) return;
    if (S.passiveEquip.length >= passiveSlots()) { addLog('心法格已满（' + passiveSlots() + ' 格）。', 'bad'); return; }
    S.passiveEquip.push(id);
    save(); renderAll();
  }));
  el.querySelectorAll('[data-unpassive]').forEach((b) => b.addEventListener('click', () => {
    S.passiveEquip.splice(+b.dataset.unpassive, 1);
    save(); renderAll();
  }));
  el.querySelectorAll('[data-up-passive]').forEach((b) => b.addEventListener('click', () => upgradePassive(b.dataset.upPassive)));
  el.querySelectorAll('[data-up-skill]').forEach((b) => b.addEventListener('click', () => upgradeSkill(b.dataset.upSkill)));
  el.querySelectorAll('[data-active]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.active;
    if (S.activeEquip.includes(id)) return;
    let free = -1;
    for (let i = 0; i < activeSlots(); i++) {
      if (!S.activeEquip[i]) { free = i; break; }
    }
    if (free === -1) { addLog('功法格已满（' + activeSlots() + ' 格），先卸下一门。', 'bad'); return; }
    S.activeEquip[free] = id;
    save(); renderAll();
  }));
  el.querySelectorAll('[data-unactive]').forEach((b) => b.addEventListener('click', () => {
    S.activeEquip[+b.dataset.unactive] = null;
    save(); renderAll();
  }));
  el.querySelectorAll('[data-gomap]').forEach((b) => b.addEventListener('click', () => switchMap(+b.dataset.gomap)));
  el.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => doAction(b.dataset.act)));
  el.querySelectorAll('[data-enter]').forEach((b) => b.addEventListener('click', startDungeon));
  el.querySelectorAll('[data-abandon]').forEach((b) => b.addEventListener('click', () => {
    if (confirm('放弃本次秘境？')) finishDungeon(false);
  }));
  el.querySelectorAll('[data-rebirth]').forEach((b) => b.addEventListener('click', doRebirth));
  el.querySelectorAll('[data-forge]').forEach((b) => b.addEventListener('click', () => forgeItem(b.dataset.forge)));
  el.querySelectorAll('[data-reroll]').forEach((b) => b.addEventListener('click', () => rerollItem(b.dataset.reroll)));
  el.querySelectorAll('[data-brothel-tab]').forEach((b) => b.addEventListener('click', () => {
    brothelTab = b.dataset.brothelTab;
    renderPanel();
  }));
  el.querySelectorAll('[data-brothel]').forEach((b) => b.addEventListener('click', () => visitBrothel(b.dataset.brothel)));
  el.querySelectorAll('[data-duel]').forEach((b) => b.addEventListener('click', () => fightSect(b.dataset.duel)));
  el.querySelectorAll('[data-other]').forEach((b) => b.addEventListener('click', () => startOtherDungeon(b.dataset.other)));
  el.querySelectorAll('[data-title]').forEach((b) => b.addEventListener('click', () => setTitle(b.dataset.title)));
  const tsel = el.querySelector('[data-title-sel]');
  if (tsel) tsel.addEventListener('change', () => {
    S.title = tsel.value || null;
    addLog(S.title ? '你换了称号。' : '你摘下了称号。', 'sys');
    save();
    renderAll();
  });
  el.querySelectorAll('[data-guide]').forEach((b) => b.addEventListener('click', showGuide));
  el.querySelectorAll('[data-codextab]').forEach((b) => b.addEventListener('click', () => {
    codexTab = b.dataset.codextab;
    renderPanel();
  }));
  el.querySelectorAll('[data-ach]').forEach((b) => b.addEventListener('click', () => claimAch(b.dataset.ach)));
  el.querySelectorAll('[data-relic]').forEach((b) => b.addEventListener('click', () => {
    expandedRelic = expandedRelic === b.dataset.relic ? null : b.dataset.relic;
    renderPanel();
  }));
  const cs = el.querySelector('#codex-search');
  if (cs) cs.addEventListener('input', () => {
    codexFilter = cs.value;
    renderPanel();
    const n = document.getElementById('codex-search');
    if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
  });
  el.querySelectorAll('[data-bounty]').forEach((b) => b.addEventListener('click', () => claimBounty(+b.dataset.bounty)));
  el.querySelectorAll('[data-board]').forEach((b) => b.remove());
  el.querySelectorAll('[data-redeem]').forEach((b) => b.addEventListener('click', () => {
    const inp = document.getElementById('code-input');
    const res = redeemCode(inp ? inp.value : '');
    const body = res.ok
      ? '<h2>兑换成功</h2><p class="story-text">获得：' + res.gained.join('、') + '</p>'
      : '<h2>兑换失败</h2><p class="story-text">' + res.msg + '</p>';
    showModal(body + '<div class="modal-actions"><button data-close="1">好</button></div>');
    const m = document.getElementById('modal-body');
    m.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', hideModal));
    if (res.ok && inp) inp.value = '';
  }));
  el.querySelectorAll('[data-evolve]').forEach((b) => b.addEventListener('click', () => evolvePet(b.dataset.evolve)));
  el.querySelectorAll('[data-party]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.party;
    if ((S.party || []).includes(id)) {
      S.party = S.party.filter((x) => x !== id);
    } else {
      if ((S.party || []).length >= 4) { addLog('队伍已满（4 人）。', 'bad'); return; }
      S.party.push(id);
    }
    save();
    renderAll();
  }));
  el.querySelectorAll('[data-lock]').forEach((b) => b.addEventListener('click', () => {
    const parts = b.dataset.lock.split(':');
    const it = ownedItem(parts[0]);
    if (!it) return;
    it.locked = it.locked || [];
    const i = +parts[1];
    const pos = it.locked.indexOf(i);
    if (pos >= 0) it.locked.splice(pos, 1);
    else it.locked.push(i);
    save();
    renderAll();
  }));
  el.querySelectorAll('[data-learn]').forEach((b) => b.addEventListener('click', () => learnSect(b.dataset.learn)));
  el.querySelectorAll('[data-task]').forEach((b) => b.addEventListener('click', () => doSectTask(b.dataset.task)));
  el.querySelectorAll('[data-custom]').forEach((b) => b.addEventListener('click', () => {
    const parts = b.dataset.custom.split(':');
    customForge(parts[0], parts[1]);
  }));
  el.querySelectorAll('[data-break]').forEach((b) => b.addEventListener('click', doBreakthrough));
  el.querySelectorAll('[data-feed]').forEach((b) => b.addEventListener('click', () => feedPet(b.dataset.feed)));
  el.querySelectorAll('[data-pet-active]').forEach((b) => b.addEventListener('click', () => {
    S.petActive = b.dataset.petActive;
    save();
    renderAll();
  }));
  el.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => buyItem(b.dataset.buy)));
  el.querySelectorAll('[data-mystery]').forEach((b) => b.addEventListener('click', () => buyMystery(+b.dataset.mystery)));
  el.querySelectorAll('[data-craft]').forEach((b) => b.addEventListener('click', craftLegendary));
  el.querySelectorAll('[data-tower]').forEach((b) => b.addEventListener('click', startTower));
  el.querySelectorAll('[data-weekly]').forEach((b) => b.addEventListener('click', startWeekly));
  el.querySelectorAll('[data-afterboss]').forEach((b) => b.addEventListener('click', () => startAfterBoss(b.dataset.afterboss)));
  el.querySelectorAll('[data-tianjie]').forEach((b) => b.addEventListener('click', startTianjie));
  el.querySelectorAll('[data-talent-up]').forEach((b) => b.addEventListener('click', () => upgradeTalent(b.dataset.talentUp)));
  el.querySelectorAll('[data-hall-claim]').forEach((b) => b.addEventListener('click', () => hallAccrue(true)));
  el.querySelectorAll('[data-hall-recruit]').forEach((b) => b.addEventListener('click', hallRecruit));
  el.querySelectorAll('[data-hall-up]').forEach((b) => b.addEventListener('click', hallUpgrade));
  el.querySelectorAll('[data-hall-slot]').forEach((sel) => sel.addEventListener('change', () => hallAssign(sel.dataset.hallSlot, sel.value)));
  el.querySelectorAll('[data-hall-train]').forEach((b) => b.addEventListener('click', () => hallTrain(+b.dataset.hallTrain)));
  el.querySelectorAll('[data-hall-grad]').forEach((b) => b.addEventListener('click', () => hallGraduate(+b.dataset.hallGrad)));
  el.querySelectorAll('[data-hall-trial]').forEach((b) => b.addEventListener('click', hallTrial));
  el.querySelectorAll('[data-hall-alchemy]').forEach((b) => b.addEventListener('click', hallAlchemy));
  el.querySelectorAll('[data-art-craft]').forEach((b) => b.addEventListener('click', () => craftArtifact(b.dataset.artCraft)));
  el.querySelectorAll('[data-art-equip]').forEach((b) => b.addEventListener('click', () => equipArtifact(b.dataset.artEquip)));
  el.querySelectorAll('[data-art-unequip]').forEach((b) => b.addEventListener('click', () => unequipArtifact(b.dataset.artUnequip)));
  el.querySelectorAll('[data-tower-quit]').forEach((b) => b.addEventListener('click', () => {
    if (confirm('放弃爬塔？')) loseTower();
  }));
  el.querySelectorAll('[data-buyitem]').forEach((b) => b.addEventListener('click', () => buyEquip(b.dataset.buyitem)));
  el.querySelectorAll('[data-use]').forEach((b) => b.addEventListener('click', () => {
    if (usePotion(b.dataset.use)) { save(); renderAll(); }
  }));
  el.querySelectorAll('[data-auto]').forEach((b) => b.addEventListener('click', () => {
    S.autoPotion = +b.dataset.auto;
    save();
    renderAll();
  }));
  el.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.toggle === 'autosell') S.autoSellWhite = !S.autoSellWhite;
    save();
    renderAll();
  }));
  const fq = el.querySelector('[data-fq]');
  if (fq) fq.addEventListener('change', () => { bagFilter.q = fq.value; renderPanel(); });
  const fs = el.querySelector('[data-fs]');
  if (fs) fs.addEventListener('change', () => { bagFilter.slot = fs.value; renderPanel(); });
  el.querySelectorAll('[data-sellfilter]').forEach((b) => b.addEventListener('click', () => {
    const list = S.bag.filter(matchesFilter);
    if (!list.length) return;
    if (!confirm('卖出筛选出的 ' + list.length + ' 件装备？')) return;
    sellBatch(list, '卖出 ' + list.length + ' 件装备');
  }));
  el.querySelectorAll('[data-sellwhite]').forEach((b) => b.addEventListener('click', () => {    const list = S.bag.filter((it) => it.quality === 'white');
    if (!list.length) { addLog('没有凡品可卖。', 'sys'); return; }
    if (!confirm('卖出 ' + list.length + ' 件凡品？')) return;
    sellBatch(list, '卖掉 ' + list.length + ' 件凡品');
  }));
  el.querySelectorAll('[data-dismantlefilter]').forEach((b) => b.addEventListener('click', () => {
    const list = S.bag.filter(matchesFilter);
    if (!list.length) return;
    if (!confirm('分解筛选出的 ' + list.length + ' 件装备？')) return;
    dismantleBatch(list, '分解了 ' + list.length + ' 件装备');
  }));
  el.querySelectorAll('[data-dismantlewhite]').forEach((b) => b.addEventListener('click', () => {
    const list = S.bag.filter((it) => it.quality === 'white');
    if (!list.length) { addLog('没有凡品可分解。', 'sys'); return; }
    if (!confirm('分解 ' + list.length + ' 件凡品？')) return;
    dismantleBatch(list, '分解了 ' + list.length + ' 件凡品');
  }));
  el.querySelectorAll('[data-autoequip]').forEach((b) => b.addEventListener('click', autoEquipBest));
  el.querySelectorAll('[data-speed]').forEach((b) => b.addEventListener('click', () => setSpeed(+b.dataset.speed)));
}

function addAttr(k) {
  if (S.points <= 0) return;
  S.points -= 1;
  const gain = { hp: 12, atk: 2, def: 2, agi: 1, mp: 4 };
  S.base[k] += gain[k];
  if (k === 'hp') battle.hp = Math.min(totalStats().hp, battle.hp + gain.hp);
  save();
  renderAll();
}

function doAction(act) {
  if (act === 'reset') {
    if (!confirm('确定重开一世？当前进度会清空。')) return;
    localStorage.removeItem(SAVE_KEY);
    S = DEFAULT_STATE();
    battle = { hp: 0, mp: 0, cds: {}, log: [], usedPot: 0, potCd: 0 };
    logLines = [];
    if (timer) clearInterval(timer);
    renderAll();
    showStartModal();
    return;
  }
  if (act === 'export') {
    const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wuxia-idle-save.json';
    a.click();
    return;
  }
  if (act === 'import') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || data.ver !== 1) throw new Error('bad');
          localStorage.setItem(SAVE_KEY, JSON.stringify(data));
          location.reload();
        } catch (e) {
          addLog('存档读不出来。', 'bad');
        }
      };
      reader.readAsText(f);
    };
    input.click();
  }
}

/* ------------------------------------------------------------ 故人面板 */

function showNpcLore(id) {
  const npc = NPCS.find((n) => n.id === id);
  if (!npc) return;
  const l = NPC_LORE[id];
  const body = [
    '<h2>' + npc.name + (npc.persona ? ' · ' + npc.persona : '') + '</h2>',
    '<div class="muted">' + npc.title + '</div>',
    l ? '<p class="story-text">' + escapeHtml(l.bio) + '</p>' : '<p class="muted">暂无小传。</p>',
    l ? '<h4>履历</h4>' + l.hist.map((h) => '<div class="aff">· ' + escapeHtml(h) + '</div>').join('') : '',
    '<div class="modal-actions"><button data-close="1">关闭</button></div>',
  ].join('');
  showModal(body);
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
}

const AFTER_TALES = {
  longnv: [
    { title: '古墓的灯', text: '终南山下起了雪。她在寒玉床边的灯里添了一勺蜜，说：「这里冷，你别老来。」话是这么说，她往旁边挪了半个位置。' },
    { title: '不老的约定', text: '她替你理了理衣领，忽然问：「我活得比常人都久。等你不在了，我该拿这身武功做什么？」你说：「那就慢慢等。」她低下头，很久没说话。' },
  ],
  wangyuyan: [
    { title: '琅嬛的午后', text: '她在琅嬛玉洞里晒书，见你来了，把一页残卷递过来：「你看，这个字像不像你？」你看了半天，只看出一个「痴」字。' },
    { title: '描眉', text: '她替你描眉，手很稳。描完对着光看了看，说：「比我画过的任何一幅都好。」' },
  ],
  zhaomin: [
    { title: '绿柳庄的灯', text: '她坐在灯下算账，见你来了，把算盘一推：「你管的事，比这天下都麻烦。」说着还是给你倒了茶。' },
    { title: '并马', text: '她策马与你并肩，风把她的头发吹乱。她说：「我这一生争的东西很多，到头来只想要一个不会走的人。」' },
  ],
  zhiruo: [
    { title: '峨眉的钟', text: '峨眉山的钟响过三遍，她还在佛前跪着。听见你的脚步，她没回头：「我求的不是来世。」' },
    { title: '剑与灯', text: '她把峨眉的剑擦了三遍，忽然递给你的方向：「往后我杀人之前，会先问你的意思。」' },
  ],
  huangrong: [
    { title: '桃花岛的菜', text: '她在灶前忙了一下午，端出一碟叫不出名字的菜。你吃了一口，她盯着你的表情，笑了：「难吃就直说。」' },
    { title: '烟花', text: '她拉着你去海边看烟花，烟花很响。她凑到你耳边说了一句，被风吹散了。你问，她摇头：「没听见就算了。」' },
  ],
  yingying: [
    { title: '琴声', text: '她在绿竹巷里弹琴，弹到一半停下：「这首不是给外人听的。」见你要走，她又按住琴弦：「……你除外。」' },
    { title: '自由', text: '她站在黑木崖上，说：「从前我以为自由是没人管。现在觉得，自由是有人等我回来。」' },
  ],
  liqiushui: [
    { title: '西夏的雪', text: '她披着狐裘坐在窗边，说西夏的雪比中原的大。顿了顿，又低声说：「那年也下着雪，我等的人没来。」' },
    { title: '不老', text: '她摸着自己的脸：「这张脸我看了一辈子，快忘了自己几岁。」她转过来看你：「你还记得吗？」' },
  ],
  licanghai: [
    { title: '雾', text: '雾漫上来，她站在雾里，像随时会散。你伸手抓住她的袖子，她怔了一下，然后轻轻反握住你的手。' },
    { title: '这一世', text: '「我本不该在这一世留下什么。」她看着你，「可现在我有了。」' },
  ],
  susu: [
    { title: '旧刀', text: '她把那柄旧刀擦了又擦，说：「这刀认得我，我却快不认得它了。」说完自己笑了。' },
    { title: '记得', text: '她说她最怕没人记得。你握住她的手：「那就好好活着，让我记得久一点。」' },
  ],
  lucy: [
    { title: '天台', text: '雨停了，天台上还滴着水。她说：「夜之城的霓虹最会骗人，看久了，人也会骗自己。」' },
    { title: '月球', text: '「等我攒够钱，我们去月球。」她把一小片数据盘放进你手心，「这是票。别弄丢。」' },
  ],
};

function showAfterTale(id) {
  const npc = NPCS.find((n) => n.id === id);
  if (!npc) return;
  const st = npcState(id);
  if (!st.bond) { addLog('结缘后才有后日谈。', 'sys'); return; }
  const scenes = AFTER_TALES[id] || [
    { title: '寻常日子', text: '她靠在你肩上打盹，手里的针线慢慢滑下去。你替她收好，没舍得叫醒。' },
  ];
  S.afterTale = S.afterTale || {};
  const idx = S.afterTale[id] || 0;
  if (idx >= scenes.length) {
    showModal('<h2>后日谈 · ' + npc.name + '</h2><p class="story-text">能说的都听过了。她坐在那儿，日子还长。</p>' +
      '<div class="modal-actions"><button data-close="1">好</button></div>');
    const m = document.getElementById('modal-body');
    m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
    return;
  }
  const sc = scenes[idx];
  S.afterTale[id] = idx + 1;
  const silver = 300 + S.level * 10;
  S.silver += silver;
  st.fav = Math.min(100, st.fav + 2);
  addLog('后日谈【' + npc.name + ' · ' + sc.title + '】：' + sc.text + '（银两 +' + silver + '，好感 +2）', 'story');
  save();
  showModal('<h2>' + npc.name + ' · ' + sc.title + '</h2>' +
    '<p class="story-text">' + sc.text + '</p>' +
    '<p class="muted">银两 +' + silver + '，好感 +2</p>' +
    '<div class="modal-actions"><button data-close="1">继续</button></div>');
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
  renderAll();
}

function openNpc(id) {
  const npc = NPCS.find((n) => n.id === id);
  const st = npcState(id);
  const si = stageIndex(id);
  const stage = npc.stages[si];
  const info = nextLine(id);
  const img = S.npcImg[id];
  const canGift = giftedToday(id) < 1;
  const giftItem = GIFTS.find((g) => (S.potions[g.id] || 0) > 0);
  const body = [
    '<h2>故人 · ' + npc.name + '</h2>',
    '<div class="muted">' + npc.title + (npc.persona ? ' · ' + npc.persona : '') + ' · 好感 ' + st.fav + '/100 · ' + stage.name + ' · 今日闲聊 ' + chatsToday(id) + '/3</div>',
    npc.look ? '<p class="muted" style="line-height:1.75;margin:6px 0">' + escapeHtml(npc.look) + '</p>' : '',
    '<div style="margin:10px 0"><img src="' + npcAvatar(id) + '" style="max-width:150px;border:1px solid #233" /></div>',
    info
      ? '<p class="story-text">' + escapeHtml(info.line.text) + '</p>' +
        info.line.options.map((o, i) => '<button class="choice" data-opt="' + i + '">' + escapeHtml(o.label) + '</button>').join('')
      : '<p class="story-text">她今日没什么要说的，只是坐着。</p>',
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">',
    '<button data-chat="1"' + (chatsToday(id) > 0 ? '' : ' disabled') + '>闲聊（' + chatsToday(id) + '/3' +
    (chatRegenLeft(id) > 0 ? ' · ' + Math.max(1, Math.ceil(chatRegenLeft(id) / 60000)) + '分后回' : '') + '）</button>',
    '<button data-lore="1">小传</button>',
    '<button data-gift="1"' + (canGift && giftItem ? '' : ' disabled') + '>送礼' + (giftItem ? '（' + giftItem.name + '）' : '（无）') + '</button>',
    (st.fav >= 90 && !st.bond
      ? '<button data-bond="companion">结为队友</button><button data-bond="spouse">与TA成婚</button>'
      : ''),
    (st.fav >= 80 && !S.night[id] ? '<button data-night="1">夜话</button>' : ''),
    (st.bond ? '<button data-tale="1">后日谈</button>' : ''),
    '</div>',
    '<div class="modal-actions"><button data-close="1">离开</button></div>',
  ].join('');
  showModal(body);
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => talkOption(id, +b.dataset.opt)));
  m.querySelectorAll('[data-chat]').forEach((b) => b.addEventListener('click', () => chatIdle(id)));
  m.querySelectorAll('[data-gift]').forEach((b) => b.addEventListener('click', () => giftNpc(id)));
  m.querySelectorAll('[data-night]').forEach((b) => b.addEventListener('click', () => nightTalk(id)));
  m.querySelectorAll('[data-bond]').forEach((b) => b.addEventListener('click', () => bondNpc(id, b.dataset.bond)));
  m.querySelectorAll('[data-lore]').forEach((b) => b.addEventListener('click', () => showNpcLore(id)));
  m.querySelectorAll('[data-tale]').forEach((b) => b.addEventListener('click', () => showAfterTale(id)));
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
}

function npcAvatar(id) {
  if (S.npcImg[id]) return S.npcImg[id];
  const npc = NPCS.find((n) => n.id === id) || { name: id, faction: 'neutral' };
  const color = npc.faction === 'good' ? '#7fd08a' : npc.faction === 'evil' ? '#d08a8a' : '#d8b56a';
  const ch = (npc.name || '?').slice(0, 1);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
    '<rect width="120" height="120" fill="#0d110d"/>' +
    '<circle cx="60" cy="46" r="19" fill="none" stroke="' + color + '" stroke-width="2"/>' +
    '<path d="M30 98c0-17 13-28 30-28s30 11 30 28" fill="none" stroke="' + color + '" stroke-width="2"/>' +
    '<text x="60" y="115" font-size="11" fill="' + color + '" text-anchor="middle">' + ch + '</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function autoLoadPortraits() {
  if (typeof Image === 'undefined') return;
  NPCS.forEach((npc) => {
    if (S.npcImg[npc.id]) return;
    const probe = new Image();
    const src = 'portraits/' + npc.id + '.png';
    probe.onload = () => {
      S.npcImg[npc.id] = src;
      save();
      renderPanel();
    };
    probe.src = src;
  });
}

function batchImportNpcImages() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = () => {
    const files = Array.prototype.slice.call(input.files || []);
    let n = 0;
    files.forEach((f) => {
      const base = f.name.replace(/\.[^.]+$/, '');
      const npc = NPCS.find((x) => x.id === base || x.name === base || base.indexOf(x.name) >= 0);
      if (!npc) return;
      n += 1;
      const r = new FileReader();
      r.onload = () => {
        S.npcImg[npc.id] = r.result;
        save();
        openNpcList();
      };
      r.readAsDataURL(f);
    });
    addLog('批量导入 ' + n + ' 张（按文件名匹配）。', 'sys');
  };
  input.click();
}

function openNpcList() {
  const items = NPCS.map((n) => {
    const st = npcState(n.id);
    const stage = npcStage(n.id);
    const ok = npcAvailable(n);
    const img = S.npcImg[n.id];
    return '<div class="npc-card">' +
      '<div class="npc-pic"><img src="' + npcAvatar(n.id) + '" /></div>' +      '<div class="npc-main">' +
      '<div><span class="npc-name">' + n.name + '</span><span class="tag">' + n.title + '</span>' +
      '<span class="tag">' + ({ good: '正道', evil: '邪道', neutral: '中立' }[n.faction] || '中立') + '</span></div>' +
      '<div class="muted">' + MAPS[n.mapIndex].name + ' · ' + stage.name + ' · 好感 ' + st.fav + ' · 闲聊 ' + chatsToday(n.id) + '/3</div>' +
      (ok ? '<button data-npc="' + n.id + '">说话</button>' : '<span class="muted">需 ' + n.minLevel + ' 级</span>') +
      ' <button data-lorelist="' + n.id + '">详情</button>' +
      ' <label class="muted" style="font-size:11px">换图<input type="file" accept="image/*" data-img="' + n.id + '" style="width:90px" /></label>' +
      '</div></div>';
  }).join('');
  showModal('<h2>故人</h2><div class="muted">点「详情」看小传；图片可按文件名批量导入（如 小龙女.jpg）。</div>' + items +
    '<div class="modal-actions"><button data-batch="1">批量导入图片</button><button data-close="1">关闭</button></div>');
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-npc]').forEach((b) => b.addEventListener('click', () => openNpc(b.dataset.npc)));
  m.querySelectorAll('[data-lorelist]').forEach((b) => b.addEventListener('click', () => showNpcLore(b.dataset.lorelist)));
  m.querySelectorAll('[data-batch]').forEach((b) => b.addEventListener('click', batchImportNpcImages));
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
  m.querySelectorAll('[data-img]').forEach((inp) => inp.addEventListener('change', () => {
    const id = inp.dataset.img;
    const f = inp.files && inp.files[0];
    if (!f) return;
    if (f.size > 900 * 1024) { addLog('图片太大（>900KB），换一张小点的。', 'bad'); return; }
    const r = new FileReader();
    r.onload = () => {
      S.npcImg[id] = r.result;
      save();
      openNpcList();
    };
    r.readAsDataURL(f);
  }));
}

/* ------------------------------------------------------------ 结局 */

function showEndingChoice() {
  showModal([
    '<h2>金銮殿 · 最后一问</h2>',
    '<p class="story-text">国师已死，权臣伏诛。龙椅空着，天下等你一句话。</p>',
    '<div class="modal-actions">',
    '<button class="choice" data-end="overthrow">颠覆王朝——你坐上龙椅，改朝换代</button>',
    '<button class="choice" data-end="save">拯救王朝——清君侧，功成身退</button>',
    '<button class="choice" data-end="retire">归隐江湖——把刀埋了，从此不问</button>',
    '</div>',
  ].join(''));
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-end]').forEach((b) => b.addEventListener('click', () => finishGame(b.dataset.end)));
}

function finishGame(kind) {
  S.ending = kind;
  if (kind === 'retire') S.hallUnlocked = true;
  const h = S.honor || 0;
  const good = h >= 40;
  const evil = h <= -40;
  let text;
  if (kind === 'overthrow') {
    text = good
      ? '你坐上龙椅，第一道旨是免了三年赋税。史官写你「以武犯禁」，百姓却叫你侠天子。'
      : evil
        ? '你坐上龙椅，刀比话多。旧臣跪了一地，没人敢抬头。青石村那盏灯，再没有人替你留。'
        : '你坐上了那把椅子。旧臣跪了一地，青石村的方向传来一声雁叫——那盏灯没有等到你。';
  } else if (kind === 'retire') {
    text = good
      ? '你把刀埋在后山，没立碑。第二天青石村多了个教孩子认字的先生。有人问起江湖，你只说：那年雪大。'
      : evil
        ? '你把刀埋了，却没埋干净。夜里总有人来敲门，你一次也没开。'
        : '你把刀埋在后山，一个人往南走。走到江边，回头看了一次，什么也没看见。';
  } else {
    text = good
      ? '你清君侧，扶新君，交出兵符，一个人走出皇城。阿绣在城门口等你，灯还亮着。江湖上再没有你的名字，只有人说，那年的雪下得很干净。'
      : evil
        ? '你救了王朝，史书却只写你「曾与魔教往来」。你把刀扔进护城河，笑了笑，走了。'
        : '你清君侧，扶新君，然后交出兵符，一个人走出皇城。江湖上再没有你的名字。';
  }

  const bonds = [];
  if ((S.spouses || []).length) {
    bonds.push('城门口站着' + S.spouses.map(npcName).join('、') + '，谁也没说话，灯却都亮着。');
  }
  if ((S.companions || []).length) {
    bonds.push('「' + npcName(S.companions[0]) + '」把刀往肩上一扛，跟在你后头，像从前一样。');
  }
  if (bonds.length) text += ' ' + bonds.join(' ');

  addLog(text, 'story');
  save();
  showModal('<h2>' + (kind === 'overthrow' ? '结局 · 龙椅' : '结局 · 归隐') + '</h2><p class="story-text">' + text + '</p>' +
    '<div class="modal-actions"><button data-close="1">合上话本</button></div>');
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
}

/* ------------------------------------------------------------ 弹窗 */

function showModal(html) {
  const modal = document.getElementById('modal');
  document.getElementById('modal-body').innerHTML = html;
  modal.classList.remove('hidden');
}

function hideModal() {
  if (S && S.eventOpen) {
    S.eventOpen = false;
    addLog('你转身离开，未作理会。', 'sys');
    save();
  }
  document.getElementById('modal').classList.add('hidden');
}

/* ------------------------------------------------------------ 启动 */

function start() {
  if (timer) clearInterval(timer);
  const st = totalStats();
  battle.hp = st.hp;
  battle.mp = st.mp;
  battle.cds = {};
  battle.usedPot = 0;
  battle.potCd = 0;
  S.buffs = S.buffs || [];
  speedMul = S.speed || 1;
  monster = null;
  foes = [];
  addLog('你叫' + S.name + '，' + currentMap().name + '人氏。', 'story');
  addLog(MAPS[S.mapIndex].intro, 'story');
  addLog('你盘膝坐下，开始了一天的修行。', 'sys');
  spawnMonster();
  renderAll();
  timer = setInterval(tick, Math.max(300, Math.round(TICK_MS / (speedMul || 1))));
}

function bindUI() {
  setText('hud-name', S.name);
  document.querySelectorAll('[data-logmode]').forEach((b) => b.addEventListener('click', () => {
    logMode = b.dataset.logmode;
    document.querySelectorAll('[data-logmode]').forEach((x) => x.classList.toggle('on', x === b));
    renderLog();
  }));
  const fightBtn = document.getElementById('btn-fight');
  fightBtn.textContent = S.paused ? '继续挂机' : '暂停挂机';
  fightBtn.addEventListener('click', () => {
    S.paused = !S.paused;
    document.getElementById('btn-fight').textContent = S.paused ? '继续挂机' : '暂停挂机';
    renderStatus();
    save();
  });
  document.getElementById('btn-map').addEventListener('click', () => { activeTab = 'map'; renderTabs(); renderPanel(); });
  document.getElementById('btn-npc').addEventListener('click', openNpcList);
  const potBtn = document.getElementById('btn-potion');
  if (potBtn) potBtn.addEventListener('click', () => {
    const id = bestHealPotion();
    if (!id) { addLog('身上没有伤药，去药店买。', 'bad'); return; }
    if (usePotion(id)) { save(); renderAll(); }
  });
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') hideModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });

  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      save();
      return;
    }
    if (!hiddenAt) return;
    const gap = (Date.now() - hiddenAt) / 1000;
    hiddenAt = 0;
    if (gap > 120 && !S.paused && !S.ending) {
      grantOffline(gap);
      renderAll();
    }
  });
}

function showOfflineModal(dur, exp, silver, eq, eqSold) {
  showModal(
    '<h2>闭关归来</h2>' +
    '<p class="story-text">你离开了 ' + dur + '。挂机所得：经验 +' + exp + '，银两 +' + silver + '。</p>' +
    (eq ? '<p class="story-text">行囊里多了 ' + eq + ' 件装备。</p>' : '') +
    (eqSold ? '<p class="muted">行囊满了，' + eqSold + ' 件装备已自动折算成银两。</p>' : '') +
    '<div class="modal-actions"><button data-close="1">继续</button></div>'
  );
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
}

function grantOffline(elapsedSec, quiet) {
  if (!(elapsedSec > 120)) return false;
  const hours = Math.min(8, elapsedSec / 3600);
  const exp = Math.round(hours * (120 + S.level * 40) * 2.5);
  const silver = Math.round(hours * (30 + S.level * 8) * 2.5);
  if (exp <= 0 && silver <= 0) return false;
  S.exp += exp;
  S.silver += silver;

  // 离线装备收益：每小时约 4 件，最多 12 件
  let eq = 0;
  let eqSold = 0;
  const n = Math.min(12, Math.round(hours * 4));
  for (let i = 0; i < n; i++) {
    if (S.bag.length < 60) {
      S.bag.push(generateItem(pick(Object.keys(SLOTS)), S.level, weightedQuality(false)));
      eq += 1;
    } else {
      eqSold += 60 + S.level * 12;
    }
  }
  if (eqSold) S.silver += eqSold;

  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const dur = h > 0 ? (h + ' 小时' + (m ? ' ' + m + ' 分钟' : '')) : Math.max(1, Math.round(hours * 60)) + ' 分钟';
  addLog('你离开的 ' + dur + '，得经验 ' + exp + '、银两 ' + silver + (eq ? '、装备 ' + eq + ' 件' : '') + '。', 'gold');
  levelUpIfNeeded();
  save();
  if (!quiet) showOfflineModal(dur, exp, silver, eq, eqSold);
  return true;
}

function offlineGains() {
  const elapsed = (Date.now() - (S.savedAt || Date.now())) / 1000;
  return grantOffline(elapsed);
}

function showStartModal() {
  const body = [
    '<h2>立名</h2>',
    '<p class="muted">江湖路远，先留个名号。</p>',
    '<input id="name-input" maxlength="8" value="" placeholder="侠客名（2-8 字）" ' +
      'style="width:100%;padding:9px 10px;background:#0a0f0a;border:1px solid #2c3f2c;color:#cfe0cf;border-radius:4px;font:inherit" />',
    '<h4>出身</h4>',
    Object.keys(ORIGINS).map((k) =>
      '<button class="choice" data-origin="' + k + '">' + ORIGINS[k].name + ' —— ' + ORIGINS[k].desc + '</button>'
    ).join(''),
    '<div class="modal-actions"><button data-close="1">稍后</button></div>',
  ].join('');
  showModal(body);
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-origin]').forEach((b) => b.addEventListener('click', () => createCharacter(b.dataset.origin)));
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
}

function showGuide() {
  showModal(
    '<h2>新手三件事</h2>' +
    '<ol class="story-text" style="padding-left:18px;line-height:1.9">' +
    '<li><b>挂机打怪</b>：装备会自动掉，行囊里点「装备」就变强。白装可一键卖。</li>' +
    '<li><b>境界突破</b>：每 10 级要手动突破，在「属性」页最上方，不突破会卡级。</li>' +
    '<li><b>结缘上阵</b>：好感到 90 可在「故人」结缘；结缘后在「伙伴」页让他们上阵，队伍最多 4 人。</li>' +
    '</ol>' +
    '<p class="muted">小技巧：秘境和异空间给奇物/套装；神秘商店用玄晶换稀有物；打不过先换装备或调队伍。</p>' +
    '<div class="modal-actions"><button data-close="1">知道了</button></div>'
  );
  const m = document.getElementById('modal-body');
  m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', hideModal));
}

function createCharacter(originId) {
  if (S.created) return;
  const input = document.getElementById('name-input');
  let name = ((input && input.value) || '').trim();
  if (name.length < 2) name = '无名';
  if (name.length > 8) name = name.slice(0, 8);
  const origin = ORIGINS[originId] || ORIGINS.orphan;
  S.name = name;
  S.origin = originId;
  for (const k of Object.keys(origin.base)) S.base[k] += origin.base[k];
  S.originCrit = origin.crit || 0;
  S.originSkill = origin.skill || 0;
  S.created = true;
  save();
  hideModal();
  logLines = [];
  start();
  showGuide();
}

function init() {
  bindUI();
  autoLoadPortraits();
  window.__wuxia = {
    get state() { return S; },
    get battle() { return battle; },
    tick,
    start,
    stats: totalStats,
    save,
    createCharacter,
    sellBatch,
    sellPrice,
    autoEquipBest,
    usePotion,
    buyItem,
    buyEquip,
    generateItem,
    maybeEvent,
    resolveEvent,
    levelUpIfNeeded,
    dropItem,
    dropPotion,
    ensureShop,
    refreshShop,
    setSpeed,
    itemScore,
    matchesFilter,
    setFilter: (q, slot) => { bagFilter.q = q; bagFilter.slot = slot; },
    npcAvailable,
    nightTalk,
    addHonor,
    maybeRevenge,
    startDungeon,
    finishDungeon,
    dropSetPiece,
    dropCollectible,
    dropManualPage,
    dropLegendary,
    doRebirth,
    offerTalents,
    bondNpc,
    capturePet,
    feedPet,
    codexProgress,
    reincPoints,
    talentMods,
    allyMods,
    petMods,
    rewardMul,
    forgeItem,
    rerollItem,
    forgeCost,
    visitBrothel,
    checkNpcGift,
    doBreakthrough,
    realmOf,
    canBreak,
    breakChance,
    passiveSlots,
    activeSlots,
    skillQ,
    upgradeSkill,
    customForge,
    learnSect,
    fightSect,
    startSectDuel: fightSect,
    startOtherDungeon,
    startTower,
    loseTower,
    refreshMystery,
    buyMystery,
    craftLegendary,
    checkTitles,
    dropRelic,
    setTitle,
    ensureBounty,
    claimBounty,
    claimBoard,
    evolvePet,
    doSectTask,
    redeemCode,
    codeSig,
    offlineGains,
    grantOffline,
    get honor() { return S.honor || 0; },
  };
  if (!S.created) {
    renderHud();
    renderBars();
    renderTabs();
    renderPanel();
    showStartModal();
    return;
  }
  if (S.ending) addLog('这一世已经写完。', 'story');
  offlineGains();
  start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
