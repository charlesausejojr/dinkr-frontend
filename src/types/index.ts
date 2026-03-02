export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export type WeekSchedule = Record<string, DaySchedule>;

export interface Establishment {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  description: string | null;
  amenities: string[];
  images: string[];
  schedule: WeekSchedule;
  latitude: number | null;
  longitude: number | null;
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
  image_url: string | null;
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
  schedule: WeekSchedule;
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
  // Enriched venue fields
  court_name: string;
  establishment_name: string;
  establishment_location: string;
  establishment_latitude: number | null;
  establishment_longitude: number | null;
  // Enriched coach fields (when include_coach is true)
  coach_name: string;
  coach_avatar_url: string | null;
  coach_bio: string;
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
  // Enriched coach fields
  coach_name: string;
  coach_avatar_url: string | null;
  coach_bio: string;
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
