export interface Sender {
  name: string;
  address: string;
  city: string;
  zip: string;
  email: string;
}

export interface Recipient {
  name: string;
  address: string;
  city: string;
  zip: string;
}

export interface Parcel {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface Draft {
  sessionToken: string;
  channelOrigin: 'WHATSAPP' | 'WEB_PORTAL' | 'MOBILE_PWA';
  step: number;
  sender: Sender;
  recipient: Recipient;
  parcel: Parcel;
  selectedTier: any | null;
  updatedAt: string;
}
