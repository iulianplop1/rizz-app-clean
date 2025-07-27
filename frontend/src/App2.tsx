import React, { useState } from 'react';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import MainPanel from './components/MainPanel';
import './App.css';

const App: React.FC = () => {
  const [section, setSection] = useState('inbox');

  return (
    <div className="app-layout">
      <Sidebar active={section} onSelect={setSection} />
      <div className="main-content">
        <TopNav />
        <MainPanel section={section} />
      </div>
    </div>
  );
};

export default App;
