import express from 'express';
import { Virhe } from '../errors/virhekasittelija';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';


const prisma : PrismaClient = new PrismaClient();

const apiKirjautunutRouter : express.Router = express.Router();

apiKirjautunutRouter.use(express.json());

apiKirjautunutRouter.post("/", async (req : express.Request, res : express.Response, next : express.NextFunction) => {

    try {
        const kayttaja = jwt.verify(req.body.token , "ToinenSuuriSalaisuus!!!")
        res.json(kayttaja);
    } catch (e : any) {
        next(new Virhe());
    }
});

export default apiKirjautunutRouter;