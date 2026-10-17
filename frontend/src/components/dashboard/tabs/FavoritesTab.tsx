"use client";

import { Star, RefreshCw } from "lucide-react";
import { ORIGIN_DETAILS } from "../dashboardData";

interface FavoritesTabProps {
  favorites: { [key: string]: { rating: number; note: string; isFavorite: boolean } };
  activeOriginName?: string;
  onRateCoffee: (originName: string, stars: number) => void;
  onSwapCoffee: (originName: string) => void;
}

export default function FavoritesTab({
  favorites,
  activeOriginName,
  onRateCoffee,
  onSwapCoffee,
}: FavoritesTabProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E6DEC8] p-6 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-2xl font-serif font-bold text-[#1A1512]">
            Coffee Favorites & Roastery Wishlist
          </h3>
          <p className="text-xs text-[#5C5042] mt-1">
            Rate your favorite mountain origins and swap your upcoming monthly box with a single click.
          </p>
        </div>
        <span className="text-xs uppercase tracking-widest font-bold text-[#2E6B34] bg-[#E7F3E8] px-3.5 py-1.5 rounded-full border border-[#C3E4C6] self-start sm:self-auto">
          3 Origins Available to Swap
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(ORIGIN_DETAILS).map(([name, data]) => {
          const fav = favorites[name] || { rating: 5, note: "", isFavorite: true };
          const isCurrentActive = activeOriginName === name;

          return (
            <div
              key={name}
              className="bg-white border border-[#E6DEC8] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="h-48 relative overflow-hidden">
                  <img src={data.img} alt={name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <span className="absolute top-3 left-3 bg-[#1A1512]/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded">
                    {data.altitude}
                  </span>
                  {isCurrentActive && (
                    <span className="absolute top-3 right-3 bg-[#2E6B34] text-white text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded">
                      ✓ Currently In Upcoming Box
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-[10px] uppercase font-bold text-[#E58A1F]">{data.region}</p>
                    <h4 className="text-xl font-serif font-bold text-white">{name}</h4>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {data.notes.map((n) => (
                      <span
                        key={n}
                        className="text-[11px] px-2 py-0.5 bg-[#FAF8F5] text-[#1A1512] border border-[#E6DEC8] rounded"
                      >
                        {n}
                      </span>
                    ))}
                  </div>

                  {/* Interactive Star Rating */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-1">
                      Your Personal Tasting Rating:
                    </p>
                    <div className="flex items-center gap-1 text-[#E58A1F]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => onRateCoffee(name, s)}
                          className="hover:scale-125 transition-transform cursor-pointer"
                          title={`Rate ${s} stars`}
                        >
                          <Star
                            size={16}
                            fill={s <= fav.rating ? "#E58A1F" : "none"}
                            stroke="#E58A1F"
                          />
                        </button>
                      ))}
                      <span className="text-xs text-[#5C5042] ml-2 font-bold">{fav.rating} / 5</span>
                    </div>
                  </div>

                  {/* Tasting Note */}
                  <div className="p-3 bg-[#FAF8F5] border border-[#E6DEC8] rounded-lg">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A7966] mb-0.5">
                      Tasting Note
                    </p>
                    <p className="text-xs text-[#5C5042] italic">"{fav.note}"</p>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                {isCurrentActive ? (
                  <div className="w-full py-2.5 bg-[#E7F3E8] text-[#2E6B34] text-xs uppercase tracking-widest font-bold text-center rounded-xl border border-[#C3E4C6]">
                    Active Selection
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSwapCoffee(name)}
                    className="w-full py-2.5 bg-[#1A1512] hover:bg-[#A3432A] text-white text-xs uppercase tracking-widest font-bold text-center rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={13} /> Swap Into Next Box
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
