// Maps supplier-invoice categories to the standard Danish chart of accounts.
// Each entry: [account_number, account_name, vat_code]
export const CATEGORY_ACCOUNT_MAP = {
  Materialer: ['4000', 'Varekøb', 'kob25'],
  Maskiner: ['1590', 'Maskiner og inventar', 'none'],
  Transport: ['7200', 'Transport og kørsel', 'kob25'],
  Lønninger: ['5000', 'Lønninger', 'none'],
  Brændstof: ['7500', 'Brændstof', 'kob25'],
  Forsikring: ['6200', 'Forsikring', 'kob25'],
  Værktøj: ['7300', 'Værktøj', 'kob25'],
  Kontor: ['7600', 'Øvrige driftsomkostninger', 'none'],
  Markedsføring: ['7000', 'Markedsføring', 'kob25'],
  Andet: ['7600', 'Øvrige driftsomkostninger', 'none'],
};

export const CREDITOR_ACCOUNT = ['2000', 'Kreditorer'];
export const INPUT_VAT_ACCOUNT = ['4200', 'Moms af køb (indgående)'];

export function accountForCategory(category) {
  return CATEGORY_ACCOUNT_MAP[category] || CATEGORY_ACCOUNT_MAP.Andet;
}