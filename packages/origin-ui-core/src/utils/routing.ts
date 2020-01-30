import { useSelector } from 'react-redux';
import { getBaseURL } from '../features/selectors';

export function getDevicesLink(baseURL: string) {
    return `${baseURL}/devices`;
}

export function getCertificatesLink(baseURL: string) {
    return `${baseURL}/certificates`;
}

export function getDemandsLink(baseURL: string) {
    return `${baseURL}/demands`;
}

export function getAccountLink(baseURL: string) {
    return `${baseURL}/account`;
}

export function getOrganizationLink(baseURL: string) {
    return `${baseURL}/organization`;
}

export function getUserRegisterLink(baseURL: string) {
    return `${getAccountLink(baseURL)}/user-register`;
}

export function getDevicesAddLink(baseURL: string) {
    return `${getDevicesLink(baseURL)}/add`;
}

export function getDevicesOwnedLink(baseURL: string) {
    return `${getDevicesLink(baseURL)}/owned`;
}

export function getDemandEditLink(baseURL: string, id: string) {
    return `${getDemandsLink(baseURL)}/edit/${id}`;
}

export function getDemandCloneLink(baseURL: string, id: string) {
    return `${getDemandsLink(baseURL)}/clone/${id}`;
}

export function getDemandViewLink(baseURL: string, id: string) {
    return `${getDemandsLink(baseURL)}/view/${id}`;
}

export function getCertificateDetailLink(baseURL: string, certificateId: string | number) {
    if (typeof certificateId === 'number') {
        certificateId = certificateId.toString();
    }

    return `${getCertificatesLink(baseURL)}/detail_view/${certificateId}`;
}

export function getCertificatesForDemandLink(baseURL: string, demandId: number) {
    return `${getCertificatesLink(baseURL)}/for_demand/${demandId}`;
}

export function getProducingDeviceDetailLink(baseURL: string, deviceId: string | number) {
    if (typeof deviceId === 'number') {
        deviceId = deviceId.toString();
    }

    return `${getDevicesLink(baseURL)}/producing_detail_view/${deviceId}`;
}

export function getOrganizationViewLink(baseURL: string, id: string) {
    return `${getOrganizationLink(baseURL)}/organization-view/${id}`;
}

export function useLinks() {
    const baseURL = useSelector(getBaseURL);

    return {
        baseURL,
        getDevicesLink: () => getDevicesLink(baseURL),
        getDevicesAddLink: () => getDevicesAddLink(baseURL),
        getDevicesOwnedLink: () => getDevicesOwnedLink(baseURL),
        getAccountLink: () => getAccountLink(baseURL),
        getOrganizationLink: () => getOrganizationLink(baseURL),
        getCertificatesLink: () => getCertificatesLink(baseURL),
        getDemandsLink: () => getDemandsLink(baseURL),
        getDemandEditLink: (id: string) => getDemandEditLink(baseURL, id),
        getDemandCloneLink: (id: string) => getDemandCloneLink(baseURL, id),
        getDemandViewLink: (id: string) => getDemandViewLink(baseURL, id),
        getCertificateDetailLink: (certificateId: string | number) =>
            getCertificateDetailLink(baseURL, certificateId),
        getCertificatesForDemandLink: (demandId: number) =>
            getCertificatesForDemandLink(baseURL, demandId),
        getProducingDeviceDetailLink: (deviceId: string | number) =>
            getProducingDeviceDetailLink(baseURL, deviceId),
        getOrganizationViewLink: (id: string) => getOrganizationViewLink(baseURL, id),
        getUserRegisterLink: () => getUserRegisterLink(baseURL)
    };
}
