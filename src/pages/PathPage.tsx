import { createContext, useEffect, useRef, useState } from 'react';
import PathDraw from '../components/PathDraw';
import { LatLng } from '../utils/map';

const geocoder = new kakao.maps.services.Geocoder();

export type PathPhase =
    | 'searchStarting'
    | 'confirmStarting'
    | 'searchDestination'
    | 'confirmDestination'
    | 'confirmBoth'
    | 'draw'
    | 'viewPath';

export const PathContext = createContext<LatLng[]>([]);

function PathPage() {
    // const [phase, setPhase] = useState<PathPhase>('searchStarting');
    const [phase, setPhase] = useState<PathPhase>('viewPath');

    const [startingKeyword, setStartingKeyword] = useState('');
    const [destinationKeyword, setDestinationKeyword] = useState('');

    const [starting, setStarting] = useState<LatLng | null>(null);
    const [destination, setDestination] = useState<LatLng | null>(null);
    const [bounds, setBounds] = useState<any>(null);

    const startingInput = useRef<HTMLInputElement>(null);
    const destinationInput = useRef<HTMLInputElement>(null);

    const path: LatLng[] = JSON.parse(window.localStorage.getItem('myPath') || '');
    // const path: LatLng[] = [];

    useEffect(() => {
        if (starting && destination && phase === 'confirmBoth') {
            // console.log(measure(starting, destination));

            const bounds = new kakao.maps.LatLngBounds();
            bounds.extend(starting);
            bounds.extend(destination);

            setBounds(bounds);
        }
    }, [starting, destination, phase]);

    useEffect(() => {
        if (phase === 'searchStarting') {
            startingInput.current?.focus();
        }
        if (phase === 'searchDestination') {
            destinationInput.current?.focus();
        }
    }, [phase]);

    const searchStarting = () => {
        geocoder.addressSearch(startingKeyword, function (result: any, status: string) {
            if (status === kakao.maps.services.Status.OK) {
                const latLng: LatLng = new kakao.maps.LatLng(result[0].y, result[0].x);
                console.log(latLng);
                setStarting(latLng);
                setPhase('confirmStarting');
            }
        });
    };

    const searchDestination = () => {
        geocoder.addressSearch(destinationKeyword, function (result: any, status: string) {
            if (status === kakao.maps.services.Status.OK) {
                const latLng: LatLng = new kakao.maps.LatLng(result[0].y, result[0].x);
                console.log(latLng);
                setDestination(latLng);
                setPhase('confirmDestination');
            }
        });
    };

    const confirmBoth = () => {
        setPhase('draw');
    };

    const uploadPath = () => {
        console.log(path);
        window.localStorage.setItem('myPath', JSON.stringify(path));
    };

    return (
        <div className="PathPage">
            {phase === 'searchStarting' && (
                <>
                    <p>어디서 출발해요?</p>
                    <div>
                        <input
                            type="text"
                            value={startingKeyword}
                            onChange={(e) => setStartingKeyword(e.target.value)}
                            ref={startingInput}
                        />
                        <button onClick={searchStarting}>검색</button>
                    </div>
                </>
            )}
            {phase === 'searchDestination' && (
                <>
                    <p>어디까지 가요?</p>
                    <div>
                        <input
                            type="text"
                            value={destinationKeyword}
                            onChange={(e) => setDestinationKeyword(e.target.value)}
                            ref={destinationInput}
                        />
                        <button onClick={searchDestination}>검색</button>
                    </div>
                </>
            )}

            <PathContext.Provider value={path}>
                <PathDraw
                    phase={phase}
                    starting={starting}
                    destination={destination}
                    bounds={bounds}
                    setStarting={setStarting}
                    setDestination={setDestination}
                    setPhase={setPhase}
                />
            </PathContext.Provider>

            {phase === 'confirmBoth' && <button onClick={confirmBoth}>확인</button>}

            {phase === 'draw' && <button onClick={uploadPath}>업로드</button>}
        </div>
    );
}

export default PathPage;
