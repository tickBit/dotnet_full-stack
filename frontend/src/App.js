import './App.css';
import Header from './components/Header';
import { useAuth } from './contexts/AuthContext';
import NotesPage from './components/NotesPage';

function App() {

  const { token, useremail } = useAuth();
    
  return (
    <div className="App">
      <Header />
      {useremail !== "" ? <><h1>Welcome {useremail}!</h1></> :     
      <h1>Welcome to the full-stack Note taking demo</h1>}
      {token  !== '' ? <NotesPage /> :
       <p>Login to make notes to this page.</p>}
    </div>
  );
}

export default App;
