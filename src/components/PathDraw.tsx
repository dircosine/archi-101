/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { PathPhase } from '../pages/PathPage';
import { LatLng } from '../utils/map';
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

export type MapEvents = 'none' | 'dragStart' | 'dragEnd' | 'zoomStart' | 'zoomChanged';

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
    const [map, setMap] = useState<any>(null);
    const [mapEvent, setMapDragEvent] = useState<MapEvents>('none');
    const [canvasCenter, setCanvasCenter] = useState<LatLng>(new kakao.maps.LatLng(37.4918782, 127.0324566));

    const mapDivRef = useRef<HTMLDivElement>(null);
    const startingMarker = useRef<any>(null);
    const destinationMarker = useRef<any>(null);

    const prevPhase = useRef<PathPhase>('searchStarting');

    const overlay = useRef<any>(null);

    useEffect(() => {
        const wrap = document.getElementById('mapCanvasWrap');

        wrap?.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }, []);

    useEffect(() => {
        if (mapDivRef.current) {
            initMap();
            setCanvasCenter(canvasCenter);
        }
    }, [mapDivRef]);

    useEffect(() => {
        const overlayContent = document.createElement('div');
        overlayContent.innerHTML = `<div class="overlayContent"><button id="confirmButton">여기!</button></div>`;

        if (starting && phase === 'confirmStarting') {
            map.relayout();

            map.setCenter(starting);
            if (prevPhase.current !== phase) {
                map.setLevel(4);
                // starting
                startingMarker.current = new kakao.maps.Marker({
                    map: map,
                    position: starting,
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

                prevPhase.current = 'confirmStarting';
            }
            setCanvasCenter(starting);

            startingMarker.current.setPosition(starting);

            overlay.current = new kakao.maps.CustomOverlay({
                map: map,
                position: starting,
                content: overlayContent,
                yAnchor: 1,
            });

            document
                .getElementById('confirmButton')
                ?.addEventListener('click', () => handleConfirm('starting', overlay));
        }
        if (destination && phase === 'confirmDestination') {
            map.relayout();

            map.setCenter(destination);
            if (prevPhase.current !== phase) {
                map.setLevel(4);

                // destination
                destinationMarker.current = new kakao.maps.Marker({
                    map: map,
                    position: destination,
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

                prevPhase.current = 'confirmDestination';
            }
            setCanvasCenter(destination);

            destinationMarker.current.setPosition(destination);

            overlay.current = new kakao.maps.CustomOverlay({
                map: map,
                position: destination,
                content: overlayContent,
                yAnchor: 1,
            });

            document
                .getElementById('confirmButton')
                ?.addEventListener('click', () => handleConfirm('destination', overlay));
        }
    }, [starting, destination, phase]);

    // confirmBoth
    useEffect(() => {
        if (bounds) {
            map.setBounds(bounds);
            setCanvasCenter(map.getCenter());
        }
    }, [bounds]);

    useEffect(() => {
        if (map && phase === 'draw' && starting) {
            map.setCenter(starting);
            map.setLevel(4);
            setCanvasCenter(starting);
        }
    }, [map, phase]);

    const initMap = () => {
        const kakoMap = new kakao.maps.Map(mapDivRef.current, {
            center: canvasCenter,
            level: 9,
        });

        // *** map events
        kakao.maps.event.addListener(kakoMap, 'dragstart', function () {
            console.log(kakoMap.getCenter());
            setMapDragEvent('dragStart');
        });

        kakao.maps.event.addListener(kakoMap, 'dragend', function () {
            setMapDragEvent('dragEnd');
            setCanvasCenter(kakoMap.getCenter());
        });

        kakao.maps.event.addListener(kakoMap, 'zoom_start', function () {
            setMapDragEvent('zoomStart');
        });

        kakao.maps.event.addListener(kakoMap, 'zoom_changed', function () {
            setMapDragEvent('zoomChanged');
            setCanvasCenter(kakoMap.getCenter());
        });

        setMap(kakoMap);
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

    const isShowing = ['confirmStarting', 'confirmDestination', 'confirmBoth', 'draw', 'viewPath'].includes(phase);

    return (
        <div className="PathDraw" id="mapCanvasWrap" style={{ width: true ? '97%' : 0 }}>
            <div ref={mapDivRef} className="map" id="map" />
            <PathCanvas map={map} mapElemId="map" phase={phase} mapEvent={mapEvent} center={canvasCenter} />
        </div>
    );
}

export default PathDraw;
