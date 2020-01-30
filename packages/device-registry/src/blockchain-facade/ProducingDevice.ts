import { Configuration } from '@energyweb/utils-general';
import { IDevice } from '@energyweb/origin-backend-core';

import * as Device from './Device';

export const getAllDevices = async (configuration: Configuration.Entity): Promise<Entity[]> => {
    const { deviceLogicInstance } = configuration.blockchainProperties;
    const deviceListLength = parseInt(await deviceLogicInstance.getDeviceListLength(), 10);

    const devicesPromises = Array(deviceListLength)
        .fill(null)
        .map(async (item, index) => {
            return {
                id: index,
                device: await deviceLogicInstance.getDevice(index)
            };
        });

    const allDevices = await Promise.all(devicesPromises);

    const producingDevicesSynced = allDevices.map(device =>
        new Entity(device.id.toString(), configuration).sync()
    );

    return Promise.all(producingDevicesSynced);
};

export const getDeviceListLength = async (configuration: Configuration.Entity) => {
    const producingDevices = await getAllDevices(configuration);
    return producingDevices.length;
};

export const getAllDevicesOwnedBy = async (owner: string, configuration: Configuration.Entity) => {
    return (await getAllDevices(configuration)).filter(
        (device: Entity) => device.owner.address.toLowerCase() === owner.toLowerCase()
    );
};

export const createDevice = async (
    devicePropertiesOnChain: Device.IOnChainProperties,
    devicePropertiesOffChain: IDevice,
    configuration: Configuration.Entity
): Promise<Entity> => {
    const producingDevice = new Entity(null, configuration);

    const {
        status: successCreateDevice,
        logs
    } = await configuration.blockchainProperties.deviceLogicInstance.createDevice(
        devicePropertiesOnChain.smartMeter.address,
        devicePropertiesOnChain.owner.address,
        Configuration.getAccount(configuration)
    );

    if (!successCreateDevice) {
        await producingDevice.deleteFromOffChainStorage();
        throw new Error('createDevice: Saving on-chain data failed. Reverting...');
    }

    const idFromTx = configuration.blockchainProperties.web3.utils
        .hexToNumber(logs[0].topics[1])
        .toString();

    producingDevice.id = idFromTx;

    await producingDevice.createOffChainProperties(devicePropertiesOffChain);

    if (configuration.logger) {
        configuration.logger.info(`Producing device ${idFromTx} created`);
    }

    return producingDevice.sync();
};
export interface IProducingDevice extends Device.IOnChainProperties {
    offChainProperties: IDevice;
}

export class Entity extends Device.Entity implements IProducingDevice {
    offChainProperties: IDevice;

    async sync(): Promise<Entity> {
        if (this.id != null) {
            const device = await this.configuration.blockchainProperties.deviceLogicInstance.getDeviceById(
                this.id
            );

            this.smartMeter = { address: device.smartMeter };
            this.owner = { address: device.owner };
            this.lastSmartMeterReadWh = Number(device.lastSmartMeterReadWh);
            this.lastSmartMeterReadFileHash = device.lastSmartMeterReadFileHash;

            this.initialized = true;

            this.offChainProperties = await this.getOffChainProperties();
            if (this.configuration.logger) {
                this.configuration.logger.verbose(`Producing device ${this.id} synced`);
            }
        }

        return this;
    }
}
