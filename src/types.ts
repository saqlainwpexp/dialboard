export type CampaignRef = { _id: string; name: string; color?: string } | null;

export type AdditionalPhone = { label: string; number: string };
export type CustomField = { key: string; value: string };

export type LeadRow = {
  _id: string;
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  source: string;
  industry: string;
  timezone: string;
  status: string;
  priority: string;
  campaign: CampaignRef;
  notes: string;
  additionalPhones: AdditionalPhone[];
  customFields: CustomField[];
  lastCalledAt: string | null;
  nextActionAt: string | null;
  createdAt: string;
};

export type CallRow = {
  _id: string;
  lead: string;
  script: { _id: string; name: string } | null;
  disposition: string;
  durationSeconds: number;
  objection: string | null;
  notes: string;
  nextActionAt: string | null;
  calledAt: string;
};

export type CallWithLead = Omit<CallRow, "lead"> & {
  lead: { _id: string; name: string; phone: string; company: string } | null;
};

export type CampaignRow = {
  _id: string;
  name: string;
  description: string;
  color: string;
  archived: boolean;
  createdAt: string;
};

export type ScriptRow = {
  _id: string;
  name: string;
  version: string;
  body: string;
  archived: boolean;
  createdAt: string;
};
