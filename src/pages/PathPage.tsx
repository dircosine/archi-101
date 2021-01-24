import { createContext, useEffect, useRef, useState } from 'react';
import PathDraw from '../components/PathDraw';
import useInput from '../hooks/useInput';
import { LatLng } from '../utils/map';

import { v4 as uuidv4 } from 'uuid';

const geocoder = new kakao.maps.services.Geocoder();

export type PathPhase =
    | 'searchStarting'
    | 'confirmStarting'
    | 'searchDestination'
    | 'confirmDestination'
    | 'confirmBoth'
    | 'draw'
    | 'viewPath';

type Path = {
    id: string; // uuid
    user?: string; // email
    coords: LatLng[]; // 경로 좌표들
    starting: LatLng;
    destination: LatLng;
};

export type PathContextType = {
    others: Path[];
    my: LatLng[];
};

export const PathContext = createContext<PathContextType>({
    others: [],
    my: [],
});

const myPath: LatLng[] = [];
const othersPath: Path[] = JSON.parse(window.localStorage.getItem('paths') || '[]');

function PathPage() {
    const [phase, setPhase] = useState<PathPhase>('searchStarting');
    // const [phase, setPhase] = useState<PathPhase>('draw');

    const startingKeyword = useInput('');
    const destinationKeyword = useInput('');

    const [starting, setStarting] = useState<LatLng | null>(null);
    // const [starting, setStarting] = useState<LatLng | null>(new kakao.maps.LatLng(37.4918782, 127.0324566));
    const [destination, setDestination] = useState<LatLng | null>(null);
    const [bounds, setBounds] = useState<any>(null);

    const startingInput = useRef<HTMLInputElement>(null);
    const destinationInput = useRef<HTMLInputElement>(null);

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
        geocoder.addressSearch(startingKeyword.value, function (result: any, status: string) {
            if (status === kakao.maps.services.Status.OK) {
                const latLng: LatLng = new kakao.maps.LatLng(result[0].y, result[0].x);
                console.log(latLng);
                setStarting(latLng);
                setPhase('confirmStarting');
            }
        });
    };

    const searchDestination = () => {
        geocoder.addressSearch(destinationKeyword.value, function (result: any, status: string) {
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
        const pathId = uuidv4();
        const path: Path = {
            id: pathId,
            coords: myPath,
            starting: starting!,
            destination: destination!,
        };
        window.localStorage.setItem('paths', JSON.stringify([...othersPath, path]));

        const myPathIds = JSON.parse(window.localStorage.getItem('myPathIds') || '[]');
        window.localStorage.setItem('myPathIds', JSON.stringify([...myPathIds, pathId]));
    };

    return (
        <div className="PathPage">
            <PathContext.Provider value={{ others: othersPath, my: myPath }}>
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

            {phase === 'searchStarting' && (
                <div className="searchWrap">
                    <p>어디서 출발해요?</p>
                    <input type="text" ref={startingInput} {...startingKeyword} />
                    <button onClick={searchStarting}>검색</button>
                </div>
            )}
            {phase === 'searchDestination' && (
                <div className="searchWrap">
                    <p>어디까지 가요?</p>
                    <input type="text" ref={destinationInput} {...destinationKeyword} />
                    <button onClick={searchDestination}>검색</button>
                </div>
            )}

            {phase === 'confirmBoth' && <button onClick={confirmBoth}>확인</button>}

            {phase === 'draw' && <button onClick={uploadPath}>업로드</button>}
        </div>
    );
}

export default PathPage;
