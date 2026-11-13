// Per-election issues for Ireland: what each campaign was argued about, named as
// voters named it at the time. Attached to the bundle in ../ireland.ts.
import type { CountryIssueDef } from "@engine/countryGame";

export const IE_ELECTION_ISSUES: Record<string, CountryIssueDef[]> = {
  "2024": [
    { id: "housing", name: "Housing", blurb: "Rents, over 14,000 people in emergency accommodation, and rival targets for homes built each year." },
    { id: "cost_of_living", name: "Cost of living", blurb: "Energy bills, childcare and grocery prices, after a budget of once-off payments and credits." },
    { id: "health", name: "Health", blurb: "Trolley counts, waiting lists, and services for children with disabilities." },
    { id: "immigration", name: "Immigration", blurb: "Asylum seekers sleeping rough, protests at sites such as Coolock, and calls for tighter controls." },
    { id: "tax_spending", name: "The Apple money", blurb: "What to do with €14 billion from the Apple tax ruling, and how to spend a large budget surplus." },
    { id: "climate", name: "Climate", blurb: "The carbon tax, retrofit grants, and whether the Greens' climate targets would survive them." },
  ],
  "2020": [
    { id: "housing", name: "Housing & rents", blurb: "Record rents, about 10,000 people in emergency accommodation, and young people unable to buy." },
    { id: "health", name: "Health", blurb: "Record trolley numbers, long waiting lists and the overspend on the new National Children's Hospital." },
    { id: "pension_age", name: "Pension age", blurb: "The State pension age rising to 67 in 2021, leaving people who retire at 65 on jobseeker's benefit." },
    { id: "brexit_unity", name: "Brexit & the border", blurb: "The UK's exit on 31 January, the Northern Ireland protocol, and Sinn Féin's push for a border poll." },
    { id: "cost_of_living", name: "Cost of living", blurb: "Childcare costs, and insurance premiums that kept rising for motorists and businesses." },
    { id: "climate", name: "Climate action", blurb: "The carbon tax raised to €26 a tonne, and the Greens' call to cut emissions by 7% a year." },
    { id: "tax_spending", name: "Tax & spending", blurb: "Fine Gael's USC cuts, against Sinn Féin plans to tax high earners and abolish the property tax." },
  ],
  "2016": [
    { id: "water_charges", name: "Water charges", blurb: "Irish Water, the bills and the Right2Water protests, with Fianna Fáil now promising to suspend charges." },
    { id: "health", name: "Health service", blurb: "Record trolley numbers in A&E, long waiting lists, and the shelved plan for universal health insurance." },
    { id: "housing", name: "Homelessness & rents", blurb: "Families in hotel rooms, Dublin rents rising about 10% a year, and too few houses being built." },
    { id: "tax_spending", name: "The recovery & the USC", blurb: "How to use the 'fiscal space', cuts to the universal social charge, and 'keep the recovery going'." },
    { id: "cost_of_living", name: "Cost of living", blurb: "Childcare, insurance and household charges after years of austerity." },
    { id: "reform", name: "Political reform", blurb: "Promises of Dáil reform after a government with a huge majority that guillotined its bills." },
  ],
  "2011": [
    { id: "bailout", name: "The bailout & the banks", blurb: "The €85 billion EU-IMF deal, the 2008 bank guarantee, and whether to burn the bondholders." },
    { id: "tax_spending", name: "Austerity", blurb: "€15 billion of cuts and tax rises planned to 2014: how fast, and who would bear them." },
    { id: "jobs", name: "Jobs & emigration", blurb: "Unemployment above 14%, and young people leaving again for Australia, Canada and Britain." },
    { id: "reform", name: "Political reform", blurb: "Abolishing the Seanad, a smaller Dáil, and an end to the politics that led to the crash." },
    { id: "health", name: "Health service", blurb: "Trolleys, two-tier access, and Fine Gael's plan for universal health insurance." },
    { id: "cost_of_living", name: "Pay & household bills", blurb: "Pay cuts, the new universal social charge on every payslip, and rising household bills." },
    { id: "housing", name: "Mortgages & ghost estates", blurb: "Homeowners in negative equity and arrears after the property crash, and empty ghost estates." },
  ],
  "2007": [
    { id: "health", name: "Health", blurb: "Trolleys in hospital corridors and the parties' promises of so many more hospital beds." },
    { id: "crime", name: "Crime", blurb: "Gang violence and the parties' promises of so many more gardaí." },
    { id: "economy", name: "The economy", blurb: "A long boom, rising house prices and the question of who can keep it going." },
    { id: "integrity", name: "Ahern & the Mahon Tribunal", blurb: "Evidence about the Taoiseach's finances in 1994, and whether he is fit to serve." },
    { id: "education", name: "Education", blurb: "Class sizes and the parties' promises on pupil-teacher ratios." },
    { id: "alliance", name: "Alliance for Change", blurb: "Fine Gael and Labour's pre-election pact against the Fianna Fáil and Progressive Democrat government." },
  ],
};
