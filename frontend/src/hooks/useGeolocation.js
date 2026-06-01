import { useCallback, useState } from 'react';

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device');
      return Promise.reject(new Error('Geolocation not supported'));
    }
    setLoading(true);
    setError(null);
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setCoords(result);
          setLoading(false);
          resolve(result);
        },
        (err) => {
          const message =
            err.code === 1
              ? 'Location permission denied'
              : err.code === 2
                ? 'Location unavailable'
                : 'Could not get location';
          setError(message);
          setLoading(false);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }, []);

  return { coords, error, loading, getPosition };
}
