/**
 * Section 13 fail messages. Each entry has a title + body. The fail screen
 * picks one at random per failure.
 */
export interface FailMessage {
  title: string;
  body: string;
}

export const FAIL_MESSAGES: FailMessage[] = [
  {
    title: 'Environmental Impact Fine',
    body: 'Too many balloons escaped into the sky.\nThe local ducks have filed a complaint.',
  },
  {
    title: 'Sky Litter Warning',
    body: 'A suspicious number of balloons have drifted beyond party limits.\nPlease pop responsibly.',
  },
  {
    title: 'Party Permit Violation',
    body: 'Your party exceeded the recommended balloon escape allowance.\nThe council is pretending to be disappointed.',
  },
  {
    title: 'Balloon Recovery Notice',
    body: 'Several balloons were last seen heading toward the clouds.\nRecovery costs have been deducted from your Party Bucks.',
  },
  {
    title: 'Neighbourhood Balloon Alert',
    body: "Mrs. Wobbleton from next door reported \u201ccolourful sky nonsense.\u201d\nYour Party Bucks have been confiscated.",
  },
  {
    title: 'Official Cleanup Notice',
    body: 'The cleanup team found ribbon trails in three gardens and one birdbath.\nThat means paperwork.',
  },
  {
    title: 'Floating Object Complaint',
    body: 'Local pigeons have requested a safer working environment.\nYour party has been temporarily shut down.',
  },
  {
    title: 'Party Over Notice',
    body: 'The balloons got away.\nThe cake survived, but your wallet did not.',
  },
  {
    title: 'Cloud Patrol Warning',
    body: 'Escaped balloons have entered cloud territory.\nThe clouds are not amused.',
  },
  {
    title: 'Backyard Safety Report',
    body: 'Too many balloons left the birthday zone.\nThe tree saw everything.',
  },
];

export function randomFailMessage(): FailMessage {
  return FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)];
}
