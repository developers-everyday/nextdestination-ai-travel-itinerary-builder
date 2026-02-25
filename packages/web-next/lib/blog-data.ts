// ── Blog Data Layer ──────────────────────────────────────────────────────────
// Flat-file content store for the /blog section.
// Each article is a structured TypeScript object — no CMS, no MDX.
// Next.js SSR + generateStaticParams turns these into crawlable HTML pages.

export interface BlogSection {
    type: "heading" | "paragraph" | "list" | "tip";
    text?: string;
    items?: string[];
}

export interface BlogPost {
    slug: string;
    title: string;
    description: string;
    author: string;
    publishedAt: string; // ISO date
    updatedAt: string;
    readingTime: string;
    category: string;
    tags: string[];
    heroEmoji: string;
    sections: BlogSection[];
}

// ── Articles ─────────────────────────────────────────────────────────────────

export const blogPosts: BlogPost[] = [
    // ─── Article 1 ───────────────────────────────────────────────────────────
    {
        slug: "how-to-plan-a-trip",
        title: "How to Plan a Trip: A Complete Step-by-Step Guide",
        description:
            "Learn how to plan your dream vacation from scratch — from picking a destination and setting a budget to booking flights, hotels, and building a day-by-day itinerary with AI.",
        author: "NextDestination Team",
        publishedAt: "2026-02-25",
        updatedAt: "2026-02-25",
        readingTime: "8 min read",
        category: "Travel Planning",
        tags: ["planning", "guide", "beginners", "budget"],
        heroEmoji: "🗺️",
        sections: [
            {
                type: "paragraph",
                text: "Planning a trip can feel overwhelming — there are flights to compare, hotels to research, activities to discover, and budgets to balance. But with the right approach, the planning process becomes just as enjoyable as the trip itself. This guide walks you through every step, whether you're a first-time traveler or a seasoned explorer looking to streamline your workflow.",
            },
            { type: "heading", text: "Step 1: Choose Your Destination" },
            {
                type: "paragraph",
                text: "Start by asking yourself what kind of experience you want. Are you craving a beach getaway, a cultural deep-dive, or an adrenaline-packed adventure? Consider factors like the season, visa requirements, and your overall budget. If you're unsure, try browsing community itineraries from travelers who've already been there.",
            },
            {
                type: "tip",
                text: "Use NextDestination.ai's community page to browse real itineraries from other travelers — filter by solo, couple, or family trips to find ideas that match your travel style.",
            },
            { type: "heading", text: "Step 2: Set Your Budget" },
            {
                type: "paragraph",
                text: "A realistic budget is the foundation of a stress-free trip. Break it down into categories: flights, accommodation, food, activities, and a contingency fund (aim for 10–15% extra). Research the average daily cost for your destination — Southeast Asia might cost $30–50/day, while Western Europe could run $100–200/day.",
            },
            {
                type: "list",
                items: [
                    "Flights: 30–40% of total budget for international trips",
                    "Accommodation: 25–35% — hostels, mid-range hotels, or vacation rentals",
                    "Food: 15–20% — mix of street food and sit-down restaurants",
                    "Activities & transport: 15–20% — tours, museums, local transit",
                    "Contingency: 10–15% — unexpected expenses, souvenirs, tips",
                ],
            },
            { type: "heading", text: "Step 3: Pick Your Travel Dates" },
            {
                type: "paragraph",
                text: "Timing matters more than most travelers realize. Travel during shoulder season (just before or after peak season) at your destination for the best combination of good weather, fewer crowds, and lower prices. Check for local holidays and festivals — they can be either a highlight or a headache depending on your preferences.",
            },
            { type: "heading", text: "Step 4: Book Flights & Accommodation" },
            {
                type: "paragraph",
                text: "For flights, use comparison tools and set price alerts. Book 6–8 weeks in advance for domestic flights and 2–3 months ahead for international trips. For accommodation, consider location over amenities — being centrally located saves time and transport costs. Read recent reviews (within the last 6 months) for the most accurate picture.",
            },
            { type: "heading", text: "Step 5: Build Your Day-by-Day Itinerary" },
            {
                type: "paragraph",
                text: "This is where AI changes the game. Instead of spending hours researching each destination, inputting all your preferences manually, gathering reviews, and cross-referencing maps, an AI-powered travel planner can generate a personalized day-by-day itinerary in seconds. You can then customize it — swap activities, add rest days, and adjust timing to your preference.",
            },
            {
                type: "tip",
                text: "Try NextDestination.ai's AI planner — enter your destination, dates, and interests, and get a complete itinerary with activities, hotels, and estimated costs in under 30 seconds.",
            },
            { type: "heading", text: "Step 6: Prepare for Departure" },
            {
                type: "paragraph",
                text: "Two weeks before departure, create a checklist: passport validity (6+ months), visa status, travel insurance, copies of important documents, currency exchange, and phone plan. Share your itinerary with a trusted contact. Download offline maps and translation apps if you're heading somewhere with limited connectivity.",
            },
            {
                type: "list",
                items: [
                    "Check passport expiry — renew if less than 6 months validity",
                    "Purchase travel insurance for medical, cancellation, and baggage coverage",
                    "Notify your bank about travel dates to avoid card blocks",
                    "Download offline maps for your destination",
                    "Pack a day bag with essentials for your first 24 hours",
                ],
            },
            { type: "heading", text: "Final Thoughts" },
            {
                type: "paragraph",
                text: "The best trips aren't necessarily the most expensive or exotic — they're the ones that are well-planned yet flexible. By following these steps, you'll arrive confident, prepared, and ready to make memories. And remember, the itinerary is a guide, not a rulebook. Leave room for spontaneity.",
            },
        ],
    },

    // ─── Article 2 ───────────────────────────────────────────────────────────
    {
        slug: "paris-3-day-itinerary",
        title: "Paris in 3 Days: The Perfect Itinerary",
        description:
            "A day-by-day guide to experiencing the best of Paris in just 3 days — from the Eiffel Tower and Louvre to hidden cafés and Montmartre's cobblestone streets.",
        author: "NextDestination Team",
        publishedAt: "2026-02-25",
        updatedAt: "2026-02-25",
        readingTime: "10 min read",
        category: "Destination Guides",
        tags: ["paris", "france", "europe", "city-break", "itinerary"],
        heroEmoji: "🗼",
        sections: [
            {
                type: "paragraph",
                text: "Three days in Paris is enough to fall in love with the City of Light — if you plan wisely. This itinerary balances iconic landmarks with local gems, ensuring you experience both the Paris everyone talks about and the one only locals know. You'll cover the 1st through 18th arrondissements without feeling rushed.",
            },
            { type: "heading", text: "Day 1: Iconic Landmarks & the Seine" },
            {
                type: "paragraph",
                text: "Start your morning at the Eiffel Tower. Arrive by 9 AM to avoid the worst queues (or pre-book tickets online). Take the stairs to the second level for a workout with a view, then ride the elevator to the summit. Afterward, walk through Champ de Mars and cross Pont d'Iéna.",
            },
            {
                type: "list",
                items: [
                    "9:00 AM — Eiffel Tower (pre-book skip-the-line tickets)",
                    "11:30 AM — Walk along the Seine to Musée d'Orsay",
                    "12:30 PM — Lunch at a café in Saint-Germain-des-Prés",
                    "2:00 PM — The Louvre (focus on Denon Wing: Mona Lisa, Venus de Milo, Winged Victory)",
                    "5:30 PM — Tuileries Garden stroll",
                    "7:00 PM — Dinner near Palais Royal",
                    "9:00 PM — Seine river cruise (Bateaux Mouches) to see the city illuminated",
                ],
            },
            {
                type: "tip",
                text: "The Louvre is enormous — don't try to see everything. Pick 2–3 sections and save the rest for a return trip. Wednesday and Friday evenings have extended hours with fewer crowds.",
            },
            { type: "heading", text: "Day 2: Montmartre, Marais & Culture" },
            {
                type: "paragraph",
                text: "Begin at Sacré-Cœur in Montmartre. Climb the steps (or take the funicular) for panoramic city views. Wander the artistic streets where Picasso and Van Gogh once lived. Browse Place du Tertre for live artist portraits, then head south to the trendy Le Marais district for lunch.",
            },
            {
                type: "list",
                items: [
                    "9:00 AM — Sacré-Cœur Basilica + Montmartre walk",
                    "11:00 AM — Place du Tertre (artist square)",
                    "12:00 PM — Falafel on Rue des Rosiers in Le Marais",
                    "1:30 PM — Musée Picasso or Centre Pompidou",
                    "4:00 PM — Place des Vosges (Paris's oldest planned square)",
                    "5:30 PM — Vintage shopping on Rue de Bretagne",
                    "7:30 PM — Dinner at a bistro in Le Marais",
                    "9:30 PM — Cocktails at a hidden speakeasy bar",
                ],
            },
            { type: "heading", text: "Day 3: Versailles or Local Exploration" },
            {
                type: "paragraph",
                text: "You have two strong options for your final day. Option A: take the RER C train to the Palace of Versailles (40 minutes each way) for the opulent Hall of Mirrors and the sprawling gardens. Option B: stay in Paris for a deeper local experience — explore the Latin Quarter, visit the Panthéon, browse Shakespeare & Company bookshop, and linger at a corner café.",
            },
            {
                type: "list",
                items: [
                    "Option A — Versailles: depart by 9 AM, Hall of Mirrors, Grand Trianon, gardens (return by 3 PM)",
                    "Option B — Latin Quarter: Panthéon, Luxembourg Gardens, Shakespeare & Company, Rue Mouffetard market",
                    "4:00 PM — Champs-Élysées walk toward Arc de Triomphe",
                    "5:30 PM — Climb Arc de Triomphe for sunset views",
                    "7:30 PM — Farewell dinner at a classic brasserie",
                ],
            },
            {
                type: "tip",
                text: "Buy a Paris Museum Pass (2 or 4 days) for skip-the-line access to 50+ museums and monuments. It pays for itself after 3 visits.",
            },
            { type: "heading", text: "Budget Breakdown" },
            {
                type: "list",
                items: [
                    "Flights: $300–800 round trip (varies by origin)",
                    "Hotel: $120–250/night for a 3-star in central Paris",
                    "Metro: €16.90 for a carnet of 10 tickets (or Navigo Easy card)",
                    "Food: €40–80/day (mix of cafés and restaurants)",
                    "Activities: €50–100/day (museums, tours, Seine cruise)",
                    "Total estimate: $1,200–2,500 for 3 days (excluding flights)",
                ],
            },
            { type: "heading", text: "Ready to Plan Your Paris Trip?" },
            {
                type: "paragraph",
                text: "This itinerary is a starting point — customize it based on your interests, pace, and budget. Whether you're a museum lover, a foodie, or a street explorer, Paris has something for you around every corner.",
            },
        ],
    },

    // ─── Article 3 ───────────────────────────────────────────────────────────
    {
        slug: "best-destinations-couples-2026",
        title: "10 Best Destinations for Couples in 2026",
        description:
            "From the Amalfi Coast to Kyoto, discover the 10 most romantic travel destinations for couples in 2026 — with tips on when to go, what to do, and how to plan the perfect getaway.",
        author: "NextDestination Team",
        publishedAt: "2026-02-25",
        updatedAt: "2026-02-25",
        readingTime: "9 min read",
        category: "Inspiration",
        tags: ["couples", "romantic", "honeymoon", "2026", "destinations"],
        heroEmoji: "💕",
        sections: [
            {
                type: "paragraph",
                text: "Whether you're celebrating an anniversary, planning a honeymoon, or simply craving quality time together, the right destination sets the tone. We've curated 10 destinations that offer romance, adventure, and unforgettable experiences for couples in 2026.",
            },
            { type: "heading", text: "1. Santorini, Greece" },
            {
                type: "paragraph",
                text: "White-washed villages clinging to volcanic cliffs, legendary sunsets over the caldera, and intimate cave hotels make Santorini the quintessential romantic escape. Visit between late April and early June or September–October for warm weather without the peak-season crowds. Don't miss a private catamaran cruise to the hot springs.",
            },
            { type: "heading", text: "2. Kyoto, Japan" },
            {
                type: "paragraph",
                text: "Kyoto blends ancient temples, bamboo groves, and world-class kaiseki cuisine into an experience that feels like stepping into a painting. Cherry blossom season (late March to mid-April) is magical for couples. Walk hand-in-hand through the Arashiyama Bamboo Grove, visit Fushimi Inari at dawn, and unwind in a traditional ryokan with a private onsen.",
            },
            { type: "heading", text: "3. Amalfi Coast, Italy" },
            {
                type: "paragraph",
                text: "Winding coastal roads, pastel-colored villages, and sparkling Mediterranean waters — the Amalfi Coast is Italian romance at its finest. Base yourself in Positano or Ravello for the best views. Take a boat to the island of Capri, share limoncello on a cliffside terrace, and eat the best seafood pasta of your life.",
            },
            { type: "heading", text: "4. Bali, Indonesia" },
            {
                type: "paragraph",
                text: "Bali offers couples everything from jungle-perched infinity pools in Ubud to beachfront villas in Seminyak. It's wildly affordable yet feels luxurious. Watch the sunset at Tanah Lot temple, take a couples' spa day, and explore the rice terraces of Tegallalang. Best visited April–October.",
            },
            { type: "heading", text: "5. Maldives" },
            {
                type: "paragraph",
                text: "Overwater bungalows, private beaches, and turquoise lagoons — the Maldives is the ultimate splurge destination for couples. Perfect for special occasions like honeymoons or milestone anniversaries. Snorkel with manta rays, dine on a sandbank under the stars, and do absolutely nothing in paradise.",
            },
            { type: "heading", text: "6. Barcelona, Spain" },
            {
                type: "paragraph",
                text: "For couples who want culture, nightlife, and beaches in one city, Barcelona delivers. Explore Gaudí's whimsical architecture, get lost in the Gothic Quarter, share tapas on a rooftop, and end the night with live flamenco. The energy of this city is infectious.",
            },
            { type: "heading", text: "7. Cape Town, South Africa" },
            {
                type: "paragraph",
                text: "Where else can you hike Table Mountain in the morning, taste world-class wine in Stellenbosch by lunch, and watch penguins at Boulders Beach by afternoon? Cape Town's diversity of experiences — combined with a favorable exchange rate — makes it an adventurous couples' pick.",
            },
            { type: "heading", text: "8. Dubrovnik, Croatia" },
            {
                type: "paragraph",
                text: "Walk the ancient city walls at sunset, kayak under the fortresses, and island-hop to Lokrum for a quiet beach day. Dubrovnik's compact Old Town is impossibly charming. Visit in May or September to avoid the cruise-ship crowds that descend in summer.",
            },
            { type: "heading", text: "9. Tulum, Mexico" },
            {
                type: "paragraph",
                text: "Tulum has reinvented itself as a bohemian-chic destination with jungle hotels, cenote swimming, and Mayan ruins overlooking the Caribbean. It's perfect for couples who want a blend of relaxation and exploration. Check out the Sian Ka'an Biosphere Reserve for a quieter side of the Riviera Maya.",
            },
            { type: "heading", text: "10. Swiss Alps, Switzerland" },
            {
                type: "paragraph",
                text: "Whether you visit for skiing in winter or hiking in summer, the Swiss Alps deliver jaw-dropping scenery and cozy mountain lodges. Take the Glacier Express, explore car-free villages like Zermatt, and fondue your way through the evenings. Expensive but worth every franc.",
            },
            { type: "heading", text: "How to Plan Your Couple's Trip" },
            {
                type: "paragraph",
                text: "The best romantic trips balance togetherness with discovery. Talk about your shared interests, agree on a pace (adventure vs. relaxation), and don't over-schedule — leave room for spontaneous discoveries. An AI travel planner can handle the logistics so you can focus on each other.",
            },
        ],
    },

    // ─── Article 4 ───────────────────────────────────────────────────────────
    {
        slug: "solo-travel-guide",
        title: "Solo Travel Guide: Tips for Your First Trip Alone",
        description:
            "Everything first-time solo travelers need to know — from choosing the right destination and staying safe to making friends on the road and building confidence.",
        author: "NextDestination Team",
        publishedAt: "2026-02-25",
        updatedAt: "2026-02-25",
        readingTime: "7 min read",
        category: "Travel Planning",
        tags: ["solo", "safety", "beginners", "tips"],
        heroEmoji: "🎒",
        sections: [
            {
                type: "paragraph",
                text: "Solo travel is one of the most transformative experiences you can have. It builds confidence, teaches self-reliance, and opens you up to connections you'd never make in a group. If you've been thinking about your first solo trip but feel nervous — that's completely normal. Here's everything you need to get started.",
            },
            { type: "heading", text: "Why Travel Solo?" },
            {
                type: "paragraph",
                text: "Solo travel isn't about being alone — it's about having complete freedom. You eat what you want, go where you want, and move at your own pace. There's no compromising on itineraries, no waiting for others, and no group dynamics to navigate. Most solo travelers report coming back more confident, independent, and open-minded.",
            },
            { type: "heading", text: "Choosing Your First Destination" },
            {
                type: "paragraph",
                text: "For your first solo trip, pick a destination that's welcoming to solo travelers, relatively safe, and has good tourism infrastructure. You want a place where it's easy to get around, where English (or your language) is widely spoken, and where there's a social hostel/travel scene.",
            },
            {
                type: "list",
                items: [
                    "Japan — incredibly safe, efficient transit, solo-friendly dining culture",
                    "Portugal — affordable, friendly locals, walkable cities",
                    "Thailand — budget-friendly, strong backpacker network, beautiful beaches",
                    "New Zealand — adventure paradise, English-speaking, low crime",
                    "Iceland — safe, stunning nature, small but welcoming tourism scene",
                    "Colombia — vibrant culture, improving safety, affordable, warm locals",
                ],
            },
            { type: "heading", text: "Staying Safe" },
            {
                type: "paragraph",
                text: "Safety is the top concern for first-time solo travelers, and rightfully so. The good news: most popular travel destinations are safe for solo visitors, especially if you exercise the same common sense you would at home.",
            },
            {
                type: "list",
                items: [
                    "Share your itinerary with a trusted friend or family member",
                    "Keep digital copies of your passport, insurance, and bookings",
                    "Stay in well-reviewed accommodations (check recent reviews)",
                    "Trust your instincts — if something feels off, leave",
                    "Avoid walking alone in unfamiliar areas after dark",
                    "Use registered taxis or ride-share apps instead of unmarked cars",
                    "Keep your valuables secure — use a money belt or hidden pouch",
                ],
            },
            { type: "heading", text: "Making Friends on the Road" },
            {
                type: "paragraph",
                text: "One of the biggest misconceptions about solo travel is that you'll be lonely. In reality, you're more likely to make friends when traveling alone because you're more approachable. Stay in social hostels, join walking tours or cooking classes, use apps like Couchsurfing Hangouts, and don't be afraid to start conversations at cafés or on public transport.",
            },
            {
                type: "tip",
                text: "Hostels with communal kitchens and common areas are the best places to meet other travelers. Cook a big meal and invite people — instant friendships.",
            },
            { type: "heading", text: "Budgeting for Solo Travel" },
            {
                type: "paragraph",
                text: "Solo travel can be cheaper or more expensive than group travel, depending on your choices. You save on group activities and can be more flexible with timing, but you lose the ability to split accommodation and transport costs. Book private rooms in hostels for a middle ground between budget and comfort.",
            },
            { type: "heading", text: "Packing Light" },
            {
                type: "paragraph",
                text: "When you're carrying everything yourself, every gram counts. Aim for a single carry-on backpack (40–45L). Pack versatile clothing that can be mixed and matched, quick-dry fabrics, and no more than 3 pairs of shoes. Roll clothes instead of folding. Leave the \"just in case\" items at home — you can buy almost anything you need on the road.",
            },
            { type: "heading", text: "Your Solo Travel Checklist" },
            {
                type: "list",
                items: [
                    "Pick a solo-friendly destination and research entry requirements",
                    "Book your first 2–3 nights of accommodation in advance",
                    "Purchase comprehensive travel insurance",
                    "Download offline maps, translation apps, and a local SIM card",
                    "Pack a portable charger, universal power adapter, and earplugs",
                    "Join online travel communities for destination-specific tips",
                    "Create a day-by-day itinerary (but keep it flexible!)",
                ],
            },
            { type: "heading", text: "Take the Leap" },
            {
                type: "paragraph",
                text: "The hardest part of solo travel is booking the ticket. Once you're on the plane, everything falls into place. Start with a short trip — a weekend in a nearby city — and work your way up to longer adventures. You'll surprise yourself with how capable and resourceful you are.",
            },
        ],
    },

    // ─── Article 5 ───────────────────────────────────────────────────────────
    {
        slug: "budget-travel-countries",
        title: "Budget Travel: 15 Countries Under $50 a Day",
        description:
            "Discover 15 incredible destinations where you can travel comfortably on $50/day or less — covering accommodation, food, transport, and activities.",
        author: "NextDestination Team",
        publishedAt: "2026-02-25",
        updatedAt: "2026-02-25",
        readingTime: "11 min read",
        category: "Budget Travel",
        tags: ["budget", "cheap", "backpacking", "countries", "tips"],
        heroEmoji: "💰",
        sections: [
            {
                type: "paragraph",
                text: "Think you need thousands of dollars to travel the world? Think again. There are dozens of beautiful, culturally rich countries where $50 a day covers a comfortable room, three meals, local transport, and an activity or two. These aren't bare-bones survival budgets — they're enough for enjoyable, memorable travel. Here are 15 of the best.",
            },
            { type: "heading", text: "Southeast Asia" },
            { type: "heading", text: "1. Vietnam — ~$25–35/day" },
            {
                type: "paragraph",
                text: "Vietnam might be the best-value destination on Earth. A bowl of phở costs $1.50, a comfortable hotel room is $15–25, and internal flights are $30–50. From Hanoi's chaotic Old Quarter to Ha Long Bay's limestone karsts and Hoi An's lantern-lit streets, Vietnam delivers endless variety without denting your wallet.",
            },
            { type: "heading", text: "2. Cambodia — ~$20–30/day" },
            {
                type: "paragraph",
                text: "Siem Reap (Angkor Wat), Phnom Penh, and the southern beaches of Koh Rong offer incredible experiences at rock-bottom prices. A tuk-tuk day tour of Angkor costs around $15, guesthouse rooms start at $8, and a massive plate of lok lak (pepper beef) is under $3.",
            },
            { type: "heading", text: "3. Laos — ~$25–35/day" },
            {
                type: "paragraph",
                text: "Luang Prabang, with its saffron-robed monks and French-colonial architecture, is one of Southeast Asia's most enchanting towns. Kayak the Nam Ou river, tube in Vang Vieng, and explore the capital Vientiane — all on a shoestring budget.",
            },
            { type: "heading", text: "4. Indonesia — ~$25–40/day" },
            {
                type: "paragraph",
                text: "Beyond Bali (which is pricier), explore Lombok, Flores, Yogyakarta, and Sulawesi for dramatically lower costs. Warungs (local eateries) serve meals for $1–2, and basic guesthouses are $10–15. Even on Bali, staying in Ubud or Canggu outside the resort bubble keeps costs under $40/day.",
            },
            { type: "heading", text: "5. Thailand — ~$30–45/day" },
            {
                type: "paragraph",
                text: "Thailand's tourism infrastructure is so well-developed that traveling cheaply is effortless. Bangkok, Chiang Mai, and the islands all offer incredible food (street pad thai for $1), affordable accommodation ($10–20 for fan rooms), and cheap transport. The only challenge is not staying forever.",
            },
            { type: "heading", text: "South Asia" },
            { type: "heading", text: "6. India — ~$15–30/day" },
            {
                type: "paragraph",
                text: "India is the ultimate budget destination for ambitious travelers. A thali meal is $1–2, train tickets across the country are $5–15, and budget hotels start at $5–10. Rajasthan, Kerala, the Himalayas, and Goa each feel like a different country. The sensory overload is part of the experience.",
            },
            { type: "heading", text: "7. Nepal — ~$20–30/day" },
            {
                type: "paragraph",
                text: "Trekking in the Himalayas, temple-hopping in Kathmandu, and jungle safaris in Chitwan — Nepal is an adventurer's paradise at budget prices. Multi-day treks like the Annapurna Circuit cost $20–30/day including food and tea-house accommodation.",
            },
            { type: "heading", text: "8. Sri Lanka — ~$25–40/day" },
            {
                type: "paragraph",
                text: "Sri Lanka packs beaches, ancient ruins, tea plantations, and wildlife into a compact island. Take the iconic train ride through the highlands (first class: $10), surf in Arugam Bay, and explore Sigiriya Rock Fortress. Budget guesthouses with breakfast start at $15.",
            },
            { type: "heading", text: "Latin America" },
            { type: "heading", text: "9. Bolivia — ~$20–30/day" },
            {
                type: "paragraph",
                text: "Bolivia is South America's most affordable country. The Salar de Uyuni (world's largest salt flat) is a bucket-list experience. La Paz, the world's highest capital, offers vibrant markets and stunning Andean scenery. Meals cost $2–4, and bus travel is cheap.",
            },
            { type: "heading", text: "10. Guatemala — ~$25–35/day" },
            {
                type: "paragraph",
                text: "From the colonial streets of Antigua to the Mayan ruins of Tikal and the volcanic Lake Atitlán, Guatemala is a cultural powerhouse. Spanish schools charge $100–150/week including homestay. Chicken buses are practically free. Markets overflow with handwoven textiles.",
            },
            { type: "heading", text: "11. Colombia — ~$30–45/day" },
            {
                type: "paragraph",
                text: "Colombia has undergone a remarkable transformation. Cartagena's walled city, Medellín's innovative culture, the coffee region, and the Caribbean coast offer diverse experiences. Public transport is excellent, street food is delicious and cheap, and hostels have a great social scene.",
            },
            { type: "heading", text: "Eastern Europe & Central Asia" },
            { type: "heading", text: "12. Georgia — ~$25–35/day" },
            {
                type: "paragraph",
                text: "Georgia is Europe's best-kept budget secret. Tbilisi's charm, the wine region of Kakheti (free wine tastings!), and the Caucasus Mountains offer incredible value. Georgian hospitality is legendary, and a khinkali dumpling feast costs $3.",
            },
            { type: "heading", text: "13. Albania — ~$30–40/day" },
            {
                type: "paragraph",
                text: "Albania's Riviera offers Mediterranean beaches rivaling Greece and Croatia at a fraction of the price. Explore Berat (City of a Thousand Windows), the Blue Eye spring, and Gjirokastër's Ottoman architecture. The country is rapidly modernizing but still incredibly affordable.",
            },
            { type: "heading", text: "Africa" },
            { type: "heading", text: "14. Morocco — ~$30–45/day" },
            {
                type: "paragraph",
                text: "Marrakech's medina, the Sahara Desert, the blue city of Chefchaouen, and the Atlas Mountains — Morocco is a sensory feast. Riads (traditional guesthouses) start at $20–30 including breakfast. A tagine dinner costs $4–6. Haggling at the souks is half the fun.",
            },
            { type: "heading", text: "15. Egypt — ~$25–40/day" },
            {
                type: "paragraph",
                text: "The Pyramids of Giza, Luxor's Valley of the Kings, and the Red Sea's coral reefs — Egypt's history and natural beauty are unmatched. Budget hotels in Cairo start at $10, a falafel sandwich is $0.50, and a full-day Nile felucca sail with lunch is $15.",
            },
            { type: "heading", text: "Tips for Traveling on $50/Day" },
            {
                type: "list",
                items: [
                    "Eat where locals eat — street food and market stalls are cheaper and often better",
                    "Use public transport instead of taxis — buses and trains save 50–80%",
                    "Travel in shoulder season for lower prices and fewer crowds",
                    "Book accommodation with free breakfast included",
                    "Stay in hostels, guesthouses, or homestays instead of hotels",
                    "Cook your own meals when facilities are available",
                    "Walk as much as possible — it's free and the best way to discover a city",
                    "Use free walking tours (tip-based) as an introduction to each city",
                    "Negotiate prices at markets and for services (where culturally appropriate)",
                    "Track your spending daily with a simple notes app",
                ],
            },
            { type: "heading", text: "Start Planning Your Budget Adventure" },
            {
                type: "paragraph",
                text: "Budget travel isn't about depriving yourself — it's about prioritizing experiences over luxury. With $50/day, you can travel for months, not weeks. The world is more affordable and accessible than you think. Pick a destination, set a budget, and go. Your future self will thank you.",
            },
        ],
    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getPostBySlug(slug: string): BlogPost | undefined {
    return blogPosts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
    return blogPosts.map((p) => p.slug);
}
