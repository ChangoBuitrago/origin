import React, { useEffect } from 'react';
import { Certificate } from '@energyweb/origin';
import { Role } from '@energyweb/user-registry';
import { showNotification, NotificationType } from '../utils/notifications';
import { useSelector, useDispatch } from 'react-redux';
import { getProducingDevices, getConfiguration } from '../features/selectors';
import { TableMaterial } from './Table/TableMaterial';
import { Check } from '@material-ui/icons';
import { getCurrentUser } from '../features/users/selectors';
import { setLoading } from '../features/general/actions';
import {
    IPaginatedLoaderHooksFetchDataParameters,
    usePaginatedLoader
} from './Table/PaginatedLoaderHooks';
import { ProducingDevice } from '@energyweb/device-registry';
import { getDeviceLocationText, LOCATION_TITLE } from '../utils/helper';
import { PowerFormatter } from '../utils/PowerFormatter';
import { EnergyFormatter } from '../utils/EnergyFormatter';
import { Skeleton } from '@material-ui/lab';

interface IProps {
    approvedOnly?: boolean;
}

interface IRecord {
    certificationRequestId: number;
    device: ProducingDevice.Entity;
    energy: number;
}

export function CertificationRequestsTable(props: IProps) {
    const configuration = useSelector(getConfiguration);
    const currentUser = useSelector(getCurrentUser);
    const producingDevices = useSelector(getProducingDevices);

    const dispatch = useDispatch();

    async function getPaginatedData({
        requestedPageSize,
        offset
    }: IPaginatedLoaderHooksFetchDataParameters) {
        if (!currentUser || producingDevices.length === 0) {
            return {
                paginatedData: [],
                total: 0
            };
        }

        const view = props.approvedOnly ? 'approved' : 'pending';

        const isIssuer = currentUser.isRole(Role.Issuer);

        const requests = await configuration.blockchainProperties.certificateLogicInstance.getCertificationRequests();

        let newPaginatedData: IRecord[] = [];

        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            const device = producingDevices.find(a => a.id === request.deviceId);

            if (
                (view === 'pending' && Number(request.status) !== 0) ||
                (view === 'approved' && Number(request.status) !== 1) ||
                (!isIssuer && currentUser.id.toLowerCase() !== device?.owner.address.toLowerCase())
            ) {
                continue;
            }

            const reads = await device.getSmartMeterReads();

            const energy = reads
                .slice(request.readsStartIndex, Number(request.readsEndIndex) + 1)
                .reduce((a, b) => a + Number(b.energy), 0);

            newPaginatedData.push({
                certificationRequestId: i,
                device,
                energy
            });
        }

        const newTotal = newPaginatedData.length;

        newPaginatedData = newPaginatedData.slice(offset, offset + requestedPageSize);

        return {
            paginatedData: newPaginatedData,
            total: newTotal
        };
    }

    const { paginatedData, loadPage, total, pageSize } = usePaginatedLoader<IRecord>({
        getPaginatedData
    });

    useEffect(() => {
        loadPage(1);
    }, [props.approvedOnly, currentUser, producingDevices.length]);

    async function approve(rowIndex: number) {
        const certificationRequestId = paginatedData[rowIndex].certificationRequestId;

        dispatch(setLoading(true));

        try {
            await Certificate.approveCertificationRequest(certificationRequestId, configuration);

            showNotification(`Certification request approved.`, NotificationType.Success);

            await loadPage(1);
        } catch (error) {
            showNotification(`Could not approve certification request.`, NotificationType.Error);
            console.error(error);
        }

        dispatch(setLoading(false));
    }

    if (!configuration) {
        return <Skeleton variant="rect" height={200} />;
    }

    const actions =
        currentUser?.isRole(Role.Issuer) && !props.approvedOnly
            ? [
                  {
                      icon: <Check />,
                      name: 'Approve',
                      onClick: (row: number) => approve(row)
                  }
              ]
            : [];

    const columns = [
        { id: 'facility', label: 'Facility' },
        { id: 'locationText', label: LOCATION_TITLE },
        { id: 'type', label: 'Type' },
        { id: 'capacity', label: `Capacity (${PowerFormatter.displayUnit})` },
        { id: 'meterRead', label: `Meter Read (${EnergyFormatter.displayUnit})` }
    ] as const;

    const rows = paginatedData.map(({ device, energy }) => {
        return {
            facility: device.offChainProperties.facilityName,
            locationText: getDeviceLocationText(device),
            type: configuration.deviceTypeService.getDisplayText(
                device.offChainProperties.deviceType
            ),
            capacity: PowerFormatter.format(device.offChainProperties.capacityInW),
            meterRead: EnergyFormatter.format(energy)
        };
    });

    return (
        <TableMaterial
            columns={columns}
            rows={rows}
            loadPage={loadPage}
            total={total}
            pageSize={pageSize}
            actions={actions}
        />
    );
}
