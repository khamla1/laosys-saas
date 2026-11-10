import { useState, useEffect } from "react";
import { DateRangeType } from "@/lib/analytics";

interface AnalyticsData<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAnalytics<T>(endpoint: string, range: DateRangeType): AnalyticsData<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/analytics/${endpoint}?range=${range}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return res.json();
      })
      .then(json => {
        if (isMounted) {
          setData(json);
          setIsLoading(false);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [endpoint, range]);

  return { data, isLoading, error };
}
