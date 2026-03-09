export interface ItineraryCardProps {
  id: string;
  title: string;
  location: string;
  image: string;
  rating: number;
  days: number;
  price: number;
  category: string;
  isGuestFavorite?: boolean;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({
  title,
  location,
  image,
  rating,
  days,
  price,
  isGuestFavorite,
}) => {
  return (
    <div className="group cursor-pointer">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F0EFED] mb-3">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Guest Favorite badge */}
        {isGuestFavorite && (
          <div className="absolute top-3 left-3">
            <span className="bg-white text-[#1A1A1A] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              Guest Favorite
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all shadow-sm">
          <svg className="w-4 h-4 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Duration badge */}
        <div className="absolute bottom-3 left-3">
          <span
            className="text-white text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "linear-gradient(135deg, #FF5A5A, #FF8C00)" }}
          >
            {days} {days === 1 ? "Day" : "Days"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-[#1A1A1A] text-[14px] leading-snug truncate group-hover:text-[#FF5A5A] transition-colors">
            {location}
          </h3>
          <p className="text-[#6B6863] text-[13px] mt-0.5 truncate">{title}</p>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-bold text-[#1A1A1A] text-[14px]">${price.toLocaleString()}</span>
            <span className="text-[#9C9891] text-[13px]">total</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 shrink-0">
          <svg className="w-3.5 h-3.5 text-[#FF5A5A] fill-[#FF5A5A]" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-[#1A1A1A] font-semibold text-[13px]">{rating}</span>
        </div>
      </div>
    </div>
  );
};

export default ItineraryCard;
