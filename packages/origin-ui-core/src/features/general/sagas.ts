import { call, put, delay, select, take, all, fork } from 'redux-saga/effects';
import { Configuration } from '@energyweb/utils-general';
import { SagaIterator } from 'redux-saga';
import {
    hideAccountChangedModal,
    showAccountChangedModal,
    setEnvironment,
    IEnvironment,
    GeneralActions,
    setCurrencies,
    setCompliance,
    setCountry,
    setRegions,
    setOffChainDataSource
} from './actions';
import { getConfiguration } from '../selectors';
import {
    getAccountChangedModalVisible,
    getAccountChangedModalEnabled,
    getEnvironment,
    getOffChainDataSource
} from './selectors';
import { UsersActions } from '../users/actions';
import { isUsingInBrowserPK } from '../authentication/selectors';
import axios from 'axios';
import { IOffChainDataSource, OffChainDataSource } from '@energyweb/origin-backend-client';

function* showAccountChangedModalOnChange(): SagaIterator {
    while (true) {
        yield take(UsersActions.updateCurrentUserId);
        const conf: Configuration.Entity = yield select(getConfiguration);

        if (!conf) {
            return;
        }

        try {
            const initialAccounts: string[] = yield call(
                conf.blockchainProperties.web3.eth.getAccounts
            );

            while (true) {
                const accountChangedModalEnabled: boolean = yield select(
                    getAccountChangedModalEnabled
                );
                const usingInBrowserPrivateKey: boolean = yield select(isUsingInBrowserPK);

                if (!accountChangedModalEnabled || usingInBrowserPrivateKey) {
                    break;
                }

                const accountChangedModalVisible: boolean = yield select(
                    getAccountChangedModalVisible
                );
                const accounts: string[] = yield call(
                    conf.blockchainProperties.web3.eth.getAccounts
                );

                if (accountChangedModalVisible) {
                    if (initialAccounts[0] === accounts[0]) {
                        yield put(hideAccountChangedModal());
                    }
                } else if (initialAccounts[0] !== accounts[0]) {
                    yield put(showAccountChangedModal());
                }

                yield delay(1000);
            }
        } catch (error) {
            console.error('showAccountChangedModalOnChange() error', error);
        }
    }
}

async function getENV(): Promise<IEnvironment> {
    try {
        const response = await axios.get('env-config.js');

        return response.data;
    } catch (error) {
        console.warn('Error while fetching env-config.js');
    }

    return {
        MODE: 'development',
        BACKEND_URL: 'http://localhost:3030',
        BLOCKCHAIN_EXPLORER_URL: 'https://volta-explorer.energyweb.org',
        WEB3: 'http://localhost:8545',
        REGISTRATION_MESSAGE_TO_SIGN: 'I register as Origin user'
    };
}

async function getComplianceFromAPI(offChainDataSource: IOffChainDataSource) {
    try {
        return offChainDataSource.configurationClient.get('Compliance');
    } catch {
        return null;
    }
}

async function getCurrenciesFromAPI(offChainDataSource: IOffChainDataSource) {
    try {
        const currencies = await offChainDataSource.configurationClient.get('Currency');

        if (currencies.length > 0) {
            return currencies;
        }

        return null;
    } catch {
        return null;
    }
}

async function getCountryFromAPI(offChainDataSource: IOffChainDataSource) {
    try {
        return offChainDataSource.configurationClient.get('Country');
    } catch {
        return null;
    }
}

function* setupEnvironment(): SagaIterator {
    const environment: IEnvironment = yield call(getENV);

    yield put(setEnvironment(environment));
}

function* fillCurrency(): SagaIterator {
    while (true) {
        yield take(GeneralActions.setEnvironment);

        const environment: IEnvironment = yield select(getEnvironment);

        if (!environment) {
            return;
        }

        const offChainDataSource = yield select(getOffChainDataSource);
        const currencies = yield call(getCurrenciesFromAPI, offChainDataSource);

        yield put(
            setCurrencies({
                currencies
            })
        );
    }
}

function* fillCompliance(): SagaIterator {
    while (true) {
        yield take(GeneralActions.setEnvironment);

        const environment: IEnvironment = yield select(getEnvironment);

        if (!environment) {
            return;
        }

        const offChainDataSource = yield select(getOffChainDataSource);

        try {
            const compliance = yield call(getComplianceFromAPI, offChainDataSource);

            yield put(setCompliance(compliance));
        } catch (error) {
            console.warn('Could not set compliance due to an error: ', error?.message);
        }
    }
}

function* fillCountryAndRegions(): SagaIterator {
    while (true) {
        yield take(GeneralActions.setEnvironment);

        const environment: IEnvironment = yield select(getEnvironment);

        if (!environment) {
            return;
        }

        const offChainDataSource = yield select(getOffChainDataSource);

        try {
            const country = yield call(getCountryFromAPI, offChainDataSource);

            yield put(setCountry(country ? country.name : null));
            yield put(setRegions(country ? country.regions : null));
        } catch (error) {
            console.warn(`Could not set country and regions due to an error: `, error?.message);
        }
    }
}

function* initializeOffChainDataSource(): SagaIterator {
    while (true) {
        yield take(GeneralActions.setEnvironment);

        const environment: IEnvironment = yield select(getEnvironment);

        if (!environment) {
            return;
        }

        const baseURL = `${environment.BACKEND_URL}/api`;
        const offChainDataSource = new OffChainDataSource(baseURL);

        yield put(setOffChainDataSource(offChainDataSource));
    }
}


export function* generalSaga(): SagaIterator {
    yield all([
        fork(showAccountChangedModalOnChange),
        fork(setupEnvironment),
        fork(initializeOffChainDataSource),
        fork(fillCurrency),
        fork(fillCompliance),
        fork(fillCountryAndRegions)
    ]);
}
