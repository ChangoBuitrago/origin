import { IUser } from './User';

export enum OrganizationStatus {
    Submitted,
    Denied,
    Active
}

export interface IOrganizationProperties {
    id: number;

    activeCountries: string;

    code: string;

    name: string;

    contact: string;

    telephone: string;

    email: string;

    address: string;

    shareholders: string;

    ceoPassportNumber: string;

    ceoName: string;

    companyNumber: string;

    vatNumber: string;

    postcode: string;

    headquartersCountry: number;

    country: number;

    businessTypeSelect: string;

    businessTypeInput: string;

    yearOfRegistration: number;

    numberOfEmployees: number;

    website: string;

    status: OrganizationStatus;
}

export interface IOrganization extends IOrganizationProperties {
    leadUser: IUser | IUser['id'];
    users: Array<IUser | IUser['id']>;
}

export interface IOrganizationWithRelationsIds extends IOrganization {
    leadUser: IUser['id'];
    users: Array<IUser['id']>;
}

export interface IOrganizationWithRelations extends IOrganization {
    leadUser: IUser;
    users: IUser[];
}

export type OrganizationPostData = Omit<IOrganizationProperties, 'id' | 'status'>;

export type OrganizationUpdateData = Pick<IOrganization, 'status'>;

export type OrganizationRemoveMemberReturnData = { success: boolean; error: string };
