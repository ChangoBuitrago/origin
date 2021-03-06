import React, { useState, useEffect } from 'react';
import moment, { Moment } from 'moment';
import { CertificateLogic } from '@energyweb/origin';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField
} from '@material-ui/core';
import { DatePicker } from '@material-ui/pickers';
import { useSelector, useDispatch } from 'react-redux';
import { getConfiguration } from '../../features/selectors';
import {
    requestCertificates,
    hideRequestCertificatesModal
} from '../../features/certificates/actions';
import {
    getRequestCertificatesModalProducingDevice,
    getRequestCertificatesModalVisible
} from '../../features/certificates/selectors';
import { formatDate, DATE_FORMAT_DMY } from '../../utils/helper';
import { EnergyFormatter } from '../../utils/EnergyFormatter';

function setMaxTimeInDay(date: Moment): Moment {
    return date
        .hours(23)
        .minutes(59)
        .seconds(59)
        .milliseconds(999);
}

const DEFAULTS = {
    fromDate: moment().toDate(),
    toDate: setMaxTimeInDay(moment())
};

export function RequestCertificatesModal() {
    const [fromDate, setFromDate] = useState(DEFAULTS.fromDate);
    const [toDate, setToDate] = useState(DEFAULTS.toDate);
    const [reads, setReads] = useState([]);

    const configuration = useSelector(getConfiguration);
    const producingDevice = useSelector(getRequestCertificatesModalProducingDevice);
    const showModal = useSelector(getRequestCertificatesModalVisible);

    const dispatch = useDispatch();

    const fromTimestamp = moment(fromDate).unix();
    const toTimestamp = moment(toDate).unix();

    const readsInTimeRange = reads.filter(
        read => Number(read.timestamp) <= toTimestamp && Number(read.timestamp) >= fromTimestamp
    );

    const energy = producingDevice ? readsInTimeRange.reduce((a, b) => a + Number(b.energy), 0) : 0;
    const isFormValid = fromDate && toDate && fromDate <= toDate.toDate();

    useEffect(() => {
        (async () => {
            if (!producingDevice) {
                return;
            }

            setFromDate(DEFAULTS.fromDate);
            setToDate(DEFAULTS.toDate);

            const newReads = await producingDevice.getSmartMeterReads();

            const certificateLogic: CertificateLogic =
                configuration.blockchainProperties.certificateLogicInstance;

            const requestedSMReadsLength = Number(
                await certificateLogic.getDeviceRequestedCertsForSMReadsLength(
                    Number(producingDevice.id)
                )
            );

            const lastRequestedRead = newReads[requestedSMReadsLength];

            if (lastRequestedRead) {
                setFromDate(moment.unix(lastRequestedRead.timestamp).toDate());
                setReads(newReads);
            }
        })();
    }, [producingDevice]);

    function handleClose() {
        dispatch(hideRequestCertificatesModal());
    }

    async function requestCerts() {
        const lastReadIndex = reads.indexOf(readsInTimeRange[readsInTimeRange.length - 1]);

        dispatch(
            requestCertificates({
                deviceId: producingDevice.id,
                lastReadIndex,
                energy
            })
        );
    }

    function handleToDateChange(date: Moment) {
        setToDate(setMaxTimeInDay(date));
    }

    return (
        <Dialog open={showModal} onClose={handleClose}>
            <DialogTitle>{`Request certificates for ${producingDevice?.offChainProperties
                ?.facilityName ?? ''}`}</DialogTitle>
            <DialogContent>
                <TextField label="From" value={formatDate(moment(fromDate))} fullWidth disabled />

                <DatePicker
                    label={'To'}
                    value={toDate}
                    onChange={handleToDateChange}
                    variant="inline"
                    inputVariant="filled"
                    className="mt-4"
                    fullWidth
                    format={DATE_FORMAT_DMY}
                />

                <TextField
                    label={EnergyFormatter.displayUnit}
                    value={EnergyFormatter.format(energy)}
                    className="mt-4"
                    fullWidth
                    disabled
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="secondary">
                    Cancel
                </Button>
                <Button onClick={requestCerts} color="primary" disabled={!isFormValid}>
                    Request
                </Button>
            </DialogActions>
        </Dialog>
    );
}
