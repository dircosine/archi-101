/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { PathPhase } from '../pages/PathPage';
import { LatLng } from '../utils/map';
import PathCanvas from './PathCanvas';

import './PathDraw.scss';

const startingImage = new kakao.maps.MarkerImage(
    'https://archi101.s3.ap-northeast-2.amazonaws.com/assets/sticker.svg',
    new kakao.maps.Size(30, 30),
    {
        offset: new kakao.maps.Point(15, 15),
    },
);
const startingDragImage = new kakao.maps.MarkerImage(
    'https://archi101.s3.ap-northeast-2.amazonaws.com/assets/sticker_drag.svg',
    new kakao.maps.Size(30, 30),
    {
        offset: new kakao.maps.Point(15, 15),
    },
);

const destinationImage = new kakao.maps.MarkerImage(
    'https://archi101.s3.ap-northeast-2.amazonaws.com/assets/sticker_blue.svg',
    new kakao.maps.Size(30, 30),
    {
        offset: new kakao.maps.Point(15, 15),
    },
);

const destinationDragImage = new kakao.maps.MarkerImage(
    'https://archi101.s3.ap-northeast-2.amazonaws.com/assets/sticker_blue_drag.svg',
    new kakao.maps.Size(30, 30),
    {
        offset: new kakao.maps.Point(15, 15),
    },
);

export type MapEvents = 'none' | 'dragStart' | 'dragEnd' | 'zoomStart' | 'zoomChanged';
export type DrawControl = 'none' | 'undo';

interface PathDrawProps {
    phase: PathPhase;
    starting: LatLng | null;
    destination: LatLng | null;
    bounds: any;
    setPhase: React.Dispatch<React.SetStateAction<PathPhase>>;
    setStarting: React.Dispatch<React.SetStateAction<LatLng | null>>;
    setDestination: React.Dispatch<React.SetStateAction<LatLng | null>>;
}

function PathDraw({ phase, starting, destination, bounds, setPhase, setStarting, setDestination }: PathDrawProps) {
    const [map, setMap] = useState<any>(null);
    const [mapEvent, setMapDragEvent] = useState<MapEvents>('none');
    const [canvasCenter, setCanvasCenter] = useState<LatLng>(new kakao.maps.LatLng(37.4918782, 127.0324566));

    const mapDivRef = useRef<HTMLDivElement>(null);
    const startingMarker = useRef<any>(null);
    const destinationMarker = useRef<any>(null);

    const prevPhase = useRef<PathPhase>('searchStarting');

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
                });
                kakao.maps.event.addListener(startingMarker.current, 'dragend', function () {
                    startingMarker.current.setImage(startingImage);
                    setPhase('confirmStarting');
                    setStarting(startingMarker.current.getPosition());
                });

                prevPhase.current = 'confirmStarting';
            }
            setCanvasCenter(starting);

            startingMarker.current.setPosition(starting);
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
                });
                kakao.maps.event.addListener(destinationMarker.current, 'dragend', function () {
                    destinationMarker.current.setImage(destinationImage);
                    setPhase('confirmDestination');
                    setDestination(destinationMarker.current.getPosition());
                });

                prevPhase.current = 'confirmDestination';
            }
            setCanvasCenter(destination);

            destinationMarker.current.setPosition(destination);
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

    return (
        <div className="PathDraw" id="mapCanvasWrap" style={{ width: true ? '98%' : 0 }}>
            <div ref={mapDivRef} className="map" id="map" />
            <PathCanvas
                map={map}
                mapElemId="map"
                phase={phase}
                mapEvent={mapEvent}
                center={canvasCenter}
                destination={destination}
            />
        </div>
    );
}

export default PathDraw;
