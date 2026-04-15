// piggy/human/index.ts
function randomDelay(min, max) {
  return new Promise((r) => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
}
function humanTypeSequence(text) {
  const adjacent = {
    a: ["q", "w", "s", "z"],
    b: ["v", "g", "h", "n"],
    c: ["x", "d", "f", "v"],
    d: ["s", "e", "r", "f", "c", "x"],
    e: ["w", "r", "d", "s"],
    f: ["d", "r", "t", "g", "v", "c"],
    g: ["f", "t", "y", "h", "b", "v"],
    h: ["g", "y", "u", "j", "n", "b"],
    i: ["u", "o", "k", "j"],
    j: ["h", "u", "i", "k", "m", "n"],
    k: ["j", "i", "o", "l", "m"],
    l: ["k", "o", "p"],
    m: ["n", "j", "k"],
    n: ["b", "h", "j", "m"],
    o: ["i", "p", "l", "k"],
    p: ["o", "l"],
    q: ["w", "a"],
    r: ["e", "t", "f", "d"],
    s: ["a", "w", "e", "d", "x", "z"],
    t: ["r", "y", "g", "f"],
    u: ["y", "i", "h", "j"],
    v: ["c", "f", "g", "b"],
    w: ["q", "e", "a", "s"],
    x: ["z", "s", "d", "c"],
    y: ["t", "u", "g", "h"],
    z: ["a", "s", "x"]
  };
  const actions = [];
  const typoIndices = new Set;
  if (text.length > 4) {
    let tries = 0;
    while (typoIndices.size < 2 && tries < 20) {
      typoIndices.add(Math.floor(Math.random() * text.length));
      tries++;
    }
  }
  for (let i = 0;i < text.length; i++) {
    if (typoIndices.has(i)) {
      const ch = text[i].toLowerCase();
      const neighbors = adjacent[ch];
      const typo = neighbors ? neighbors[Math.floor(Math.random() * neighbors.length)] ?? ch : ch;
      actions.push(typo);
      actions.push("BACKSPACE");
    }
    actions.push(text[i]);
  }
  return actions;
}
export {
  randomDelay,
  humanTypeSequence
};
