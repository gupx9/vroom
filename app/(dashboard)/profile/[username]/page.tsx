import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/app/actions/profile';
import ProfileActions from '@/app/components/ProfileActions';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

function ReputationBadge({ score }: { score: number }) {
  let colorClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
  if (score > 50) colorClass = 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50';
  else if (score > 0) colorClass = 'bg-green-900/40 text-green-400 border-green-700/50';
  else if (score < 0) colorClass = 'bg-red-900/40 text-red-400 border-red-800/50';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${colorClass}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      {score >= 0 ? `+${score}` : score} rep
    </span>
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const result = await getPublicProfile(username);

  if ('error' in result && result.error === 'User not found') notFound();
  if ('error' in result) return null;

  const { user, currentUserId, existingReview, existingReport } = result;
  const isOwnProfile = currentUserId === user.id;

  const joinedYear = new Date(user.createdAt).getFullYear();
  const totalItems = user.cars.length + user.dioramas.length;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Avatar + info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-zinc-300 uppercase">
                {user.username.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">@{user.username}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <ReputationBadge score={user.reputation} />
                <span className="text-zinc-600 text-xs">
                  Member since {joinedYear}
                </span>
                <span className="text-zinc-600 text-xs">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} in collection
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons — only shown to other users */}
          {!isOwnProfile && (
            <ProfileActions
              targetUserId={user.id}
              targetUsername={user.username}
              initialReview={existingReview ?? null}
              initialReport={existingReport ?? null}
            />
          )}
          {isOwnProfile && (
            <span className="text-xs text-zinc-600 italic">This is your profile</span>
          )}
        </div>
      </div>

      {/* Showcase */}
      {totalItems === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <svg className="mx-auto mb-4 opacity-40" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 4v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <p className="text-zinc-500 font-medium">No items in collection yet</p>
        </div>
      ) : (
        <>
          {/* Cars */}
          {user.cars.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                Die-cast Cars <span className="text-zinc-700">({user.cars.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {user.cars.map((car) => (
                  <div
                    key={car.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg hover:border-zinc-600 hover:shadow-red-900/10 transition-all duration-200 flex flex-col group"
                  >
                    <div className="aspect-video overflow-hidden bg-zinc-950 relative">
                      {car.imageData ? (
                        <img
                          src={car.imageData}
                          alt={`${car.brand} ${car.carModel}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                      )}
                      {car.forSale && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-900/80 text-green-300 text-[10px] font-bold uppercase tracking-wider border border-green-700/60">
                          For Sale
                        </span>
                      )}
                      {car.forTrade && !car.forSale && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-900/80 text-yellow-300 text-[10px] font-bold uppercase tracking-wider border border-yellow-700/60">
                          For Trade
                        </span>
                      )}
                      {car.forTrade && car.forSale && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-yellow-900/80 text-yellow-300 text-[10px] font-bold uppercase tracking-wider border border-yellow-700/60">
                          For Trade
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1 space-y-1">
                      <p className="text-white font-semibold text-sm leading-tight">{car.brand || '—'}</p>
                      <p className="text-zinc-400 text-sm">{car.carModel || '—'}</p>
                      <p className="text-zinc-500 text-xs">{car.size} · {car.condition}</p>
                    </div>
                    {car.forSale && (
                      <div className="px-4 pb-4">
                        <p className="text-red-400 font-bold text-sm">৳{car.sellingPrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dioramas */}
          {user.dioramas.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                Dioramas <span className="text-zinc-700">({user.dioramas.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {user.dioramas.map((d) => (
                  <div
                    key={d.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg hover:border-zinc-600 hover:shadow-red-900/10 transition-all duration-200 flex flex-col group"
                  >
                    <div className="aspect-video overflow-hidden bg-zinc-950 relative">
                      {d.imageData ? (
                        <img
                          src={d.imageData}
                          alt="Diorama"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          </svg>
                        </div>
                      )}
                      {d.forSale && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-900/80 text-green-300 text-[10px] font-bold uppercase tracking-wider border border-green-700/60">
                          For Sale
                        </span>
                      )}
                      {d.forTrade && !d.forSale && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-900/80 text-yellow-300 text-[10px] font-bold uppercase tracking-wider border border-yellow-700/60">
                          For Trade
                        </span>
                      )}
                      {d.forTrade && d.forSale && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-yellow-900/80 text-yellow-300 text-[10px] font-bold uppercase tracking-wider border border-yellow-700/60">
                          For Trade
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-zinc-300 text-sm line-clamp-3">{d.description}</p>
                    </div>
                    {d.forSale && (
                      <div className="px-4 pb-4">
                        <p className="text-red-400 font-bold text-sm">৳{d.sellingPrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
