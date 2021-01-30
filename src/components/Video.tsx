import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import './Video.scss';

function Video() {
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
            <p className="announce">아주 잠깐만 다시 볼까요? 🎧</p>
            <div className="video">
                <video ref={videoRef} controls width="100%">
                    {/* <source
                        src="https://archi101.s3.ap-northeast-2.amazonaws.com/ch1-540.mp4"
                        type="video/mp4"
                    ></source> */}
                    <source src="ch1-540.mp4" type="video/mp4" />
                </video>
                {videoEnded && (
                    <>
                        <div className="quote">
                            <p>
                                우리는 여기서 밥먹고 술먹고 학교가고 당구장가고, 뭐 모든 생활을 다 합니다.
                                <br />
                                <br />
                                그런데 과연 우리는 이 도시에 대해서 잘 알고있을까?
                                <br />
                                <br />
                                의외로 넓거든 여기가.
                            </p>
                        </div>

                        <Link to="/path">자 한명씩 나와서 각자 오는길을 표시해봐, 이렇게.</Link>
                    </>
                )}
            </div>
        </section>
    );
}

export default Video;
