import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Alert, Backdrop, Box, Button, Card, CardActionArea, CardContent, CardMedia, CircularProgress, Dialog, DialogTitle, Divider, Grid, IconButton, List, ListItem, ListItemText, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { tuote as Tuote, kayttaja as Kayttaja } from '@prisma/client';
import StoreIcon from '@mui/icons-material/Store';

interface ApiData {
  tuotteet: ostoskorinTuote[]
  virhe: string
  haettu: boolean
  kirjauduttu: boolean
  kayttaja?: Kayttaja
}

interface ostoskorinTuote {
  hinta: Number
  nimi: string
  maara: Number
  koriId: Number
}

interface fetchAsetukset {
  method: string
  headers?: any
  body?: string
}

interface Props {
  token: string
  setToken: Dispatch<SetStateAction<string>>
  ostoskoriToken: string
}


const Ostoskori: React.FC<Props> = (props: Props): React.ReactElement => {

  const navigate: NavigateFunction = useNavigate();

  const lomakeRef: any = useRef<any>();

  const [apiData, setApiData] = useState<ApiData>({
    tuotteet: [],
    virhe: "",
    haettu: false,
    kirjauduttu: false
  });

  const poisto = async (poisto?: boolean, koriId?: number): Promise<void> => {
    try{
      const poisto = await fetch("/api/ostoskori/poisto", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ koriId: koriId, ostoskoriToken: props.ostoskoriToken })
      });
      if(poisto.status === 200){
        setApiData({
          ...apiData,
          tuotteet : await poisto.json()
        });
      }
    }catch(e : any){
      console.log("Damn");
    }
  }

  const apiKutsu = async (): Promise<void> => {

    setApiData({
      ...apiData,
      haettu: false,
      kirjauduttu: false
    });
    console.log("Jee");
    //Ostoskori löytyy, eli etsitään tuotteita
    if (props.ostoskoriToken !== 'null') {
      try {
        const yhteys = await fetch("/api/ostoskori/haku", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ostoskoriToken: props.ostoskoriToken
          })
        });

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
    else {
      setApiData({
        ...apiData,
        haettu: true
      });
    }
  }

  const maksettava = () => {
    let summa = 0;
    apiData.tuotteet.map((tuote: ostoskorinTuote) => {
      summa += Number(tuote.hinta) * Number(tuote.maara);
    })
    return summa;
  }

  useEffect(() => {
    apiKutsu();
  }, []);

  const handleLogin = () => {
    navigate("/login/1");
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
        <Button sx={{ marginLeft: 2 }} color="primary" variant="contained" onClick={() => { navigate("/") }}>
          Kauppa
          <StoreIcon sx={{ marginLeft: 1 }} />
        </Button>
      </Box>

        <Typography variant='h4' align='center' borderBottom={1}>Ostoskori</Typography>
        {(Boolean(apiData.virhe))
          ? <Alert severity="error">{apiData.virhe}</Alert>
          : (!apiData.haettu) ? <Backdrop open={true}>
            <CircularProgress color='inherit' />
          </Backdrop> :
            apiData.tuotteet.length === 0 ? <Typography>Ostoskori on tyhjä</Typography> :
              <Grid container spacing={2} display={"flex"} sx={{ textAlign: 'center' }}>
                <Grid item xs={12} marginTop={2}>
                  <Typography variant='h6'>Maksettava yhteensä: {maksettava()}€</Typography>
                </Grid>
                {apiData.tuotteet.map((tuote: ostoskorinTuote, idx: number) => {
                  return <Grid item key={idx} xs={12}>
                    <Card>
                      <CardContent>
                        <Typography>{tuote.nimi}</Typography>
                        <Typography>Kappalehinta: {Number(tuote.hinta)}€ </Typography>
                        <Typography>Määrä: {Number(tuote.maara)}</Typography>
                        <Typography>Kokonaishinta: {Number(tuote.hinta) * Number(tuote.maara)}€</Typography>
                        <Button onClick={() => poisto(true, Number(tuote.koriId))}><DeleteIcon /></Button>
                      </CardContent>
                    </Card>
                  </Grid>
                })}</Grid>
        }
      </Stack>

    </>
  );
}

export default Ostoskori;
