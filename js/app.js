const ROUND_KEY = "skins-round-v1";
const NAMES_KEY = "skins-names-v1";
const STAKE_KEY = "skins-stake-v1";
const ROUND_STAKE_KEY = "skins-round-stake-v1";
const NINE_STAKE_KEY = "skins-nine-stake-v1";
const NINES_KEY = "skins-nines-v2";
const SCORE_MAX = 15;
const STAKE_MAX = 100000;
const NINE = 9;

// Every course uses the same scorecard, skins, round bet and First 9 / last 9.
// The round pot and the two nines can all be on in the same round. They are
// added into one Swish together with the skins.
// A new course is { id, name, place, holes: [{ par, meters, line? }] }.
// line only draws that hole's map. Back 9 is holes 10–18 when the course has them.
const COURSES = [
  {
    id: "fagersta-18",
    name: "Fagersta 18hål",
    place: "Discexpress Arena",
    holes: [
      { par: 3, meters: 95 },
      { par: 3, meters: 99 },
      { par: 3, meters: 81 },
      { par: 5, meters: 213 },
      { par: 4, meters: 180 },
      { par: 3, meters: 76 },
      { par: 3, meters: 110 },
      { par: 3, meters: 95 },
      { par: 3, meters: 103 },
      { par: 3, meters: 69 },
      { par: 3, meters: 110 },
      { par: 4, meters: 144 },
      { par: 3, meters: 91 },
      { par: 4, meters: 210 },
      { par: 3, meters: 76 },
      { par: 3, meters: 89 },
      { par: 3, meters: 94 },
      { par: 3, meters: 76 },
    ],
  },
  {
    id: "virsbo-18",
    name: "Virsbo 18hål",
    place: "Virsbo DGB",
    holes: [
      { par: 3, meters: 59, line: [[59.864927, 16.042612], [59.864786, 16.042956], [59.864661, 16.043215], [59.864574, 16.043324]] },
      { par: 4, meters: 130, line: [[59.864029, 16.043326], [59.863365, 16.042871], [59.862967, 16.043001]] },
      { par: 4, meters: 135, line: [[59.862864, 16.043461], [59.862722, 16.042317], [59.862935, 16.041168]] },
      { par: 3, meters: 101, line: [[59.861903, 16.040934], [59.861620, 16.041567], [59.861325, 16.041740], [59.861179, 16.041986]] },
      { par: 3, meters: 71, line: [[59.861186, 16.042370], [59.861789, 16.042783]] },
      { par: 3, meters: 58, line: [[59.861817, 16.043294], [59.861246, 16.043276]] },
      { par: 3, meters: 85, line: [[59.861115, 16.042521], [59.860778, 16.042745], [59.860648, 16.042687], [59.860452, 16.042745]] },
      { par: 3, meters: 84, line: [[59.859741, 16.042989], [59.859578, 16.043059], [59.859036, 16.042907]] },
      { par: 3, meters: 78, line: [[59.858641, 16.042800], [59.858954, 16.042029], [59.858941, 16.041650]] },
      { par: 4, meters: 114, line: [[59.859091, 16.042064], [59.859376, 16.042646], [59.859863, 16.042130]] },
      { par: 3, meters: 64, line: [[59.860325, 16.042493], [59.860829, 16.042368]] },
      { par: 4, meters: 131, line: [[59.860914, 16.042113], [59.860780, 16.040403], [59.860900, 16.040030]] },
      { par: 3, meters: 82, line: [[59.861025, 16.040889], [59.861767, 16.040622]] },
      { par: 3, meters: 65, line: [[59.861701, 16.040409], [59.861282, 16.040458], [59.861199, 16.040179]] },
      { par: 3, meters: 71, line: [[59.861403, 16.039882], [59.861891, 16.039653], [59.861964, 16.039429]] },
      { par: 3, meters: 79, line: [[59.862031, 16.039208], [59.862100, 16.040496]] },
      { par: 3, meters: 118, line: [[59.862744, 16.040865], [59.863113, 16.040259], [59.863620, 16.039815]] },
      { par: 3, meters: 96, line: [[59.863973, 16.039892], [59.864505, 16.040101], [59.864737, 16.040192]] },
    ],
  },
];

// First tap on an empty hole: left is one under par, right is par.
// After that the arrows step by one, from 1 up to 15.
function nextScore(current, dir, par) {
  if (current == null) {
    const holePar = Number.isInteger(par) ? par : 3;
    return dir < 0 ? Math.max(1, holePar - 1) : holePar;
  }
  const next = current + dir;
  if (next < 1 || next > SCORE_MAX) return current;
  return next;
}

function settle(scores) {
  const players = scores[0] ? scores[0].length : 0;
  const won = Array(players).fill(0);
  const holes = [];
  let carry = 0;
  let blocked = false;

  for (let h = 0; h < scores.length; h += 1) {
    const pot = carry + 1;
    const open = blocked || scores[h].some((score) => score == null);
    if (open) {
      holes.push({ state: "open", pot: blocked ? null : pot });
      blocked = true;
      continue;
    }
    const best = Math.min(...scores[h]);
    const leaders = [];
    scores[h].forEach((score, index) => {
      if (score === best) leaders.push(index);
    });
    if (leaders.length === 1) {
      won[leaders[0]] += pot;
      holes.push({ state: "won", player: leaders[0], pot });
      carry = 0;
    } else {
      holes.push({ state: "tie", pot });
      carry = pot;
    }
  }

  return { won, holes, carry };
}

function coursePar(course) {
  return course.holes.reduce((sum, hole) => sum + hole.par, 0);
}

function courseMeters(course) {
  return course.holes.reduce((sum, hole) => sum + hole.meters, 0);
}

function formatMeters(meters) {
  return `${new Intl.NumberFormat("sv-SE").format(meters)}\u00a0m`;
}

function formatToPar(diff) {
  if (diff === 0) return "E";
  if (diff > 0) return `+${diff}`;
  return `−${Math.abs(diff)}`;
}

function formatKr(amount) {
  return `${new Intl.NumberFormat("sv-SE").format(amount)}\u00a0kr`;
}

function readStake(value) {
  if (typeof value === "number" && !Number.isInteger(value)) return null;
  const text = String(value == null ? "" : value).trim().replace(/\s/g, "");
  if (!/^\d+$/.test(text)) return null;
  const stake = Number(text);
  if (stake < 1 || stake > STAKE_MAX) return null;
  return stake;
}

function toParClass(diff) {
  if (diff < 0) return "is-under";
  if (diff > 0) return "is-over";
  return "is-even";
}

// Scored holes from the start through the hole on screen. Later holes stay out.
function toParThrough(scores, holes, player, throughHole) {
  return runningSpan(scores, holes, player, 0, throughHole);
}

// Running score versus par for a stretch of holes. Unscored holes in the stretch are skipped.
function runningSpan(scores, holes, player, fromHole, throughHole) {
  let diff = 0;
  let played = 0;
  const last = Math.min(throughHole, holes.length - 1);
  for (let hole = fromHole; hole <= last; hole += 1) {
    const score = scores[hole][player];
    if (score == null) continue;
    diff += score - holes[hole].par;
    played += 1;
  }
  return played ? diff : null;
}

// Every hole in the stretch must be scored. Used for First 9 and last 9.
function nineToPar(scores, holes, player, fromHole, toHole) {
  if (fromHole < 0 || toHole >= holes.length || toHole < fromHole) return null;
  let diff = 0;
  for (let hole = fromHole; hole <= toHole; hole += 1) {
    const score = scores[hole][player];
    if (score == null) return null;
    diff += score - holes[hole].par;
  }
  return diff;
}

// Drop the lowest skin count, then each shorter stack pays each taller one
// the difference times the stake. Totalvinst is the sum of those payments.
function settlement(skins, stake) {
  if (!skins.length) return { net: [], payments: [], total: 0 };
  const min = Math.min(...skins);
  const net = skins.map((count) => count - min);
  const payments = [];
  for (let from = 0; from < net.length; from += 1) {
    for (let to = 0; to < net.length; to += 1) {
      if (net[to] <= net[from]) continue;
      const diff = net[to] - net[from];
      payments.push({ from, to, skins: diff, amount: diff * stake });
    }
  }
  payments.sort((a, b) => b.amount - a.amount || a.from - b.from || a.to - b.to);
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { net, payments, total };
}

// The round pot follows the score versus par. Lower is better.
// One player alone in last pays the winner, split if several share the win.
// If everyone else is tied for second, they split the same pot and each pay the winner.
function splitPlace(total, single, group, direction) {
  const base = Math.floor(total / group.length);
  let rest = total % group.length;
  return group.map((index) => {
    const amount = base + (rest > 0 ? 1 : 0);
    if (rest > 0) rest -= 1;
    return direction === "from"
      ? { from: index, to: single, amount }
      : { from: single, to: index, amount };
  }).filter((share) => share.amount > 0);
}

function placeBet(toPars, amount) {
  const pot = amount == null ? 100 : amount;
  if (!Number.isInteger(pot) || pot < 1 || pot > STAKE_MAX) return { shares: [] };
  if (!toPars || toPars.length < 2 || toPars.some((diff) => !Number.isInteger(diff))) {
    return { shares: [] };
  }
  const best = Math.min(...toPars);
  const worst = Math.max(...toPars);
  if (best === worst) return { shares: [] };
  const winners = [];
  const losers = [];
  let middles = 0;
  toPars.forEach((diff, index) => {
    if (diff === best) winners.push(index);
    else if (diff === worst) losers.push(index);
    else middles += 1;
  });
  if (losers.length === 1 && winners.length) {
    return { shares: splitPlace(pot, losers[0], winners, "to") };
  }
  if (winners.length === 1 && middles === 0 && losers.length > 1) {
    return { shares: splitPlace(pot, winners[0], losers, "from") };
  }
  return { shares: [] };
}

// 1, 2, 2 when two players share the score behind the winner. Null until every hole is scored.
function densePlaces(toPars) {
  if (!toPars || toPars.some((diff) => !Number.isInteger(diff))) return null;
  const order = toPars
    .map((diff, index) => ({ diff, index }))
    .sort((a, b) => a.diff - b.diff || a.index - b.index);
  const ranks = Array(toPars.length);
  let rank = 0;
  let previous = null;
  order.forEach((item) => {
    if (item.diff !== previous) {
      rank += 1;
      previous = item.diff;
    }
    ranks[item.index] = rank;
  });
  return ranks;
}

// Fold every debt into the fewest Swish payments.
function kvittning(balances) {
  const creditors = [];
  const debtors = [];
  balances.forEach((balance, index) => {
    if (balance > 0) creditors.push({ index, left: balance });
    else if (balance < 0) debtors.push({ index, left: -balance });
  });
  creditors.sort((a, b) => b.left - a.left || a.index - b.index);
  debtors.sort((a, b) => b.left - a.left || a.index - b.index);
  const payments = [];
  let creditor = 0;
  let debtor = 0;
  while (creditor < creditors.length && debtor < debtors.length) {
    const amount = Math.min(creditors[creditor].left, debtors[debtor].left);
    payments.push({
      from: debtors[debtor].index,
      to: creditors[creditor].index,
      amount,
    });
    creditors[creditor].left -= amount;
    debtors[debtor].left -= amount;
    if (creditors[creditor].left === 0) creditor += 1;
    if (debtors[debtor].left === 0) debtor += 1;
  }
  payments.sort((a, b) => b.amount - a.amount || a.from - b.from || a.to - b.to);
  return payments;
}

function payRounds(skins, stake, groups) {
  const money = settlement(skins, stake);
  const balances = Array(skins.length).fill(0);
  money.payments.forEach((payment) => {
    balances[payment.from] -= payment.amount;
    balances[payment.to] += payment.amount;
  });
  const shares = [];
  groups.forEach((group) => {
    group.forEach((share) => {
      balances[share.from] -= share.amount;
      balances[share.to] += share.amount;
      shares.push(share);
    });
  });
  return { payments: kvittning(balances), shares };
}

function swishPayments(skins, stake, toPars, placeAmount) {
  const bet = placeBet(toPars, placeAmount == null ? 100 : placeAmount);
  return payRounds(skins, stake, [bet.shares]);
}

function roundToPar(scores, holes, player) {
  let diff = 0;
  for (let hole = 0; hole < holes.length; hole += 1) {
    const score = scores[hole][player];
    if (score == null) return null;
    diff += score - holes[hole].par;
  }
  return diff;
}

function placeNote(shares, total, prefix) {
  if (!shares.length) return "";
  const head = prefix ? `${prefix}: ` : "";
  const pot = formatKr(total);
  const amount = shares[0].amount;
  const even = shares.every((share) => share.amount === amount);
  const sameFrom = shares.every((share) => share.from === shares[0].from);
  const sameTo = shares.every((share) => share.to === shares[0].to);
  if (shares.length === 1) {
    return `<p class="note included">${head}${pot} från sist till vinnaren ingår i beloppen.</p>`;
  }
  if (sameTo && even) {
    return `<p class="note included">${head}Andraplatsen ger ${formatKr(amount)} var till vinnaren. ${pot} totalt är inräknat tillsammans med skinsen.</p>`;
  }
  if (sameTo) {
    return `<p class="note included">${head}${pot} från andraplatsen till vinnaren är inräknat tillsammans med skinsen.</p>`;
  }
  if (sameFrom && even) {
    return `<p class="note included">${head}Sist betalar ${formatKr(amount)} var till de som delar segern. Det ingår i beloppen.</p>`;
  }
  return `<p class="note included">${head}${pot} från sist delas mellan de som delar segern och ingår i beloppen.</p>`;
}

function scoreClass(score, par) {
  if (score == null) return "is-empty";
  if (score < par) return "is-under";
  if (score > par) return "is-over";
  return "is-par";
}

function scoreTone(score, par) {
  const diff = score - par;
  if (diff === -1) return "score-birdie";
  if (diff < 0) return "score-under";
  if (diff === 0) return "score-par";
  if (diff === 1) return "score-bogey";
  if (diff === 2) return "score-double";
  return "score-triple";
}

function scoreMark(score, par, won) {
  if (score == null) return "–";
  const ring = won ? " skin-won" : "";
  const title = won ? ` title="Skin"` : "";
  return `<span class="mark ${scoreTone(score, par)}${ring}"${title}>${score}</span>`;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function selfTest() {
  const errors = [];
  const check = (name, ok) => {
    if (!ok) errors.push(name);
  };

  check("left empty is 2", nextScore(null, -1) === 2);
  check("right empty is 3", nextScore(null, 1) === 3);
  check("par 4 left is 3", nextScore(null, -1, 4) === 3);
  check("par 4 right is 4", nextScore(null, 1, 4) === 4);
  check("par 5 left is 4", nextScore(null, -1, 5) === 4);
  check("par 5 right is 5", nextScore(null, 1, 5) === 5);
  check("left from 2 is 1", nextScore(2, -1) === 1);
  check("right from 2 is 3", nextScore(2, 1) === 3);
  check("right from 3 is 4", nextScore(3, 1) === 4);
  check("left stops at 1", nextScore(1, -1) === 1);
  check("right stops at 15", nextScore(SCORE_MAX, 1) === SCORE_MAX);

  const course = COURSES[0];
  check("18 holes", course.holes.length === 18);
  check("par 59", coursePar(course) === 59);
  check("2011 m", courseMeters(course) === 2011);
  check("name", course.name === "Fagersta 18hål");
  const virsbo = COURSES.find((item) => item.id === "virsbo-18");
  check("virsbo 18", virsbo && virsbo.holes.length === 18);
  check("virsbo par 58", coursePar(virsbo) === 58);
  check("virsbo 1621 m", courseMeters(virsbo) === 1621);
  check("virsbo lines", virsbo.holes.every((hole) => hole.line.length >= 2));
  check("virsbo map", holeMap(virsbo.holes[0]).includes("<svg"));
  check("fagersta no map", holeMap(course.holes[0]) === "");

  const tied = [
    [2, 3],
    [3, 3],
    [4, 2],
  ];
  const settled = settle(tied);
  check("first skin", settled.won[0] === 1 && settled.holes[0].state === "won");
  check("push", settled.holes[1].state === "tie" && settled.holes[1].pot === 1);
  check("carry pays 2", settled.won[1] === 2 && settled.holes[2].pot === 2 && settled.holes[2].player === 1);

  const blocked = [
    [3, 3],
    [null, null],
    [2, 4],
  ];
  const waiting = settle(blocked);
  check("later hole waits", waiting.holes[2].pot === null && waiting.won[0] === 0 && waiting.won[1] === 0);

  const trio = [[3, 2, 3]];
  const one = settle(trio);
  check("unique low", one.won[1] === 1 && one.holes[0].player === 1);

  const allSquare = [[4, 4, 4]];
  const square = settle(allSquare);
  check("three-way tie", square.holes[0].state === "tie" && square.carry === 1);

  const money = settlement([9, 5, 4], 10);
  const owed = (from, to) => money.payments.find((payment) => payment.from === from && payment.to === to);
  check("net skins 5,1,0", money.net[0] === 5 && money.net[1] === 1 && money.net[2] === 0);
  check("p3 owes p2 10", owed(2, 1) && owed(2, 1).amount === 10 && owed(2, 1).skins === 1);
  check("p3 owes p1 50", owed(2, 0) && owed(2, 0).amount === 50 && owed(2, 0).skins === 5);
  check("p2 owes p1 40", owed(1, 0) && owed(1, 0).amount === 40 && owed(1, 0).skins === 4);
  check("totalvinst 100", money.total === 100 && money.payments.length === 3);
  check("even skins", settlement([3, 3, 3], 10).payments.length === 0 && settlement([3, 3, 3], 10).total === 0);
  check("one player", settlement([4], 10).payments.length === 0);

  const placed = placeBet([-6, -5, -4]);
  check("loser pays winner 100", placed.shares.length === 1 && placed.shares[0].from === 2 && placed.shares[0].to === 0 && placed.shares[0].amount === 100);
  const splitBet = placeBet([-6, -6, -5]);
  check("two at -6 get 50 each", splitBet.shares.length === 2 && splitBet.shares.every((share) => share.from === 2 && share.amount === 50) && splitBet.shares.some((share) => share.to === 0) && splitBet.shares.some((share) => share.to === 1));
  const pair = placeBet([-6, -4]);
  check("two players, loser pays", pair.shares.length === 1 && pair.shares[0].from === 1 && pair.shares[0].to === 0 && pair.shares[0].amount === 100);
  const tiedSecond = placeBet([4, 3, 4]);
  check("tied second pays 50 each", tiedSecond.shares.length === 2 && tiedSecond.shares.every((share) => share.to === 1 && share.amount === 50) && tiedSecond.shares.some((share) => share.from === 0) && tiedSecond.shares.some((share) => share.from === 2));
  check("tied second is 100 total", tiedSecond.shares.reduce((sum, share) => sum + share.amount, 0) === 100);
  check("tied last with a middle pays nothing", placeBet([-6, -5, -4, -4]).shares.length === 0);
  check("level scores pay nothing", placeBet([-6, -6, -6]).shares.length === 0);
  const places = densePlaces([4, 3, 4]);
  check("places 2, 1, 2", places && places[0] === 2 && places[1] === 1 && places[2] === 2);

  const skinsOnly = kvittning([120, -30, -90]);
  const skinsPay = (from, to) => skinsOnly.find((payment) => payment.from === from && payment.to === to);
  check("net without the 100", skinsOnly.length === 2 && skinsPay(2, 0) && skinsPay(2, 0).amount === 90 && skinsPay(1, 0) && skinsPay(1, 0).amount === 30);

  const cleared = swishPayments([7, 2, 0], 10, [-8, -7, -5]);
  const clearedPay = (from, to) => cleared.payments.find((payment) => payment.from === from && payment.to === to);
  check("7-2-0 includes 100", cleared.shares.length === 1 && cleared.payments.length === 2);
  check("p3 swishar 190", clearedPay(2, 0) && clearedPay(2, 0).amount === 190);
  check("p2 swishar 30", clearedPay(1, 0) && clearedPay(1, 0).amount === 30);

  const nine = swishPayments([9, 5, 4], 10, [-6, -5, -4]);
  const ninePay = (from, to) => nine.payments.find((payment) => payment.from === from && payment.to === to);
  check("9-5-4 two swishes", nine.payments.length === 2 && ninePay(2, 0) && ninePay(2, 0).amount === 160 && ninePay(1, 0) && ninePay(1, 0).amount === 30);
  check("even swish", swishPayments([3, 3, 3], 10, [-5, -5, -5]).payments.length === 0);

  const splitSwish = swishPayments([0, 0, 0], 10, [-6, -6, -5]);
  check("split swish is 50 each", splitSwish.payments.length === 2 && splitSwish.payments.every((payment) => payment.from === 2 && payment.amount === 50) && splitSwish.payments.some((payment) => payment.to === 0) && splitSwish.payments.some((payment) => payment.to === 1));

  const added = swishPayments([0, 1, 0], 10, [4, 3, 4]);
  const addedPay = (from, to) => added.payments.find((payment) => payment.from === from && payment.to === to);
  check("skins plus 100", added.shares.length === 2 && addedPay(0, 1) && addedPay(0, 1).amount === 60 && addedPay(2, 1) && addedPay(2, 1).amount === 60);

  const custom = swishPayments([0, 0, 0], 10, [-1, 0, 1], 200);
  const customPay = (from, to) => custom.payments.find((payment) => payment.from === from && payment.to === to);
  check("round 200", custom.payments.length === 1 && customPay(2, 0) && customPay(2, 0).amount === 200);

  const nineLast = placeBet([-2, 0, 0], 50);
  check("nine tied last pays 25", nineLast.shares.length === 2 && nineLast.shares.every((share) => share.to === 0 && share.amount === 25));
  const nineLead = placeBet([-2, -2, 0], 50);
  check("nine tied lead gets 25", nineLead.shares.length === 2 && nineLead.shares.every((share) => share.from === 2 && share.amount === 25));
  const ninesOnly = payRounds([0, 0, 0], 10, [placeBet([-1, 0, 0], 50).shares, placeBet([0, -1, 0], 50).shares]);
  const ninesPay = (from, to) => ninesOnly.payments.find((payment) => payment.from === from && payment.to === to);
  check("two nines add", ninesOnly.payments.length === 2 && ninesPay(2, 0) && ninesPay(2, 0).amount === 25 && ninesPay(2, 1) && ninesPay(2, 1).amount === 25);
  const both = payRounds([1, 0, 0], 10, [
    placeBet([-1, 0, 0], 200).shares,
    placeBet([-1, 0, 0], 50).shares,
    placeBet([0, 0, 0], 50).shares,
  ]);
  const bothPay = (from, to) => both.payments.find((payment) => payment.from === from && payment.to === to);
  check("round and nines add", both.payments.length === 2 && bothPay(1, 0) && bothPay(1, 0).amount === 135 && bothPay(2, 0) && bothPay(2, 0).amount === 135);
  const mixed = payRounds([0, 0, 0], 10, [
    placeBet([-2, 0, 1], 100).shares,
    placeBet([0, -3, 0], 50).shares,
  ]);
  const mixedPay = (from, to) => mixed.payments.find((payment) => payment.from === from && payment.to === to);
  check("round and nine net across winners", mixed.payments.length === 2 && mixedPay(2, 0) && mixedPay(2, 0).amount === 75 && mixedPay(2, 1) && mixedPay(2, 1).amount === 50);

  const spanHoles = Array.from({ length: 11 }, () => ({ par: 3 }));
  const spanScores = spanHoles.map(() => [3]);
  spanScores[0][0] = 1;
  spanScores[9][0] = 2;
  spanScores[10][0] = 2;
  check("front through 9", toParThrough(spanScores, spanHoles, 0, 8) === -2);
  check("total through 11", toParThrough(spanScores, spanHoles, 0, 10) === -4);
  check("back through 11", runningSpan(spanScores, spanHoles, 0, 9, 10) === -2);
  check("back nine bet", nineToPar(spanScores, spanHoles, 0, 9, 10) === -2);

  const pars = [{ par: 3 }, { par: 3 }];
  check("two throws is -1 on next hole", toParThrough([[2, 4], [null, null]], pars, 0, 1) === -1);
  check("four throws is +1", toParThrough([[2, 4], [null, null]], pars, 1, 1) === 1);
  check("no score hides paren", toParThrough([[null], [null]], pars, 0, 1) == null);
  check("later hole stays out", toParThrough([[2, 3], [2, 5]], pars, 0, 0) === -1);
  check("stake 10", readStake("10") === 10 && readStake(10) === 10);
  check("stake rejects empty", readStake("") == null && readStake("0") == null && readStake("1.5") == null && readStake("100001") == null);

  const names = ["A", "B"];
  const scores = COURSES[0].holes.map(() => [null, null]);
  check("old round without stake", validRound({
    courseId: "fagersta-18",
    names,
    hole: 0,
    screen: "hole",
    scores,
  }));
  check("bad stake rejected", !validRound({
    courseId: "fagersta-18",
    names,
    hole: 0,
    screen: "hole",
    stake: 0,
    scores,
  }));
  check("bad nine stake rejected", !validRound({
    courseId: "fagersta-18",
    names,
    hole: 0,
    screen: "hole",
    nines: true,
    nineStake: 0,
    scores,
  }));

  return errors;
}

const state = {
  screen: "home",
  courseId: null,
  count: 0,
  names: [],
  hole: 0,
  scores: null,
  stake: 10,
  stakeText: "10",
  roundStake: 100,
  roundText: "100",
  nines: true,
  nineStake: 50,
  nineText: "50",
  dialog: null,
};

let memoryNames = [];
let pendingFocus = null;
let enter = null;
let keepScroll = false;
let popPlayer = null;
let gesture = null;

function currentCourse() {
  return COURSES.find((course) => course.id === state.courseId) || null;
}

function courseHasNines(course) {
  return !!course && course.holes.length >= NINE * 2;
}

function onBackNine(course) {
  return courseHasNines(course) && state.hole >= NINE && state.hole < NINE * 2;
}

function loadMemory() {
  try {
    const data = JSON.parse(localStorage.getItem(NAMES_KEY) || "[]");
    if (Array.isArray(data) && data.every((name) => typeof name === "string")) {
      memoryNames = data.slice(0, 8);
    }
  } catch (err) {
    memoryNames = [];
  }
  try {
    const stake = readStake(localStorage.getItem(STAKE_KEY));
    if (stake != null) {
      state.stake = stake;
      state.stakeText = String(stake);
    }
    const roundStake = readStake(localStorage.getItem(ROUND_STAKE_KEY));
    if (roundStake != null) {
      state.roundStake = roundStake;
      state.roundText = String(roundStake);
    }
    const nineStake = readStake(localStorage.getItem(NINE_STAKE_KEY));
    if (nineStake != null) {
      state.nineStake = nineStake;
      state.nineText = String(nineStake);
    }
    const savedNines = localStorage.getItem(NINES_KEY);
    state.nines = savedNines == null ? true : savedNines === "1";
  } catch (err) {
    /* storage can be blocked */
  }
}

function rememberStake(stake) {
  state.stake = stake;
  state.stakeText = String(stake);
  try {
    localStorage.setItem(STAKE_KEY, String(stake));
  } catch (err) {
    /* storage can be blocked */
  }
}

function rememberBets() {
  const roundStake = readStake(state.roundText);
  const nineStake = readStake(state.nineText);
  if (roundStake != null) {
    state.roundStake = roundStake;
    state.roundText = String(roundStake);
  }
  if (nineStake != null) {
    state.nineStake = nineStake;
    state.nineText = String(nineStake);
  }
  try {
    localStorage.setItem(ROUND_STAKE_KEY, String(state.roundStake));
    localStorage.setItem(NINE_STAKE_KEY, String(state.nineStake));
    localStorage.setItem(NINES_KEY, state.nines ? "1" : "0");
  } catch (err) {
    /* storage can be blocked */
  }
}

function remember(names) {
  memoryNames = names.slice();
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(memoryNames));
  } catch (err) {
    /* storage can be blocked */
  }
}

function validRound(data) {
  if (!data || typeof data !== "object") return false;
  const course = COURSES.find((item) => item.id === data.courseId);
  if (!course) return false;
  if (!Array.isArray(data.names) || data.names.length < 1 || data.names.length > 8) return false;
  if (!data.names.every((name) => typeof name === "string" && name.trim())) return false;
  if (!Array.isArray(data.scores) || data.scores.length !== course.holes.length) return false;
  for (const row of data.scores) {
    if (!Array.isArray(row) || row.length !== data.names.length) return false;
    for (const score of row) {
      if (score != null && (!Number.isInteger(score) || score < 1 || score > SCORE_MAX)) return false;
    }
  }
  if (data.screen !== "hole" && data.screen !== "result") return false;
  if (!Number.isInteger(data.hole) || data.hole < 0 || data.hole >= course.holes.length) return false;
  if (data.stake != null && readStake(data.stake) == null) return false;
  if (data.roundStake != null && readStake(data.roundStake) == null) return false;
  if (data.nineStake != null && readStake(data.nineStake) == null) return false;
  if (data.nines != null && typeof data.nines !== "boolean") return false;
  if (data.nines === true && (!courseHasNines(course) || readStake(data.nineStake) == null)) return false;
  return true;
}

function loadRound() {
  try {
    const data = JSON.parse(localStorage.getItem(ROUND_KEY) || "null");
    return validRound(data) ? data : null;
  } catch (err) {
    return null;
  }
}

function persist() {
  if (state.screen !== "hole" && state.screen !== "result") return;
  const data = {
    v: 1,
    courseId: state.courseId,
    names: state.names,
    hole: state.hole,
    scores: state.scores,
    screen: state.screen,
    stake: state.stake,
    roundStake: state.roundStake,
    nines: state.nines,
    nineStake: state.nineStake,
  };
  try {
    localStorage.setItem(ROUND_KEY, JSON.stringify(data));
  } catch (err) {
    /* storage can be blocked */
  }
}

function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function canStart() {
  return state.count >= 1
    && state.names.length === state.count
    && state.names.every((name) => name.trim())
    && readStake(state.stakeText) != null
    && readStake(state.roundText) != null
    && (!state.nines || readStake(state.nineText) != null);
}

function sheetEl() {
  return document.getElementById("sheet");
}

function canMove(dir) {
  if (state.dialog) return false;
  const course = currentCourse();
  if (!course) return false;
  if (state.screen === "hole") {
    if (dir > 0) return true;
    return state.hole > 0;
  }
  if (state.screen === "result") return dir < 0;
  return false;
}

function go(dir) {
  if (!canMove(dir)) return;
  const course = currentCourse();
  enter = dir > 0 ? "next" : "prev";
  if (state.screen === "hole" && dir > 0 && state.hole === course.holes.length - 1) {
    state.screen = "result";
  } else if (state.screen === "result" && dir < 0) {
    state.screen = "hole";
    state.hole = course.holes.length - 1;
  } else {
    state.hole += dir;
  }
  persist();
  vibrate(6);
  render();
}

function jump(hole) {
  const course = currentCourse();
  if (!course || hole < 0 || hole >= course.holes.length) return;
  if (state.screen === "hole" && hole === state.hole) return;
  const forward = state.screen === "hole" && hole > state.hole;
  enter = forward ? "next" : "prev";
  state.screen = "hole";
  state.hole = hole;
  persist();
  render();
}

function chooseCourse(id) {
  if (!COURSES.some((course) => course.id === id)) return;
  state.courseId = id;
  state.screen = "players";
  state.count = 0;
  state.names = [];
  state.dialog = null;
  render();
}

function setCount(count) {
  if (count < 1 || count > 8 || count === state.count) return;
  const prev = state.count;
  const remembered = memoryNames.length === count ? memoryNames : null;
  const names = Array.from({ length: count }, (_, index) => {
    if (state.names[index]) return state.names[index];
    return remembered ? (remembered[index] || "") : "";
  });
  state.count = count;
  state.names = names;
  if (count > prev) {
    const startAt = prev === 0 ? 0 : prev;
    const empty = names.findIndex((name, index) => index >= startAt && !name.trim());
    pendingFocus = empty === -1 ? null : empty;
  }
  render();
}

function actuallyStart() {
  const stake = readStake(state.stakeText);
  const roundStake = readStake(state.roundText);
  const nineStake = readStake(state.nineText);
  const course = currentCourse();
  if (!course || stake == null) return;
  if (!courseHasNines(course)) state.nines = false;
  if (roundStake == null) return;
  if (state.nines && nineStake == null) return;
  const names = state.names.map((name) => name.trim());
  state.names = names;
  state.count = names.length;
  state.scores = course.holes.map(() => names.map(() => null));
  state.hole = 0;
  state.screen = "hole";
  state.dialog = null;
  enter = "next";
  if (roundStake != null) state.roundStake = roundStake;
  if (nineStake != null) state.nineStake = nineStake;
  remember(names);
  rememberStake(stake);
  rememberBets();
  persist();
  vibrate(10);
  render();
}

function startRound() {
  if (!canStart()) return;
  if (loadRound()) {
    state.dialog = "overwrite";
    render();
    return;
  }
  actuallyStart();
}

function resume() {
  const data = loadRound();
  if (!data) return;
  state.courseId = data.courseId;
  state.names = data.names.slice();
  state.count = data.names.length;
  state.scores = data.scores.map((row) => row.slice());
  state.hole = data.hole;
  state.screen = data.screen;
  state.stake = data.stake == null ? 10 : readStake(data.stake);
  state.stakeText = String(state.stake);
  state.roundStake = data.roundStake == null ? 100 : readStake(data.roundStake);
  state.roundText = String(state.roundStake);
  state.nines = data.nines === true;
  state.nineStake = data.nineStake == null ? 50 : readStake(data.nineStake);
  state.nineText = String(state.nineStake);
  state.dialog = null;
  render();
}

function clearRound() {
  try {
    localStorage.removeItem(ROUND_KEY);
  } catch (err) {
    /* storage can be blocked */
  }
  state.dialog = null;
  state.screen = "home";
  state.count = 0;
  state.names = [];
  state.scores = null;
  state.hole = 0;
  render();
}

function changeScore(player, dir) {
  if (state.screen !== "hole" || !state.scores) return;
  const row = state.scores[state.hole];
  const par = currentCourse().holes[state.hole].par;
  const next = nextScore(row[player], dir, par);
  if (next === row[player]) return;
  row[player] = next;
  popPlayer = player;
  keepScroll = true;
  vibrate(10);
  persist();
  render();
}

function clearScore(player) {
  if (state.screen !== "hole" || !state.scores) return;
  if (state.scores[state.hole][player] == null) return;
  state.scores[state.hole][player] = null;
  keepScroll = true;
  persist();
  render();
}

function chevron(dir) {
  const d = dir < 0 ? "M14.5 5.5 7.5 12l7 6.5" : "M9.5 5.5 16.5 12l-7 6.5";
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function checkSVG() {
  return `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 8.2 6.4 11l6.1-6.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function basketSVG() {
  return `<svg class="basket" viewBox="0 0 120 132" aria-hidden="true">
    <ellipse cx="34" cy="22" rx="16" ry="5.5" fill="currentColor"/>
    <rect x="57" y="30" width="4" height="88" rx="2" fill="currentColor"/>
    <ellipse cx="59" cy="36" rx="30" ry="9" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M31 40c8 22 16 36 28 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M87 40c-8 22-16 36-28 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M59 32v52" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M44 38c6 18 10 30 15 40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M74 38c-6 18-10 30-15 40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M40 92h38l-7 24H47z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <path d="M44 100h30M46 108h26" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
}

function skinPhrase(count) {
  return count === 1 ? "1 skin" : `${count} skins`;
}

function statusInfo() {
  if (!state.scores) return { text: "", cls: "is-open" };
  const info = settle(state.scores).holes[state.hole];
  if (!info || info.state === "open") {
    if (!info || info.pot == null) {
      return { text: "Skinnet räknas när hålen före är ifyllda.", cls: "is-open" };
    }
    return { text: `Potten: ${skinPhrase(info.pot)}`, cls: "is-open" };
  }
  if (info.state === "won") {
    const name = state.names[info.player];
    const text = info.pot === 1 ? `${name} tar skinnet` : `${name} tar ${info.pot} skins`;
    return { text, cls: "is-won" };
  }
  const text = info.pot === 1 ? "Delat — skinnet följer med" : `Delat — ${info.pot} skins följer med`;
  return { text, cls: "is-tie" };
}

function strokesSoFar(player) {
  let sum = 0;
  let played = 0;
  state.scores.forEach((row) => {
    if (row[player] != null) {
      sum += row[player];
      played += 1;
    }
  });
  return { sum, played };
}

function strokeLabel(player, course) {
  let sum = 0;
  let played = 0;
  let par = 0;
  course.holes.forEach((hole, index) => {
    const score = state.scores[index][player];
    if (score == null) return;
    sum += score;
    played += 1;
    par += hole.par;
  });
  if (played === 0) return "Inga kast";
  if (played === course.holes.length) return `${sum} slag · ${formatToPar(sum - par)}`;
  return `${sum} slag · ${played} hål`;
}

function hintText() {
  const course = currentCourse();
  if (state.screen === "result") return "Svep åt höger till hål 18";
  if (state.hole === 0) return "Svep åt vänster till hål 2";
  if (state.hole === course.holes.length - 1) return "Svep åt höger tillbaka · åt vänster till resultat";
  return "Svep åt höger tillbaka · åt vänster till nästa hål";
}

function holeNav() {
  const course = currentCourse();
  let prevLabel = "Föregående hål";
  let nextLabel = "Nästa hål";
  if (state.screen === "result") {
    prevLabel = "Hål 18";
    nextLabel = "Nästa";
  } else if (course) {
    prevLabel = state.hole === 0 ? "Föregående hål" : `Hål ${state.hole}`;
    nextLabel = state.hole === course.holes.length - 1 ? "Resultat" : `Hål ${state.hole + 2}`;
  }
  return `<footer class="hole-foot">
    <button type="button" class="nav-arrow" data-action="back-hole" aria-label="${esc(prevLabel)}" ${canMove(-1) ? "" : "disabled"}>${chevron(-1)}</button>
    <p class="hint">${esc(hintText())}</p>
    <button type="button" class="nav-arrow" data-action="next-hole" aria-label="${esc(nextLabel)}" ${canMove(1) ? "" : "disabled"}>${chevron(1)}</button>
  </footer>`;
}

function titleFor() {
  if (state.screen === "hole") return `ESS Skins · Hål ${state.hole + 1}`;
  if (state.screen === "result") return "ESS Skins · Resultat";
  if (state.screen === "players" && currentCourse()) return `ESS Skins · ${currentCourse().name}`;
  return "ESS Skins";
}

function courseCard(course) {
  return `<button type="button" class="layout" data-action="course" data-course="${esc(course.id)}">
    <span>
      <span class="layout-name">${esc(course.name)}</span>
      <span class="layout-meta"><span>${esc(course.place)}</span><span>${course.holes.length} hål · par ${coursePar(course)} · ${formatMeters(courseMeters(course))}</span></span>
    </span>
    <span class="layout-go">${chevron(1)}</span>
  </button>`;
}

function resumeCard(saved) {
  const course = COURSES.find((item) => item.id === saved.courseId);
  const where = saved.screen === "result" ? "Resultat" : `Hål ${saved.hole + 1}`;
  return `<section class="resume">
    <p class="kicker">Pågående runda</p>
    <h2>${esc(course.name)}</h2>
    <p class="where">${esc(where)} · ${esc(saved.names.join(", "))}</p>
    <div class="resume-actions">
      <button type="button" class="primary" data-action="resume">Fortsätt</button>
      <button type="button" class="ghost" data-action="ask-new">Ny runda</button>
    </div>
  </section>`;
}

function homeView() {
  const saved = loadRound();
  return `<div class="screen home">
    ${basketSVG()}
    <div class="monogram">
      <p class="initial"><b>E</b><span>Emil</span></p>
      <p class="initial"><b>S</b><span>Salle</span></p>
      <p class="initial"><b>S</b><span>Simon</span></p>
    </div>
    <h1 class="wordmark">ESS Skins</h1>
    <div class="rule"></div>
    <p class="tagline">Discgolf scorekort</p>
    ${saved ? resumeCard(saved) : ""}
    <p class="kicker">Välj layout</p>
    <div class="layouts">${COURSES.map(courseCard).join("")}</div>
  </div>`;
}

function playersView(course) {
  const counts = Array.from({ length: 8 }, (_, index) => {
    const count = index + 1;
    const on = state.count === count;
    return `<button type="button" class="count" role="checkbox" aria-checked="${on}" aria-label="${count} spelare" data-action="count" data-count="${count}">
      <span class="box">${checkSVG()}</span>
      <span class="count-num">${count}</span>
    </button>`;
  }).join("");

  const names = state.count
    ? `<div class="names">
        <p class="kicker">Namn</p>
        ${state.names.map((name, index) => `<label class="name-field">
          <span>Spelare ${index + 1}</span>
          <input data-name-index="${index}" value="${esc(name)}" placeholder="Namn" maxlength="24" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="${index === state.count - 1 ? "go" : "next"}">
        </label>`).join("")}
      </div>`
    : "";

  return `<div class="screen paper setup">
    <div class="player-scroll">
      <button type="button" class="back" data-action="home">${chevron(-1)}<span>ESS Skins</span></button>
      <p class="kicker">${esc(course.name)}</p>
      <h1>Hur många spelar?</h1>
      <div class="count-grid" role="group" aria-label="Antal spelare">${counts}</div>
      ${names}
    </div>
    <div class="start-bar">
      <label class="stake">
        <span>Varje skin är värd</span>
        <input id="stake-input" inputmode="numeric" enterkeyhint="go" maxlength="6" value="${esc(state.stakeText)}" autocomplete="off" spellcheck="false">
        <span>kr</span>
      </label>
      <label class="stake">
        <span>Rundan är värd</span>
        <input id="round-input" inputmode="numeric" enterkeyhint="go" maxlength="6" value="${esc(state.roundText)}" autocomplete="off" spellcheck="false">
        <span>kr</span>
      </label>
      ${courseHasNines(course) ? `<div class="nines-row">
        <button type="button" class="nines-toggle" data-action="nines" role="checkbox" aria-checked="${state.nines ? "true" : "false"}">
          <span class="box">${checkSVG()}</span>
          <span>First 9 och last 9</span>
        </button>
        <label class="stake nine-amt">
          <input id="nine-input" inputmode="numeric" enterkeyhint="go" maxlength="6" aria-label="First 9 och last 9 är värd" value="${esc(state.nineText)}" autocomplete="off" spellcheck="false">
          <span>kr</span>
        </label>
      </div>
      ${state.nines ? `<p class="note bet-note">Rundan och niorna räknas båda.</p>` : ""}` : ""}
      <button type="button" id="start-btn" class="primary" data-action="start" ${canStart() ? "" : "disabled"}>Starta</button>
    </div>
  </div>`;
}

// Tee at the bottom, basket ahead. The line follows the hole's bends.
function holeMap(hole) {
  const line = hole.line;
  if (!line || line.length < 2) return "";
  const lat0 = line[0][0];
  const lon0 = line[0][1];
  const scale = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const raw = line.map(([lat, lon]) => [(lon - lon0) * scale, (lat - lat0) * 111320]);
  const dx = raw[1][0] - raw[0][0];
  const dy = raw[1][1] - raw[0][1];
  const ang = Math.atan2(dx, dy);
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const scr = raw.map(([x, y]) => [x * c - y * s, -(x * s + y * c)]);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  scr.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  const pad = 18;
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;
  const width = maxX - minX;
  const height = maxY - minY;
  const px = (x) => (x - minX).toFixed(1);
  const py = (y) => (y - minY).toFixed(1);
  const path = scr.map(([x, y], index) => `${index ? "L" : "M"}${px(x)} ${py(y)}`).join("");
  const tee = scr[0];
  const aim = scr[1];
  const span = Math.hypot(aim[0] - tee[0], aim[1] - tee[1]) || 1;
  const ux = (aim[0] - tee[0]) / span;
  const uy = (aim[1] - tee[1]) / span;
  const sideX = -uy;
  const sideY = ux;
  const halfW = 2.3;
  const halfD = 1.3;
  const cx = tee[0] - ux * 0.4;
  const cy = tee[1] - uy * 0.4;
  const teeBox = [
    [cx - sideX * halfW - ux * halfD, cy - sideY * halfW - uy * halfD],
    [cx + sideX * halfW - ux * halfD, cy + sideY * halfW - uy * halfD],
    [cx + sideX * halfW + ux * halfD, cy + sideY * halfW + uy * halfD],
    [cx - sideX * halfW + ux * halfD, cy - sideY * halfW + uy * halfD],
  ].map(([x, y]) => `${px(x)},${py(y)}`).join(" ");
  const basket = scr[scr.length - 1];
  const nx = -s;
  const ny = -c;
  return `<figure class="hole-map">
    <div class="map-kicker">
      <p class="kicker">Hålets layout</p>
      <svg class="compass" viewBox="-22 -22 44 44" width="40" height="40" aria-hidden="true">
        <circle r="15"/>
        <line x1="${(-nx * 3).toFixed(1)}" y1="${(-ny * 3).toFixed(1)}" x2="${(nx * 8).toFixed(1)}" y2="${(ny * 8).toFixed(1)}"/>
        <text x="${(nx * 12).toFixed(1)}" y="${(ny * 12).toFixed(1)}">N</text>
      </svg>
    </div>
    <div class="frame">
      <svg viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Hålets layout. Tee längst ner, korgen längst fram.">
        <path d="${path}" class="fairway"/>
        <path d="${path}" class="fairway-line"/>
        <polygon points="${teeBox}" class="tee"/>
        <g class="basket" transform="translate(${px(basket[0])} ${py(basket[1])})">
          <line x1="0" y1="1.2" x2="0" y2="5.2"/>
          <circle r="3.1"/>
          <circle r="1.3"/>
        </g>
      </svg>
    </div>
    <p class="note">Tee längst ner. Linjen går via hålets böjar till korgen.</p>
  </figure>`;
}

function holeView(course) {
  const hole = course.holes[state.hole];
  const result = settle(state.scores);
  const status = statusInfo();
  const crowded = state.names.length >= 6 ? " crowded" : "";
  const pips = course.holes.map((_, index) => {
    const done = result.holes[index] && result.holes[index].state !== "open";
    const now = index === state.hole;
    const cls = `pip${done ? " done" : ""}${now ? " now" : ""}`;
    return `<button type="button" class="${cls}" data-action="jump" data-hole="${index}" aria-label="Hål ${index + 1}" ${now ? 'aria-current="true"' : ""}><span></span></button>`;
  }).join("");

  const players = state.names.map((name, index) => {
    const score = state.scores[state.hole][index];
    const toPar = toParThrough(state.scores, course.holes, index, state.hole);
    const back = onBackNine(course) ? runningSpan(state.scores, course.holes, index, NINE, state.hole) : null;
    const paren = toPar == null
      ? ""
      : `<span class="topar ${toParClass(toPar)}">(${formatToPar(toPar)})</span>`;
    const bracket = back == null
      ? ""
      : `<span class="backpar ${toParClass(back)}">[${formatToPar(back)}]</span>`;
    const metaBits = [];
    if (result.won[index] > 0) metaBits.push(`<span class="pill">${skinPhrase(result.won[index])}</span>`);
    const thrown = strokesSoFar(index);
    if (thrown.played > 0) metaBits.push(`<span>${thrown.sum} slag</span>`);
    const pop = popPlayer === index ? " pop" : "";
    const label = score == null
      ? `${name}, inget resultat`
      : `${name}, ${score} kast. Tryck för att sudda.`;
    const backCol = onBackNine(course) ? `<div class="stand-col">${bracket}</div>` : "";
    return `<section class="player">
      <h2 class="player-name">${esc(name)}</h2>
      <div class="stand-col">${paren}</div>
      ${backCol}
      <div class="player-meta">${metaBits.join("")}</div>
      <div class="counter">
        <button type="button" class="arrow" data-action="score" data-player="${index}" data-dir="-1" aria-label="Färre kast för ${esc(name)}" ${score != null && nextScore(score, -1, hole.par) === score ? "disabled" : ""}>${chevron(-1)}</button>
        <button type="button" class="score-num ${scoreClass(score, hole.par)}${pop}" data-action="clear" data-player="${index}" aria-label="${esc(label)}">${score == null ? "–" : score}</button>
        <button type="button" class="arrow" data-action="score" data-player="${index}" data-dir="1" aria-label="Fler kast för ${esc(name)}" ${score != null && nextScore(score, 1, hole.par) === score ? "disabled" : ""}>${chevron(1)}</button>
      </div>
    </section>`;
  }).join("");

  return `<div class="screen paper hole" id="sheet">
    <header class="hole-head">
      <div class="top-row">
        <p class="kicker">${esc(course.name)}</p>
        <button type="button" class="text-btn" data-action="home">Hem</button>
      </div>
      <h1 class="hole-title">Hål ${state.hole + 1}</h1>
      <p class="hole-sub">Par ${hole.par} · ${hole.meters} m</p>
      <div class="pips">${pips}</div>
      <p class="status ${status.cls}">${esc(status.text)}</p>
    </header>
    <div class="hole-body">
      <div class="players${crowded}${onBackNine(course) ? " has-back" : ""}">
        <div class="stand-head">
          <span></span>
          <span>Totalt</span>
          ${onBackNine(course) ? "<span>Back 9</span>" : ""}
          <span></span>
        </div>
        ${players}
      </div>
      ${holeMap(hole)}
    </div>
    ${holeNav()}
  </div>`;
}

function resultView(course) {
  const result = settle(state.scores);
  const toPars = state.names.map((_, player) => roundToPar(state.scores, course.holes, player));
  const rankOf = densePlaces(toPars);
  const order = state.names.map((_, index) => index).sort((a, b) => {
    if (rankOf && rankOf[a] !== rankOf[b]) return rankOf[a] - rankOf[b];
    if (!rankOf && result.won[a] !== result.won[b]) return result.won[b] - result.won[a];
    if (!rankOf) {
      const sa = strokesSoFar(a);
      const sb = strokesSoFar(b);
      if (sa.played === sb.played && sa.played > 0 && sa.sum !== sb.sum) return sa.sum - sb.sum;
    }
    return a - b;
  });

  const standings = order.map((player, place) => {
    const rank = rankOf ? rankOf[player] : place + 1;
    return `<li class="${rank === 1 ? "is-first" : ""}">
    <span class="rank">${rank}</span>
    <span class="who">${esc(state.names[player])}</span>
    <span class="strokes">${esc(strokeLabel(player, course))}</span>
    <span class="skins-big">${result.won[player]}<small>${result.won[player] === 1 ? "skin" : "skins"}</small></span>
  </li>`;
  }).join("");

  const allFilled = state.scores.every((row) => row.every((score) => score != null));
  const leftover = allFilled && result.carry > 0
    ? `<p class="note">${skinPhrase(result.carry)} blev över — ingen vann dem.</p>`
    : "";

  const head = `<tr><th class="name-col"></th>${course.holes.map((_, index) => `<th>${index + 1}</th>`).join("")}<th class="tot">Tot</th></tr>`;
  const body = state.names.map((name, player) => {
    const cells = course.holes.map((hole, index) => {
      const score = state.scores[index][player];
      const info = result.holes[index];
      const took = info && info.state === "won" && info.player === player;
      return `<td class="${score == null ? "is-empty" : ""}">${scoreMark(score, hole.par, took)}</td>`;
    }).join("");
    const thrown = strokesSoFar(player);
    return `<tr><th class="name-col">${esc(name)}</th>${cells}<td class="tot">${thrown.played ? thrown.sum : "–"}</td></tr>`;
  }).join("");
  const parCells = course.holes.map((hole) => `<td>${hole.par}</td>`).join("");
  const money = settlement(result.won, state.stake);
  const roundBet = placeBet(toPars, state.roundStake);
  const frontBet = state.nines ? placeBet(state.names.map((_, player) => nineToPar(state.scores, course.holes, player, 0, NINE - 1)), state.nineStake) : { shares: [] };
  const backBet = state.nines ? placeBet(state.names.map((_, player) => nineToPar(state.scores, course.holes, player, NINE, NINE * 2 - 1)), state.nineStake) : { shares: [] };
  const groups = [roundBet.shares];
  if (state.nines) groups.push(frontBet.shares, backBet.shares);
  const cleared = payRounds(result.won, state.stake, groups);
  const nets = state.names.map((name, index) => `<li><span>${esc(name)}</span><b>${skinPhrase(money.net[index])}</b></li>`).join("");
  const pays = cleared.payments.map((payment) => {
    const from = state.names[payment.from];
    const to = state.names[payment.to];
    return `<li>${esc(from)} swishar ${formatKr(payment.amount)} till ${esc(to)}</li>`;
  }).join("");
  const pending = allFilled ? "" : `<p class="note">Räknat på skins som redan är vunna.</p>`;
  const included = `${placeNote(roundBet.shares, state.roundStake)}${state.nines ? `${placeNote(frontBet.shares, state.nineStake, "First 9")}${placeNote(backBet.shares, state.nineStake, "Last 9")}` : ""}`;
  const worth = state.nines
    ? `<p class="note">Rundan är värd ${formatKr(state.roundStake)}. First 9 och last 9 är värda ${formatKr(state.nineStake)} var.</p>`
    : `<p class="note">Rundan är värd ${formatKr(state.roundStake)}</p>`;
  const outcome = cleared.payments.length
    ? `<ul class="pay-list">${pays}</ul>${included}`
    : `<p class="note">Ingen behöver swisha.</p>`;

  return `<div class="screen paper result" id="sheet">
    <div class="result-body">
      <button type="button" class="back" data-action="back-hole">${chevron(-1)}<span>Hål 18</span></button>
      <p class="kicker">${esc(course.name)}</p>
      <div class="top-row">
        <h1>Resultat</h1>
        <button type="button" class="text-btn" data-action="ask-new">Ny runda</button>
      </div>
      <ol class="standings">${standings}</ol>
      ${leftover}
      <section class="swish">
        <h2 class="section-label">Swish</h2>
        <p class="note">Varje skin är värd ${formatKr(state.stake)}</p>
        ${worth}
        <p class="note">När lägsta dragits bort</p>
        <ul class="net-list">${nets}</ul>
        ${outcome}
        ${pending}
      </section>
      <h2 class="section-label">Scorekort</h2>
      <p class="note">Dra sidledes för alla hål.</p>
      <div class="card-scroll">
        <table class="card">
          <thead>${head}</thead>
          <tbody>${body}</tbody>
          <tfoot><tr class="par-row"><th class="name-col">Par</th>${parCells}<td class="tot">${coursePar(course)}</td></tr></tfoot>
        </table>
      </div>
    </div>
    ${holeNav()}
  </div>`;
}

function dialogHTML() {
  if (!state.dialog) return "";
  const overwrite = state.dialog === "overwrite";
  const title = overwrite ? "Starta ny runda?" : "Ny runda?";
  const body = overwrite ? "Den pågående rundan ersätts." : "Den pågående rundan tas bort.";
  const ok = overwrite ? "Starta ny" : "Ta bort rundan";
  const action = overwrite ? "confirm-start" : "confirm-new";
  return `<div class="dialog-back" data-action="close-dialog">
    <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
      <h2 id="dlg-title">${title}</h2>
      <p class="dialog-copy">${body}</p>
      <button type="button" class="primary" id="dialog-cancel" data-action="close-dialog">Avbryt</button>
      <button type="button" class="danger" data-action="${action}">${ok}</button>
    </div>
  </div>`;
}

function view() {
  if (state.screen !== "home" && !currentCourse()) state.screen = "home";
  if (state.screen === "players") return playersView(currentCourse());
  if (state.screen === "hole") return holeView(currentCourse());
  if (state.screen === "result") return resultView(currentCourse());
  return homeView();
}

function render() {
  const scrollTop = keepScroll ? (document.querySelector(".hole-body")?.scrollTop || 0) : 0;
  const app = document.getElementById("app");
  if (!app) return;
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", state.screen === "home" ? "#0e1c16" : "#f3eee4");
  document.title = titleFor();
  app.innerHTML = view() + dialogHTML();

  const sheet = sheetEl();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (sheet && enter && !reduce) {
    sheet.classList.add(enter === "next" ? "enter-next" : "enter-prev");
  }
  enter = null;

  if (keepScroll) {
    const body = document.querySelector(".hole-body");
    if (body) body.scrollTop = scrollTop;
    keepScroll = false;
  }
  if (pendingFocus != null) {
    const field = document.querySelector(`[data-name-index="${pendingFocus}"]`);
    pendingFocus = null;
    if (field) field.focus();
  }
  if (state.dialog) document.getElementById("dialog-cancel")?.focus();
  popPlayer = null;
}

function onClick(event) {
  const inDialog = event.target.closest(".dialog");
  if (inDialog && !event.target.closest(".dialog [data-action]")) return;
  const button = event.target.closest("[data-action]");
  if (!button || !document.getElementById("app").contains(button)) return;
  const action = button.dataset.action;

  if (action === "close-dialog") {
    state.dialog = null;
    render();
    return;
  }
  if (action === "home") {
    state.dialog = null;
    state.screen = "home";
    render();
    return;
  }
  if (action === "course") {
    chooseCourse(button.dataset.course);
    return;
  }
  if (action === "count") {
    setCount(Number(button.dataset.count));
    return;
  }
  if (action === "nines") {
    state.nines = !state.nines;
    render();
    return;
  }
  if (action === "start") {
    startRound();
    return;
  }
  if (action === "confirm-start") {
    actuallyStart();
    return;
  }
  if (action === "score") {
    changeScore(Number(button.dataset.player), Number(button.dataset.dir));
    return;
  }
  if (action === "clear") {
    clearScore(Number(button.dataset.player));
    return;
  }
  if (action === "jump") {
    jump(Number(button.dataset.hole));
    return;
  }
  if (action === "resume") {
    resume();
    return;
  }
  if (action === "ask-new") {
    state.dialog = "newround";
    render();
    return;
  }
  if (action === "confirm-new") {
    clearRound();
    return;
  }
  if (action === "back-hole") {
    go(-1);
    return;
  }
  if (action === "next-hole") go(1);
}

function onInput(event) {
  if (event.target.id === "stake-input" || event.target.id === "round-input" || event.target.id === "nine-input") {
    if (event.target.id === "stake-input") state.stakeText = event.target.value;
    if (event.target.id === "round-input") state.roundText = event.target.value;
    if (event.target.id === "nine-input") state.nineText = event.target.value;
    const button = document.getElementById("start-btn");
    if (button) button.disabled = !canStart();
    return;
  }
  const field = event.target.closest("[data-name-index]");
  if (!field) return;
  state.names[Number(field.dataset.nameIndex)] = field.value;
  const button = document.getElementById("start-btn");
  if (button) button.disabled = !canStart();
}

function onKey(event) {
  if (event.key === "Escape" && state.dialog) {
    state.dialog = null;
    render();
    return;
  }
  if (state.dialog) return;
  if ((event.target.id === "stake-input" || event.target.id === "round-input" || event.target.id === "nine-input") && event.key === "Enter") {
    event.preventDefault();
    if (canStart()) startRound();
    return;
  }
  const field = event.target.closest?.("[data-name-index]");
  if (field && event.key === "Enter") {
    event.preventDefault();
    const index = Number(field.dataset.nameIndex);
    const next = document.querySelector(`[data-name-index="${index + 1}"]`);
    if (next) next.focus();
    else if (canStart()) startRound();
    return;
  }
  if (event.target.closest?.("input, textarea")) return;
  if (event.repeat) return;
  if (event.key === "ArrowRight") go(1);
  if (event.key === "ArrowLeft") go(-1);
}

function onPointerDown(event) {
  if (state.dialog) return;
  if (state.screen !== "hole" && state.screen !== "result") return;
  if (event.button !== 0) return;
  if (event.target.closest("button, input, a, .card-scroll, .pips")) return;
  gesture = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    dx: 0,
    axis: null,
  };
  const sheet = sheetEl();
  if (sheet) sheet.style.transition = "none";
}

function onPointerMove(event) {
  if (!gesture || event.pointerId !== gesture.id) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (!gesture.axis) {
    if (Math.hypot(dx, dy) < 10) return;
    gesture.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? "x" : "y";
  }
  if (gesture.axis !== "x") return;
  gesture.dx = dx;
  const app = document.getElementById("app");
  try {
    if (app && !app.hasPointerCapture(event.pointerId)) app.setPointerCapture(event.pointerId);
  } catch (err) {
    /* synthetic events have no active pointer */
  }
  const sheet = sheetEl();
  if (!sheet) return;
  const dir = dx < 0 ? 1 : -1;
  const drag = canMove(dir) ? dx : dx * 0.22;
  sheet.style.transform = `translate3d(${drag}px,0,0)`;
}

function onPointerUp(event) {
  if (!gesture || event.pointerId !== gesture.id) return;
  const { dx, axis } = gesture;
  gesture = null;
  const sheet = sheetEl();
  if (!sheet || axis !== "x") {
    if (sheet) {
      sheet.style.transition = "";
      sheet.style.transform = "";
    }
    return;
  }
  const threshold = Math.min(72, (sheet.offsetWidth || 360) * 0.22);
  if (dx < -threshold && canMove(1)) {
    go(1);
    return;
  }
  if (dx > threshold && canMove(-1)) {
    go(-1);
    return;
  }
  sheet.style.transition = "transform 220ms ease";
  sheet.style.transform = "translate3d(0,0,0)";
}

function init() {
  const app = document.getElementById("app");
  if (!app) return;
  loadMemory();
  app.addEventListener("click", onClick);
  app.addEventListener("input", onInput);
  app.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  document.addEventListener("keydown", onKey);
  render();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

window.SkinsDebug = {
  selfTest,
  setMemory(names) { memoryNames = names.slice(); },
  setCount,
  startRound: actuallyStart,
  score: changeScore,
  go,
  showResult() {
    state.screen = "result";
    enter = null;
    render();
  },
  paint() {
    enter = null;
    render();
  },
  state,
};

init();
