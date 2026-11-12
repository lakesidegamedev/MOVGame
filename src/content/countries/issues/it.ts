// Per-election issues for Italy: what each campaign was argued about, named as
// voters named it at the time. Attached to the bundle in ../italy.ts.
import type { CountryIssueDef } from "@engine/countryGame";

export const IT_ELECTION_ISSUES: Record<string, CountryIssueDef[]> = {
  "2022": [
    { id: "energy", name: "Energy bills", blurb: "Gas and power bills doubled or worse since Russia invaded Ukraine, and calls for an EU price cap on gas." },
    { id: "economy", name: "Inflation & wages", blurb: "Inflation above 8 percent, wages that have barely moved in years and a minimum wage the left proposes." },
    { id: "income", name: "Citizens' income", blurb: "Whether to keep, tighten or scrap the citizens' income that Five Star brought in." },
    { id: "tax", name: "Flat tax", blurb: "The Lega's 15 percent flat tax and Forza Italia's 23 percent, against the left's plan to cut payroll taxes." },
    { id: "europe", name: "Europe & the PNRR", blurb: "The 191 billion euro EU recovery plan and whether a right-wing government would renegotiate it." },
    { id: "migration", name: "Migration", blurb: "Sea arrivals rising again and Meloni's call for a naval blockade off Libya." },
    { id: "pensions", name: "Pensions", blurb: "The end of Quota 100 and the Lega's push for retirement after 41 years of contributions." },
  ],
  "2018": [
    { id: "migration", name: "Migration", blurb: "More than 600,000 sea arrivals since 2014, the deal with Libya and the Macerata shooting." },
    { id: "tax", name: "Flat tax", blurb: "The centre-right's flat tax: 23 percent for Forza Italia, 15 percent for the Lega." },
    { id: "income", name: "Citizens' income", blurb: "Five Star's promise of 780 euros a month for the poor and the jobless." },
    { id: "economy", name: "Jobs & the Jobs Act", blurb: "A slow recovery, short-term contracts and Renzi's Jobs Act on hiring and firing." },
    { id: "pensions", name: "Fornero law", blurb: "The Lega promises to scrap the Fornero pension law, and Five Star to rewrite it." },
    { id: "south", name: "The South", blurb: "Unemployment near 20 percent in the South and young people leaving for the North and abroad." },
    { id: "europe", name: "Europe & the euro", blurb: "EU deficit rules, the bank rescues and the Lega's and Five Star's past doubts about the euro." },
    { id: "corruption", name: "The caste", blurb: "Politicians' privileges, and Five Star's scandal over MPs who did not return part of their pay." },
  ],
  "2013": [
    { id: "austerity", name: "Monti's austerity", blurb: "The tax rises and cuts Monti made to calm the bond markets after the 2011 spread crisis." },
    { id: "tax", name: "IMU property tax", blurb: "Monti's IMU on first homes, which Berlusconi promises to abolish and refund in cash." },
    { id: "economy", name: "Recession & jobs", blurb: "A second year of recession, unemployment above 11 percent and youth unemployment above 36 percent." },
    { id: "corruption", name: "The caste", blurb: "Regional party-funding scandals, the Monte dei Paschi losses and what politicians cost the taxpayer." },
    { id: "europe", name: "Europe & Germany", blurb: "The fiscal compact, Berlin's line on austerity and Grillo's call for a referendum on the euro." },
    { id: "pensions", name: "Fornero reform", blurb: "The Fornero reform raising the pension age, and the esodati left with neither a job nor a pension." },
    { id: "income", name: "Citizens' income", blurb: "Five Star's proposal of a guaranteed income for every citizen." },
  ],
  "2008": [
    { id: "tax", name: "ICI & taxes", blurb: "Berlusconi pledges to abolish the ICI tax on first homes, and both blocs promise lower taxes." },
    { id: "economy", name: "Wages & prices", blurb: "Flat wages, rising pasta and fuel prices and an economy that has barely grown in years." },
    { id: "services", name: "Naples rubbish crisis", blurb: "Rubbish piled in the streets of Naples and Campania after the landfills filled up." },
    { id: "corruption", name: "The caste", blurb: "La Casta, the bestseller on politicians' privileges, and Grillo's V-Day against MPs with convictions." },
    { id: "migration", name: "Crime & immigration", blurb: "The Reggiani murder in Rome and the emergency decree on expelling EU citizens." },
    { id: "industry", name: "Alitalia", blurb: "Air France-KLM's bid for the state airline and Berlusconi's call for Italian buyers instead." },
    { id: "pensions", name: "Pensions", blurb: "The 2007 deal replacing a sudden jump in the pension age with gradual steps." },
  ],
};
