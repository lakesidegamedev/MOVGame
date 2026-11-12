// Per-election issues for India: what each Lok Sabha campaign was argued about,
// named as voters named it at the time. Attached to the bundle in ../india.ts.
import type { CountryIssueDef } from "@engine/countryGame";

export const IN_ELECTION_ISSUES: Record<string, CountryIssueDef[]> = {
  "2024": [
    { id: "jobs", name: "Unemployment", blurb: "Youth joblessness, leaked recruitment exam papers and the four-year Agnipath army scheme." },
    { id: "identity", name: "Ram temple and religion", blurb: "The Ayodhya temple consecrated in January, and Modi's April speeches on Congress, wealth and Muslims." },
    { id: "institutions", name: "Save the Constitution", blurb: "Opposition claims that 400 seats would let the BJP rewrite the Constitution and end reservations." },
    { id: "inflation", name: "Price rise", blurb: "Food inflation near 8.7 percent in April and the cost of pulses, vegetables and cooking gas." },
    { id: "welfare", name: "Free ration and cash", blurb: "Free grain for 800 million people extended for five years, and Congress's pledge of 1 lakh a year to poor women." },
    { id: "caste", name: "Caste census", blurb: "Rahul Gandhi's call for a national caste count after Bihar's 2023 survey, and the 50 percent quota cap." },
    { id: "corruption", name: "Electoral bonds and raids", blurb: "The Supreme Court striking down electoral bonds, and the arrests of Kejriwal and Hemant Soren." },
    { id: "growth", name: "Viksit Bharat", blurb: "Modi's goal of a developed India by 2047, growth above 7 percent and new roads, railways and airports." },
  ],
  "2019": [
    { id: "security", name: "Pulwama and Balakot", blurb: "The February bombing that killed 40 CRPF personnel and the air strike on Balakot that followed." },
    { id: "jobs", name: "Unemployment", blurb: "A leaked NSSO survey putting unemployment at 6.1 percent, a 45-year high, which the government disputed." },
    { id: "welfare", name: "Farmers and NYAY", blurb: "Low crop prices, PM-KISAN's 6,000 rupees a year to small farmers and Congress's NYAY income pledge." },
    { id: "corruption", name: "Rafale deal", blurb: "The 'chowkidar chor hai' charge over the fighter jet deal and the 'main bhi chowkidar' reply." },
    { id: "growth", name: "Demonetisation and GST", blurb: "The 2016 note ban and the 2017 GST rollout: reform to some, a blow to small traders to others." },
    { id: "identity", name: "Religion and citizenship", blurb: "The Ram temple dispute, the Citizenship Amendment Bill, a national citizens' register and the new EWS quota." },
    { id: "federalism", name: "Andhra special status", blurb: "Andhra Pradesh's demand for special category status, which took the TDP out of the NDA in 2018." },
  ],
  "2014": [
    { id: "corruption", name: "Scams", blurb: "The 2G spectrum, coal block and Commonwealth Games scandals, and the Lokpal law passed in December 2013." },
    { id: "inflation", name: "Price rise", blurb: "Years of high food inflation, onions at 80 rupees a kilo in late 2013 and dearer diesel and gas." },
    { id: "growth", name: "Development", blurb: "Growth below 5 percent, stalled projects and Modi's record as chief minister of Gujarat." },
    { id: "jobs", name: "Jobs for the young", blurb: "About 100 million first-time voters, and who could create work for them." },
    { id: "identity", name: "Communal and caste politics", blurb: "The 2013 Muzaffarnagar riots, Modi's 2002 Gujarat record and caste arithmetic in UP and Bihar." },
    { id: "federalism", name: "Telangana", blurb: "The February law splitting Andhra Pradesh, and anger on both sides of the new border." },
    { id: "welfare", name: "Food security", blurb: "The National Food Security Act of 2013 and the rural jobs guarantee as Congress's record." },
  ],
  "2009": [
    { id: "welfare", name: "Loan waiver and NREGA", blurb: "The 2008 farm loan waiver of over 60,000 crore rupees and the rural jobs guarantee in every district." },
    { id: "security", name: "Terror after 26/11", blurb: "The November 2008 Mumbai attacks and the BJP's charge that the UPA was soft on terror." },
    { id: "growth", name: "Global slowdown", blurb: "Growth down from 9 percent to under 7 after the 2008 crash, and job losses in exports." },
    { id: "inflation", name: "Price rise", blurb: "Food prices still climbing, though headline inflation fell from 12.9 percent in August 2008 to near zero." },
    { id: "identity", name: "Communal politics", blurb: "Varun Gandhi's Pilibhit speech, the 2008 Kandhamal violence and the Ram temple in the BJP manifesto." },
    { id: "nuclear_deal", name: "Nuclear deal", blurb: "The civil nuclear agreement with the United States that cost Singh the Left's support in July 2008." },
    { id: "corruption", name: "Black money", blurb: "Advani's pledge to bring back Indian money held in Swiss banks, and the 2008 cash-for-votes scandal." },
    { id: "federalism", name: "Telangana demand", blurb: "The TRS demand for a separate Telangana state, which brought it into the TDP's grand alliance." },
  ],
};
