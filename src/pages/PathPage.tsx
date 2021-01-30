import { createContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import PathDraw, { DrawControl } from '../components/PathDraw';
import useInput from '../hooks/useInput';
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

type Path = {
    id: string; // uuid
    user?: string; // email
    coords: LatLng[]; // 경로 좌표들
    starting: LatLng;
    destination: LatLng;
};

export type PathContextType = {
    othersPath: Path[];
    myPath: LatLng[];
    setMyPath: React.Dispatch<React.SetStateAction<LatLng[]>>;
};

export const PathContext = createContext<PathContextType>({
    othersPath: [],
    myPath: [],
    setMyPath: () => {},
});

const othersPath: Path[] = JSON.parse(window.localStorage.getItem('paths') || '[]');

function PathPage() {
    // const [phase, setPhase] = useState<PathPhase>('searchStarting');
    const [phase, setPhase] = useState<PathPhase>('draw');
    const [myPath, setMyPath] = useState<LatLng[]>([]);

    const startingKeyword = useInput('');
    const destinationKeyword = useInput('');

    // const [starting, setStarting] = useState<LatLng | null>(null);
    const [starting, setStarting] = useState<LatLng | null>(new kakao.maps.LatLng(37.4918782, 127.0324566));
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

    const handleConfirm = () => {
        if (phase === 'confirmStarting') {
            setPhase('searchDestination');
        }
        if (phase === 'confirmDestination') {
            setPhase('confirmBoth');
        }
        if (phase === 'confirmBoth') {
            setPhase('draw');
        }
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

    const undo = () => {
        setMyPath(myPath.slice(0, -5));
    };

    return (
        <div className="PathPage">
            <section className="map">
                <PathContext.Provider value={{ othersPath, myPath, setMyPath }}>
                    <PathDraw
                        phase={phase}
                        starting={starting}
                        destination={destination}
                        bounds={bounds}
                        setStarting={setStarting}
                        setDestination={setDestination}
                    />
                </PathContext.Provider>
            </section>

            <section className="control">
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

                {['confirmStarting', 'confirmDestination'].includes(phase) && (
                    <button onClick={handleConfirm}>확인</button>
                )}

                {phase === 'confirmBoth' && <button onClick={handleConfirm}>출발!</button>}

                {phase === 'draw' && (
                    <div className="tools">
                        <button onClick={undo}>undo</button>
                        <button onClick={uploadPath}>업로드</button>
                    </div>
                )}
            </section>
        </div>
    );
}

export default PathPage;
