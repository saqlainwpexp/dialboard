export const DISPOSITION_LABELS: Record<string, string> = {
  no_answer: "No Answer",
  voicemail: "Voicemail",
  gatekeeper: "Gatekeeper",
  wrong_number: "Wrong Number",
  not_interested: "Not Interested",
  callback_requested: "Callback Requested",
  meeting_booked: "Meeting Booked",
  dnc: "Do Not Call",
};

export const DISPOSITION_STYLES: Record<string, string> = {
  no_answer: "bg-zinc-100 text-zinc-500",
  voicemail: "bg-zinc-100 text-zinc-500",
  gatekeeper: "bg-accent-blue-soft text-accent-blue",
  wrong_number: "bg-zinc-100 text-zinc-500",
  not_interested: "bg-red-50 text-red-500",
  callback_requested: "bg-amber-50 text-amber-600",
  meeting_booked: "bg-emerald-50 text-emerald-600",
  dnc: "bg-red-50 text-red-500",
};

export const OBJECTION_LABELS: Record<string, string> = {
  price: "Price",
  timing: "Timing",
  no_budget: "No Budget",
  already_have_vendor: "Already Have Vendor",
  not_decision_maker: "Not Decision Maker",
  no_need: "No Need",
  other: "Other",
};
