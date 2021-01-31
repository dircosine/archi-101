/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useRef } from 'react';
import { PathPhase } from '../pages/PathPage';
import { LatLng, measure, Point } from '../utils/map';

import { PathContext } from '../pages/PathPage';
import { MapEvents } from './PathDraw';

interface PathCanvasProps {
    map: any;
    mapElemId: string;
    phase: PathPhase;
    mapEvent: MapEvents;
    center: LatLng;
    destination: LatLng | null;
}

function PathCanvas({ map, mapElemId, phase, mapEvent, center, destination }: PathCanvasProps) {
    const { othersPath, myPath, setMyPath, setIsArrival } = useContext(PathContext);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctx = useRef<CanvasRenderingContext2D | null>(null);
    const stageWidth = useRef(0);
    const stageHeight = useRef(0);

    const centerMovedX = useRef(0);
    const centerMovedY = useRef(0);
    const innerMyPath = useRef<LatLng[]>([]);

    useEffect(() => {
        if (canvasRef.current && map && !ctx.current) {
            initCavans();
        }

        if (map && phase === 'draw') {
            setTimeout(() => initDraw(), 1000);
        }
    }, [phase, map]);

    useEffect(() => {
        if (map) {
            clearAll();
            drawOthers();
        }
    }, [map, center]);

    useEffect(() => {
        if (mapEvent === 'dragStart' || mapEvent === 'zoomStart') {
            clearAll();
        }
    }, [mapEvent]);

    useEffect(() => {
        innerMyPath.current = myPath;
        clearAll();
        drawMy();
        drawOthers();
    }, [myPath]);

    const initCavans = () => {
        if (!canvasRef.current) {
            return null;
        }

        canvasRef.current.className = 'canvas';
        const mapElem = document.getElementById(mapElemId);
        ctx.current = canvasRef.current.getContext('2d');

        if (!ctx.current || !mapElem) {
            return null;
        }

        const pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;

        stageWidth.current = mapElem.clientWidth;
        stageHeight.current = mapElem.clientHeight;

        canvasRef.current.width = stageWidth.current * pixelRatio;
        canvasRef.current.height = stageHeight.current * pixelRatio;
        ctx.current.scale(pixelRatio, pixelRatio);

        // let levelChanging = false;
        // canvasRef.current.addEventListener('wheel', (e) => {
        //     e.preventDefault();
        //     if (Math.abs(e.deltaY) > 5 && !levelChanging) {
        //         levelChanging = true;
        //         map.setLevel(map.getLevel() + Math.sign(e.deltaY), { animate: true });
        //         setTimeout(() => {
        //             levelChanging = false;
        //         }, 50);
        //     }
        // });

        map.relayout();
    };

    const initDraw = () => {
        const mapElem = document.getElementById(mapElemId);

        if (!canvasRef.current || !mapElem) {
            return;
        }
        const mapProjection = map.getProjection();

        const initCenter = map.getCenter();
        const containterPoint = mapProjection.containerPointFromCoords(initCenter);
        const point = mapProjection.pointFromCoords(initCenter);

        let pushcounter = 0;
        centerMovedX.current = point.x - containterPoint.x;
        centerMovedY.current = point.y - containterPoint.y;

        myPath.push(map.getCenter());

        let isDown = false;

        canvasRef.current.addEventListener('pointerdown', (e) => {
            isDown = true;

            if (!ctx.current) {
                isDown = false;
                return;
            }

            ctx.current.save();
            ctx.current.beginPath();

            ctx.current.lineWidth = 7;
            ctx.current.strokeStyle = 'rgba(255,1,2,1)';
            ctx.current.lineCap = 'round';

            const lastCoords = innerMyPath.current[innerMyPath.current.length - 1];
            if (lastCoords) {
                const lastPoint: Point = mapProjection.containerPointFromCoords(lastCoords);
                ctx.current.moveTo(lastPoint.x, lastPoint.y);
            }
        });

        canvasRef.current.addEventListener('pointermove', (e) => {
            if (!isDown || !ctx.current) {
                return;
            }

            pushcounter += 1;

            if (
                e.offsetX < 40 ||
                e.offsetY < 40 ||
                e.offsetX > stageWidth.current - 40 ||
                e.offsetY > stageHeight.current - 40
            ) {
                isDown = false;
                const point: Point = new kakao.maps.Point(
                    e.offsetX + centerMovedX.current,
                    e.offsetY + centerMovedY.current,
                );
                map.setCenter(mapProjection.coordsFromPoint(point));
                centerMovedX.current += e.offsetX - stageWidth.current / 2;
                centerMovedY.current += e.offsetY - stageHeight.current / 2;

                ctx.current.clearRect(0, 0, stageWidth.current, stageHeight.current);
                ctx.current.save();
                ctx.current.beginPath();
                for (let i = 0; i < innerMyPath.current.length; i++) {
                    const point: Point = mapProjection.pointFromCoords(innerMyPath.current[i]);
                    ctx.current.lineTo(point.x - centerMovedX.current, point.y - centerMovedY.current);
                }
                ctx.current.stroke();
                ctx.current.restore();

                drawOthers();
            } else if (pushcounter >= 5) {
                pushcounter = 0;
                const point: Point = new kakao.maps.Point(
                    e.offsetX + centerMovedX.current,
                    e.offsetY + centerMovedY.current,
                );
                const coords: LatLng = mapProjection.coordsFromPoint(point);

                const _point: Point = mapProjection.containerPointFromCoords(coords);
                ctx.current.lineTo(_point.x, _point.y);

                ctx.current.stroke();

                innerMyPath.current.push(coords);
            }
        });

        canvasRef.current.addEventListener('pointerup', (e) => {
            isDown = false;

            ctx.current?.restore();

            const lastCoords = innerMyPath.current[innerMyPath.current.length - 1];

            setMyPath(innerMyPath.current);

            if (lastCoords && destination && measure(lastCoords, destination) < 300) {
                // 300m 이내까지 myPath 가 그려졌을 때
                setIsArrival(true);
            }
        });
    };

    const clearAll = () => ctx.current?.clearRect(0, 0, stageWidth.current, stageHeight.current);

    const drawMy = () => {
        if (!ctx.current) {
            return;
        }
        const mapProjection = map.getProjection();

        const prevCenter = map.getCenter();
        const newLastCoords = innerMyPath.current[innerMyPath.current.length - 1];

        const prevCenterPoint = mapProjection.pointFromCoords(prevCenter);
        const newLastPoint = mapProjection.pointFromCoords(newLastCoords);

        centerMovedX.current += newLastPoint.x - prevCenterPoint.x;
        centerMovedY.current += newLastPoint.y - prevCenterPoint.y;

        map.setCenter(newLastCoords);

        ctx.current.save();
        ctx.current.beginPath();

        ctx.current.lineWidth = 5;
        ctx.current.strokeStyle = 'rgba(255,1,2,1)';
        ctx.current.lineCap = 'round';

        for (let i = 0; i < innerMyPath.current.length; i++) {
            const point: Point = mapProjection.containerPointFromCoords(innerMyPath.current[i]);
            ctx.current.lineTo(point.x, point.y);
        }
        ctx.current.stroke();
        ctx.current.restore();
    };

    const drawOthers = () => {
        if (!ctx.current) {
            return;
        }

        const mapProjection = map.getProjection();

        ctx.current.save();

        ctx.current.lineWidth = 4;
        ctx.current.strokeStyle = 'rgba(255,1,2,0.6)';
        ctx.current.lineCap = 'round';

        for (let i = 0; i < othersPath.length; i++) {
            const otherPath = othersPath[i];
            ctx.current.beginPath();
            for (let j = 0; j < otherPath.coords?.length; j++) {
                const point: Point = mapProjection.containerPointFromCoords(
                    new kakao.maps.LatLng(otherPath.coords[j].Ma, otherPath.coords[j].La),
                );
                ctx.current.lineTo(point.x, point.y);
            }
            ctx.current.stroke();
        }
        ctx.current.restore();
    };

    return (
        <canvas ref={canvasRef} className="canvas" style={{ pointerEvents: phase === 'draw' ? 'inherit' : 'none' }} />
    );
}

export default PathCanvas;
