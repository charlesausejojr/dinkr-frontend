export interface Establishment {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  description: string | null;
  amenities: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  courts?: Court[];
}

export interface Court {
  id: string;
  establishment_id: string;
  name: string;
  description: string | null;
  price_per_hour: number;
  surface_type: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Coach {
  id: string;
  name: string;
  bio: string | null;
  rate_per_hour: number;
  specialties: string[];
  avatar_url: string | null;
  user_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  court_id: string;
  user_id: string;
  coach_id?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  include_coach: boolean;
  created_at: string;
}

export interface CoachBooking {
  id: string;
  coach_id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
}
