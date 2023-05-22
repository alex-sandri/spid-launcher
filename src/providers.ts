import { Page } from 'puppeteer';
import { ConfEntry } from './conf.js';

export type Provider = {
  signIn: (page: Page, credentials: ConfEntry) => Promise<void>,
};

export type ProviderName = 'posteid';

export const providers: { [key in ProviderName]: Provider } = {
  posteid: {
    async signIn(page, credentials) {
      const usernameSelector = '#username';
      const passwordSelector = '#password';
      const signInButtonSelector = 'button[type=submit]';

      await page.waitForSelector(usernameSelector);
      await page.type(usernameSelector, credentials.username);

      await page.waitForSelector(passwordSelector);
      await page.type(passwordSelector, credentials.password);

      await page.waitForSelector(signInButtonSelector);

      await Promise.all([
        page.waitForNavigation(),
        page.click(signInButtonSelector),
      ]);
    },
  },
};
