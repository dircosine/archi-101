import axios from 'axios';
import { createContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import queryString from 'query-string';

import PathDraw from '../components/PathDraw';
import useInput from '../hooks/useInput';
import { LatLng } from '../utils/map';

import './PathPage.scss';

const geocoder = new kakao.maps.services.Geocoder();

export type PathPhase =
    | 'searchStarting'
    | 'confirmStarting'
    | 'searchDestination'
    | 'confirmDestination'
    | 'confirmBoth'
    | 'draw'
    | 'done';

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
    const location = useLocation();
    const { dest } = queryString.parse(location.search);

    const [phase, setPhase] = useState<PathPhase>('searchStarting');
    // const [phase, setPhase] = useState<PathPhase>('done');
    const [othersPath, setOtherPath] = useState<Path[]>([]);
    const [myPath, setMyPath] = useState<LatLng[]>([]);
    const [isArrival, setIsArrival] = useState(false);
    const [copied, setCopied] = useState(false);

    const startingKeyword = useInput('');
    const destinationKeyword = useInput('');

    const [starting, setStarting] = useState<LatLng | null>(null);
    // const [starting, setStarting] = useState<LatLng | null>(new kakao.maps.LatLng(37.4918782, 127.0324566));
    const [destination, setDestination] = useState<LatLng | null>(null);
    const [bounds, setBounds] = useState<any>(null);

    const startingInput = useRef<HTMLInputElement>(null);
    const destinationInput = useRef<HTMLInputElement>(null);

    const fetchPaths = async () => {
        const { data } = await axios.get<{ statusCode: number; body: string }>(
            'https://ii7sy8a53m.execute-api.ap-northeast-2.amazonaws.com/default/archi101-getPathsKeys',
        );
        const pathsKeys: Path[] = JSON.parse(data.body);
        const results = await Promise.all(
            pathsKeys.map((key) => axios.get<Path>(`https://archi101.s3.ap-northeast-2.amazonaws.com/${key}`)),
        );

        setOtherPath(results.map((res) => res.data));
    };

    useEffect(() => {
        fetchPaths();
    }, []);

    useEffect(() => {
        if (dest) {
            const [long, lat] = (dest as string).split(',');
            setDestination(new kakao.maps.LatLng(long, lat));
        }
    }, [dest]);

    useEffect(() => {
        if (starting && destination && phase === 'confirmBoth') {
            const bounds = new kakao.maps.LatLngBounds();
            bounds.extend(starting);
            bounds.extend(destination);

            setBounds(bounds);
        }
    }, [starting, destination, phase]);

    const searchStarting = () => {
        geocoder.addressSearch(startingKeyword.value, function (result: any, status: string) {
            if (status === kakao.maps.services.Status.OK) {
                const latLng: LatLng = new kakao.maps.LatLng(result[0].y, result[0].x);
                console.log(latLng);
                setStarting(latLng);
                setPhase('confirmStarting');
                setStarting(null);
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
                setDestination(null);
            }
        });
    };

    const handleConfirm = () => {
        if (phase === 'confirmStarting') {
            if (dest) {
                setPhase('confirmBoth');
            } else {
                setPhase('searchDestination');
            }
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

        const { data } = await axios.post(
            'https://ii7sy8a53m.execute-api.ap-northeast-2.amazonaws.com/default/archi101-gets3signedurl-api',
            {
                fileName: fileName,
                fileType: fileType,
            },
        );

        const signedRequest = JSON.parse(data.body);

        await axios.put(signedRequest, blob, {
            headers: {
                'Content-Type': fileType,
            },
        });
    };

    const handleArrival = async () => {
        const pathId = uuidv4();
        const path: Path = {
            id: pathId,
            coords: myPath,
            starting: starting!,
            destination: destination!,
        };
        const myPathIds = JSON.parse(window.localStorage.getItem('myPathIds') || '[]');
        window.localStorage.setItem('myPathIds', JSON.stringify([...myPathIds, pathId]));

        await uploadPath(path);

        fetchPaths();
        setPhase('done');
    };

    const handleSearchInputFocus = () => {
        if (phase === 'confirmStarting') {
            setPhase('searchStarting');
        }
        if (phase === 'confirmDestination') {
            setPhase('searchDestination');
        }
    };

    const hanldeShare = () => {
        console.log(destination);
    };

    const destLink = `${window.location.href.split('/').slice(0, 3).join('/')}?dest=${destination?.Ma},${
        destination?.La
    }`;

    return (
        <div className="PathPage">
            <section className="map">
                <PathContext.Provider value={{ othersPath, myPath, setMyPath, setIsArrival }}>
                    <PathDraw
                        phase={phase}
                        starting={starting}
                        destination={destination}
                        bounds={bounds}
                        setPhase={setPhase}
                        setStarting={setStarting}
                        setDestination={setDestination}
                    />
                </PathContext.Provider>
            </section>

            <section className="control searchWrap">
                {/* *** starting *** */}
                {phase === 'searchStarting' && <p>어디서 출발해요?</p>}
                {(phase === 'searchStarting' || phase === 'confirmStarting') && (
                    <input
                        type="text"
                        ref={startingInput}
                        autoFocus
                        onFocus={handleSearchInputFocus}
                        {...startingKeyword}
                    />
                )}
                {phase === 'searchStarting' && (
                    <button onClick={searchStarting} disabled={!startingKeyword.value}>
                        검색
                    </button>
                )}
                {phase === 'confirmStarting' && (
                    <div>
                        <p style={{ backgroundColor: 'white' }}>
                            출발하는 곳에{' '}
                            <img
                                className="sticker-desc"
                                src="https://archi101.s3.ap-northeast-2.amazonaws.com/assets/sticker_drag.svg"
                                alt="red sticker"
                            />
                            빨간색 스티커를 붙여볼게요
                        </p>
                        <button onClick={handleConfirm} disabled={!starting}>
                            다음!
                        </button>
                    </div>
                )}

                {/* *** destination *** */}
                {phase === 'searchDestination' && <p>어디까지 가요?</p>}
                {(phase === 'searchDestination' || phase === 'confirmDestination') && (
                    <input
                        type="text"
                        ref={destinationInput}
                        autoFocus
                        onFocus={handleSearchInputFocus}
                        {...destinationKeyword}
                    />
                )}
                {phase === 'searchDestination' && (
                    <button onClick={searchDestination} disabled={!destinationKeyword.value}>
                        검색
                    </button>
                )}
                {phase === 'confirmDestination' && (
                    <div>
                        <p style={{ backgroundColor: 'white' }}>
                            도착하는 곳에는{' '}
                            <img
                                className="sticker-desc"
                                src="https://archi101.s3.ap-northeast-2.amazonaws.com/assets/sticker_blue_drag.svg"
                                alt="red sticker"
                            />
                            파란색 스티커를 붙일게요
                        </p>
                        <button onClick={handleConfirm} disabled={!destination}>
                            다음!
                        </button>
                    </div>
                )}

                {/* *** both *** */}
                {phase === 'confirmBoth' && <button onClick={handleConfirm}>출발!</button>}

                {/* *** draw *** */}
                {phase === 'draw' && (
                    <>
                        <p>삐뚤빼뚤, 펜을 잡고 목적지까지 가는 길을 그려봐요 🖍</p>
                        <div className="controls">
                            <button onClick={undo}> </button>
                            <button className="last-button" onClick={handleArrival} disabled={!isArrival}>
                                도착!
                            </button>
                        </div>
                    </>
                )}

                {/* *** done *** */}
                {phase === 'done' && (
                    <>
                        <p>🎉🎉🎉</p>
                        <div>
                            <CopyToClipboard text={destLink} onCopy={() => setCopied(true)}>
                                <button onClick={hanldeShare}>같은 목적지로 공유하기</button>
                            </CopyToClipboard>
                            {copied ? <span>링크 복사됨!</span> : null}
                        </div>
                        <Link to="/homework">다음!</Link>
                    </>
                )}
            </section>
        </div>
    );
}

export default PathPage;
