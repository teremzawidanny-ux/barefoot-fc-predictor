import { Navigate } from 'react-router-dom';

// Redirect legacy index imports to Home
const Index = () => <Navigate to="/" replace />;

export default Index;
