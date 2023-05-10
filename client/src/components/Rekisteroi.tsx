import React, { Dispatch, SetStateAction, useRef } from "react";
import { Backdrop, Box, Button, Dialog, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, NavigateFunction } from 'react-router-dom';
// import { Kayttaja } from "@prisma/client";

interface Props {
    setToken: Dispatch<SetStateAction<string>>
}

const Rekisteroi: React.FC<Props> = (props: Props): React.ReactElement => {

    const navigate: NavigateFunction = useNavigate();

    const lomakeRef = useRef<HTMLFormElement>();
    

    const rekisteroi = async (e: React.FormEvent): Promise<void> => {

        e.preventDefault();

        if (lomakeRef.current?.kayttajatunnus.value) {

            if (lomakeRef.current?.salasana.value) {

                const yhteys = await fetch("/api/rekisteroi", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tunnus: lomakeRef.current?.kayttajatunnus.value,
                        salasana: lomakeRef.current?.salasana.value
                    })
                });
                console.log(yhteys.status);
                if (yhteys.status === 200) {

                    let { token } = await yhteys.json();

                    props.setToken(token);

                    localStorage.setItem("token", token);

                    navigate("/");
                }
                if (yhteys.status === 401) {
                    alert("Käyttäjä on jo olemassa");
                }
                else{
                    alert(yhteys.status);
                }

            }
        }
    };

    const [open, setOpen] = React.useState(false);

    const handleClose = () => {
        navigate("/")
    };

    return (
        <Dialog open={true} onClose={handleClose}>
            <Paper sx={{ padding: 2 }}>
                <Box
                    component="form"
                    onSubmit={rekisteroi}
                    ref={lomakeRef}
                    style={{
                        width: 300,
                        backgroundColor: "#fff",
                        padding: 20
                    }}
                >
                    <Stack spacing={2}>
                        <Typography variant="h6">Rekisteröi uusi käyttäjä</Typography>
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
                            Rekisteröi
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleClose}
                        >
                            Peruuta
                        </Button>
                    </Stack>

                </Box>
            </Paper>
        </Dialog>
    );
};

export default Rekisteroi;
