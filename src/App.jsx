import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DataHub from './pages/DataHub';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/datahub" element={<DataHub />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
