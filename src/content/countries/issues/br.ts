// Per-election issues for Brazil: what each runoff was argued about, named as
// voters named it at the time. Attached to the bundle in ../brazil.ts.
import type { CountryIssueDef } from "@engine/countryGame";

export const BR_ELECTION_ISSUES: Record<string, CountryIssueDef[]> = {
  "2022": [
    { id: "economy_jobs", name: "Hunger and prices", blurb: "Inflation near 12 percent in the spring, fuel prices, and a survey counting 33 million Brazilians going hungry." },
    { id: "social", name: "Auxílio Brasil", blurb: "The cash transfer raised to 600 reais in August, and whether it would stay at 600 in 2023." },
    { id: "democracy", name: "Voting machines and democracy", blurb: "Bolsonaro's doubts about the electronic ballot, his July talk to ambassadors and his clashes with the courts." },
    { id: "values", name: "Religion and family", blurb: "Abortion, drugs and church rumours, with both campaigns courting evangelical voters." },
    { id: "corruption", name: "Corruption", blurb: "Lula's annulled Lava Jato convictions against the secret budget amendments handed out in Congress." },
    { id: "security", name: "Guns and crime", blurb: "Decrees that multiplied gun licences for hunters and collectors, and what to do about violent crime." },
    { id: "pandemic", name: "Pandemic record", blurb: "Close to 690,000 COVID deaths, the delayed vaccine purchases and the Senate inquiry's findings." },
    { id: "environment", name: "Amazon", blurb: "Deforestation at a 15-year high and the June killings of Bruno Pereira and Dom Phillips in the Javari valley." },
  ],
  "2018": [
    { id: "security", name: "Crime and violence", blurb: "A record of more than 60,000 killings in 2017, the army in charge of Rio's security and calls to arm citizens." },
    { id: "corruption", name: "Lava Jato", blurb: "Lula jailed in April and barred from running, and the PT's record in the Petrobras scandal." },
    { id: "economy_jobs", name: "Unemployment", blurb: "Around 12 million people out of work after the 2015 to 2016 recession, and a slow recovery." },
    { id: "democracy", name: "Democracy", blurb: "Whether Bolsonaro's praise for the 1964 to 1985 military regime was a threat, and fake news on WhatsApp." },
    { id: "values", name: "Family and values", blurb: "Gender teaching in schools, the false 'gay kit' claim and the women's 'Ele não' protests." },
    { id: "social", name: "Bolsa Família", blurb: "PT warnings of cuts against Bolsonaro's promise of a 13th Bolsa Família payment each year." },
    { id: "public_finances", name: "Pension reform", blurb: "Temer's stalled pension reform, the spending cap and Paulo Guedes's plan to sell state firms." },
  ],
  "2014": [
    { id: "corruption", name: "Petrobras scandal", blurb: "Plea-deal testimony from a former Petrobras director on kickbacks from refinery contracts to parties." },
    { id: "economy_jobs", name: "Growth and inflation", blurb: "A technical recession in the first half and inflation above the 6.5 percent ceiling of the target." },
    { id: "social", name: "Bolsa Família", blurb: "PT warnings that the opposition would cut the cash transfer, and Aécio's bill to write it into law." },
    { id: "public_finances", name: "Central bank and budget", blurb: "Central bank independence, pushed by Marina Silva, and Aécio's choice of Armínio Fraga for finance." },
    { id: "public_services", name: "Health, schools and fares", blurb: "The demands of the June 2013 protests: bus fares, hospitals, schools and World Cup stadium spending." },
    { id: "security", name: "Crime", blurb: "More than 50,000 killings a year and the debate on trying older teenagers as adults for violent crimes." },
    { id: "water", name: "São Paulo water crisis", blurb: "The Cantareira reservoirs near empty after a drought, and how the state water company managed it." },
  ],
  "2010": [
    { id: "values", name: "Abortion and religion", blurb: "Rousseff's past remarks on abortion, warnings from church pulpits and her pledge not to change the law." },
    { id: "economy_jobs", name: "Growth and jobs", blurb: "Growth heading for 7 percent after the 2009 dip, record formal hiring and easy credit." },
    { id: "social", name: "Bolsa Família and wages", blurb: "The Lula years' cash transfers and minimum wage rises, and Serra's offer of a 600 real minimum wage." },
    { id: "health", name: "Public health", blurb: "Queues in the public health system, Serra's record on generic drugs and Rousseff's 24-hour clinics." },
    { id: "corruption", name: "Corruption", blurb: "Erenice Guerra's September resignation as chief of staff over her relatives' lobbying." },
    { id: "state", name: "Pre-salt and privatisation", blurb: "Who controls the pre-salt oil fields, the Petrobras share sale and the PSDB's privatisation record." },
    { id: "security", name: "Crime and crack", blurb: "Crack cocaine spreading through the cities and the police pacification units in Rio's favelas." },
  ],
  "2006": [
    { id: "corruption", name: "Mensalão and the dossier", blurb: "The 2005 cash-for-votes scheme and the PT aides caught with cash to buy a dossier on PSDB candidates." },
    { id: "state", name: "Privatisation", blurb: "PT warnings that Alckmin would sell Petrobras, Banco do Brasil and the Caixa, which he denied." },
    { id: "social", name: "Bolsa Família", blurb: "About 11 million families on the cash transfer and a minimum wage raised to 350 reais in April." },
    { id: "economy_jobs", name: "Growth and jobs", blurb: "Inflation down near 3 percent but growth trailing the region, and who would speed it up." },
    { id: "public_finances", name: "Taxes and spending", blurb: "Alckmin's 'management shock' to cut spending and the tax burden, against the PT's record." },
    { id: "security", name: "PCC attacks", blurb: "The PCC gang's May wave of attacks on police and buses in São Paulo, and who answered for its prisons." },
  ],
  "2002": [
    { id: "economy_jobs", name: "Unemployment", blurb: "Joblessness, falling pay and the 2001 power rationing that slowed the economy." },
    { id: "public_finances", name: "The real and the IMF", blurb: "The real near 4 to the dollar, a 30 billion dollar IMF loan and Lula's pledge to honour the debt." },
    { id: "social", name: "Hunger and poverty", blurb: "Lula's Zero Hunger plan against the government's Bolsa Escola and other cash transfers." },
    { id: "security", name: "Violence", blurb: "Kidnappings, the January murder of Santo André's mayor Celso Daniel and the drug gangs of Rio." },
    { id: "state", name: "Privatisation record", blurb: "The 1990s sales of Vale and the Telebras companies, and whether more state firms should follow." },
    { id: "corruption", name: "Corruption", blurb: "The cash found in the Lunus raid that ended Roseana Sarney's run, and old charges from the 1990s." },
  ],
};
