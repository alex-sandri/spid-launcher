import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProviderName } from './providers.js';
import { fileURLToPath } from 'node:url';

type Conf = { [key in ProviderName]?: ConfEntry }

export type ConfEntry = {
  username: string;
  password: string;
}

const confLocation = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'spid.conf',
);

export const parseConf = async (): Promise<Conf> => {
  try {
    const conf = await fs.readFile(confLocation, 'utf-8');

    return JSON.parse(conf);
  } catch (_) {
    return {};
  }
}

export const saveConf = async (
  provider: ProviderName,
  username: string,
  password: string,
): Promise<void> => {
  const currentConf = await parseConf();

  const conf = {
    ...currentConf,
    [provider]: { username, password },
  };

  await fs.writeFile(confLocation, JSON.stringify(conf), 'utf-8');
}
