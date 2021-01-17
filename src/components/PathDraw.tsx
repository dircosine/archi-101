import { forwardRef, useEffect, useRef } from 'react';
import { PathPhase } from '../pages/PathPage';
import { LatLng, Point } from '../utils/map';
import PathCanvas from './PathCanvas';

import './PathDraw.scss';

const startingImage = new kakao.maps.MarkerImage(
    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png',
    new kakao.maps.Size(50, 45),
    {
        offset: new kakao.maps.Point(15, 43),
    },
);
const startingDragImage = new kakao.maps.MarkerImage(
    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_drag.png',
    new kakao.maps.Size(50, 64),
    {
        offset: new kakao.maps.Point(15, 54),
    },
);

const destinationImage = new kakao.maps.MarkerImage(
    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png',
    new kakao.maps.Size(50, 45),
    {
        offset: new kakao.maps.Point(15, 43),
    },
);

const destinationDragImage = new kakao.maps.MarkerImage(
    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_drag.png',
    new kakao.maps.Size(50, 64),
    {
        offset: new kakao.maps.Point(15, 54),
    },
);

interface PathDrawProps {
    phase: PathPhase;
    starting: LatLng | null;
    destination: LatLng | null;
    bounds: any;
    setStarting: React.Dispatch<React.SetStateAction<LatLng | null>>;
    setDestination: React.Dispatch<React.SetStateAction<LatLng | null>>;
    setPhase: React.Dispatch<React.SetStateAction<PathPhase>>;
}

function PathDraw({ phase, starting, destination, bounds, setStarting, setDestination, setPhase }: PathDrawProps) {
    const mapDivRef = useRef<HTMLDivElement>(null);
    const map = useRef<any>(null);

    const startingMarker = useRef<any>(null);
    const destinationMarker = useRef<any>(null);

    const overlay = useRef<any>(null);

    useEffect(() => {
        const wrap = document.getElementById('mapCanvasWrap');

        wrap?.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }, []);

    useEffect(() => {
        if (mapDivRef.current) {
            initMap();
        }
    }, [mapDivRef]);

    useEffect(() => {
        const overlayContent = document.createElement('div');
        overlayContent.innerHTML = `<div class="overlayContent"><button id="confirmButton">여기!</button></div>`;

        if (starting && phase === 'confirmStarting') {
            map.current.relayout();

            map.current.setCenter(starting);
            startingMarker.current.setPosition(starting);

            overlay.current = new kakao.maps.CustomOverlay({
                map: map.current,
                position: starting,
                content: overlayContent,
                yAnchor: 1,
            });

            document
                .getElementById('confirmButton')
                ?.addEventListener('click', () => handleConfirm('starting', overlay));
        }
        if (destination && phase === 'confirmDestination') {
            map.current.relayout();

            map.current.setCenter(destination);
            destinationMarker.current.setPosition(destination);

            overlay.current = new kakao.maps.CustomOverlay({
                map: map.current,
                position: destination,
                content: overlayContent,
                yAnchor: 1,
            });

            document
                .getElementById('confirmButton')
                ?.addEventListener('click', () => handleConfirm('destination', overlay));
        }
    }, [starting, destination, phase]);

    useEffect(() => {
        if (bounds) {
            map.current.setBounds(bounds);
        }
    }, [bounds]);

    useEffect(() => {
        if (phase === 'draw') {
            map.current.setCenter(starting);
        }
    }, [phase]);

    const initMap = () => {
        const initLatLng: LatLng = new kakao.maps.LatLng(33.450701, 126.570667);

        map.current = new kakao.maps.Map(mapDivRef.current, {
            center: initLatLng,
            level: 4,
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

            if (overlay.current) {
                overlay.current.setMap(null);
            }
        });
        kakao.maps.event.addListener(startingMarker.current, 'dragend', function () {
            startingMarker.current.setImage(startingImage);
            setStarting(startingMarker.current.getPosition());
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

            if (overlay.current) {
                overlay.current.setMap(null);
            }
        });
        kakao.maps.event.addListener(destinationMarker.current, 'dragend', function () {
            destinationMarker.current.setImage(destinationImage);
            setDestination(destinationMarker.current.getPosition());
        });
    };

    const handleConfirm = (type: 'starting' | 'destination', overlay: any) => {
        if (overlay.current) {
            overlay.current.setMap(null);
        }

        if (type === 'starting') {
            setPhase('searchDestination');
        }
        if (type === 'destination') {
            setPhase('confirmBoth');
        }
    };

    const isShowing =
        phase === 'confirmStarting' || phase === 'confirmDestination' || phase === 'confirmBoth' || phase === 'draw';

    return (
        <div className="PathDraw" id="mapCanvasWrap" style={{ width: isShowing ? '97%' : 0 }}>
            <div ref={mapDivRef} className="map" id="map" />
            <PathCanvas map={map} mapElemId="map" phase={phase} />
        </div>
    );
}

export default PathDraw;
