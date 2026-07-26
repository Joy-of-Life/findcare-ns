const mongoose = require('mongoose');
const Daycare  = require('./models/Daycare');
require('dotenv').config();

const sampleDaycares = [
  {
    owner:        '000000000000000000000001',
    name:         'Little Explorers Daycare',
    address:      '1234 Barrington Street',
    city:         'Halifax',
    coordinates:  { lat: 44.6488, lng: -63.5752 },
    ageRange:     ['infant', 'toddler'],
    monthlyPrice: 850,
    language:     ['English'],
    openHours:    '7:00am – 6:00pm',
    phone:        '902-555-0101',
    availability: { infant: 3, toddler: 1, preschool: 0 },
    rating:       4.8,
    reviewCount:  24,
    licensed:     true,
    verified:     true,
    description:  'A warm and nurturing environment for your little ones in the heart of Halifax.'
  },
  {
    owner:        '000000000000000000000001',
    name:         'Les Petits Amis',
    address:      '567 Quinpool Road',
    city:         'Halifax',
    coordinates:  { lat: 44.6510, lng: -63.5890 },
    ageRange:     ['infant', 'toddler', 'preschool'],
    monthlyPrice: 780,
    language:     ['French', 'English'],
    openHours:    '7:30am – 5:30pm',
    phone:        '902-555-0202',
    availability: { infant: 0, toddler: 2, preschool: 3 },
    rating:       4.6,
    reviewCount:  18,
    licensed:     true,
    verified:     true,
    description:  'Bilingual French-English daycare offering a rich cultural experience for children.'
  },
  {
    owner:        '000000000000000000000001',
    name:         'Sunshine Kids Centre',
    address:      '890 Main Street',
    city:         'Dartmouth',
    coordinates:  { lat: 44.6717, lng: -63.5774 },
    ageRange:     ['toddler', 'preschool'],
    monthlyPrice: 720,
    language:     ['English'],
    openHours:    '6:45am – 6:00pm',
    phone:        '902-555-0303',
    availability: { infant: 0, toddler: 4, preschool: 2 },
    rating:       4.5,
    reviewCount:  31,
    licensed:     true,
    verified:     true,
    description:  'Bright and cheerful daycare with outdoor play areas and STEM activities.'
  },
  {
    owner:        '000000000000000000000001',
    name:         'Harbour Lights Childcare',
    address:      '234 Prince Street',
    city:         'Truro',
    coordinates:  { lat: 45.3647, lng: -63.2561 },
    ageRange:     ['infant', 'toddler', 'preschool'],
    monthlyPrice: 650,
    language:     ['English'],
    openHours:    '7:00am – 5:30pm',
    phone:        '902-555-0404',
    availability: { infant: 2, toddler: 0, preschool: 1 },
    rating:       4.3,
    reviewCount:  15,
    licensed:     true,
    verified:     true,
    description:  'Family run daycare in the heart of Truro with a focus on outdoor learning.'
  },
  {
    owner:        '000000000000000000000001',
    name:         'Cape Breton Kids Club',
    address:      '456 Charlotte Street',
    city:         'Sydney',
    coordinates:  { lat: 46.1351, lng: -60.1831 },
    ageRange:     ['toddler', 'preschool'],
    monthlyPrice: 600,
    language:     ['English'],
    openHours:    '7:30am – 5:00pm',
    phone:        '902-555-0505',
    availability: { infant: 0, toddler: 3, preschool: 2 },
    rating:       4.2,
    reviewCount:  12,
    licensed:     true,
    verified:     true,
    description:  'Affordable quality childcare serving Cape Breton families since 2010.'
  },
  {
    owner:        '000000000000000000000001',
    name:         'Petit Monde Garderie',
    address:      '789 Lacewood Drive',
    city:         'Halifax',
    coordinates:  { lat: 44.6742, lng: -63.6520 },
    ageRange:     ['infant', 'toddler', 'preschool'],
    monthlyPrice: 900,
    language:     ['French'],
    openHours:    '7:00am – 6:00pm',
    phone:        '902-555-0606',
    availability: { infant: 1, toddler: 0, preschool: 2 },
    rating:       4.9,
    reviewCount:  42,
    licensed:     true,
    verified:     true,
    description:  'Premier French immersion daycare in Halifax with experienced educators.'
  },
  {
    owner:        '000000000000000000000001',
    name:         'Bright Beginnings Daycare',
    address:      '321 Portland Street',
    city:         'Dartmouth',
    coordinates:  { lat: 44.6656, lng: -63.5683 },
    ageRange:     ['infant', 'toddler'],
    monthlyPrice: 800,
    language:     ['English'],
    openHours:    '6:30am – 6:30pm',
    phone:        '902-555-0707',
    availability: { infant: 2, toddler: 3, preschool: 0 },
    rating:       4.4,
    reviewCount:  19,
    licensed:     true,
    verified:     true,
    description:  'Early opening daycare perfect for parents with early work schedules.'
  },
  {
    owner:        '000000000000000000000001',
    name:         'Valley View Childcare',
    address:      '567 Commercial Street',
    city:         'Bridgewater',
    coordinates:  { lat: 44.3762, lng: -64.5199 },
    ageRange:     ['toddler', 'preschool'],
    monthlyPrice: 580,
    language:     ['English'],
    openHours:    '7:30am – 5:30pm',
    phone:        '902-555-0808',
    availability: { infant: 0, toddler: 2, preschool: 4 },
    rating:       4.1,
    reviewCount:  8,
    licensed:     true,
    verified:     true,
    description:  'Affordable childcare in the Annapolis Valley with a focus on nature play.'
  },
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB...');
    await Daycare.deleteMany({});
    console.log('Cleared existing daycares...');
    await Daycare.insertMany(sampleDaycares);
    console.log(`Seeded ${sampleDaycares.length} Nova Scotia daycares!`);
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
