import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import './Video.scss';

interface VideoProps {
    // isVideoEnded: boolean;
    // setIsVideoEnded: React.Dispatch<React.SetStateAction<boolean>>;
}

function Video({}: VideoProps) {
    const [videoEnded, setVideoEnded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef) {
            videoRef.current?.addEventListener('ended', (e) => {
                setVideoEnded(true);
            });
        }
    }, [videoRef]);

    return (
        <section className="Video">
            <video ref={videoRef} controls width="100%">
                {/* <source src="https://archi101.s3.ap-northeast-2.amazonaws.com/ch1-540.mp4" type="video/mp4"></source> */}
                <source src="/ch1-540.mp4" type="video/mp4" />
            </video>
            <Link to="/path">자 한명씩 나와서 각자 오는길을 표시해봐, 이렇게.</Link>
        </section>
    );
}

export default Video;
