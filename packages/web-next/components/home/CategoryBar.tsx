"use client";

type Category = {
  id: string;
  name: string;
  icon: string;
};

const categories: Category[] = [
  { id: "all", name: "All", icon: "🌍" },
  { id: "beach", name: "Beach", icon: "🏖️" },
  { id: "mountain", name: "Mountain", icon: "⛰️" },
  { id: "city", name: "Iconic Cities", icon: "city" },
  { id: "luxury", name: "Luxury", icon: "💎" },
  { id: "budget", name: "Budget Friendly", icon: "💰" },
  { id: "adventure", name: "Adventure", icon: "🏄" },
  { id: "foodie", name: "Foodie", icon: "🍕" },
  { id: "history", name: "History", icon: "🏛️" },
  { id: "nature", name: "Nature", icon: "🌲" },
];

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="sticky top-[72px] z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`flex flex-col items-center gap-2 min-w-max group transition-all duration-200 ${
                selectedCategory === category.id
                  ? "text-slate-900 opacity-100"
                  : "text-slate-500 opacity-70 hover:opacity-100"
              }`}
            >
              <div
                className={`text-2xl transition-transform duration-200 ${
                  selectedCategory === category.id
                    ? "scale-110"
                    : "group-hover:scale-110"
                }`}
              >
                {category.id === "city" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                ) : (
                  category.icon
                )}
              </div>
              <span
                className={`text-xs font-bold whitespace-nowrap pb-2 border-b-2 transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "border-slate-900"
                    : "border-transparent group-hover:border-slate-300"
                }`}
              >
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
