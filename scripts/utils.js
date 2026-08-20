// Tier definitions — shared between team-config and match-result blocks
export const defaultLevelMap = {
  B: 1,
  S: 3,
  SG: 4,
  G: 5,
  GP: 6,
  P: 7,
  PE: 8,
  E: 9,
  ED: 10,
  D: 11,
  DM: 12,
  M: 13,
  GM: 15,
  C: 17,
};

export const tierLabels = {
  B: 'Bronze',
  S: 'Silver',
  SG: 'Silver ↔ Gold',
  G: 'Gold',
  GP: 'Gold ↔ Platinum',
  P: 'Platinum',
  PE: 'Platinum ↔ Emerald',
  E: 'Emerald',
  ED: 'Emerald ↔ Diamond',
  D: 'Diamond',
  DM: 'Diamond ↔ Master',
  M: 'Master',
  GM: 'Grandmaster',
  C: 'Challenger',
};

/**
 * Computes a player's score from their current and peak tier.
 * If both are set: average. If only one: use that value.
 */
export const computeLevel = (currentTier, peakTier) => {
  const c = currentTier ? defaultLevelMap[currentTier] : null;
  const p = peakTier ? defaultLevelMap[peakTier] : null;
  if (c !== null && p !== null) return (c + p) / 2;
  return c ?? p ?? 0;
};

export const getKeyByValue = (object, value) => Object.keys(object).find((key) => object[key] === value);

export function createTag(tag, attributes, html, options = {}) {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement
      || html instanceof SVGElement
      || html instanceof DocumentFragment) {
      el.append(html);
    } else if (Array.isArray(html)) {
      el.append(...html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  options.parent?.append(el);
  return el;
}
