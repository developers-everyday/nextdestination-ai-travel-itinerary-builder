"use client";

type Category = {
  id: string;
  name: string;
  icon: string | React.ReactNode;
};

const CityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const categories: Category[] = [
  { id: "all",       name: "All",            icon: "🌍"     },
  { id: "beach",     name: "Beach",          icon: "🏖️"    },
  { id: "mountain",  name: "Mountain",       icon: "⛰️"    },
  { id: "city",      name: "Iconic Cities",  icon: <CityIcon /> },
  { id: "luxury",    name: "Luxury",         icon: "💎"     },
  { id: "budget",    name: "Budget Friendly",icon: "💰"     },
  { id: "adventure", name: "Adventure",      icon: "🏄"     },
  { id: "foodie",    name: "Foodie",         icon: "🍕"     },
  { id: "history",   name: "History",        icon: "🏛️"    },
  { id: "nature",    name: "Nature",         icon: "🌲"     },
];

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="sticky top-[68px] z-30 bg-white border-b border-[#EEECE9] shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border shrink-0 ${
                  isActive
                    ? "text-white border-transparent shadow-sm"
                    : "text-[#6B6863] border-[#EEECE9] bg-white hover:bg-[#FFF0F0] hover:text-[#FF5A5A] hover:border-[#FFD0D0]"
                }`}
                style={isActive ? {
                  background: "linear-gradient(135deg, #FF5A5A 0%, #FF8C00 100%)",
                  borderColor: "transparent",
                } : {}}
              >
                <span className={`text-base leading-none ${isActive ? "" : "opacity-80"}`}>
                  {cat.icon}
                </span>
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
