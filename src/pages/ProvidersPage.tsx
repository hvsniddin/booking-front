import React, { useState, useEffect } from 'react';
import { providersApi, servicesApi } from '../api/endpoints';
import { Provider, Service } from '../types';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, CalendarCheck, Globe, CheckCircle2 } from 'lucide-react';

export const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [provRes, servRes] = await Promise.all([
        providersApi.list({ is_active: true }),
        servicesApi.list({ is_active: true }),
      ]);

      const provList = Array.isArray(provRes) ? provRes : provRes.results || [];
      const servList = Array.isArray(servRes) ? servRes : servRes.results || [];

      setProviders(provList);
      setServices(servList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getServiceNames = (servicesList: any[]) => {
    if (!servicesList || !Array.isArray(servicesList)) return [];
    return servicesList
      .map((item) => {
        if (typeof item === 'object' && item?.name) return item.name;
        if (typeof item === 'number') return services.find((s) => s.id === item)?.name;
        return null;
      })
      .filter(Boolean);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Specialists & Providers
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Meet our verified professional team and find the right expert for your needs.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-lg">No active providers available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => {
            const offered = getServiceNames(provider.services || []);
            return (
              <div
                key={provider.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-brand-500/20">
                      {provider.name ? provider.name[0] : 'P'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {provider.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Specialist
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                    {provider.bio || 'Professional service specialist ready to assist you.'}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    {provider.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{provider.email}</span>
                      </div>
                    )}
                    {provider.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{provider.phone_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Timezone: {provider.timezone || 'UTC'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Services Provided:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {offered.length > 0 ? (
                        offered.map((sName, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium"
                          >
                            {sName}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">All general services</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/book?provider_id=${provider.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition dark:bg-brand-600 dark:hover:bg-brand-700"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Book with {provider.name.split(' ')[0]}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
