const activeOrganizationId = 1;

export const environment = {
  production: false,
  platformProviderApiBaseUrl: 'http://localhost:8080',
  platformProviderActiveOrganizationId: activeOrganizationId,
  platformProviderUsersEndpointPath: `/organizations/${activeOrganizationId}/users`,
  platformProviderOrganizationsEndpointPath: '/organizations',
  platformProviderRolesEndpointPath: '/roles',
  platformProviderAssetsEndpointPath: `/organizations/${activeOrganizationId}/assets`,
  platformProviderIoTDevicesEndpointPath: `/organizations/${activeOrganizationId}/iot-devices`,
  platformProviderGatewaysEndpointPath: `/organizations/${activeOrganizationId}/gateways`,
  platformProviderAssetSettingsEndpointPath: `/organizations/${activeOrganizationId}/asset-settings`,
  platformProviderMaintenanceSchedulesEndpointPath: `/organizations/${activeOrganizationId}/maintenance-schedules`,
  platformProviderTechnicalServiceRequestsEndpointPath: `/organizations/${activeOrganizationId}/technical-service-requests`,
  platformProviderSensorReadingsEndpointPath: `/organizations/${activeOrganizationId}/sensor-readings`,
  platformProviderReportsEndpointPath: `/organizations/${activeOrganizationId}/reports`,
  platformProviderIncidentsEndpointPath: `/organizations/${activeOrganizationId}/incidents`,
  platformProviderNotificationsEndpointPath: `/organizations/${activeOrganizationId}/notifications`,
  platformProviderSignUpEndpointPath: '/organization-sign-ups',
  platformProviderSignInEndpointPath: '',
  platformProviderPasswordResetEndpointPath: '/password-reset-requests',
};
