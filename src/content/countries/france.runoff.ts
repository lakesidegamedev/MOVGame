// FRANCE: the first round and the voter transfers into the runoff. Small, so
// the setup screen can show the runoff starting point without loading the
// France bundle. The runoff tests check them against engine/runoff.ts.

import type { TransferMatrix, RoundShares } from "@engine/runoff";

/** National first-round shares (real 2017/2022; polling-informed 2027). */
export const FR_FIRST_ROUND: Record<string, RoundShares> = {
  // 2017 first round (approx.): Macron 24.0, Le Pen 21.3, Fillon 20.0, Mélenchon 19.6, Hamon 6.4, …
  "2017": { ens: 0.240, rn: 0.213, lfi: 0.196, lr: 0.200, other: 0.151 },
  // 2022 first round: Macron 27.9, Le Pen 23.2, Mélenchon 22.0, Zemmour 7.1, Pécresse 4.8, …
  "2022": { ens: 0.279, rn: 0.232, lfi: 0.220, lr: 0.048, other: 0.221 },
  // 2027 speculative: centre and RN clear, left fragmented, right collapsed.
  "2027": { ens: 0.26, rn: 0.25, lfi: 0.18, lr: 0.10, other: 0.21 },
  // 2012 first round: Hollande 28.6, Sarkozy 27.2, Le Pen 17.9, Mélenchon 11.1,
  // Bayrou 9.1. `ens` = Hollande (PS), `rn` = Sarkozy (UMP); here `lr` carries
  // the eliminated Le Pen (FN) vote that breaks to the right finalist.
  "2012": { ens: 0.286, rn: 0.272, lfi: 0.111, lr: 0.179, other: 0.152 },
  // 2007 first round: Sarkozy 31.2, Royal 25.9, Bayrou 18.6, Le Pen 10.4,
  // Besancenot 4.1, de Villiers 2.2, Buffet 1.9, Voynet 1.6, Laguiller 1.3,
  // Bové 1.3, Nihous 1.2, Schivardi 0.3. `ens` = Royal, `rn` = Sarkozy;
  // `lfi` = the left candidates, `lr` = Le Pen and de Villiers, `other` =
  // Bayrou and Nihous.
  "2007": { ens: 0.2587, rn: 0.3118, lfi: 0.1057, lr: 0.1267, other: 0.1972 },
  // 2002 first round: Chirac 19.9, Le Pen 16.9, Jospin 16.2, Bayrou 6.8,
  // Laguiller 5.7, Chevenement 5.3, Mamere 5.3, Besancenot 4.3, Saint-Josse
  // 4.2, Madelin 3.9, Hue 3.4, Megret 2.3, Taubira 2.3, Lepage 1.9, Boutin
  // 1.2, Gluckstein 0.5. `ps` = Jospin, `gauche_rad` = Laguiller, Besancenot,
  // Hue and Gluckstein, `gauche_plur` = Chevenement, Mamere and Taubira,
  // `centre_droit` = Bayrou and Madelin, `other` = Saint-Josse, Lepage, Boutin
  // and Megret.
  "2002": { ens: 0.1988, rn: 0.1686, ps: 0.1618, gauche_rad: 0.1381, gauche_plur: 0.1290, centre_droit: 0.1075, other: 0.0964 },
  // 1995 first round: Jospin 23.3, Chirac 20.8, Balladur 18.6, Le Pen 15.0,
  // Hue 8.6, Laguiller 5.3, de Villiers 4.7, Voynet 3.3, Cheminade 0.3.
  // `ens` = Jospin, `rn` = Chirac; `lr` = Balladur, `fn` = Le Pen and de
  // Villiers, `lfi` = Hue, Laguiller, Voynet and Cheminade.
  "1995": { ens: 0.2330, rn: 0.2084, lr: 0.1858, fn: 0.1974, lfi: 0.1754 },
  // 1988 first round: Mitterrand 34.1, Chirac 19.9, Barre 16.5, Le Pen 14.4,
  // Lajoinie 6.8, Waechter 3.8, Juquin 2.1, Laguiller 2.0, Boussel 0.4.
  // `ens` = Mitterrand, `rn` = Chirac; `lr` = Barre, `fn` = Le Pen, `lfi` =
  // the four left and green candidates.
  "1988": { ens: 0.3411, rn: 0.1994, lr: 0.1654, fn: 0.1439, lfi: 0.1501 },
  // 1981 first round: Giscard 28.3, Mitterrand 25.9, Chirac 18.0, Marchais
  // 15.4, Lalonde 3.9, Laguiller 2.3, Crepeau 2.2, Debre 1.7, Garaud 1.3,
  // Bouchardeau 1.1. `ens` = Mitterrand, `rn` = Giscard; `lr` = Chirac, Debre
  // and Garaud, `lfi` = Marchais, Laguiller and Bouchardeau, `other` = Lalonde
  // and Crepeau.
  "1981": { ens: 0.2585, rn: 0.2832, lr: 0.2100, lfi: 0.1875, other: 0.0609 },
};

/** Bloc-transfer matrices from eliminated first-round candidates into the runoff. */
export const FR_TRANSFERS: Record<string, TransferMatrix> = {
  // 2017: a firm front républicain — Fillon/Hamon voters break hard for Macron.
  "2017": {
    lfi: { ens: 0.52, rn: 0.12, _abstain: 0.36 },
    lr: { ens: 0.72, rn: 0.18, _abstain: 0.10 },
    other: { ens: 0.58, rn: 0.22, _abstain: 0.20 },
  },
  // 2022: softer transfers — Mélenchon's "troisième tour" frame, a drilled RN.
  "2022": {
    lfi: { ens: 0.42, rn: 0.18, _abstain: 0.40 },
    lr: { ens: 0.55, rn: 0.30, _abstain: 0.15 },
    other: { ens: 0.48, rn: 0.28, _abstain: 0.24 },
  },
  // 2027: front républicain fatigue — transfers still favour the centre, barely.
  "2027": {
    lfi: { ens: 0.35, rn: 0.25, _abstain: 0.40 },
    lr: { ens: 0.45, rn: 0.40, _abstain: 0.15 },
    other: { ens: 0.40, rn: 0.35, _abstain: 0.25 },
  },
  // 2012: the left (Mélenchon) breaks hard for Hollande (`ens`); the FN vote
  // (`lr` slot) breaks to Sarkozy (`rn`); Bayrou's centre (`other`) splits with
  // a slight edge to Hollande. The net leaves Hollande narrowly ahead.
  "2012": {
    lfi: { ens: 0.80, rn: 0.06, _abstain: 0.14 },
    lr: { ens: 0.20, rn: 0.60, _abstain: 0.20 },
    other: { ens: 0.42, rn: 0.38, _abstain: 0.20 },
  },
  // 2007: the left breaks for Royal, Le Pen's voters mostly for Sarkozy, and
  // Bayrou's voters split almost evenly.
  "2007": {
    lfi: { ens: 0.80, rn: 0.05, _abstain: 0.15 },
    lr: { ens: 0.07, rn: 0.72, _abstain: 0.21 },
    other: { ens: 0.38, rn: 0.37, _abstain: 0.25 },
  },
  // 2002: rows are net of the surge in turnout between rounds (abstention fell
  // from 28 to 20 percent), so they run higher than raw switching. Even so the
  // model understates the 82 percent landslide, which the authored regional
  // shares carry exactly.
  "2002": {
    ps: { ens: 0.98, rn: 0.00, _abstain: 0.02 },
    gauche_rad: { ens: 0.93, rn: 0.02, _abstain: 0.05 },
    gauche_plur: { ens: 0.96, rn: 0.01, _abstain: 0.03 },
    centre_droit: { ens: 0.96, rn: 0.02, _abstain: 0.02 },
    other: { ens: 0.74, rn: 0.18, _abstain: 0.08 },
  },
  // 1995: Balladur's voters mostly follow him to Chirac, Le Pen's voters
  // split between Chirac and the couch, the left breaks for Jospin.
  "1995": {
    lfi: { ens: 0.86, rn: 0.03, _abstain: 0.11 },
    lr: { ens: 0.10, rn: 0.76, _abstain: 0.14 },
    fn: { ens: 0.13, rn: 0.60, _abstain: 0.27 },
  },
  // 1988: Barre's centrists and Le Pen's voters go to Chirac in large numbers,
  // the Communists and Greens to Mitterrand, but the right falls just short.
  "1988": {
    lfi: { ens: 0.90, rn: 0.03, _abstain: 0.07 },
    lr: { ens: 0.17, rn: 0.71, _abstain: 0.12 },
    fn: { ens: 0.05, rn: 0.80, _abstain: 0.15 },
  },
  // 1981: Chirac's Gaullists mostly follow him to Giscard, the Communists and
  // ecologists to Mitterrand, which is just enough.
  "1981": {
    lfi: { ens: 0.86, rn: 0.04, _abstain: 0.10 },
    lr: { ens: 0.16, rn: 0.74, _abstain: 0.10 },
    other: { ens: 0.60, rn: 0.12, _abstain: 0.28 },
  },
};
