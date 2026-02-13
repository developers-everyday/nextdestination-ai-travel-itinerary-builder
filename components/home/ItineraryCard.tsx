import React from 'react';

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
    isGuestFavorite
}) => {
    return (
        <div className="group cursor-pointer">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-200 mb-3">
                <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Favorite Button */}
                <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/70 hover:text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>


            </div>

            <div className="flex justify-between items-start gap-2">
                <div>
                    <h3 className="font-bold text-slate-900 text-[15px] leading-tight group-hover:underline decoration-1 underline-offset-2 decoration-transparent group-hover:decoration-slate-900 transition-all">{location}</h3>
                    <p className="text-slate-500 text-[15px] mt-0.5">{title}</p>
                    <p className="text-slate-500 text-[15px] mt-0.5">{days} days</p>
                    <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="font-bold text-slate-900 text-[15px]">${price}</span>
                        <span className="text-slate-900 text-[15px]">total</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-[15px]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-900 fill-slate-900" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-slate-900">{rating}</span>
                </div>
            </div>
        </div>
    );
};

export default ItineraryCard;
