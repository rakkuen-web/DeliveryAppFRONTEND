// City detection based on GPS coordinates
export const detectCity = (latitude, longitude) => {
  const cities = {
    marrakech: {
      name: 'Marrakech',
      center: [31.6295, -7.9811],
      bounds: {
        north: 31.7,
        south: 31.55,
        east: -7.9,
        west: -8.1
      }
    },
    casablanca: {
      name: 'Casablanca',
      center: [33.5731, -7.5898],
      bounds: {
        north: 33.65,
        south: 33.5,
        east: -7.5,
        west: -7.7
      }
    },
    rabat: {
      name: 'Rabat',
      center: [34.0209, -6.8416],
      bounds: {
        north: 34.1,
        south: 33.95,
        east: -6.7,
        west: -6.9
      }
    }
  };

  // Check which city the coordinates fall into
  for (const [key, city] of Object.entries(cities)) {
    if (
      latitude >= city.bounds.south &&
      latitude <= city.bounds.north &&
      longitude >= city.bounds.west &&
      longitude <= city.bounds.east
    ) {
      return {
        key,
        name: city.name,
        center: city.center
      };
    }
  }

  // Default to Marrakech if no match
  return {
    key: 'marrakech',
    name: 'Marrakech',
    center: cities.marrakech.center
  };
};

// Get user's city and store in localStorage
export const getUserCity = () => {
  return new Promise((resolve) => {
    const savedCity = localStorage.getItem('userCity');
    if (savedCity) {
      resolve(JSON.parse(savedCity));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const city = detectCity(position.coords.latitude, position.coords.longitude);
        localStorage.setItem('userCity', JSON.stringify(city));
        resolve(city);
      },
      () => {
        // Default to Marrakech
        const defaultCity = {
          key: 'marrakech',
          name: 'Marrakech',
          center: [31.6295, -7.9811]
        };
        localStorage.setItem('userCity', JSON.stringify(defaultCity));
        resolve(defaultCity);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    );
  });
};