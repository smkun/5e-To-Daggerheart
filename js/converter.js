// daggerheart-converter.js (v1.0)

function convertDnDToDaggerheart(mon) {
  // 1) Tier
  const crNum = crToNumber(mon.cr);
  const tier = (crNum <= 3) ? 1 : (crNum <= 10) ? 2 : (crNum <= 16) ? 3 : 4;

  // 2) Role
  const role = inferRole(mon, crNum);

  // 3) Difficulty
  const base = baselineDifficulty(tier, role);
  const ac = (Array.isArray(mon.ac) ? mon.ac[0] : mon.ac) ?? 12;
  const diff = clamp(base + Math.round((ac - 13) / 2), 8, 18);

  // 4) Thresholds/HP/Stress
  const pkg = thresholdsPackage(tier, role, mon.hp?.average ?? mon.hp ?? 1, crNum);

  // 5) ATK
  const toHit = bestToHit(mon.actions || mon.action || []);
  const atk = toHitToAtk(toHit);

  // 6) Standard attack
  const std = buildStandardAttack(mon);

  // 7) Experience
  const exp = pickExperience(mon);

  // 8) Features
  const features = buildFeatures(mon, role);

  const adversary = {
    name: mon.name,
    tier,
    type: role, // Bruiser/Horde/Leader/Minion/Ranged/Skulk/Standard/Support/Solo/Social
    description: inferDescription(mon),
    motives: inferMotives(role),
    difficulty: diff,
    thresholds: pkg.thresholds, // [Major, Severe]
    hp: pkg.hp,
    stress: pkg.stress,
    atk: atk,
    standardAttack: std, // { name, range, damage }
    experience: exp,     // e.g., "Keen Senses +2"
    features
  };

  return {
    adversary,
    markdown: toMarkdown(adversary)
  };
}

// ---------- helpers ----------
function crToNumber(cr) {
  if (!cr) return 1;
  if (typeof cr === 'number') return cr;
  const s = String(cr).trim();
  if (s.includes('/')) { const [a,b]=s.split('/').map(Number); return a/b; }
  return Number(s) || 1;
}

function inferRole(mon, crNum) {
  const name = (mon.name||'').toLowerCase();
  const acts = mon.actions || mon.action || [];
  const hasMulti = acts.some(a => /multiattack/i.test(a.name||''));
  const rangedish = acts.some(a => /\brange\b/i.test(a.entries?.[0]||a.desc||''));
  const skills = mon.skills || mon.skill || {};
  const traits = mon.traits || mon.trait || [];
  const stealthy = (skills && /stealth/i.test(Object.keys(skills).join(' '))) || /invisible|hide|ambush/i.test(JSON.stringify(traits).toLowerCase());
  const summons = traits.some(t => /summon/i.test(t.name||''));
  const hpAvg = mon.hp?.average ?? mon.hp ?? 1;
  const size = (Array.isArray(mon.size)?mon.size[0]:mon.size)||'M';

  if (summons) return 'Leader';
  if (stealthy && !rangedish) return 'Skulk';
  if (rangedish && !stealthy) return 'Ranged';
  if (crNum < 0.25 || hpAvg < 8) return 'Minion';
  if (/[L|H|G]/.test(String(size)) && (hasMulti || hpAvg >= 80)) return 'Bruiser';
  return 'Standard';
}

function baselineDifficulty(tier, role) {
  const t1 = { Standard:12, Ranged:12, Skulk:13, Horde:8, Bruiser:12, Leader:13, Minion:11, Solo:14, Support:12, Social:12 };
  const t2 = { Standard:13, Ranged:14, Skulk:14, Horde:10, Bruiser:16, Leader:15, Minion:12, Solo:15, Support:13, Social:13 };
  const t3 = { Standard:14, Ranged:15, Skulk:15, Horde:12, Bruiser:17, Leader:16, Minion:13, Solo:16, Support:14, Social:14 };
  const t4 = { Standard:15, Ranged:16, Skulk:16, Horde:13, Bruiser:18, Leader:17, Minion:14, Solo:17, Support:15, Social:15 };
  const table = [null,t1,t2,t3,t4][tier] || t2;
  return table[role] ?? table.Standard;
}

function thresholdsPackage(tier, role, dndHP, crNum) {
  // book-like defaults
  let Major, Severe, hp, stress;
  if (tier===1 && role==='Standard') { Major=8; Severe=14; hp=5; stress=3; }
  else if (tier===1 && role==='Horde') { Major=6; Severe=12; hp=6; stress=3; }
  else if (tier===2 && role==='Bruiser') { Major=14; Severe=27; hp=7; stress=5; }
  else { // generic fallback
    Major = 8 + (tier-1)*3;
    Severe = 14 + (tier-1)*6;
    hp = 5 + (tier>2?1:0);
    stress = (role==='Leader'||role==='Bruiser') ? 4 : 3;
  }
  // nudge by quartiles of expected DND HP vs CR
  const low = expectedLowHP(crNum), high = expectedHighHP(crNum);
  if (dndHP <= low) { Major = Math.max(4, Major-2); Severe = Math.max(Major+4, Severe-2); hp = Math.max(4, hp-1); }
  if (dndHP >= high){ Major += 2; Severe += 3; hp = Math.min(8, hp+1); }
  return { thresholds:[Major,Severe], hp, stress };
}
function expectedLowHP(cr){ return cr<=1?10 : cr<=3?30 : cr<=10?90 : cr<=16?170 : 230; }
function expectedHighHP(cr){ return cr<=1?25 : cr<=3?55 : cr<=10?150 : cr<=16?260 : 350; }

function bestToHit(actions){
  let best = 0;
  for (const a of actions||[]) {
    const t = (a.entries?.[0] || a.desc || '').match(/to hit[,)]?\s*([+-]?\d+)/i);
    if (t) best = Math.max(best, Number(t[1]));
  }
  return best;
}
function toHitToAtk(x){ if (x>=9) return 4; if (x>=7) return 3; if (x>=5) return 2; return 1; }

function buildStandardAttack(mon){
  const acts = mon.actions || mon.action || [];
  // pick iconic melee first; else best single-dmg ranged
  let cand = null, bestAvg = -1;
  for (const a of acts) {
    const name = a.name||'';
    const text = a.entries?.[0] || a.desc || '';
    const dmg = averageDamage(text);
    if (/talon|bite|claw|greataxe|sword|slam|spike|hoof|maul|fist|dagger/i.test(name)) {
      if (dmg>bestAvg) {bestAvg=dmg; cand={name, text, dmg};}
    }
  }
  if (!cand) {
    for (const a of acts) {
      const text = a.entries?.[0] || a.desc || '';
      const dmg = averageDamage(text);
      if (dmg>bestAvg) {bestAvg=dmg; cand={name:a.name||'Attack', text, dmg};}
    }
  }
  const range = inferRange(cand?.text||'');
  const dice = snapDamageDice(cand?.dmg||4.5);
  const name = normalizeAttackName(cand?.name||'Attack');
  return { name, range, damage: dice };
}
function averageDamage(txt){
  // sum of N dice chunks + static; simple parse
  let total = 0, count = 0;
  const re = /\((\d+)d(\d+)(?:\s*\+\s*(\d+))?\)/gi;
  let m;
  while ((m=re.exec(txt))) {
    const [ , n, d, plus ] = m;
    total += Number(n)*(Number(d)+1)/2 + Number(plus||0);
    count++;
  }
  if (count===0) { const f = txt.match(/(\d+)\s*damage/i); if (f) return Number(f[1]); }
  return total || 4.5;
}
function inferRange(txt){ if (/range\s*\d+\/\d+/i.test(txt) || /bow|javelin|spit|bolt|ray|blast/i.test(txt)) return 'Close'; return /reach\s*5|melee|talon|bite|claw/i.test(txt)?'Very Close':'Close'; }
function normalizeAttackName(n){ return n.replace(/^\s*multiattack\s*$/i,'Strike'); }
function snapDamageDice(avg){
  const steps = [
    { s:'1d6+1', v: 4.5 }, { s:'1d8+1', v: 5.5 }, { s:'1d10+1', v: 6.5 },
    { s:'2d6+1', v: 8.0 }, { s:'1d12+2', v: 8.5 }, { s:'2d8+2', v: 11.0 }
  ];
  let best = steps[0];
  for (const st of steps) if (Math.abs(st.v-avg) < Math.abs(best.v-avg)) best=st;
  return best.s;
}

function pickExperience(mon){
  const skills = mon.skills || mon.skill || {};
  // pick biggest bonus and map to a broad tag
  let best = {name:null,val:-999};
  for (const [k,v] of Object.entries(skills)) {
    // Parse "+5" format - keep the sign and digits
    const match = String(v).match(/([+-]?\d+)/);
    const num = match ? Number(match[1]) : 0;
    if (num>best.val) best={name:k, val:num};
  }
  if (!best.name) return null;
  const map = { 
    perception:'Keen Senses', 
    stealth:'Stealth', 
    acrobatics:'Acrobatics', 
    athletics:'Throw', 
    survival:'Tracker', 
    nature:'Nature\'s Friend',
    investigation:'Investigation',
    insight:'Read Intentions',
    intimidation:'Intimidation',
    deception:'Deception',
    persuasion:'Charm',
    arcana:'Arcane Knowledge',
    history:'Ancient Knowledge',
    religion:'Divine Knowledge',
    medicine:'Healing Arts'
  };
  const label = map[best.name.toLowerCase()] || 'Quick Reflexes';
  return `${label} ${best.val>=6?'+3':'+2'}`;
}

function buildFeatures(mon, role){
  const feats = [];
  
  // Flight positioning & "From Above" if it dives/swoops
  if ((mon.speed && mon.speed.fly) || hasTrait(mon, /fly|dive/i)) {
    feats.push({ kind:'Passive', name:'From Above', text:'When this adversary succeeds on a standard attack from above a target, deal one die-step higher damage instead of standard damage.' });
  }
  // "Horde" or "Minion" mechanics
  if (role==='Horde') {
    feats.push({ kind:'Passive', name:'Horde (weakened)', text:'When this adversary has marked half or more of their HP, their standard attack deals half damage (round down).' });
  }
  if (role==='Minion') {
    feats.push({ kind:'Passive', name:'Minion (5)', text:'Defeated when they take any damage. For every 5 damage a PC deals to this adversary, defeat an additional Minion within range the attack would succeed against.' });
  }
  // Summoning: check both traits and actions
  if (hasTrait(mon, /summon/i) || hasAction(mon, /summon/i)) {
    // Special case for Air Elemental summoning
    if (hasAction(mon, /summon air elemental/i)) {
      feats.push({ kind:'Action', name:'Summon Air Elemental', text:'Spend a Fear to begin a ritual; if 5 aarakocra within Close range each forgo actions and maintain focus for 3 consecutive spotlights, summon an Air Elemental at Far range which is friendly and obeys commands for up to 1 hour or until dismissed.' });
    } else {
      feats.push({ kind:'Action', name:'Summon Allies', text:'Spend a Fear to summon suitable allies at Far range.' });
    }
  }
  // Convert specific D&D traits by keyword
  if (hasTrait(mon, /pack tactics/i)) feats.push({ kind:'Passive', name:'Pack Hunters', text:'Has advantage on attacks against targets within Very Close range of one of its allies.' });
  if (hasTrait(mon, /poison|venom/i) || hasAction(mon, /poison|venom/i)) feats.push({ kind:'Action', name:'Venomous Strike', text:'Make an attack. On success, deal normal damage and the target becomes Infected until they heal any HP (disadvantage on action rolls while infected).' });
  if (hasTrait(mon, /regeneration/i)) feats.push({ kind:'Passive', name:'Regeneration', text:'At the start of this adversary\'s turn, they heal 1 HP unless they have taken damage since their last turn.' });
  if (hasTrait(mon, /magic resistance/i)) feats.push({ kind:'Passive', name:'Magic Resistance', text:'Has advantage on Instinct rolls against spells and magical effects.' });
  if (hasTrait(mon, /keen sight|keen smell|keen hearing/i)) feats.push({ kind:'Passive', name:'Keen Senses', text:'Cannot be surprised and has advantage on rolls to detect hidden creatures.' });
  if (hasTrait(mon, /charge/i)) feats.push({ kind:'Action', name:'Charge', text:'Move Close and make an attack. On success, deal one die-step higher damage.' });
  if (hasTrait(mon, /lair actions/i)) feats.push({ kind:'Action', name:'Lair Actions', text:'Once per encounter, spend a Fear to trigger a dangerous environmental effect.' });
  if (hasTrait(mon, /amphibious/i)) feats.push({ kind:'Passive', name:'Amphibious', text:'Can move and fight equally well on land or in water.' });
  if (hasTrait(mon, /incorporeal|ethereal/i)) feats.push({ kind:'Passive', name:'Incorporeal', text:'Can move through solid objects and walls.' });
  if (hasTrait(mon, /invisible/i)) feats.push({ kind:'Passive', name:'Invisible', text:'Cannot be seen without magical means. Attacks against this adversary have disadvantage.' });
  if (hasTrait(mon, /web/i) || hasAction(mon, /web/i)) feats.push({ kind:'Action', name:'Web Attack', text:'Make a ranged attack. On success, target is Restrained until they spend an action to break free.' });
  if (hasTrait(mon, /frighten|fear|frightful/i) || hasAction(mon, /frighten|fear|frightful/i)) {
    feats.push({ kind:'Action', name:'Frightening Presence', text:'Spend a Fear to cause all enemies within Close range to mark Stress.' });
  }
  
  // Breath weapons (dragons and other creatures)
  if (hasAction(mon, /breath|recharge/i)) {
    const actions = mon.actions || mon.action || [];
    const breathAction = actions.find(a => /breath|recharge/i.test(a.name));
    if (breathAction) {
      const breathName = breathAction.name.includes('Cold') ? 'Frost Breath' :
                        breathAction.name.includes('Fire') ? 'Fire Breath' :
                        breathAction.name.includes('Lightning') ? 'Lightning Breath' :
                        breathAction.name.includes('Acid') ? 'Acid Breath' :
                        breathAction.name.includes('Poison') ? 'Poison Breath' : 'Breath Weapon';
      feats.push({ kind:'Action', name:breathName, text:'Spend a Fear to unleash a devastating area attack affecting all enemies within Close range.' });
    }
  }
  
  // Only add Flurry for creatures with unusually high attack frequency or special multiattack patterns
  if (hasAction(mon, /multiattack/i)) {
    const actions = mon.actions || mon.action || [];
    const multiattackText = actions.find(a => /multiattack/i.test(a.name))?.entries?.[0] || '';
    // Only add Flurry if the multiattack is particularly complex (4+ attacks, or mentions "each target")
    if (/four|five|six|seven|eight/i.test(multiattackText) || /each target|different targets/i.test(multiattackText)) {
      feats.push({ kind:'Action', name:'Flurry', text:'Make two standard attacks against different targets.' });
    }
  }
  
  // Damage resistances/immunities
  if (mon.resist && mon.resist.length > 0) {
    const resistTypes = Array.isArray(mon.resist) ? mon.resist.join(', ') : mon.resist;
    feats.push({ kind:'Passive', name:'Resistance', text:`Takes half damage from: ${resistTypes}.` });
  }
  if (mon.immune && mon.immune.length > 0) {
    const immuneTypes = Array.isArray(mon.immune) ? mon.immune.join(', ') : mon.immune;
    feats.push({ kind:'Passive', name:'Immunity', text:`Takes no damage from: ${immuneTypes}.` });
  }
  
  // Legendary resistance
  if (hasTrait(mon, /legendary resistance/i)) {
    feats.push({ kind:'Passive', name:'Legendary Resistance', text:'Three times per encounter, when this adversary fails a roll, they can choose to succeed instead.' });
  }
  
  // Legendary actions
  const legendaryActions = mon.legendary_actions || mon.legendary || [];
  if (legendaryActions && legendaryActions.length > 0) {
    feats.push({ kind:'Passive', name:'Legendary Actions', text:'At the end of each PC turn, this adversary can take one additional action.' });
  }

  return feats;
}
function hasTrait(mon, re){
  const traits = mon.traits || mon.trait || [];
  return traits.some(t => re.test(t.name||'') || re.test((t.entries?.join(' ')||t.desc||'')));
}
function hasAction(mon, re){
  const actions = mon.actions || mon.action || [];
  return actions.some(a => re.test(a.name||'') || re.test((a.entries?.join(' ')||a.desc||'')));
}

function inferDescription(mon){ 
  const sizeCode = Array.isArray(mon.size) ? mon.size[0] : mon.size || 'M';
  const sizeMap = { T: 'tiny', S: 'small', M: 'medium', L: 'large', H: 'huge', G: 'gargantuan' };
  const size = sizeMap[sizeCode] || 'medium';
  const type = mon.type?.type || mon.type || 'creature';
  const typeTag = mon.type?.tags ? ` ${mon.type.tags[0]}` : '';
  
  // Generate description based on monster characteristics
  let action = 'attacks with determination';
  if (mon.speed && mon.speed.fly) action = 'strikes from the sky';
  else if (hasTrait(mon, /stealth|hide|ambush/i)) action = 'lurks in shadows';
  else if (hasTrait(mon, /pack|group/i)) action = 'hunts in groups';
  else if (hasTrait(mon, /magic|spell/i)) action = 'wields arcane power';
  
  return `A ${size} ${type}${typeTag} who ${action}.`; 
}
function inferMotives(role){
  switch (role){
    case 'Bruiser': return ['Break lines','Smash frontliners','Charge'];
    case 'Horde': return ['Overwhelm','Grapple','Swarm'];
    case 'Leader': return ['Command','Summon','Focus fire'];
    case 'Ranged': return ['Kite','Volleys','Pick off stragglers'];
    case 'Skulk': return ['Ambush','Flank','Escape'];
    default: return ['Patrol','Defend','Flee if outmatched'];
  }
}
function clamp(x,a,b){ return Math.max(a, Math.min(b,x)); }

function toMarkdown(a){
  return [
`${a.name.toUpperCase()}`,
`Tier ${a.tier} ${a.type}`,
`${a.description}`,
`Motives & Tactics: ${a.motives.join(', ')}`,
``,
`Difficulty: ${a.difficulty} | Thresholds: ${a.thresholds[0]}/${a.thresholds[1]} | HP: ${a.hp} | Stress: ${a.stress}`,
`ATK: +${a.atk} | ${a.standardAttack.name}: ${a.standardAttack.range} | ${a.standardAttack.damage} phy`,
a.experience ? `Experience: ${a.experience}` : '',
``,
`FEATURES`,
...a.features.map(f => `${f.name} - ${f.kind}: ${f.text}`)
].filter(Boolean).join('\n');
}

// Global converter object for browser compatibility
const converter = {
  convertToDaggerheart(monster) {
    const result = convertDnDToDaggerheart(monster);
    return result.adversary;
  },
  
  generateMarkdown(adversary) {
    return toMarkdown(adversary);
  }
};
