import { useQuery } from '@tanstack/react-query';
import { SystemOptionsService } from '../services/system-options.service';

/**
 * Hook personnalisé pour récupérer et mettre en cache les options système.
 * Utilise React Query pour éviter de refaire des appels API inutiles.
 */
export const useSystemOptions = (category: string) => {
  return useQuery({
    queryKey: ['system-options', category],
    queryFn: () => SystemOptionsService.getByCategory(category),
    staleTime: 1000 * 60 * 60, // Les données restent fraîches pendant 1 heure
    retry: 2,
  });
};
