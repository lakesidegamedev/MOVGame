// Per-election issues for New Zealand: what each campaign was argued about, named
// as voters named it at the time. Attached to the bundle in ../newZealand.ts.
import type { CountryIssueDef } from "@engine/countryGame";

export const NZ_ELECTION_ISSUES: Record<string, CountryIssueDef[]> = {
  "2023": [
    { id: "cost_of_living", name: "Cost of living", blurb: "Food inflation that peaked above 12%, mortgage rates near 7%, and Labour's plan to take GST off fruit and vegetables." },
    { id: "economy_tax", name: "Tax cuts", blurb: "National's income tax relief, paid for partly by a foreign buyer tax, and Labour ruling out a wealth tax." },
    { id: "crime", name: "Law & order", blurb: "Ram raids, gang patches and National's military-style academies for serious young offenders." },
    { id: "health", name: "Health", blurb: "Nurse and doctor shortages, emergency department waits, and the DHBs merged into Te Whatu Ora." },
    { id: "treaty", name: "Co-governance", blurb: "Three Waters, the Māori Health Authority and ACT's call for a referendum on the Treaty principles." },
    { id: "housing", name: "Housing", blurb: "Prices off their peak but rents rising, and National's plan to restore interest deductions for landlords." },
    { id: "climate", name: "Climate & the floods", blurb: "Cyclone Gabrielle and the Auckland floods, and plans to price farm emissions." },
  ],
  "2020": [
    { id: "covid", name: "COVID-19 response", blurb: "The second Auckland lockdown, managed isolation at the border and the elimination strategy." },
    { id: "economy_tax", name: "Economy & recovery", blurb: "The deepest recession in decades, wage subsidies, and a new 39% tax rate on income over $180,000." },
    { id: "housing", name: "Housing", blurb: "Record house prices despite the pandemic, and KiwiBuild's missed targets." },
    { id: "health", name: "Health", blurb: "Cancer drug funding, mental health services and hospital waiting lists." },
    { id: "referendums", name: "Cannabis & euthanasia votes", blurb: "Two referendums on the same ballot: legal recreational cannabis and the End of Life Choice Act." },
    { id: "climate", name: "Climate & environment", blurb: "The Zero Carbon Act's targets, new freshwater rules for farmers, and the Green School grant row." },
  ],
  "2017": [
    { id: "housing", name: "Housing crisis", blurb: "Auckland prices, families living in cars and motels, and Labour's KiwiBuild plan for 100,000 homes." },
    { id: "economy_tax", name: "Tax", blurb: "National's families package of tax cuts, against Labour's tax working group and fears of a capital gains tax." },
    { id: "child_poverty", name: "Child poverty", blurb: "Children in cold, damp homes, and Ardern's pledge to make cutting child poverty her mission." },
    { id: "health", name: "Health", blurb: "Underfunded hospitals, mental health waits and the cost of seeing a GP." },
    { id: "climate", name: "Clean rivers & water", blurb: "Swimmable rivers, dairy pollution and Labour's proposed royalty on water used for irrigation." },
    { id: "immigration", name: "Immigration", blurb: "Record net migration of about 72,000 a year, and Labour and NZ First promises to cut it." },
  ],
};
