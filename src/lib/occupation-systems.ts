// VisaCheck occupation classification systems per country.
// Each country uses a different system — we must ask the right question.
// Pure data module — no I/O, no React, no storage.

export interface OccupationSystem {
  countryCode: string;
  systemName: string;
  codeLabel: string;
  codeHint: string;
  codePlaceholder: string;
  lookupUrl: string;
}

export const OCCUPATION_SYSTEMS: OccupationSystem[] = [
  {
    countryCode: 'GB',
    systemName: 'SOC 2021 (Standard Occupational Classification)',
    codeLabel: 'SOC 2021 code',
    codeHint: '4-digit occupation code from the UK Immigration Salary Addendum',
    codePlaceholder: 'e.g. 2133',
    lookupUrl: 'https://www.gov.uk/government/publications/skilled-worker-visa-eligible-occupations-and-codes',
  },
  {
    countryCode: 'US',
    systemName: 'O*NET-SOC',
    codeLabel: 'O*NET-SOC code',
    codeHint: 'Occupational code from the US Department of Labor O*NET database',
    codePlaceholder: 'e.g. 15-1252',
    lookupUrl: 'https://www.onetonline.org/',
  },
  {
    countryCode: 'CA',
    systemName: 'NOC 2021 (National Occupational Classification)',
    codeLabel: 'NOC 2021 code',
    codeHint: '5-digit code from Canada\'s National Occupational Classification',
    codePlaceholder: 'e.g. 21232',
    lookupUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/submit-application/teer-categories/noc.html',
  },
  {
    countryCode: 'AU',
    systemName: 'ANZSCO (Australian and New Zealand Standard Classification of Occupations)',
    codeLabel: 'ANZSCO code',
    codeHint: '6-digit occupation code from ANZSCO',
    codePlaceholder: 'e.g. 261312',
    lookupUrl: 'https://www.abs.gov.au/statistics/classifications/anzsco-australian-and-new-zealand-standard-classification-occupations',
  },
  {
    countryCode: 'DE',
    systemName: 'BAMF qualification assessment',
    codeLabel: 'Occupation (ISCO-08)',
    codeHint: 'Your occupation title — Germany uses ISCO-08 for recognition',
    codePlaceholder: 'e.g. Software Developer',
    lookupUrl: 'https://www.anerkennung-in-deutschland.de/html/en/index.html',
  },
  {
    countryCode: 'AE',
    systemName: 'MoHRE occupation classification',
    codeLabel: 'Occupation title',
    codeHint: 'Your job title — UAE Ministry of Human Resources classifies by profession',
    codePlaceholder: 'e.g. Software Engineer',
    lookupUrl: 'https://www.mohre.gov.ae/en/services/issue-work-permit.aspx',
  },
  {
    countryCode: 'SG',
    systemName: 'SSOC (Singapore Standard Occupational Classification)',
    codeLabel: 'SSOC code',
    codeHint: '5-digit code from Singapore\'s occupational classification',
    codePlaceholder: 'e.g. 21212',
    lookupUrl: 'https://www.singstat.gov.sg/publications/reference/standard-classifications/ssoc',
  },
  {
    countryCode: 'NZ',
    systemName: 'ANZSCO (shared with Australia)',
    codeLabel: 'ANZSCO code',
    codeHint: '6-digit occupation code from ANZSCO — shared NZ/AU system',
    codePlaceholder: 'e.g. 261312',
    lookupUrl: 'https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/tools-and-information/work-and-employment/anzco',
  },
  {
    countryCode: 'IE',
    systemName: 'Irish occupation classification',
    codeLabel: 'Occupation title',
    codeHint: 'Your job title — Ireland classifies by occupation for Critical Skills permits',
    codePlaceholder: 'e.g. Software Developer',
    lookupUrl: 'https://enterprise.gov.ie/en/What-We-Do/Workplace-Skills/Employment-Permits/Employment-Permit-Types/Critical-Skills-Employment-Permit/',
  },
];

export function getOccupationSystem(countryCode: string): OccupationSystem | null {
  const code = countryCode.trim().toUpperCase();
  return OCCUPATION_SYSTEMS.find((s) => s.countryCode === code) ?? null;
}
