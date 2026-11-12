// Per-election issues for Mexico: what each presidential campaign was argued
// about, named as voters named it at the time. Attached to the bundle in
// ../mexico.ts.
import type { CountryIssueDef } from "@engine/countryGame";

export const MX_ELECTION_ISSUES: Record<string, CountryIssueDef[]> = {
  "2024": [
    { id: "poverty", name: "Social programmes", blurb: "Pensions for everyone over 65, youth apprenticeships and grants, and whether a new government would keep them." },
    { id: "security", name: "Violence and security", blurb: "Some 30,000 murders a year, the 'hugs not bullets' policy and the National Guard under army command." },
    { id: "corruption", name: "Corruption", blurb: "Fraud at the Segalmex food agency, and the opposition parties' own records in government." },
    { id: "economy_jobs", name: "Wages and nearshoring", blurb: "A minimum wage doubled since 2018, a strong peso and new factories moving to the north." },
    { id: "democracy", name: "Courts and the INE", blurb: "López Obrador's Plan C to elect judges by popular vote, and his clashes with the electoral institute." },
    { id: "health", name: "Health and medicines", blurb: "Medicine shortages after Seguro Popular was scrapped, and the IMSS-Bienestar system that replaced it." },
    { id: "energy", name: "Pemex and energy", blurb: "Pemex's debts, the Dos Bocas refinery and state control of electricity." },
  ],
  "2018": [
    { id: "corruption", name: "Corruption", blurb: "The 'White House' mansion, Odebrecht bribes and former governors like Javier Duarte in jail." },
    { id: "security", name: "Violence", blurb: "2017, the most violent year on record, and the Internal Security Law keeping the army on the streets." },
    { id: "economy_jobs", name: "Wages and growth", blurb: "Low wages, growth near 2 percent and the half-built new airport for Mexico City at Texcoco." },
    { id: "poverty", name: "Poverty and pensions", blurb: "López Obrador's promise of pensions for all the elderly and grants for the young, against targeted programmes." },
    { id: "us_relations", name: "Trump and NAFTA", blurb: "Trump's border wall and the NAFTA renegotiation under way since 2017." },
    { id: "energy", name: "Gasolinazo and oil", blurb: "The January 2017 fuel price rise, and whether to undo the 2013 opening of oil to private firms." },
  ],
  "2012": [
    { id: "security", name: "Drug war", blurb: "Over 50,000 dead since Calderón sent the army against the cartels in December 2006." },
    { id: "economy_jobs", name: "Jobs and wages", blurb: "The recovery after the 2009 crash, low wages and young people neither working nor studying." },
    { id: "corruption", name: "Corruption", blurb: "The PRI's former governors, from Coahuila's hidden debts to Tamaulipas, and the overruns on the Estela de Luz monument." },
    { id: "democracy", name: "Media and democracy", blurb: "#YoSoy132, claims that Televisa favoured Peña Nieto, and fears of the old PRI returning." },
    { id: "poverty", name: "Poverty", blurb: "Nearly half of Mexicans poor by CONEVAL's 2010 count, and the future of Oportunidades." },
    { id: "energy", name: "Pemex", blurb: "Peña Nieto's call to let private investment into Pemex, against the left's defence of state oil." },
  ],
  "2006": [
    { id: "economy_jobs", name: "Jobs", blurb: "Calderón's pitch as the jobs president, slow growth and the millions who left to work in the US." },
    { id: "poverty", name: "Poverty and inequality", blurb: "López Obrador's 'for the good of all, the poor first', and his pensions for the elderly in Mexico City." },
    { id: "security", name: "Crime and kidnapping", blurb: "Kidnappings, the 2004 march against insecurity and drug violence in Michoacán and Nuevo Laredo." },
    { id: "corruption", name: "Corruption", blurb: "The PRD's 2004 video scandals, and the charges about Calderón's brother-in-law's contracts." },
    { id: "democracy", name: "Fox and fair play", blurb: "The 2005 attempt to strip López Obrador's immunity, and Fox's open campaigning for his party." },
    { id: "energy", name: "Pemex", blurb: "Pemex's finances, and whether to let private investment into oil and electricity." },
    { id: "us_relations", name: "Migration and the US", blurb: "The Sensenbrenner bill, the spring migrant marches in US cities and remittances sent home." },
  ],
  "2000": [
    { id: "democracy", name: "Change", blurb: "Ending 71 years of PRI rule, in the first presidential vote run by a fully independent IFE." },
    { id: "economy_jobs", name: "Economy and jobs", blurb: "Recovery from the 1994 peso crisis, wages that never caught up and Fox's pledge of 7 percent growth." },
    { id: "corruption", name: "Fobaproa and corruption", blurb: "The Fobaproa bank bailout that turned private debts into public ones, and graft under the PRI." },
    { id: "security", name: "Crime", blurb: "Kidnappings and street crime that had soared in Mexico City since the 1995 crisis." },
    { id: "poverty", name: "Poverty and Chiapas", blurb: "Progresa cash transfers, the poor south and Fox's promise to settle Chiapas in fifteen minutes." },
    { id: "us_relations", name: "NAFTA and migration", blurb: "Six years of NAFTA, factory jobs on the border and migrants crossing north." },
    { id: "energy", name: "Pemex and electricity", blurb: "Zedillo's failed 1999 bid to open electricity to private firms, and the future of Pemex." },
  ],
};
