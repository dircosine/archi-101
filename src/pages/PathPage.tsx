import axios from 'axios';
import { createContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import PathDraw from '../components/PathDraw';
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
    setIsArrival: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PathContext = createContext<PathContextType>({
    othersPath: [],
    myPath: [],
    setMyPath: () => {},
    setIsArrival: () => {},
});

function PathPage() {
    const params = useParams<{ destination: string }>();

    const [phase, setPhase] = useState<PathPhase>('searchStarting');
    // const [phase, setPhase] = useState<PathPhase>('draw');
    const [othersPath, setOtherPath] = useState<Path[]>([]);
    const [myPath, setMyPath] = useState<LatLng[]>([]);
    const [isArrival, setIsArrival] = useState(false);

    const startingKeyword = useInput('');
    const destinationKeyword = useInput('');

    const [starting, setStarting] = useState<LatLng | null>(null);
    // const [starting, setStarting] = useState<LatLng | null>(new kakao.maps.LatLng(37.4918782, 127.0324566));
    const [destination, setDestination] = useState<LatLng | null>(null);
    const [bounds, setBounds] = useState<any>(null);

    const startingInput = useRef<HTMLInputElement>(null);
    const destinationInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchPaths = async () => {
            const { data: pathsKeys } = await axios.get<string[]>('http://localhost:4000/common/keys');

            console.log(pathsKeys);
            const results = await Promise.all(
                pathsKeys.map((key) => axios.get<Path>(`https://archi101.s3.ap-northeast-2.amazonaws.com/${key}`)),
            );

            setOtherPath(results.map((res) => res.data));
        };

        fetchPaths();
    }, []);

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

    const undo = () => {
        if (myPath.length <= 1) {
            return;
        }
        const newMyPath = myPath.slice(0, -8);
        if (!newMyPath.length) {
            newMyPath.push(starting!);
        }
        setMyPath(newMyPath);
    };

    const uploadPath = async (path: Path) => {
        const blob = new Blob([JSON.stringify(path)], { type: 'application/json' });
        console.log(blob);

        let fileName = `${path.id}.json`;
        let fileType = 'application/json';

        const { data: signRes } = await axios.post('http://localhost:4000/common/sign_s3', {
            fileName: fileName,
            fileType: fileType,
        });

        await axios.put(signRes.signedRequest, blob, {
            headers: {
                'Content-Type': fileType,
            },
        });
    };

    const handleArrival = () => {
        const pathId = uuidv4();
        const path: Path = {
            id: pathId,
            coords: myPath,
            starting: starting!,
            destination: destination!,
        };
        const myPathIds = JSON.parse(window.localStorage.getItem('myPathIds') || '[]');
        window.localStorage.setItem('myPathIds', JSON.stringify([...myPathIds, pathId]));

        uploadPath(path);
    };

    return (
        <div className="PathPage">
            <section className="map">
                <PathContext.Provider value={{ othersPath, myPath, setMyPath, setIsArrival }}>
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
                    <div className="controls">
                        <button onClick={undo}>undo</button>
                        <button onClick={handleArrival} disabled={!isArrival}>
                            도착!
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}

export default PathPage;
