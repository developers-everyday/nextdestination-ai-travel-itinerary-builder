import { CommunityItinerary } from '../types';

export const communityItineraries: CommunityItinerary[] = [
    {
        id: '1',
        name: 'Hidden Gems of Positano',
        location: 'Amalfi Coast, Italy',
        destination: 'Positano, Italy',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=1200',
        images: [
            'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1534113414509-0c1d8c448120?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=1200'
        ],
        creator: {
            id: 'marco',
            name: 'Marco G.',
            avatar: 'https://i.pravatar.cc/150?u=marco',
            verified: true
        },
        saveCount: 1240,
        duration: 5,
        tags: ['Coastal', 'Photography', 'Food & Wine', 'Romantic'],
        category: 'Romantic',
        trending: true,
        createdAt: '2024-11-15',
        itinerary: {
            destination: 'Positano, Italy',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Arrival & Coastal Exploration',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '14:00',
                            activity: 'Check-in at Le Sirenuse',
                            location: 'Via Cristoforo Colombo, 30',
                            description: 'Luxury hotel with stunning views of the Mediterranean',
                            type: 'hotel'
                        },
                        {
                            id: '1-2',
                            time: '16:30',
                            activity: 'Sunset at Spiaggia Grande',
                            location: 'Main Beach',
                            description: 'Relax on the iconic pebble beach with colorful umbrellas',
                            type: 'activity'
                        },
                        {
                            id: '1-3',
                            time: '19:30',
                            activity: 'Dinner at La Sponda',
                            location: 'Le Sirenuse Hotel',
                            description: 'Michelin-starred dining by candlelight',
                            type: 'activity'
                        }
                    ]
                },
                {
                    day: 2,
                    theme: 'Path of the Gods Hike',
                    activities: [
                        {
                            id: '2-1',
                            time: '08:00',
                            activity: 'Sentiero degli Dei Trail',
                            location: 'Bomerano to Nocelle',
                            description: 'Epic 7.8km coastal hike with breathtaking views',
                            type: 'activity'
                        },
                        {
                            id: '2-2',
                            time: '14:00',
                            activity: 'Lunch at Trattoria Santa Croce',
                            location: 'Nocelle',
                            description: 'Traditional Italian cuisine with panoramic terrace',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: '2',
        name: 'Cyberpunk Tokyo Nightlife',
        location: 'Shibuya, Japan',
        destination: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=1200',
        images: [
            'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=1200'
        ],
        creator: {
            id: 'sarah',
            name: 'Sarah K.',
            avatar: 'https://i.pravatar.cc/150?u=sarah',
            verified: true
        },
        saveCount: 890,
        duration: 4,
        tags: ['Urban', 'Nightlife', 'Technology', 'Street Food'],
        category: 'Adventure',
        trending: true,
        createdAt: '2024-12-01',
        itinerary: {
            destination: 'Tokyo, Japan',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Neon Dreams in Shibuya',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '18:00',
                            activity: 'Shibuya Crossing Experience',
                            location: 'Shibuya Scramble',
                            description: 'Witness the world\'s busiest intersection at peak hour',
                            type: 'activity'
                        },
                        {
                            id: '1-2',
                            time: '20:00',
                            activity: 'Robot Restaurant Show',
                            location: 'Shinjuku',
                            description: 'Mind-blowing neon spectacle with robots and performers',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: '3',
        name: 'Luxury Retreat in Bali',
        location: 'Ubud, Indonesia',
        destination: 'Ubud, Bali',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1200',
        images: [
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?auto=format&fit=crop&q=80&w=1200'
        ],
        creator: {
            id: 'julian',
            name: 'Julian P.',
            avatar: 'https://i.pravatar.cc/150?u=julian',
            verified: true
        },
        saveCount: 2105,
        duration: 7,
        tags: ['Wellness', 'Spa', 'Nature', 'Yoga'],
        category: 'Luxury',
        createdAt: '2024-10-20',
        itinerary: {
            destination: 'Ubud, Bali',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Arrival & Spa Indulgence',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '15:00',
                            activity: 'Check-in at Four Seasons Sayan',
                            location: 'Sayan, Ubud',
                            description: 'Jungle luxury resort with infinity pool',
                            type: 'hotel'
                        },
                        {
                            id: '1-2',
                            time: '17:00',
                            activity: 'Balinese Massage',
                            location: 'Resort Spa',
                            description: '90-minute traditional healing treatment',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: '4',
        name: 'Safari Adventure in Serengeti',
        location: 'Tanzania',
        destination: 'Serengeti National Park',
        image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1200',
        creator: {
            id: 'david',
            name: 'David M.',
            avatar: 'https://i.pravatar.cc/150?u=david',
            verified: true
        },
        saveCount: 1567,
        duration: 6,
        tags: ['Wildlife', 'Safari', 'Photography', 'Adventure'],
        category: 'Adventure',
        trending: true,
        createdAt: '2024-11-28',
        itinerary: {
            destination: 'Serengeti National Park',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Big Five Safari',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '06:00',
                            activity: 'Morning Game Drive',
                            location: 'Central Serengeti',
                            description: 'Spot lions, elephants, and leopards',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: '5',
        name: 'Northern Lights in Iceland',
        location: 'Reykjavik, Iceland',
        destination: 'Iceland',
        image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&q=80&w=1200',
        creator: {
            id: 'emma',
            name: 'Emma L.',
            avatar: 'https://i.pravatar.cc/150?u=emma'
        },
        saveCount: 3421,
        duration: 5,
        tags: ['Northern Lights', 'Nature', 'Hot Springs', 'Winter'],
        category: 'Adventure',
        createdAt: '2024-09-15',
        itinerary: {
            destination: 'Iceland',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Golden Circle & Aurora Hunt',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '10:00',
                            activity: 'Thingvellir National Park',
                            location: 'Golden Circle',
                            description: 'Walk between tectonic plates',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: '6',
        name: 'Parisian Romance',
        location: 'Paris, France',
        destination: 'Paris',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200',
        creator: {
            id: 'sophie',
            name: 'Sophie D.',
            avatar: 'https://i.pravatar.cc/150?u=sophie',
            verified: true
        },
        saveCount: 2890,
        duration: 4,
        tags: ['Romance', 'Art', 'Fine Dining', 'Culture'],
        category: 'Romantic',
        trending: true,
        createdAt: '2024-12-10',
        itinerary: {
            destination: 'Paris',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Classic Parisian Charm',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '10:00',
                            activity: 'Louvre Museum',
                            location: 'Rue de Rivoli',
                            description: 'See the Mona Lisa and Venus de Milo',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: '7',
        name: 'Backpacking Southeast Asia',
        location: 'Thailand, Vietnam, Cambodia',
        destination: 'Southeast Asia',
        image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=1200',
        creator: {
            id: 'alex',
            name: 'Alex R.',
            avatar: 'https://i.pravatar.cc/150?u=alex'
        },
        saveCount: 4123,
        duration: 21,
        tags: ['Backpacking', 'Budget', 'Temples', 'Beaches'],
        category: 'Budget',
        createdAt: '2024-08-05',
        itinerary: {
            destination: 'Southeast Asia',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Bangkok Street Food Tour',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '18:00',
                            activity: 'Khao San Road',
                            location: 'Bangkok',
                            description: 'Street food paradise and backpacker hub',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: '8',
        name: 'Family Fun in Orlando',
        location: 'Florida, USA',
        destination: 'Orlando',
        image: 'https://images.unsplash.com/photo-1605718263861-cc8bf6be1648?auto=format&fit=crop&q=80&w=1200',
        creator: {
            id: 'jennifer',
            name: 'Jennifer W.',
            avatar: 'https://i.pravatar.cc/150?u=jennifer'
        },
        saveCount: 1876,
        duration: 6,
        tags: ['Theme Parks', 'Family', 'Kids', 'Entertainment'],
        category: 'Family',
        createdAt: '2024-11-01',
        itinerary: {
            destination: 'Orlando',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Magic Kingdom Day',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '09:00',
                            activity: 'Disney Magic Kingdom',
                            location: 'Walt Disney World',
                            description: 'Classic Disney experience with the whole family',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: '9',
        name: 'Santorini Sunset Dreams',
        location: 'Santorini, Greece',
        destination: 'Santorini',
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=1200',
        creator: {
            id: 'maria',
            name: 'Maria K.',
            avatar: 'https://i.pravatar.cc/150?u=maria',
            verified: true
        },
        saveCount: 5234,
        duration: 5,
        tags: ['Sunsets', 'Wine', 'Beaches', 'Photography'],
        category: 'Romantic',
        trending: true,
        createdAt: '2024-12-15',
        itinerary: {
            destination: 'Santorini',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Oia Sunset Magic',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '18:30',
                            activity: 'Sunset at Oia Castle',
                            location: 'Oia',
                            description: 'World-famous sunset viewing spot',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: '10',
        name: 'Kyoto Temple Trail',
        location: 'Kyoto, Japan',
        destination: 'Kyoto',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1200',
        creator: {
            id: 'takeshi',
            name: 'Takeshi Y.',
            avatar: 'https://i.pravatar.cc/150?u=takeshi',
            verified: true
        },
        saveCount: 2567,
        duration: 4,
        tags: ['Temples', 'Culture', 'Gardens', 'Traditional'],
        category: 'Cultural',
        createdAt: '2024-10-12',
        itinerary: {
            destination: 'Kyoto',
            hasArrivalFlight: true,
            hasDepartureFlight: true,
            days: [
                {
                    day: 1,
                    theme: 'Ancient Temples & Bamboo',
                    hasHotel: true,
                    activities: [
                        {
                            id: '1-1',
                            time: '08:00',
                            activity: 'Fushimi Inari Shrine',
                            location: 'Southern Kyoto',
                            description: 'Thousands of vermillion torii gates',
                            type: 'activity'
                        }
                    ]
                }
            ]
        }
    }
];
