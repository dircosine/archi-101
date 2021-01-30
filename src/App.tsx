import { Switch, Redirect, Route, BrowserRouter, Link } from 'react-router-dom';

import './App.scss';
import IntroPage from './pages/IntroPage';
import PathPage from './pages/PathPage';

export type Section = 'poster' | 'video' | 'path';

export const BASE_NAME = '/architecture-101';

// window.addEventListener(
//     'scroll',
//     (e) => {
//         e.preventDefault();
//         console.log(window.pageYOffset);
//         const scrollValue = window.pageYOffset / (document.body.offsetHeight - window.innerHeight);
//         if (window.pageYOffset >= 500) {
//             window.scrollTo(0, 500);
//         }
//         // console.log(scrollValue);
//         // document.body.style.setProperty('--scroll', scrollValue.toString());
//     },
//     false,
// );

function App() {
    return (
        <div className="App">
            <div className="wrap">
                <BrowserRouter basename={BASE_NAME}>
                    <header style={{ zIndex: 9999 }}>
                        <Link to="/">
                            <img src={`${BASE_NAME}/logo.png`} height="40px" alt="logo" />
                        </Link>
                    </header>
                    <Switch>
                        <Route exact path="/" component={IntroPage} />
                        <Route path="/path" component={PathPage} />
                        <Redirect path="*" to="/" />
                    </Switch>
                </BrowserRouter>
            </div>
        </div>
    );
}

export default App;
