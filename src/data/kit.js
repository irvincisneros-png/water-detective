// "Pack your kit" content. Matches the course safety rule: buddy, boundary, no wading, gloves.
export const KIT = [
  { id: 'gloves', icon: 'glove', label: 'Gloves', safe: true, why: 'Gloves keep dirty water off your skin.' },
  { id: 'buddy', icon: 'buddy', label: 'A buddy', safe: true, why: 'Always test with a buddy, so someone can get help.' },
  { id: 'pole', icon: 'pole', label: 'Sampling pole', safe: true, why: 'A pole lets you reach the water from the bank, so you do not need to go in.' },
  { id: 'thongs', icon: 'thong', label: 'Thongs', safe: false, why: 'Thongs slip on wet banks. You need shoes that grip.' },
  { id: 'boots', icon: 'boot', label: 'Wading boots, for going in', safe: false, why: 'We never wade in. Water scientists sample from the bank.' },
  { id: 'bottle', icon: 'bottle', label: 'Drink bottle, to taste-test', safe: false, why: 'Never taste water samples. They can make you sick.' },
];
export const KIT_NEEDED = 3;
export const KIT_DONE = 'Safe kit packed: gloves, a buddy and a sampling pole. Off we go.';
