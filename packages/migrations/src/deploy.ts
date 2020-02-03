import dotenv from 'dotenv';
import program from 'commander';
import path from 'path';
import fs from 'fs';

import { marketDemo } from './market';
import { deployEmptyContracts } from './deployEmpty';
import { OffChainDataSource } from '@energyweb/origin-backend-client';

program.option('-e, --env <env_file_path>', 'path to the .env file');
program.option('-c, --config <config_file_path>', 'path to the config file');

program.parse(process.argv);

const absolutePath = (relativePath: string) => path.resolve(__dirname, relativePath);

const envFile = program.env ? absolutePath(program.env) : '../../.env';
const configFilePath = absolutePath(program.config ?? '../config/demo-config.json');

(async () => {
    dotenv.config({
        path: envFile
    });

    const { currencies, country, complianceRegistry } = JSON.parse(fs.readFileSync(configFilePath, 'utf8').toString());

    if (!country) {
        throw new Error('Please specify a country in the format: { name: "countryName", regions: {} }')
    } else if (currencies.length < 1) {
        throw new Error('At least one currency has to be specified: e.g. [ "USD" ]');
    }

    const offChainDataSource = new OffChainDataSource(
        process.env.BACKEND_URL,
        Number(process.env.BACKEND_PORT)
    );

    await offChainDataSource.configurationClient.add('Compliance', complianceRegistry ?? 'none');
    await offChainDataSource.configurationClient.add('Country', country);

    for (const currency of currencies) {
        await offChainDataSource.configurationClient.add('Currency', currency);
    }

    const contractConfig = await deployEmptyContracts();

    await marketDemo(configFilePath, contractConfig);

    if (contractConfig && contractConfig.marketLogic) {
        await offChainDataSource.configurationClient.add('MarketContractLookup', contractConfig.marketLogic.toLowerCase());
    }
})();
