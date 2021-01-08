export interface Coords {
    x: number;
    y: number;
    getX(): number;
    getY(): number;
    equals(coords: Coords): boolean;
    toString(): string;
    toLatLng(): LatLng;
}

export interface LatLng {
    latitude: number;
    longitude: number;
    getLat(): number;
    getLng(): number;
    equals(latlng: LatLng): boolean;
    toString(): string;
    toCoords(): Coords;
}

export const measure = (ll1: LatLng, ll2: LatLng): number => {
    const lat1 = ll1.getLat();
    const lon1 = ll1.getLng();
    const lat2 = ll2.getLat();
    const lon2 = ll2.getLng();

    const R = 6378.137;
    const dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
    const dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d * 1000; // meters
};

export const center = (ll1: LatLng, ll2: LatLng) => {
    const lat1 = ll1.getLat();
    const lon1 = ll1.getLng();
    const lat2 = ll2.getLat();
    const lon2 = ll2.getLng();

    return new kakao.maps.LatLng((lat1 + lat2) / 2, (lon1 + lon2) / 2);
};

export const mapLevel = {
    1: 20,
    2: 30,
    3: 50,
    4: 100,
    5: 250,
    6: 500,
    7: 1000,
    8: 2000,
    9: 4000,
    10: 8000,
    11: 16000,
    12: 32000,
    13: 64000,
    14: 128000,
};
