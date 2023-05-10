import express from 'express';
import { Virhe } from '../errors/virhekasittelija';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';


const prisma : PrismaClient = new PrismaClient();

const apiRekisteroiRouter : express.Router = express.Router();

apiRekisteroiRouter.use(express.json());

apiRekisteroiRouter.post("/", async (req : express.Request, res : express.Response, next : express.NextFunction) => {
    if(!await prisma.kayttaja.findFirst({
        where : {
            tunnus : String(req.body.tunnus)
         }
        }))
        {
            if(req.body.salasana.length > 0){
                let hash = crypto.createHash("SHA256").update(req.body.salasana).digest("hex");
                try{
                    await prisma.kayttaja.create({
                        data : {
                            tunnus : req.body.tunnus,
                            salasana : hash
                        }
                    })
                    let token = jwt.sign(req.body.kayttajatunnus, "ToinenSuuriSalaisuus!!!");

                    res.json({token : token})
                }

                catch (e : any) {
                next(new Virhe());
            }
        }
    }

    else{
        next(new Virhe(401, "Käyttäjä on jo olemassa"));
    }
    try {
        const token = req.body.token
        const kayttaja = jwt.verify(token , "ToinenSuuriSalaisuus!!!")
        res.json(kayttaja);
    } catch (e : any) {
        next(new Virhe());
    }
});

export default apiRekisteroiRouter;