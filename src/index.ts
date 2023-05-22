import { Argument, Option, program } from 'commander';
import inquirer from 'inquirer';
import { parseConf, saveConf } from './conf.js';
import { ProviderName, providers } from './providers.js';

const options = {
  provider: (mandatory: boolean) => new Option('--provider <value>')
    .choices(Object.keys(providers))
    .makeOptionMandatory(mandatory),
} as const;

program
  .command('signin')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select the provider:',
        choices: Object.keys(providers),
      },
      {
        type: 'input',
        name: 'username',
        message: 'Enter your username:',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
      },
    ]);

    const { provider, username, password } = answers;

    await saveConf(provider, username, password);
  });

program
  .command('launch')
  .addOption(options.provider(false))
  .addArgument(new Argument('service').argRequired())
  .action(async (serviceName, options) => {
    const conf = await parseConf();

    const providerName: ProviderName | undefined = options.provider
      ?? Object.keys(conf)[0];

    if (providerName === undefined) {
      return program.error(`could not find any credentials, please sign in first`);
    }

    const credentials = conf[providerName];

    if (credentials === undefined) {
      return program.error(`could not find credentials for provider "${providerName}"`);
    }

    const { services } = await import('./services.js');

    const service = services[serviceName];

    if (service === undefined) {
      return program.error(`service "${serviceName}" is not supported`);
    }

    {
      const puppeteer = await import('puppeteer');

      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--incognito', '--start-maximized'],
      });

      {
        const page = (await browser.pages())[0];

        if (page === undefined) {
          return program.error(`could not launch browser`);
        }

        await page.goto(service.url);

        try {
          await service.resolver(page, serviceName, providerName, credentials);
        } catch (e) {
          if (typeof e === 'string') {
            program.error(e);
          }
        } finally {
          browser.disconnect();
        }
      }
    }
  });

program
  .addHelpCommand()
  .parse();
