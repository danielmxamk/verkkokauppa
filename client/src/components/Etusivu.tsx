import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Alert, Backdrop, Box, Button, Card, CardActionArea, CardContent, CardMedia, CircularProgress, Dialog, DialogTitle, Divider, Grid, IconButton, List, ListItem, ListItemText, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { kayttaja as Kayttaja } from '@prisma/client';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import e from 'express';

interface ApiData {
  tuotteet: Tuote[]
  virhe: string
  haettu: boolean
  kirjauduttu: boolean
  kayttaja?: Kayttaja
}

interface Tuote {
  id: Number
  nimi: String
  hinta: Number
  maara: Number
}

interface Props {
  token: string
  setToken: Dispatch<SetStateAction<string>>
  setOstoskoriToken: Dispatch<SetStateAction<string>>
  ostoskoriToken: string
}


const Etusivu: React.FC<Props> = (props: Props): React.ReactElement => {

  const navigate: NavigateFunction = useNavigate();

  const [apiData, setApiData] = useState<ApiData>({
    tuotteet: [],
    virhe: "",
    haettu: false,
    kirjauduttu: false
  });

  const paivitaMaara = (tuoteId: Number, maara: string) => {
    let kopio = apiData.tuotteet;
    let uusiMaara = Number(maara);

    if(typeof uusiMaara === "number" && uusiMaara >= 0){
        if(uusiMaara !== 0){
          kopio.map((tuote : Tuote) => {
            //Tuote löytyi
            if(tuote.id === tuoteId){
                tuote.maara = uusiMaara;
    
                setApiData({
                  ...apiData,
                  tuotteet : kopio
                });
                return true;
            }
          });
        }
        return true;
      }
    //Syöttö ei ole luku tai alle 1
    else{
      return false;
    }
  }

  const lisaysKutsu = async (tuoteId: Number, maara: Number): Promise<void> => {
    let syotto = {};
    //Onko ostoskori jo olemassa
    if (props.ostoskoriToken !== 'null') {
      syotto = {
        ostoskoriToken: props.ostoskoriToken,
        maara: maara,
        tuoteId: tuoteId
      }
    }
    else {
      syotto = {
        maara: maara,
        tuoteId: tuoteId
      }
    }
    console.log(syotto);
    try {
      const lisays = await fetch("/api/ostoskori/lisays", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(syotto)
      });
      //Ostoskori löydetty
      if (lisays.status === 200) {
        console.log("Jee")

        if (props.ostoskoriToken === 'null') {
          let { ostoskoriToken } = await lisays.json();
          props.setOstoskoriToken(ostoskoriToken);
          localStorage.setItem("ostoskoriToken", ostoskoriToken);
        }
        else {
          console.log("Ostoskori oli jo olemassa");
        }
      }
      else {
        console.log("Voi harmi");
      }

    } catch (e: any) {
      console.log(e);
    }
    //Ostoskoria ei ole olemassa
  }


  const apiKutsu = async (metodi?: string, tuoteId?: number, maara?: number): Promise<void> => {

    setApiData({
      ...apiData,
      haettu: false,
      kirjauduttu: false
    });


    try {
      const yhteys = await fetch('/api/tuotteet');
      const tarkistus = await fetch("/api/auth/tarkistus", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${props.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: props.token
        })
      });

      if (yhteys.status === 200) {
        if (tarkistus.status === 200) {
          setApiData({
            ...apiData,
            kayttaja: await tarkistus.json(),
            tuotteet: await yhteys.json(),
            kirjauduttu: true,
            haettu: true
          });
        }
        else {
          setApiData({
            ...apiData,
            tuotteet: await yhteys.json(),
            haettu: true
          });
        }
      }

      else {
        let virheteksti: string = "";

        switch (yhteys.status) {

          case 400: virheteksti = "Virhe pyynnön tiedoissa"; break;
          case 401: navigate("/login"); break;
          default: virheteksti = "Palvelimella tapahtui odottamaton virhe"; break;

        }

        setApiData({
          ...apiData,
          virhe: virheteksti,
          haettu: true
        });

      }

    } catch (e: any) {

      setApiData({
        ...apiData,
        virhe: "Palvelimeen ei saada yhteyttä",
        haettu: true
      });
    }
  }

  useEffect(() => {
    apiKutsu();
  }, []);

  const handleLogin = () => {
    navigate("/login/0");
  };
  const handleRegister = () => {
    navigate("/rekisteroi");
  };

  const kirjauduUlos = () => {
    localStorage.delete("token");
    props.setToken("");
    window.location.reload();
  };

  return (
    <>
      <Stack><Box margin={5}>
        {apiData.kirjauduttu && apiData.kayttaja ? <>
          <Typography variant="h6">{apiData.kayttaja.tunnus}</Typography>
          <Button
            variant="contained"
            size="medium"
            onClick={kirjauduUlos}
            color='error'
          >Kirjaudu ulos</Button></>
          : <>
            <Button onClick={handleLogin}>Kirjaudu</Button>
            <Button onClick={handleRegister}>Rekisteröi</Button>
          </>}
        <Button onClick={() => { navigate("/ostoskori") }} color="success" variant='contained' sx={{ marginLeft: 2 }}>
          Ostoskori
          <ShoppingCartIcon sx={{ marginLeft: 1 }} />
        </Button>
      </Box>

        <Typography variant='h5' align='center'>Tuotteet</Typography>
        {(Boolean(apiData.virhe))
          ? <Alert severity="error">{apiData.virhe}</Alert>
          : (apiData.haettu)
            ? <Grid container spacing={2} display={"flex"}>
              {apiData.tuotteet.map((tuote: Tuote, idx: number) => {
                return <Grid item key={idx} xs={3}>
                  <Card sx={{ minHeight: 200, textAlign: 'center' }}>
                    <CardContent>
                      <Typography>{tuote.nimi}</Typography><br />
                      <Typography>Hinta: {Number(tuote.hinta)}€</Typography><br />
                      <TextField size='small' defaultValue={1} label='Lukumäärä' name='lukumaara' type='number'
                        onChange={(e) => paivitaMaara(tuote.id , e.target.value) ? e.target.value : e.target.value = "1"} />
                      <Button onClick={() => lisaysKutsu(tuote.id, tuote.maara ? tuote.maara : 1)}>Lisää ostoskoriin</Button>
                    </CardContent>
                  </Card>
                </Grid>
              })}</Grid>
            : <Backdrop open={true}>
              <CircularProgress color='inherit' />
            </Backdrop>
        }
      </Stack>

    </>
  );
}

export default Etusivu;
