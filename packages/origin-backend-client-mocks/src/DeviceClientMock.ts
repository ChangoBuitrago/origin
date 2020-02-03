import moment from 'moment';
import { IDevice, DeviceUpdateData, DeviceStatusChanged, SupportedEvents, IEvent } from '@energyweb/origin-backend-core';

import { IDeviceClient, IEventClient } from '@energyweb/origin-backend-client';

export class DeviceClientMock implements IDeviceClient {
    private storage = new Map<number, IDevice>();

    constructor(public eventClient: IEventClient) {}

    async getById(id: number): Promise<IDevice> {
        return this.storage.get(id);
    }

    async getAll(): Promise<IDevice[]> {
        return [...this.storage.values()];
    }

    async add(id: number, data: IDevice): Promise<IDevice> {
        this.storage.set(id, data);

        return data;
    }

    async update(
        id: number,
        data: DeviceUpdateData
    ): Promise<IDevice> {
        const device = this.storage.get(id);

        Object.assign(device, data);

        this.storage.set(id, device);

        const event: DeviceStatusChanged = {
            deviceId: id.toString(),
            status: data.status
        };

        const sendEvent: IEvent = {
            type: SupportedEvents.DEVICE_STATUS_CHANGED,
            data: event,
            timestamp: moment().unix()
        };

        (this.eventClient as any).triggerEvent(sendEvent);

        return device;
    }
}

