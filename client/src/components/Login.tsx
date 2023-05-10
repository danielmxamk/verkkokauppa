import React, { Dispatch, SetStateAction, useRef } from "react";
import { Backdrop, Box, Button, Dialog, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, NavigateFunction, useParams } from 'react-router-dom';
// import { Kayttaja } from "@prisma/client";

interface Props {
    setToken: Dispatch<SetStateAction<string>>
}

const Login: React.FC<Props> = (props: Props): React.ReactElement => {

    const navigate: NavigateFunction = useNavigate();

    const lomakeRef = useRef<HTMLFormElement>();
    
    const {reittiId} = useParams();
    

    const kirjaudu = async (e: React.FormEvent): Promise<void> => {

        e.preventDefault();

        if (lomakeRef.current?.kayttajatunnus.value) {

            if (lomakeRef.current?.salasana.value) {

                const yhteys = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tunnus: lomakeRef.current?.kayttajatunnus.value,
                        salasana: lomakeRef.current?.salasana.value
                    })
                });

                if (yhteys.status === 200) {

                    let { token } = await yhteys.json();

                    props.setToken(token);

                    localStorage.setItem("token", token);
                    if(reittiId === "0"){
                        navigate("/");
                    }else{
                        navigate("/ostoskori");
                    }
                }

            }
        }
    };

    const [open, setOpen] = React.useState(false);

    const handleClose = () => {
        console.log(reittiId);
        if(reittiId === "0"){
            navigate("/");
        }else{
            navigate("/ostoskori");
        }
    };

    return (
        <Dialog open={true} onClose={handleClose}>
            <Paper sx={{ padding: 2 }}>
                <Box
                    component="form"
                    onSubmit={kirjaudu}
                    ref={lomakeRef}
                    style={{
                        width: 300,
                        backgroundColor: "#fff",
                        padding: 20
                    }}
                >
                    <Stack spacing={2}>
                        <Typography variant="h6">Kirjaudu sisään</Typography>
                        <TextField
                            label="Käyttäjätunnus"
                            name="kayttajatunnus"
                        />
                        <TextField
                            label="Salasana"
                            name="salasana"
                            type="password"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                        >
                            Kirjaudu
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleClose}
                        >
                            Peruuta
                        </Button>
                        <Typography>
                            (käyttäjä:daniel, salasana:daniel123)
                        </Typography>
                    </Stack>

                </Box>
            </Paper>
        </Dialog>
    );
};

export default Login;
