// Per-election issues for Spain: what each campaign was argued about, named as
// voters named it at the time. Attached to the bundle in ../spain.ts.
import type { CountryIssueDef } from "@engine/countryGame";

export const ES_ELECTION_ISSUES: Record<string, CountryIssueDef[]> = {
  "2023": [
    { id: "prices", name: "Prices & mortgages", blurb: "Food prices up sharply despite the VAT cut on basics, and a rising Euribor lifting variable mortgages." },
    { id: "housing", name: "Housing", blurb: "Spain's first housing law, passed in May, with rent caps in stressed areas and young people priced out." },
    { id: "catalonia", name: "Pardons & sedition", blurb: "The 2021 pardons, the repeal of the sedition offence and the government's reliance on ERC and Bildu." },
    { id: "services", name: "Health care", blurb: "Waits for a family doctor, primary care strikes and staff shortages after the pandemic." },
    { id: "alliances", name: "Pacts with Vox", blurb: "The PP's new regional deals with Vox in Valencia and Extremadura, and what a Feijóo government would need." },
    { id: "pensions", name: "Pensions", blurb: "The March reform tying pensions to prices and raising contributions on higher salaries." },
    { id: "jobs", name: "Labour reform", blurb: "The 2021 labour reform against temporary contracts, and a minimum wage of 1,080 euros." },
    { id: "equality", name: "Only yes means yes law", blurb: "Sentence cuts for hundreds of sex offenders under the consent law, amended in April." },
  ],
  "2019": [
    { id: "catalonia", name: "Catalonia", blurb: "The Supreme Court trial of the 2017 leaders and the row over a 'rapporteur' in talks with Torra." },
    { id: "jobs", name: "Jobs & wages", blurb: "The minimum wage raised to 900 euros, unemployment near 15 percent and temporary contracts." },
    { id: "pensions", name: "Pensions", blurb: "Pensions linked to prices again after the 2018 pensioners' protests." },
    { id: "housing", name: "Rents", blurb: "Rents rising fast in Madrid and Barcelona, and the March decree on rental contracts." },
    { id: "immigration", name: "Immigration", blurb: "Record sea arrivals in 2018 and Vox's call for walls around Ceuta and Melilla." },
    { id: "equality", name: "Feminism", blurb: "The March 8 strikes, the 'Manada' case and Vox's call to repeal the gender violence law." },
    { id: "corruption", name: "Corruption", blurb: "The Gürtel ruling that brought down Rajoy in 2018 and the PP's new leadership." },
  ],
  "2015": [
    { id: "jobs", name: "Unemployment", blurb: "Unemployment down to 21 percent, but new jobs mostly temporary and low paid after the 2012 labour reform." },
    { id: "corruption", name: "Corruption", blurb: "Bárcenas's secret ledgers, the Gürtel and Púnica investigations and Andalusia's ERE case." },
    { id: "renewal", name: "The new politics", blurb: "Podemos and Citizens against the two-party system, with promises of electoral and party reform." },
    { id: "austerity", name: "Cuts & recovery", blurb: "Growth above 3 percent against the cuts, the VAT rise to 21 percent and the 2012 bank rescue." },
    { id: "catalonia", name: "Catalonia", blurb: "The September Catalan vote and the November resolution to begin secession, annulled by the court." },
    { id: "services", name: "Health & education", blurb: "Health cuts, the 2012 prescription charges and the LOMCE education law." },
    { id: "pensions", name: "Pensions", blurb: "The pension reserve fund being drawn down and rises held to 0.25 percent a year." },
  ],
  "2011": [
    { id: "jobs", name: "Unemployment", blurb: "Nearly five million out of work, over 21 percent, and youth unemployment above 45 percent." },
    { id: "austerity", name: "Cuts & the risk premium", blurb: "A risk premium near 500 points, the deficit cap written into the Constitution and where the next cuts fall." },
    { id: "services", name: "Health & education", blurb: "Regional cuts to hospitals and schools, from Catalonia to Castilla-La Mancha and Madrid." },
    { id: "renewal", name: "15-M & reform", blurb: "The indignados' call for a fairer electoral law and politicians who answer to voters." },
    { id: "pensions", name: "Pensions", blurb: "The 2011 reform raising the retirement age to 67, and this year's freeze on most pensions." },
    { id: "security", name: "The end of ETA", blurb: "ETA's October announcement that its violence is over, and the Basque nationalist left back on the ballot." },
    { id: "corruption", name: "Gürtel", blurb: "The Gürtel case and Camps's resignation as president of Valencia in July." },
  ],
};
