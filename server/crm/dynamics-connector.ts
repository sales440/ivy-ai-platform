
import { z } from "zod";
import axios from "axios";

/**
 * Interface definition for Dynamics 365 connectivity.
 * This ensures we adhere to the clean architecture pattern.
 */
export interface DynamicsCredentials {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    orgUrl: string; // e.g. https://myorg.crm.dynamics.com
}

export class DynamicsConnector {
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(
        private credentials: DynamicsCredentials,
        private companyId: number
    ) { }

    /**
     * Authenticaties with Azure AD to get a bearer token
     */
    private async authenticate() {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        const tokenEndpoint = `https://login.microsoftonline.com/${this.credentials.tenantId}/oauth2/v2.0/token`;

        try {
            const params = new URLSearchParams();
            params.append('client_id', this.credentials.clientId);
            params.append('client_secret', this.credentials.clientSecret);
            params.append('scope', `${this.credentials.orgUrl}/.default`);
            params.append('grant_type', 'client_credentials');

            const response = await axios.post(tokenEndpoint, params);

            this.accessToken = response.data.access_token;
            // Expires in slightly less than returned time to be safe
            this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000;

            return this.accessToken;
        } catch (error) {
            console.error("Dynamics Auth Failed:", error);
            throw new Error("Failed to authenticate with Microsoft Dynamics 365");
        }
    }

    /**
     * Validates the connection by fetching 'WhoAmI'
     */
    async testConnection(): Promise<boolean> {
        try {
            const token = await this.authenticate();
            const response = await axios.get(`${this.credentials.orgUrl}/api/data/v9.2/WhoAmI`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.status === 200;
        } catch (e) {
            return false;
        }
    }

    /**
     * Syncs Leads from Dynamics to Ivy
     */
    async syncLeadsFromCRM() {
        const token = await this.authenticate();
        // Select basic fields: firstname, lastname, emailaddress1, companyname
        const query = "?$select=firstname,lastname,emailaddress1,companyname&$top=50";

        const response = await axios.get(`${this.credentials.orgUrl}/api/data/v9.2/leads${query}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Prefer": "odata.include-annotations=\"*\""
            }
        });

        return response.data.value.map((d: any) => ({
            externalId: d.leadid,
            name: `${d.firstname || ''} ${d.lastname || ''}`.trim(),
            email: d.emailaddress1,
            company: d.companyname
        }));
    }

    /**
     * Syncs Tickets (Cases) from Dynamics to Ivy
     * Currently a placeholder as leads are priority.
     */
    async syncTicketsFromCRM() {
        return []; // Not implemented yet
    }

    /**
     * Pushes local leads to Dynamics 365
     */
    async syncLeadsToCRM(leads: any[]) {
        const token = await this.authenticate();
        const results = [];

        for (const lead of leads) {
            try {
                const payload = {
                    firstname: lead.name.split(' ')[0],
                    lastname: lead.name.split(' ').slice(1).join(' ') || 'Unknown',
                    emailaddress1: lead.email,
                    companyname: lead.company,
                    subject: "Created by Ivy.AI"
                };

                const response = await axios.post(
                    `${this.credentials.orgUrl}/api/data/v9.2/leads`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                results.push({ id: lead.id, status: 'success', remoteId: response.headers['odata-entityid'] });
            } catch (e: any) {
                results.push({ id: lead.id, status: 'error', error: e.message });
            }
        }
        return results;
    }

    /**
     * Pushes local tickets to Dynamics 365
     */
    async syncTicketsToCRM(tickets: any[]) {
        return []; // Not implemented yet
    }
}
