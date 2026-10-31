import type { CustomError } from "@/utils/exception";
import { useEffect, useState } from "react";

export const useFetch = <T>(
  asyncFunction: () => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependencyList: any[] = [],
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | CustomError | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await asyncFunction();
        setData(result);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, dependencyList);

  return { data, loading, error };
};
