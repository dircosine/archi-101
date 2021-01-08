import { useEffect, useRef, useState } from 'react';

import { LatLng, measure } from './utils/map';

import axios from 'axios';
import './App.css';

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

    const mapDivRef = useRef(null);
    const map = useRef<any>(null);
    const startingMarker = useRef<any>(null);
    const destinationMarker = useRef<any>(null);

    useEffect(() => {
        if (mapDivRef.current) {
            initMap();
        }
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
        });
        kakao.maps.event.addListener(destinationMarker.current, 'dragend', function () {
            destinationMarker.current.setImage(destinationImage);
            setDestination(destinationMarker.current.getPosition());
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
            <div ref={mapDivRef} id="map" style={{ width: '100%', paddingTop: '75%' }}></div>
            {starting && destination && <button onClick={confirmPosition}>확인</button>}
        </div>
    );
}

export default App;
