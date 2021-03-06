import Web3 from 'web3';
import { PastEventOptions } from 'web3-eth-contract';

import { GeneralFunctions, ISpecialTx } from '@energyweb/utils-general';

import RegistryJSON from '../../build/contracts/Registry.json';

export class Registry extends GeneralFunctions {
    web3: Web3;

    constructor(web3: Web3, address?: string) {
        const buildFile: any = RegistryJSON;
        super(
            address
                ? new web3.eth.Contract(RegistryJSON.abi, address)
                : new web3.eth.Contract(
                      buildFile.abi,
                      buildFile.networks.length > 0 ? buildFile.networks[0] : null
                  )
        );
        this.web3 = web3;
    }

    async initialize(txParams: ISpecialTx) {
        const method = this.web3Contract.methods.initialize();

        return this.send(method, txParams);
    }

    async getAllEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('allEvents', this.createFilter(eventFilter));
    }

    async getAllTransferSingleEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('TransferSingle', this.createFilter(eventFilter));
    }

    async getAllIssuanceSingleEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('IssuanceSingle', this.createFilter(eventFilter));
    }

    async balanceOf(_tokenOwner: string, _id: number, txParams?: ISpecialTx) {
        return this.web3Contract.methods.balanceOf(_tokenOwner, _id).call(txParams);
    }

    async claimedBalanceOf(_tokenOwner: string, _id: number, txParams?: ISpecialTx) {
        return this.web3Contract.methods.claimedBalanceOf(_tokenOwner, _id).call(txParams);
    }

    async getCertificate(_certificateId: number, txParams?: ISpecialTx) {
        return this.web3Contract.methods.getCertificate(_certificateId).call(txParams);
    }

    async safeTransferFrom(
        _from: string,
        _to: string,
        _certificateId: number,
        _value: number,
        _data: number[],
        txParams?: ISpecialTx
    ) {
        const method = this.web3Contract.methods.safeTransferFrom(
            _from,
            _to,
            _certificateId,
            _value,
            _data
        );

        return this.send(method, txParams);
    }

    async safeTransferAndClaimFrom(
        _from: string,
        _to: string,
        _certificateId: number,
        _value: number,
        _data: number[],
        _claimData: number[],
        txParams?: ISpecialTx
    ) {
        const method = this.web3Contract.methods.safeTransferAndClaimFrom(
            _from,
            _to,
            _certificateId,
            _value,
            _data,
            _claimData
        );

        return this.send(method, txParams);
    }

    async safeBatchTransferAndClaimFrom(
        _from: string,
        _to: string,
        _ids: number[],
        _values: number[],
        _data: number[],
        _claimData: number[][],
        txParams?: ISpecialTx
    ) {
        const method = this.web3Contract.methods.safeBatchTransferAndClaimFrom(
            _from,
            _to,
            _ids,
            _values,
            _data,
            _claimData
        );

        return this.send(method, txParams);
    }

    async safeBatchTransferFrom(
        _from: string,
        _to: string,
        _ids: number[],
        _values: number[],
        _data: number[],
        txParams?: ISpecialTx
    ) {
        const method = this.web3Contract.methods.safeBatchTransferFrom(
            _from,
            _to,
            _ids,
            _values,
            _data
        );

        return this.send(method, txParams);
    }

    async totalSupply(txParams?: ISpecialTx) {
        return this.web3Contract.methods.totalSupply().call(txParams);
    }

    async issue(_to: string, _validityData: any, _topic: number, _value: number, _data: any, txParams?: ISpecialTx) {
        const method = this.web3Contract.methods.issue(
            _to,
            _validityData,
            _topic,
            _value,
            _data
        );

        return this.send(method, txParams);
    }
}
