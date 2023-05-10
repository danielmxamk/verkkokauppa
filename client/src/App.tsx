import React, { useState } from 'react';
import { Container, Typography } from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Rekisteroi from './components/Rekisteroi';
import Etusivu from './components/Etusivu';
import Ostoskori from './components/Ostoskori';

const App : React.FC = () : React.ReactElement => {

  const [token, setToken] = useState<string>(String(localStorage.getItem("token")));
  const [ostoskoriToken, setOstoskoriToken] = useState<string>(String(localStorage.getItem("ostoskoriToken")));

  return (
    <Container>
      
    <Typography variant="h4" align="center" sx={{marginBottom : 2, marginTop : 2}}>Verkkokauppa</Typography>

      <Routes>
        <Route path="/" element={<Etusivu token={token} setToken={setToken} setOstoskoriToken={setOstoskoriToken} ostoskoriToken={ostoskoriToken}/>}/>
        <Route path="/ostoskori" element={<Ostoskori token={token} setToken={setToken} ostoskoriToken={ostoskoriToken}/>}/>
        <Route path="/login/:reittiId" element={<Login setToken={setToken}/>}/>
        <Route path="/rekisteroi" element={<Rekisteroi setToken={setToken}/>}/>
      </Routes>
      

    </Container>
  );
}

export default App;
