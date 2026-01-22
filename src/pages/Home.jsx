import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>FinanceWise</h1>
      <p>Welcome to your intelligent financial analysis platform.</p>
      <Link to="/datahub">Go to Data Hub</Link>
    </div>
  );
}

export default Home;
