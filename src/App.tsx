import { Switch, Redirect, Route, BrowserRouter, Link } from 'react-router-dom';

import './App.scss';
import IntroPage from './pages/IntroPage';
import PathPage from './pages/PathPage';

export type Section = 'poster' | 'video' | 'path';

export const BASE_NAME = '/architecture-101';

function App() {
    return (
        <div className={`App ${window.location.pathname.split('/').slice(-1)[0] ? 'App--pathPage' : ''}`}>
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
