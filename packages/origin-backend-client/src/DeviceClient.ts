import { IDevice, DeviceUpdateData } from '@energyweb/origin-backend-core';
import { IRequestClient, RequestClient } from './RequestClient';

export interface IDeviceClient {
    getById(id: number): Promise<IDevice>;
    getAll(): Promise<IDevice[]>;
    add(id: number, device: IDevice): Promise<IDevice>;
    update(id: number, data: DeviceUpdateData): Promise<IDevice>
}

export class DeviceClient implements IDeviceClient {
    constructor(
        private readonly dataApiUrl: string,
        private readonly requestClient: IRequestClient = new RequestClient()
    ) {}

    private get endpoint() {
        return `${this.dataApiUrl}/Device`;
    }

    public async getById(id: number): Promise<IDevice> {
        const url = `${this.endpoint}/${id}`;
        const { data } = await this.requestClient.get(url);

        return data;
    }

    public async getAll(): Promise<IDevice[]> {
        const { data } = await this.requestClient.get(this.endpoint);

        return data;
    }

    public async add(id: number, device: IDevice): Promise<IDevice> {
        const url = `${this.endpoint}/${id}`;
        const { data } = await this.requestClient.post(url, device);

        return data;
    }

    public async update(
        id: number,
        data: DeviceUpdateData
    ): Promise<IDevice> {
        const response = await this.requestClient.put<DeviceUpdateData, IDevice>(`${this.endpoint}/${id}`, data);

        return response.data;
    }
}
