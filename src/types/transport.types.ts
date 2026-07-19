export type TransportServiceType = 
  | 'GOODS'
  | 'FURNITURE'
  | 'CONSTRUCTION'
  | 'HEAVY'
  | 'BACKLOAD'
  | 'EQUIPMENT'
  | 'CARS'
  | 'LIVESTOCK';

export type TransportRequestStatus = 
  | 'OPEN'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type TransportQuoteStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type TransportBookingStatus = 
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type CarrierVehicleType = 
  | 'PICKUP'
  | 'TRUCK_3_TON'
  | 'TRUCK_7_TON'
  | 'TRUCK_10_TON'
  | 'TRAILER'
  | 'REFRIGERATED'
  | 'FLATBED'
  | 'OTHER';

export interface TransportRequest {
  id: string;
  userId: string;
  serviceType: TransportServiceType;
  
  fromGovernorate: string;
  fromCity?: string;
  fromLat?: number;
  fromLng?: number;
  
  toGovernorate: string;
  toCity?: string;
  toLat?: number;
  toLng?: number;

  timingType?: 'asap' | 'scheduled';
  scheduledDate?: string;
  scheduledTime?: string;
  
  cargoDescription: string;
  weightTons?: number;
  requiresHelper: boolean;
  notes?: string;
  
  scheduledAt?: string;
  isFlexible: boolean;
  
  budgetMin?: number;
  budgetMax?: number;
  
  status: TransportRequestStatus;
  
  createdAt: string;
  updatedAt: string;

  user?: {
    id: string;
    displayName: string;
    phone: string;
  };
  quotesCount?: number;
  viewCount?: number;
}

export interface CarrierProfile {
  id: string;
  userId: string;
  
  companyName?: string;
  bio?: string;
  vehicleTypes?: string[];
  serviceTypes?: string[];
  governorate?: string;
  city?: string;
  contactPhone?: string;
  whatsapp?: string;
  
  serviceAreas?: string[];
  isAvailable: boolean;
  
  averageRating: number;
  totalTrips: number;
  
  isVerified: boolean;
  
  createdAt: string;
  updatedAt: string;

  user?: {
    id: string;
    displayName: string;
    phone: string;
    avatar?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
}

export interface TransportQuote {
  id: string;
  requestId: string;
  carrierId: string;
  
  price: number;
  estimatedHours?: number;
  message?: string;
  
  status: TransportQuoteStatus;
  
  createdAt: string;
  updatedAt: string;

  carrier?: CarrierProfile;
}

export interface TransportBooking {
  id: string;
  requestId: string;
  quoteId: string;
  shipperId: string;
  carrierId: string;
  
  status: TransportBookingStatus;
  cancellationReason?: string;
  
  createdAt: string;
  updatedAt: string;

  request?: TransportRequest;
  quote?: TransportQuote;
  carrier?: CarrierProfile;
  shipper?: {
    id: string;
    displayName: string;
    phone: string;
  };
}
