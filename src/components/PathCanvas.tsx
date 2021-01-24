/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useRef } from 'react';
import { PathPhase } from '../pages/PathPage';
import { LatLng, Point } from '../utils/map';

import { PathContext } from '../pages/PathPage';
import { MapEvents } from './PathDraw';

interface PathCanvasProps {
    map: any;
    mapElemId: string;
    phase: PathPhase;
    mapEvent: MapEvents;
    center: LatLng;
}

function PathCanvas({ map, mapElemId, phase, mapEvent, center }: PathCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctx = useRef<CanvasRenderingContext2D | null>(null);
    const stageWidth = useRef(0);
    const stageHeight = useRef(0);
    const path = useContext(PathContext);

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
            ctx.current?.clearRect(0, 0, stageWidth.current, stageHeight.current);
            console.log('ue1');
            drawOthers();
        }
    }, [map, center]);

    useEffect(() => {
        if (mapEvent === 'dragStart' || mapEvent === 'zoomStart') {
            console.log('clear');
            ctx.current?.clearRect(0, 0, stageWidth.current, stageHeight.current);
        }
    }, [mapEvent]);

    // useEffect(() => {
    //     if (canvasRef.current && map) {
    //         map.setCenter(center);
    //         map.setLevel(4);
    //         drawPath();
    //     }
    // }, [center]);

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
        let centerMovedX = point.x - containterPoint.x;
        let centerMovedY = point.y - containterPoint.y;

        path.my.push(map.getCenter());

        let isDown = false;

        canvasRef.current.addEventListener('pointerdown', (e) => {
            isDown = true;

            if (!ctx.current) {
                isDown = false;
                return;
            }

            ctx.current.save();
            ctx.current.beginPath();

            ctx.current.lineWidth = 5;
            ctx.current.strokeStyle = 'rgba(255,1,2,1)';
            ctx.current.lineCap = 'round';

            const lastCoords = path.my[path.my.length - 1];
            const lastPoint: Point = mapProjection.containerPointFromCoords(lastCoords);
            ctx.current.moveTo(lastPoint.x, lastPoint.y);
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
                const point: Point = new kakao.maps.Point(e.offsetX + centerMovedX, e.offsetY + centerMovedY);
                map.setCenter(mapProjection.coordsFromPoint(point));
                centerMovedX += e.offsetX - stageWidth.current / 2;
                centerMovedY += e.offsetY - stageHeight.current / 2;

                ctx.current.clearRect(0, 0, stageWidth.current, stageHeight.current);
                ctx.current.save();
                ctx.current.beginPath();
                for (let i = 0; i < path.my.length; i++) {
                    const point: Point = mapProjection.pointFromCoords(path.my[i]);
                    ctx.current.lineTo(point.x - centerMovedX, point.y - centerMovedY);
                }
                ctx.current.stroke();
                ctx.current.restore();

                drawOthers();
            } else if (pushcounter >= 5) {
                pushcounter = 0;
                const point: Point = new kakao.maps.Point(e.offsetX + centerMovedX, e.offsetY + centerMovedY);
                const coords: LatLng = mapProjection.coordsFromPoint(point);

                const _point: Point = mapProjection.containerPointFromCoords(coords);
                ctx.current.lineTo(_point.x, _point.y);

                ctx.current.stroke();

                path.my.push(coords);
            }
        });

        canvasRef.current.addEventListener('pointerup', (e) => {
            isDown = false;

            ctx.current?.restore();
        });
    };

    const drawOthers = () => {
        if (!ctx.current) {
            return;
        }

        console.log('draw others!');

        const mapProjection = map.getProjection();

        ctx.current.save();

        ctx.current.lineWidth = 4;
        ctx.current.strokeStyle = 'rgba(255,1,2,0.6)';
        ctx.current.lineCap = 'round';

        ctx.current.beginPath();
        for (let i = 0; i < path.others.length; i++) {
            const other = path.others[i];
            for (let j = 0; j < other.coords?.length; j++) {
                const point: Point = mapProjection.containerPointFromCoords(
                    new kakao.maps.LatLng(other.coords[j].Ma, other.coords[j].La),
                );
                ctx.current.lineTo(point.x, point.y);
            }
        }
        ctx.current.stroke();
        ctx.current.restore();
    };

    return (
        <canvas ref={canvasRef} className="canvas" style={{ pointerEvents: phase === 'draw' ? 'inherit' : 'none' }} />
    );
}

export default PathCanvas;
