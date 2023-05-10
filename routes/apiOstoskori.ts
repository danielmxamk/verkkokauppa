import express from 'express';
import { Virhe } from '../errors/virhekasittelija';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma: PrismaClient = new PrismaClient();

const apiOstoskoriRouter: express.Router = express.Router();

apiOstoskoriRouter.use(express.json());

interface Token {
    ostoskoriToken: string
}
apiOstoskoriRouter.post("/poisto", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.body.koriId) {
        if (req.body.ostoskoriToken) {
            let token = jwt.verify(req.body.ostoskoriToken, "ToinenSuuriSalaisuus!!!");
            //Tokeni oli oikein, eli ostoskori löytyi
            if (typeof token === "object") {
                let ostoskoriId: number = token["ostoskoriToken"];
                console.log(req.body.koriId);
                try {
                    let poisto = await prisma.korintuote.deleteMany({
                        where: {
                            id: Number(req.body.koriId),
                            ostoskoriId: ostoskoriId
                        }
                    });
                    if (poisto) {
                        let tuotteet = await prisma.$queryRaw`SELECT tuote.nimi as nimi, tuote.hinta as hinta, korintuote.maara as maara, korintuote.id as koriId 
                                                        FROM korintuote
                                                        JOIN tuote ON  korintuote.tuoteId = tuote.id
                                                        WHERE korintuote.ostoskoriId = ${ostoskoriId}`;
                        if (tuotteet) {
                            res.json(tuotteet);
                        }
                    } else {
                        console.log("Booo");
                    }
                } catch (e: any) {
                    next(new Virhe());
                }
            }
            else {
                next(new Virhe(409, "Token ei toiminut"));
            }
        }
        else {
            next(new Virhe(409, "Syötöstä puuttuu ostoskoriTokeni"));
        }
    }
    else {
        next(new Virhe(409, "Syötöstä puuttuu koriId"));
    }

});

apiOstoskoriRouter.post("/lisays", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Löytyykö tuote ID:tä ja määrää
    if (req.body.tuoteId && req.body.maara) {
        //Tokeni on syötetty syötteeseen
        if (req.body.ostoskoriToken) {
            let token = jwt.verify(req.body.ostoskoriToken, "ToinenSuuriSalaisuus!!!");
            //Tokeni oli oikein, eli ostoskori löytyi
            if (typeof token === "object") {
                let ostoskoriId: number = token["ostoskoriToken"];
                try {
                    let tuote = await prisma.korintuote.findFirst({
                        where: {
                            ostoskoriId: ostoskoriId,
                            tuoteId: Number(req.body.tuoteId)
                        }
                    });
                    //Tuote löydetty jo ostoskorista, eli muutetaan vaan lukumäärä (voidaan käyttää myös poistoon)
                    if (tuote) {
                        let paivitys = await prisma.korintuote.updateMany({
                            where: {
                                ostoskoriId: ostoskoriId,
                                tuoteId: Number(req.body.tuoteId)
                            },
                            data: {
                                maara: tuote.maara + req.body.maara
                            }
                        });
                        if (paivitys) {
                            console.log("Päivitys onnistui");
                            // res.json(false);
                        }
                    }
                    //Tuotetta ei löytynyt, eli tehdään uusi syöttö
                    else {
                        let korintuote = await prisma.korintuote.create({
                            data: {
                                ostoskoriId: ostoskoriId,
                                tuoteId: Number(req.body.tuoteId),
                                maara: Number(req.body.maara)
                            }
                        });
                        if (korintuote) {
                            console.log("Tuotteen lisäys onnistui");
                        }
                    }
                } catch (e: any) {
                    next(new Virhe());
                }
            }
            else {
                next(new Virhe(406, "Epäonnistuttu tokenin varmistuksessa"));
            }
        }
        else {
            //Ostoskoria ei ole olemassa, eli luodaan uusi ostoskori ja lisätään korintuote
            try {
                //Luodaan tyhjä ostoskori
                let uusiOstoskori = await prisma.ostoskori.create({
                    data: {
                    }
                });
                //Ostoskorin lisäys onnistui
                if (uusiOstoskori) {
                    let korintuote = await prisma.korintuote.create({
                        data: {
                            ostoskoriId: uusiOstoskori.id,
                            tuoteId: Number(req.body.tuoteId),
                            maara: Number(req.body.maara)
                        }
                    });
                    //Tuotteen lisäys onnistui. Tehdään ostoskori token ja palautetaan se.
                    if (korintuote) {
                        let ostoskoriToken = jwt.sign({ ostoskoriToken: uusiOstoskori.id }, "ToinenSuuriSalaisuus!!!", { noTimestamp: true });
                        res.json({ ostoskoriToken: ostoskoriToken });
                    }
                    else {
                        next(new Virhe(407, "Epäonnistuttu tuotteen lisäämisessä"));
                    }
                }
                else {
                    next(new Virhe(403, "Epäonnistuttu ostoskorin luonnissa"));
                }
            } catch (e: any) {
                next(new Virhe());
            }
        }
    }
    else {
        next(new Virhe(402, "Puuttuva tuote ID tai määrä"));
    }
});

apiOstoskoriRouter.post("/haku", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    //Tokeni on syötetty syötteeseen
    if (req.body.ostoskoriToken) {
        let token = jwt.verify(req.body.ostoskoriToken, "ToinenSuuriSalaisuus!!!");
        //Tokeni oli oikein, eli ostoskori löytyi
        if (typeof token === "object") {
            let ostoskoriId: number = token["ostoskoriToken"];
            try {
                let tuotteet = await prisma.$queryRaw`SELECT tuote.nimi as nimi, tuote.hinta as hinta, korintuote.maara as maara, korintuote.id as koriId 
                                                        FROM korintuote
                                                        JOIN tuote ON  korintuote.tuoteId = tuote.id
                                                        WHERE korintuote.ostoskoriId = ${ostoskoriId}`;
                if (tuotteet) {
                    res.json(tuotteet);
                }
                //Tuotetta ei löytynyt, eli tehdään uusi syöttö
                else {
                    next(new Virhe(408, "Tuotteiden haku epäonnistui"));
                }
            } catch (e: any) {
                next(new Virhe());
            }
        }
        else {
            next(new Virhe(406, "Epäonnistuttu tokenin varmistuksessa"));
        }
    }
    else {
        next(new Virhe(407, "Ostoskoria ei löytynyt"));
    }
});

apiOstoskoriRouter.get("/", async (req: express.Request, res: express.Response, next: express.NextFunction) => {

    try {
        res.json(await prisma.ostoskori.findMany({

        }));
    } catch (e: any) {
        next(new Virhe());
    }
});

export default apiOstoskoriRouter;