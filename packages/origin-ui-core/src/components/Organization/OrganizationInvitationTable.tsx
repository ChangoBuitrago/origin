import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Check, Clear } from '@material-ui/icons';
import {
    IOrganization,
    OrganizationInvitationStatus,
    IOrganizationInvitation
} from '@energyweb/origin-backend-core';

import { showNotification, NotificationType } from '../../utils/notifications';
import { TableMaterial } from '../Table/TableMaterial';
import { getCurrentUser } from '../../features/users/selectors';
import { setLoading } from '../../features/general/actions';
import {
    IPaginatedLoaderHooksFetchDataParameters,
    usePaginatedLoader
} from '../Table/PaginatedLoaderHooks';
import { getOffChainDataSource } from '../../features/general/selectors';

interface IRecord {
    organization: IOrganization;
    invitation: IOrganizationInvitation;
}

function getOrganizationInvitationStatusText(status: OrganizationInvitationStatus) {
    if (status === OrganizationInvitationStatus.Accepted) {
        return 'Accepted';
    }

    if (status === OrganizationInvitationStatus.Rejected) {
        return 'Rejected';
    }

    return 'Pending';
}

interface IProps {
    email?: string;
    organizationId?: number;
}

export function OrganizationInvitationTable(props: IProps) {
    const currentUser = useSelector(getCurrentUser);
    const organizationClient = useSelector(getOffChainDataSource).organizationClient;

    const dispatch = useDispatch();

    async function getPaginatedData({
        requestedPageSize,
        offset
    }: IPaginatedLoaderHooksFetchDataParameters) {
        if (!organizationClient) {
            return {
                paginatedData: [],
                total: 0
            };
        }

        const organizations = await organizationClient.getAll();
        let invitations: IOrganizationInvitation[] = [];

        if (props.email) {
            invitations = await organizationClient.getInvitationsForEmail(props.email);
        } else if (props.organizationId) {
            invitations = await organizationClient.getInvitationsToOrganization(
                props.organizationId
            );
        }

        let newPaginatedData: IRecord[] = invitations.map(invitation => ({
            invitation,
            organization: organizations?.find(o => o.id === invitation.organization)
        }));

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
    }, [currentUser, organizationClient]);

    async function accept(rowIndex: number) {
        const invitation = paginatedData[rowIndex]?.invitation;

        if (invitation.status !== OrganizationInvitationStatus.Pending) {
            showNotification(
                `You can only accept invitation with status pending.`,
                NotificationType.Error
            );

            return;
        }

        dispatch(setLoading(true));

        try {
            await organizationClient.acceptInvitation(invitation.id);

            showNotification(`Invitation accepted.`, NotificationType.Success);

            await loadPage(1);
        } catch (error) {
            showNotification(`Could not accept invitation.`, NotificationType.Error);
            console.error(error);
        }

        dispatch(setLoading(false));
    }

    async function reject(rowIndex: number) {
        const invitation = paginatedData[rowIndex]?.invitation;

        if (invitation.status !== OrganizationInvitationStatus.Pending) {
            showNotification(
                `You can only reject invitation with status pending.`,
                NotificationType.Error
            );

            return;
        }

        dispatch(setLoading(true));

        try {
            await organizationClient.rejectInvitation(invitation.id);

            showNotification(`Invitation rejected.`, NotificationType.Success);

            await loadPage(1);
        } catch (error) {
            showNotification(`Could not reject invitation.`, NotificationType.Error);
            console.error(error);
        }

        dispatch(setLoading(false));
    }

    const actions =
        typeof props.organizationId === 'undefined'
            ? [
                  {
                      icon: <Check />,
                      name: 'Accept',
                      onClick: (row: number) => accept(row)
                  },
                  {
                      icon: <Clear />,
                      name: 'Reject',
                      onClick: (row: number) => reject(row)
                  }
              ]
            : [];

    const columns = [
        { id: 'organization', label: 'Organization' },
        { id: 'email', label: 'Email' },
        { id: 'status', label: 'Status' }
    ] as const;

    const rows = paginatedData.map(({ organization, invitation }) => {
        return {
            organization: organization.name,
            status: getOrganizationInvitationStatusText(invitation.status),
            email: invitation.email
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
