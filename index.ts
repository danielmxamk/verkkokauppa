import express from 'express';
import path from 'path';
import apiTilauksetRouter from './routes/apiTilaukset';
import apiTuotteetRouter from './routes/apiTuotteet';
import apiAuthRouter from './routes/apiAuth';
import apiKirjautunutRouter from './routes/apiKirjautunut';
import jwt from 'jsonwebtoken';
import apiRekisteroiRouter from './routes/apiRekisteroi';
import apiOstoskoriRouter from './routes/apiOstoskori';


const app : express.Application = express();

const portti : number = Number(process.env.PORT);

const checkToken = (req : express.Request, res : express.Response, next : express.NextFunction) => {

    try {

        let token : string = req.headers.authorization!.split(" ")[1];

        jwt.verify(token, "ToinenSuuriSalaisuus!!!");

        next();

    } catch (e: any) {
        res.status(401).json({});
    }

}

app.use(express.static(path.resolve(__dirname, "public")));

app.use("/api/auth", apiAuthRouter);

app.use("/api/auth/tarkistus", checkToken, apiAuthRouter);

app.use("/api/tilaus", apiTilauksetRouter);

app.use("/api/tuotteet", apiTuotteetRouter);

app.use("/api/kirjautunut", checkToken, apiKirjautunutRouter);

app.use("/api/rekisteroi", apiRekisteroiRouter);

app.use("/api/ostoskori" , apiOstoskoriRouter);

app.use((req : express.Request, res : express.Response, next : express.NextFunction) => {

    if (!res.headersSent) {
        res.status(404).json({ viesti : "Virheellinen reitti"});
    }

    next();
});

app.listen(portti, () => {

    console.log(`Palvelin käynnistyi porttiin : ${portti}`);    

});