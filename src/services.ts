import { ElementHandle, Page } from 'puppeteer';
import { ProviderName, providers } from './providers.js';
import { ConfEntry } from './conf.js';

type Service = {
  url: string;
  resolver: (
    page: Page, 
    service: string,
    provider: ProviderName,
    credentials: ConfEntry,
  ) => Promise<void>;
}

const defaultServiceResolver = async (
  page: Page,
  serviceName: string,
  providerName: ProviderName,
  credentials: ConfEntry,
): Promise<void> => {
  const selector = `.spid-idp-button-link[data-idp=${providerName}] > a`;

  const handle = await page.waitForSelector(selector) as ElementHandle<HTMLButtonElement> | null;

  if (handle === null) {
    throw `service "${serviceName}" does not support signing in with provider "${providerName}"`;
  }

  await Promise.all([
    page.waitForNavigation(),
    handle.evaluate((button) => button.click()),
  ]);

  {
    const provider = providers[providerName];
    await provider.signIn(page, credentials);
  }
}

export const services: { [key: string]: Service } = {
  'concorsi.difesa': {
    url: 'https://spid.difesa.it/SPIDLogin/',
    resolver: defaultServiceResolver,
  },
  'concorsi.gdf.gov': {
    url: 'https://gdf.spidgateway.infocert.it/gateway/login?TARGET=https%3a%2f%2fconcorsi.gdf.gov.it%2fSso%2fSpid',
    resolver: defaultServiceResolver,
  },
  'sanitakmzero.azero.veneto': {
    url: 'https://sanitakmzero.azero.veneto.it/',
    resolver: defaultServiceResolver,
  },
  'spidmail.namirial': {
    url: 'https://spidmail.namirial.it/',
    async resolver(page, service, provider, credentials) {
      const signInButtonSelector = 'button[type=submit]';

      const handle = await page.waitForSelector(signInButtonSelector) as ElementHandle<HTMLButtonElement> | null;

      if (handle === null) {
        throw 'could not sign in';
      }

      await Promise.all([
        page.waitForNavigation(),
        handle.evaluate((button) => button.click()),
      ]);

      return defaultServiceResolver(page, service, provider, credentials);
    },
  },
};
