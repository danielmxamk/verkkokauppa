import express from 'express';
import { kayttaja as Kayttaja, PrismaClient } from '@prisma/client';
import { Virhe } from '../errors/virhekasittelija';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Alert } from '@mui/material';

const apiAuthRouter : express.Router = express.Router();

const prisma : PrismaClient = new PrismaClient();

apiAuthRouter.use(express.json());

apiAuthRouter.post("/login", async (req : express.Request, res : express.Response, next : express.NextFunction) : Promise<void> => {

    try {

        const kayttaja = await prisma.kayttaja.findFirst({
            where : {
                tunnus : req.body.tunnus
            }
        });

        if (req.body.tunnus === kayttaja?.tunnus) {
            let hash = crypto.createHash("SHA256").update(req.body.salasana).digest("hex");

            if (hash === kayttaja?.salasana) {

                let token = jwt.sign(kayttaja, "ToinenSuuriSalaisuus!!!", {noTimestamp: true });

                res.json({token : token})

            } else {
                next(new Virhe(401, "Virheellinen käyttäjätunnus tai salasana"));
            }

        } else {
            next(new Virhe(401, "Virheellinen käyttäjätunnus tai salasana"));
        }

    } catch {
        next(new Virhe());
    }
});

apiAuthRouter.post("/tarkistus", async (req : express.Request, res : express.Response, next : express.NextFunction) : Promise<void> => {
    try {
        const token = req.body.token;
        const kayttaja = jwt.verify(token , "ToinenSuuriSalaisuus!!!");
        res.json(kayttaja);
    } catch (e : any) {
        next(new Virhe());
    }
});

export default apiAuthRouter;
