import { scrapeVikAlerts } from './vik';
import { scrapePowerOutages } from './erm';

export const scrapers = {
  vik: scrapeVikAlerts,
  erm: scrapePowerOutages
};