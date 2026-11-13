// Per-election issues for Japan: what each House of Representatives campaign
// was argued about, named as voters named it at the time. Attached to the
// bundle in ../japan.ts.
import type { CountryIssueDef } from "@engine/countryGame";

export const JP_ELECTION_ISSUES: Record<string, CountryIssueDef[]> = {
  "2026": [
    { id: "economy", name: "Prices and take-home pay", blurb: "Rice and food prices outpacing pay, a weak yen and the higher tax-free income threshold." },
    { id: "security", name: "China and defence", blurb: "Beijing's anger at Takaichi's November remarks on a Taiwan emergency, and faster defence spending." },
    { id: "consumption_tax", name: "Consumption tax on food", blurb: "Rival pledges to cut the 8 percent consumption tax on food, and how to pay for it." },
    { id: "foreigners", name: "Foreign residents", blurb: "Rules for foreign residents, tourists and land purchases, pushed up the agenda by Sanseito's 2025 gains." },
    { id: "pensions", name: "Social insurance", blurb: "Pension levels and the social insurance premiums taken out of workers' pay." },
    { id: "politics_money", name: "Politics and money", blurb: "Komeito's exit from the coalition over the slush funds, and limits on corporate donations." },
    { id: "diet_reform", name: "Cutting Diet seats", blurb: "Ishin's price for backing Takaichi: a cut of about a tenth in the number of lower house seats." },
  ],
  "2024": [
    { id: "politics_money", name: "Slush fund scandal", blurb: "Faction fundraising kickbacks kept off the books, and the twelve members the LDP refused to endorse." },
    { id: "economy", name: "Prices and take-home pay", blurb: "Rice and food prices rising faster than wages, and the 1.03 million yen income wall." },
    { id: "childcare", name: "Children and the birth rate", blurb: "Kishida's 3.6 trillion yen plan for children and the new support levy added to health insurance." },
    { id: "security", name: "Defence spending", blurb: "Doubling defence spending to 2 percent of GDP by 2027, and how to pay for it." },
    { id: "pensions", name: "Social security", blurb: "Pensions for an ageing population and the December switch from paper health cards to My Number cards." },
    { id: "reconstruction", name: "Noto recovery", blurb: "Rebuilding on the Noto peninsula after the New Year's Day earthquake and the September floods." },
  ],
  "2021": [
    { id: "covid", name: "COVID-19 response", blurb: "The fifth wave that overwhelmed hospitals in August, the vaccine rollout and the Olympic summer." },
    { id: "economy", name: "Wages and 'new capitalism'", blurb: "Kishida's pledge to share the gains of growth with workers, and cash support for pandemic losses." },
    { id: "security", name: "China and defence", blurb: "Pressure on Taiwan, North Korean missiles and an LDP pledge with 2 percent of GDP for defence in mind." },
    { id: "politics_money", name: "Politics and money", blurb: "Abe's cherry blossom dinners, the Moritomo files and a former justice minister's vote-buying conviction." },
    { id: "childcare", name: "Cash for children", blurb: "Komeito's 100,000 yen for every child under 18, and wider handouts promised by most parties." },
    { id: "consumption_tax", name: "Consumption tax cut", blurb: "Opposition calls to cut the 10 percent tax to 5 percent for a time." },
    { id: "nuclear", name: "Energy and climate", blurb: "Reactor restarts and how to reach the 2050 carbon neutrality goal Suga set in 2020." },
  ],
  "2017": [
    { id: "security", name: "North Korea", blurb: "Missiles fired over Hokkaido in August and September, and the North's sixth nuclear test." },
    { id: "consumption_tax", name: "Consumption tax rise", blurb: "Whether the 2019 rise to 10 percent goes ahead, and Abe's plan to spend part of it on education." },
    { id: "economy", name: "Abenomics", blurb: "Record company profits and near full employment, against real wages that barely rose." },
    { id: "childcare", name: "Free education", blurb: "Abe's pledge of free preschool and childcare, and the opposition's own offers for families." },
    { id: "politics_money", name: "Moritomo and Kake", blurb: "A discounted land sale to a school operator and a vet school approved for a friend of Abe." },
    { id: "constitution", name: "Revising Article 9", blurb: "Abe's May proposal to write the Self-Defense Forces into Article 9 by 2020." },
    { id: "nuclear", name: "Nuclear phase-out", blurb: "Hope's pledge of zero nuclear power by 2030, the CDP's own exit plan and the restarts under way." },
  ],
  "2014": [
    { id: "economy", name: "Abenomics", blurb: "A recession after April's tax rise, a weaker yen and stocks at a seven-year high." },
    { id: "consumption_tax", name: "Tax rise delay", blurb: "Abe's delay of the second rise, from 8 to 10 percent, by eighteen months to April 2017." },
    { id: "security", name: "Collective self-defence", blurb: "The July cabinet decision reinterpreting Article 9, and the State Secrets Act taking effect." },
    { id: "pensions", name: "Pensions and care", blurb: "The pension fund's October shift into shares, and the elderly care costs the tax rise was meant to fund." },
    { id: "nuclear", name: "Nuclear restarts", blurb: "The Sendai reactors in Kagoshima cleared to restart, with every reactor in Japan offline since 2013." },
    { id: "trade", name: "TPP and farming", blurb: "Talks on the Trans-Pacific Partnership and protection for rice, beef and dairy." },
    { id: "okinawa", name: "Okinawa bases", blurb: "Onaga's November win for governor of Okinawa on opposition to moving Futenma to Henoko." },
  ],
  "2012": [
    { id: "economy", name: "Deflation and the yen", blurb: "Years of falling prices, a yen near 80 to the dollar and Abe's call for 2 percent inflation." },
    { id: "nuclear", name: "Nuclear power", blurb: "Reactors idle after Fukushima, the Oi restart in July and pledges to phase out nuclear in the 2030s." },
    { id: "consumption_tax", name: "Consumption tax rise", blurb: "The August law to double the tax to 10 percent by 2015, which the 2009 manifesto had ruled out." },
    { id: "security", name: "Senkaku and China", blurb: "The September purchase of the Senkaku Islands, the protests in China and the row over Takeshima." },
    { id: "reconstruction", name: "Tohoku reconstruction", blurb: "Rebuilding after the 2011 tsunami, the Fukushima evacuees and reconstruction money spent elsewhere." },
    { id: "trade", name: "TPP", blurb: "Whether to join the Trans-Pacific Partnership talks, which farm groups and many LDP members opposed." },
  ],
  "2009": [
    { id: "pensions", name: "Pension records", blurb: "Some 50 million pension records the state could not match, and the new health scheme for over-75s." },
    { id: "economy", name: "Recession and jobs", blurb: "The deepest postwar slump after the Lehman shock, temp worker layoffs and unemployment at 5.7 percent." },
    { id: "childcare", name: "Child allowance", blurb: "The Democrats' 26,000 yen a month per child, against the LDP's offer of free preschool." },
    { id: "politics_money", name: "Bureaucrats and waste", blurb: "Retired officials parachuting into public bodies, wasteful spending and Ozawa's aide's donation case." },
    { id: "consumption_tax", name: "Consumption tax", blurb: "Aso's plan to raise it once the economy recovered, against the Democrats' four-year freeze." },
    { id: "security", name: "North Korea and bases", blurb: "North Korea's May nuclear test and Hatoyama's call to move Futenma out of Okinawa." },
    { id: "trade", name: "Farm trade", blurb: "The Democrats' US free trade pledge, softened after farm protests, and income support for farmers." },
  ],
  "2005": [
    { id: "postal", name: "Postal privatisation", blurb: "Koizumi's bills to split Japan Post into four companies, and the Councillors' vote that killed them." },
    { id: "reform", name: "Koizumi's reforms", blurb: "Smaller government, fewer public works and fewer civil servants, which both big parties promise and the LDP's rural base resents." },
    { id: "economy", name: "A sluggish recovery", blurb: "A recovery that has not reached farmers, shopkeepers and builders, and the worst public finances of any rich country." },
    { id: "consumption_tax", name: "The consumption tax", blurb: "The common understanding that the tax will have to rise and temporary tax cuts will end." },
    { id: "foreign_policy", name: "Iraq, China & Yasukuni", blurb: "Troops in Iraq, Koizumi's visits to Yasukuni Shrine and Okada's pledge to bring the troops home." },
  ],
};
