export const TABS = [
  "Book a Court",
  "List a Court",
  "Book a Coach",
  "Become a Coach",
  "My Bookings",
] as const;
export type TabType = (typeof TABS)[number];

export const TIME_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

export const BOOKING_DURATION_OPTIONS = [1, 1.5, 2, 2.5, 3];
