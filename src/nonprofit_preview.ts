export type NonprofitWork = {
  donations: { donor: string; amountCents: number; receiptSent: boolean }[];
  volunteers: { name: string; optedIn: boolean; shift: string }[];
  campaign: string;
};

export function previewWork(work: NonprofitWork) {
  return {
    receipts: work.donations.filter(donation => !donation.receiptSent).map(donation => ({ donor: donation.donor, amountCents: donation.amountCents })),
    reminders: work.volunteers.filter(volunteer => volunteer.optedIn).map(volunteer => ({ name: volunteer.name, shift: volunteer.shift })),
    report: { campaign: work.campaign, raisedCents: work.donations.reduce((sum, donation) => sum + donation.amountCents, 0) }
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(previewWork({
    campaign: "Winter meals",
    donations: [{ donor: "Mina", amountCents: 2500, receiptSent: false }],
    volunteers: [{ name: "Lee", optedIn: true, shift: "Saturday 09:00" }]
  }), null, 2));
}
