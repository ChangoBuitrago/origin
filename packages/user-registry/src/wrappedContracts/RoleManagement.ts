import Web3 from 'web3';
import { GeneralFunctions, ISpecialTx } from '@energyweb/utils-general';
import { PastEventOptions } from 'web3-eth-contract';
import RoleManagementJSON from '../../build/contracts/lightweight/RoleManagement.json';

export enum Role {
    UserAdmin,
    DeviceAdmin,
    DeviceManager,
    Trader,
    Matcher,
    Issuer,
    Listener
}

export function buildRights(roles: Role[]): number {
    if (!roles) {
        return 0;
    }

    return roles.reduce((a, b) => {
        return a | Math.pow(2, b);
    }, 0);
}

export class RoleManagement extends GeneralFunctions {
    web3: Web3;

    constructor(web3: Web3, address?: string) {
        const buildFile: any = RoleManagementJSON;
        super(
            address
                ? new web3.eth.Contract(RoleManagementJSON.abi, address)
                : new web3.eth.Contract(
                      buildFile.abi,
                      buildFile.networks.length > 0 ? buildFile.networks[0] : null
                  )
        );
        this.web3 = web3;
    }

    async getAllLogChangeOwnerEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('LogChangeOwner', this.createFilter(eventFilter));
    }

    async getAllEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('allEvents', this.createFilter(eventFilter));
    }

    async owner(txParams?: ISpecialTx) {
        return this.web3Contract.methods.owner().call(txParams);
    }

    async isRole(_role: number, _caller: string, txParams?: ISpecialTx) {
        return this.web3Contract.methods.isRole(_role, _caller).call(txParams);
    }
}
