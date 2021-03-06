import { GeneralFunctions, ISpecialTx } from '@energyweb/utils-general';
import { PastEventOptions } from 'web3-eth-contract';
import Web3 from 'web3';
import moment from 'moment';
import DeviceLogicJSON from '../../build/contracts/lightweight/DeviceLogic.json';

export class DeviceLogic extends GeneralFunctions {
    web3: Web3;

    constructor(web3: Web3, address?: string) {
        const buildFile: any = DeviceLogicJSON;
        super(
            address
                ? new web3.eth.Contract(buildFile.abi, address)
                : new web3.eth.Contract(
                      buildFile.abi,
                      buildFile.networks.length > 0 ? buildFile.networks[0] : null
                  )
        );
        this.web3 = web3;
    }

    async initialize(userContractAddress: string, txParams: ISpecialTx) {
        const method = this.web3Contract.methods.initialize(userContractAddress);

        return this.send(method, txParams);
    }

    async getAllLogNewMeterReadEvents(eventFilter?: PastEventOptions) {

        return this.web3Contract.getPastEvents('LogNewMeterRead', this.createFilter(eventFilter));
    }

    async getAllLogDeviceCreatedEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('LogDeviceCreated', this.createFilter(eventFilter));
    }

    async getAllLogDeviceFullyInitializedEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('LogDeviceFullyInitialized', this.createFilter(eventFilter));
    }

    async getSmartMeterReadsForDeviceByIndex(
        _deviceId: number,
        _indexes: number[],
        txParams?: ISpecialTx
    ) {
        return this.web3Contract.methods
            .getSmartMeterReadsForDeviceByIndex(_deviceId, _indexes)
            .call(txParams);
    }

    async getSmartMeterReadsForDevice(_deviceId: number, txParams?: ISpecialTx) {
        return this.web3Contract.methods.getSmartMeterReadsForDevice(_deviceId).call(txParams);
    }

    async getAllLogChangeOwnerEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('LogChangeOwner', this.createFilter(eventFilter));
    }

    async getAllEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('allEvents', this.createFilter(eventFilter));
    }

    async getLastMeterReadingAndHash(_deviceId: number, txParams?: ISpecialTx) {
        return this.web3Contract.methods.getLastMeterReadingAndHash(_deviceId).call(txParams);
    }

    async createDevice(
        _smartMeter: string,
        _owner: string,
        txParams?: ISpecialTx
    ) {
        const method = this.web3Contract.methods.createDevice(
            _smartMeter,
            _owner
        );

        return this.send(method, txParams);
    }

    async getDeviceOwner(_deviceId: number, txParams?: ISpecialTx) {
        return this.web3Contract.methods.getDeviceOwner(_deviceId).call(txParams);
    }

    async saveSmartMeterRead(
        _deviceId: number,
        _newMeterRead: number,
        _lastSmartMeterReadFileHash: string,
        _timestamp: number = moment().unix(),
        txParams?: ISpecialTx
    ) {
        const method = this.web3Contract.methods.saveSmartMeterRead(
            _deviceId,
            _newMeterRead,
            _lastSmartMeterReadFileHash,
            _timestamp
        );

        return this.send(method, txParams);
    }

    async getDeviceListLength(txParams?: ISpecialTx) {
        return this.web3Contract.methods.getDeviceListLength().call(txParams);
    }

    async getDevice(_deviceId: number, txParams?: ISpecialTx) {
        return this.web3Contract.methods.getDevice(_deviceId).call(txParams);
    }

    async getDeviceById(_deviceId: number, txParams?: ISpecialTx) {
        return this.web3Contract.methods.getDeviceById(_deviceId).call(txParams);
    }

    async isRole(_role: number, _caller: string, txParams?: ISpecialTx) {
        return this.web3Contract.methods.isRole(_role, _caller).call(txParams);
    }

    async userLogicAddress(txParams?: ISpecialTx) {
        return this.web3Contract.methods.userLogicAddress().call(txParams);
    }
}
