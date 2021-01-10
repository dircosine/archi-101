import { useEffect, useRef, useState } from 'react';

import { LatLng, measure, Path, Point } from './utils/map';

import './App.scss';

declare global {
    interface Window {
        kakao: any;
    }
}

const geocoder = new kakao.maps.services.Geocoder();

const startSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png',
    startSize = new kakao.maps.Size(50, 45),
    startOption = {
        offset: new kakao.maps.Point(15, 43),
    };

const startingImage = new kakao.maps.MarkerImage(startSrc, startSize, startOption);
const startDragSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_drag.png',
    startDragSize = new kakao.maps.Size(50, 64),
    startDragOption = {
        offset: new kakao.maps.Point(15, 54),
    };

const startingDragImage = new kakao.maps.MarkerImage(startDragSrc, startDragSize, startDragOption);

const arriveSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png',
    arriveSize = new kakao.maps.Size(50, 45),
    arriveOption = {
        offset: new kakao.maps.Point(15, 43),
    };

const destinationImage = new kakao.maps.MarkerImage(arriveSrc, arriveSize, arriveOption);
const arriveDragSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_drag.png',
    arriveDragSize = new kakao.maps.Size(50, 64),
    arriveDragOption = {
        offset: new kakao.maps.Point(15, 54),
    };

const destinationDragImage = new kakao.maps.MarkerImage(arriveDragSrc, arriveDragSize, arriveDragOption);

function App() {
    const [startingKeyword, setStartingKeyword] = useState('');
    const [destinationKeyword, setDestinationKeyword] = useState('');

    const [starting, setStarting] = useState<LatLng | null>(null);
    const [destination, setDestination] = useState<LatLng | null>(null);

    const mapDivRef = useRef<HTMLDivElement>(null);
    const map = useRef<any>(null);
    const startingMarker = useRef<any>(null);
    const destinationMarker = useRef<any>(null);

    const isDown = useRef(false);

    useEffect(() => {
        if (mapDivRef.current) {
            initMap();
            initCavans();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapDivRef]);

    const initMap = () => {
        const initLatLng: LatLng = new kakao.maps.LatLng(33.450701, 126.570667);

        map.current = new kakao.maps.Map(mapDivRef.current, {
            center: initLatLng,
            level: 3,
        });

        // starting
        startingMarker.current = new kakao.maps.Marker({
            map: map.current,
            position: initLatLng,
            draggable: true,
            image: startingImage,
        });
        kakao.maps.event.addListener(startingMarker.current, 'dragstart', function () {
            startingMarker.current.setImage(startingDragImage);
        });
        kakao.maps.event.addListener(startingMarker.current, 'dragend', function () {
            startingMarker.current.setImage(startingImage);
            setStarting(startingMarker.current.wPosition());
        });

        // destination
        destinationMarker.current = new kakao.maps.Marker({
            map: map.current,
            position: initLatLng,
            draggable: true,
            image: destinationImage,
        });
        kakao.maps.event.addListener(destinationMarker.current, 'dragstart', function () {
            destinationMarker.current.setImage(destinationDragImage);
        });
        kakao.maps.event.addListener(destinationMarker.current, 'dragend', function () {
            destinationMarker.current.setImage(destinationImage);
            setDestination(destinationMarker.current.getPosition());
        });
    };

    const initCavans = () => {
        const wrap = document.getElementById('mapCanvasWrap');
        const mapElem = document.getElementById('map');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.className = 'canvas';

        if (!wrap || !ctx || !mapElem) {
            return;
        }

        wrap.appendChild(canvas);

        const pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;

        const stageWidth = mapElem.clientWidth;
        const stageHeight = mapElem.clientHeight;

        canvas.width = stageWidth * pixelRatio;
        canvas.height = stageHeight * pixelRatio;
        ctx.scale(pixelRatio, pixelRatio);

        const paths: Path[] = [];
        let path: Path;

        const translates: Point[] = [{ x: 0, y: 0 }];

        let tX: number;
        let tY: number;

        let interval: NodeJS.Timeout;

        canvas.addEventListener('pointerdown', (e) => {
            isDown.current = true;
            if (ctx) {
            }

            tX = e.offsetX - stageWidth / 2;
            tY = e.offsetY - stageHeight / 2;

            interval = setInterval(() => {
                translates.push({ x: -tX, y: -tY });
                // path = {
                //     path: new Path2D(),
                //     translate: { x: 0, y: 0 },
                // };
                // path.path.moveTo(stageWidth / 2, stageHeight / 2);
                // path.path.lineTo(e.offsetX, e.offsetY);

                // path.path.lineTo(e.offsetX, e.offsetY);
                // ctx.stroke(path.path);

                // ctx.closePath();
                ctx.clearRect(0, 0, stageWidth, stageHeight);

                // path.translate = { x: -tX, y: -tY };
                // paths.push(path);

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(stageWidth / 2, stageHeight / 2);
                for (let i = translates.length - 1; i >= 0; i -= 1) {
                    const translate = translates[i];
                    ctx.translate(translate.x, translate.y);
                    ctx.lineTo(stageWidth / 2, stageHeight / 2);
                }
                ctx.stroke();
                ctx.restore();

                map.current.panBy(tX, tY);
            }, 300);
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!isDown.current || !ctx) {
                return;
            }

            tX = (e.offsetX - stageWidth / 2) * 0.3;
            tY = (e.offsetY - stageHeight / 2) * 0.3;
        });

        canvas.addEventListener('pointerup', (e) => {
            isDown.current = false;

            clearInterval(interval);
            // const tX = e.offsetX - stageWidth / 2;
            // const tY = e.offsetY - stageHeight / 2;
        });
    };

    const searchStarting = () => {
        geocoder.addressSearch(startingKeyword, function (result: any, status: string) {
            if (status === kakao.maps.services.Status.OK) {
                const latLng: LatLng = new kakao.maps.LatLng(result[0].y, result[0].x);

                map.current.setCenter(latLng);
                startingMarker.current.setPosition(latLng);

                setStarting(latLng);
            }
        });
    };

    const searchDestination = () => {
        geocoder.addressSearch(destinationKeyword, function (result: any, status: string) {
            if (status === kakao.maps.services.Status.OK) {
                const latLng: LatLng = new kakao.maps.LatLng(result[0].y, result[0].x);

                map.current.setCenter(latLng);
                destinationMarker.current.setPosition(latLng);

                setDestination(latLng);
            }
        });
    };

    const confirmPosition = () => {
        console.log(starting, destination);
        if (starting && destination) {
            console.log(measure(starting, destination));

            const bounds = new kakao.maps.LatLngBounds();
            bounds.extend(starting);
            bounds.extend(destination);

            map.current.setBounds(bounds);
        }
    };

    return (
        <div className="App">
            <div>
                <input type="text" value={startingKeyword} onChange={(e) => setStartingKeyword(e.target.value)} />
                <button onClick={searchStarting}>검색</button>
            </div>
            <div>
                <input type="text" value={destinationKeyword} onChange={(e) => setDestinationKeyword(e.target.value)} />
                <button onClick={searchDestination}>검색</button>
            </div>
            <div className="mapCanvasWrap" id="mapCanvasWrap">
                <div ref={mapDivRef} className="map" id="map"></div>
                {/* <canvas ref={canvasRef} className="canvas"></canvas> */}
            </div>
            {starting && destination && <button onClick={confirmPosition}>확인</button>}
        </div>
    );
}

export default App;
